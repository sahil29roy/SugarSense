import json
from pathlib import Path
from typing import Any, Dict
from unittest.mock import MagicMock
import joblib
import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

from app.main import app
from app.services.screening_service import ScreeningService, get_screening_service
from ml.dataset import ALL_FEATURES, TARGET_COLUMN, load_dataset
from ml.train import METADATA_FILENAME, MODEL_FILENAME, SAVED_MODEL_DIR


@pytest.fixture
def client():
    """TestClient fixture with app lifecycle."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def base_questionnaire() -> Dict[str, Any]:
    """Base questionnaire payload."""
    return {
        "Age": 50,
        "Gender": "Male",
        "Polyuria": "No",
        "Polydipsia": "No",
        "sudden weight loss": "No",
        "weakness": "No",
        "Polyphagia": "No",
        "Genital thrush": "No",
        "visual blurring": "No",
        "Itching": "No",
        "Irritability": "No",
        "delayed healing": "No",
        "partial paresis": "No",
        "muscle stiffness": "No",
        "Alopecia": "No",
        "Obesity": "No",
    }


def test_model_artifact_load_and_feature_order():
    """Verify saved model artifact loads cleanly and preserves strict feature ordering."""
    model_path = SAVED_MODEL_DIR / MODEL_FILENAME
    assert model_path.exists(), f"Model file not found at {model_path}"

    pipeline = joblib.load(model_path)
    assert hasattr(pipeline, "predict")
    assert hasattr(pipeline, "predict_proba")

    with open(SAVED_MODEL_DIR / METADATA_FILENAME, "r", encoding="utf-8") as f:
        meta = json.load(f)

    recorded_features = meta["features"]["order"]
    assert recorded_features == ALL_FEATURES
    assert len(recorded_features) == 16


def test_no_target_leakage():
    """Verify target column 'class' is not present in features or model input schemas."""
    assert TARGET_COLUMN not in ALL_FEATURES
    assert "class" not in [f.lower() for f in ALL_FEATURES]


def test_empirical_model_evaluation_metrics_integrity():
    """Verify saved model test metrics match held-out test data evaluation without fabrication."""
    df = load_dataset()
    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    # Reproduce identical 80/20 train/test split with random_state=42 and stratify
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    model_path = SAVED_MODEL_DIR / MODEL_FILENAME
    pipeline = joblib.load(model_path)
    y_pred = pipeline.predict(X_test)

    cm = confusion_matrix(y_test, y_pred, labels=["Negative", "Positive"])
    tn, fp, fn, tp = cm.ravel()

    with open(SAVED_MODEL_DIR / METADATA_FILENAME, "r", encoding="utf-8") as f:
        meta = json.load(f)

    saved_cm = meta["selected_model_metrics"]["test_metrics"]["confusion_matrix"]
    assert tn == saved_cm["true_negative"] == 40
    assert fp == saved_cm["false_positive"] == 0
    assert fn == saved_cm["false_negative"] == 1
    assert tp == saved_cm["true_positive"] == 63

    accuracy = (tp + tn) / (tp + tn + fp + fn)
    assert round(accuracy, 4) == meta["selected_model_metrics"]["test_metrics"]["accuracy"] == 0.9904


def test_prediction_boundary_ages(client: TestClient, base_questionnaire: Dict[str, Any]):
    """Verify boundary conditions for Age feature (1 and 120 valid; 0 and 121 rejected)."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.return_value = "507f1f77bcf86cd799439011"
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        # Lower boundary: Age 1 is valid
        p_min = base_questionnaire.copy()
        p_min["Age"] = 1
        res_min = client.post("/api/v1/predict", json=p_min)
        assert res_min.status_code == 200
        assert res_min.json()["prediction"] in ["Positive", "Negative"]

        # Upper boundary: Age 120 is valid
        p_max = base_questionnaire.copy()
        p_max["Age"] = 120
        res_max = client.post("/api/v1/predict", json=p_max)
        assert res_max.status_code == 200
        assert res_max.json()["prediction"] in ["Positive", "Negative"]

        # Below lower boundary: Age 0 is rejected
        p_zero = base_questionnaire.copy()
        p_zero["Age"] = 0
        assert client.post("/api/v1/predict", json=p_zero).status_code == 422

        # Above upper boundary: Age 121 is rejected
        p_over = base_questionnaire.copy()
        p_over["Age"] = 121
        assert client.post("/api/v1/predict", json=p_over).status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_extreme_symptom_responses(client: TestClient, base_questionnaire: Dict[str, Any]):
    """Verify screening model behavior on all-negative vs all-positive symptom profiles."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.return_value = "507f1f77bcf86cd799439011"
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        # All symptoms 'No' -> Low risk (Negative)
        all_no = base_questionnaire.copy()
        res_no = client.post("/api/v1/predict", json=all_no)
        assert res_no.status_code == 200
        data_no = res_no.json()
        assert data_no["prediction"] == "Negative"
        assert data_no["risk_assessment"] == "Low Risk Detected"
        assert data_no["model_score"] <= 0.5

        # All symptoms 'Yes' -> Elevated risk (Positive)
        all_yes = base_questionnaire.copy()
        for key in all_yes:
            if key not in ["Age", "Gender"]:
                all_yes[key] = "Yes"
        res_yes = client.post("/api/v1/predict", json=all_yes)
        assert res_yes.status_code == 200
        data_yes = res_yes.json()
        assert data_yes["prediction"] == "Positive"
        assert data_yes["risk_assessment"] == "Elevated Risk Detected"
        assert data_yes["model_score"] >= 0.5
    finally:
        app.dependency_overrides.clear()


def test_probability_distribution_normalization(client: TestClient, base_questionnaire: Dict[str, Any]):
    """Verify probability distribution is valid, non-negative, and sums to 1.0."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.return_value = "507f1f77bcf86cd799439011"
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        res = client.post("/api/v1/predict", json=base_questionnaire)
        assert res.status_code == 200
        data = res.json()
        probs = data["class_probabilities"]
        assert "Negative" in probs and "Positive" in probs
        assert 0.0 <= probs["Negative"] <= 1.0
        assert 0.0 <= probs["Positive"] <= 1.0
        assert pytest.approx(probs["Negative"] + probs["Positive"], abs=1e-3) == 1.0
    finally:
        app.dependency_overrides.clear()


def test_educational_disclaimers_present(client: TestClient, base_questionnaire: Dict[str, Any]):
    """Verify that predictions and statistics endpoints include unambiguous educational disclaimers."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.return_value = "507f1f77bcf86cd799439011"
    mock_screening.get_stats.return_value = {
        "total_screenings": 0,
        "positive_predictions": 0,
        "negative_predictions": 0,
        "positive_percentage": 0.0,
        "negative_percentage": 0.0,
        "top_reported_symptoms": [],
        "disclaimer": "Educational screening tool only.",
    }
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        # Prediction endpoint
        res_pred = client.post("/api/v1/predict", json=base_questionnaire)
        assert res_pred.status_code == 200
        assert "medical diagnosis" in res_pred.json()["disclaimer"].lower()

        # Stats endpoint
        res_stats = client.get("/api/v1/stats")
        assert res_stats.status_code == 200
        assert "disclaimer" in res_stats.json()
    finally:
        app.dependency_overrides.clear()
