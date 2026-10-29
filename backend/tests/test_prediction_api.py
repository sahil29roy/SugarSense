from typing import Any, Dict
from unittest.mock import MagicMock
from fastapi import HTTPException, status
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.services.prediction_service import PredictionService, get_prediction_service
from app.services.screening_service import ScreeningService, get_screening_service


@pytest.fixture
def client():
    """TestClient fixture with app lifecycle."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_questionnaire_payload() -> Dict[str, Any]:
    """Sample valid symptom questionnaire matching exact dataset schema."""
    return {
        "Age": 45,
        "Gender": "Male",
        "Polyuria": "Yes",
        "Polydipsia": "Yes",
        "sudden weight loss": "No",
        "weakness": "Yes",
        "Polyphagia": "No",
        "Genital thrush": "No",
        "visual blurring": "Yes",
        "Itching": "No",
        "Irritability": "Yes",
        "delayed healing": "No",
        "partial paresis": "No",
        "muscle stiffness": "No",
        "Alopecia": "Yes",
        "Obesity": "No",
    }


def test_api_root(client: TestClient):
    """Verify that root GET / returns HTTP 200 with SugarSense identity."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "SugarSense API"
    assert data["status"] == "online"
    assert "version" in data


def test_health_check_operational(client: TestClient):
    """Verify that GET /health reports healthy status and model confirmation."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "sugarsense-backend"
    assert data["model_loaded"] is True
    assert data["model_name"] == "Decision Tree"


def test_health_check_degraded_when_model_missing(client: TestClient):
    """Verify that GET /health returns HTTP 503 and degraded status when model is not loaded."""
    # Create mock uninitialized service
    unloaded_service = PredictionService()
    unloaded_service.is_loaded = False
    unloaded_service.pipeline = None

    app.dependency_overrides[get_prediction_service] = lambda: unloaded_service
    try:
        response = client.get("/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["model_loaded"] is False
    finally:
        app.dependency_overrides.clear()


def test_get_model_info_success(client: TestClient):
    """Verify GET /api/v1/model-info returns safe model architecture and metrics metadata."""
    response = client.get("/api/v1/model-info")
    assert response.status_code == 200
    data = response.json()

    assert data["model_name"] == "Decision Tree"
    assert "Positive" in data["target_classes"]
    assert "Negative" in data["target_classes"]
    assert len(data["features"]) == 16
    assert "Age" in data["features"]
    assert "sudden weight loss" in data["features"]

    # Ensure evaluation metrics are present
    assert "metrics" in data
    assert "test_metrics" in data["metrics"]
    assert "accuracy" in data["metrics"]["test_metrics"]
    assert "recall_positive" in data["metrics"]["test_metrics"]

    # Ensure local filesystem paths are not leaked
    assert "model_file" not in data
    assert "artifacts_dir" not in data
    assert "disclaimer" in data


def test_get_model_info_service_unavailable(client: TestClient):
    """Verify GET /api/v1/model-info returns HTTP 503 if model metadata is unavailable."""
    unloaded_service = PredictionService()
    unloaded_service.is_loaded = False

    app.dependency_overrides[get_prediction_service] = lambda: unloaded_service
    try:
        response = client.get("/api/v1/model-info")
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_predict_success_with_valid_input(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify POST /api/v1/predict with valid payload returns proper prediction response schema and persists screening."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.return_value = "507f1f77bcf86cd799439011"
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        response = client.post("/api/v1/predict", json=valid_questionnaire_payload)
        assert response.status_code == 200
        data = response.json()

        assert data["prediction"] in ["Positive", "Negative"]
        assert data["risk_assessment"] in ["Elevated Risk Detected", "Low Risk Detected"]
        assert isinstance(data["model_score"], float)
        assert 0.0 <= data["model_score"] <= 1.0

        # Verify probability distribution
        probs = data["class_probabilities"]
        assert "Positive" in probs
        assert "Negative" in probs
        assert pytest.approx(probs["Positive"] + probs["Negative"], 0.01) == 1.0

        # Verify screening id persistence result
        assert data["screening_id"] == "507f1f77bcf86cd799439011"
        mock_screening.save_screening.assert_called_once()

        # Verify educational disclaimer
        assert "disclaimer" in data
        assert "medical diagnosis" in data["disclaimer"]
    finally:
        app.dependency_overrides.clear()


def test_predict_database_persistence_failure_returns_503(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify POST /api/v1/predict returns 503 when database fails to persist screening record."""
    mock_screening = MagicMock(spec=ScreeningService)
    mock_screening.save_screening.side_effect = HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Screening persistence failed. Database is currently unavailable."
    )
    app.dependency_overrides[get_screening_service] = lambda: mock_screening

    try:
        response = client.post("/api/v1/predict", json=valid_questionnaire_payload)
        assert response.status_code == 503
        assert "unavailable" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_predict_rejects_invalid_age(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that age validation rejects negative, zero, out-of-range, and non-numeric values."""
    # Negative age
    payload_neg = valid_questionnaire_payload.copy()
    payload_neg["Age"] = -5
    res = client.post("/api/v1/predict", json=payload_neg)
    assert res.status_code == 422

    # Zero age
    payload_zero = valid_questionnaire_payload.copy()
    payload_zero["Age"] = 0
    res = client.post("/api/v1/predict", json=payload_zero)
    assert res.status_code == 422

    # Exceeding physiological range
    payload_old = valid_questionnaire_payload.copy()
    payload_old["Age"] = 150
    res = client.post("/api/v1/predict", json=payload_old)
    assert res.status_code == 422

    # Non-numeric string age
    payload_str = valid_questionnaire_payload.copy()
    payload_str["Age"] = "forty-five"
    res = client.post("/api/v1/predict", json=payload_str)
    assert res.status_code == 422


def test_predict_rejects_invalid_gender(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that gender validation rejects unsupported categories."""
    payload = valid_questionnaire_payload.copy()
    payload["Gender"] = "Other"
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 422

    # Case sensitivity check
    payload["Gender"] = "male"
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 422


def test_predict_rejects_invalid_symptom_values(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that symptoms must strictly be 'Yes' or 'No'."""
    # Arbitrary string
    payload_str = valid_questionnaire_payload.copy()
    payload_str["Polyuria"] = "Maybe"
    res = client.post("/api/v1/predict", json=payload_str)
    assert res.status_code == 422

    # Integer
    payload_int = valid_questionnaire_payload.copy()
    payload_int["Polydipsia"] = 1
    res = client.post("/api/v1/predict", json=payload_int)
    assert res.status_code == 422

    # Boolean
    payload_bool = valid_questionnaire_payload.copy()
    payload_bool["weakness"] = True
    res = client.post("/api/v1/predict", json=payload_bool)
    assert res.status_code == 422


def test_predict_rejects_missing_required_fields(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that omitting any questionnaire question results in 422 validation error."""
    # Omit single symptom
    payload = valid_questionnaire_payload.copy()
    del payload["Polyuria"]
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 422

    # Omit age
    payload_no_age = valid_questionnaire_payload.copy()
    del payload_no_age["Age"]
    res = client.post("/api/v1/predict", json=payload_no_age)
    assert res.status_code == 422


def test_predict_rejects_unexpected_fields(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that extra unexpected fields are rejected by extra='forbid'."""
    payload = valid_questionnaire_payload.copy()
    payload["unexpected_extra_field"] = "malicious_or_accidental_value"
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 422


def test_predict_service_unavailable_error(client: TestClient, valid_questionnaire_payload: Dict[str, Any]):
    """Verify that POST /api/v1/predict returns HTTP 503 when the model pipeline is unavailable."""
    unloaded_service = PredictionService()
    unloaded_service.is_loaded = False

    app.dependency_overrides[get_prediction_service] = lambda: unloaded_service
    try:
        res = client.post("/api/v1/predict", json=valid_questionnaire_payload)
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
