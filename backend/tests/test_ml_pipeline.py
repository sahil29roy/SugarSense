import json
from pathlib import Path
import joblib
import pandas as pd
import pytest

from ml.dataset import (
    ALL_COLUMNS,
    ALL_FEATURES,
    TARGET_CLASSES,
    TARGET_COLUMN,
    get_features_and_target,
    load_dataset,
    validate_schema,
)
from ml.pipeline import validate_input_data
from ml.train import METADATA_FILENAME, MODEL_FILENAME, SAVED_MODEL_DIR
from ml.verify_prediction import get_synthetic_test_case


def test_dataset_schema_validation():
    """Verify that dataset loads cleanly and adheres to schema expectations."""
    df = load_dataset()
    assert not df.empty
    assert df.shape == (520, 17)
    validate_schema(df)

    # Empty dataframe should fail schema check
    with pytest.raises(ValueError, match="Dataset is empty"):
        validate_schema(pd.DataFrame())

    # Dataframe missing a column should fail schema check
    incomplete_df = df.drop(columns=["Polyuria"])
    with pytest.raises(ValueError, match="missing required columns"):
        validate_schema(incomplete_df)


def test_feature_target_separation():
    """Verify that target 'class' is cleanly separated and never included in features."""
    df = load_dataset()
    X, y = get_features_and_target(df)

    assert len(X) == len(y) == 520
    assert TARGET_COLUMN not in X.columns
    assert list(X.columns) == ALL_FEATURES
    assert y.name == TARGET_COLUMN
    assert set(y.unique()) == set(TARGET_CLASSES)


def test_saved_model_loading():
    """Verify that serialized pipeline and its metadata file exist and load cleanly."""
    model_path = SAVED_MODEL_DIR / MODEL_FILENAME
    metadata_path = SAVED_MODEL_DIR / METADATA_FILENAME

    assert model_path.is_file(), f"Model file missing: {model_path}"
    assert metadata_path.is_file(), f"Metadata file missing: {metadata_path}"

    pipeline = joblib.load(model_path)
    assert hasattr(pipeline, "predict")
    assert hasattr(pipeline, "predict_proba")

    with open(metadata_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    assert "model_name" in meta
    assert meta["model_name"] in {"Decision Tree", "Logistic Regression"}
    assert "features" in meta
    assert meta["features"]["order"] == ALL_FEATURES
    assert "target" in meta
    assert meta["target"]["classes"] == TARGET_CLASSES


def test_valid_input_prediction():
    """Verify inference prediction and probability computation on a valid sample."""
    pipeline = joblib.load(SAVED_MODEL_DIR / MODEL_FILENAME)
    sample = get_synthetic_test_case()

    df_sample = validate_input_data(sample)
    prediction = pipeline.predict(df_sample)[0]

    assert prediction in TARGET_CLASSES

    # Check probabilities
    probs = pipeline.predict_proba(df_sample)[0]
    assert len(probs) == 2
    assert all(pd.notna(float(p)) and 0.0 <= float(p) <= 1.0 for p in probs)
    assert pytest.approx(sum(probs), 0.001) == 1.0
    positive_index = list(pipeline.classes_).index("Positive")
    assert 0.0 <= float(probs[positive_index]) <= 1.0


def test_invalid_or_missing_input_features():
    """Verify that invalid data, missing features, or out-of-bound values are properly rejected."""
    sample = get_synthetic_test_case()

    # 1. Missing feature
    missing_sample = {k: v for k, v in sample.items() if k != "Polydipsia"}
    with pytest.raises(ValueError, match="missing required features"):
        validate_input_data(missing_sample)

    # 2. Non-numeric Age
    invalid_age_str = sample.copy()
    invalid_age_str["Age"] = "unknown_age"
    with pytest.raises(ValueError, match="Feature 'Age' must be numeric"):
        validate_input_data(invalid_age_str)

    # 3. Unrealistic negative Age
    negative_age = sample.copy()
    negative_age["Age"] = -10
    with pytest.raises(ValueError, match="physiological range"):
        validate_input_data(negative_age)

    # 4. Null value in categorical feature
    null_cat = sample.copy()
    null_cat["Gender"] = None
    with pytest.raises(ValueError, match="null or missing values"):
        validate_input_data(null_cat)


def test_expected_output_classes():
    """Verify that fitted model classes exactly match known target labels."""
    pipeline = joblib.load(SAVED_MODEL_DIR / MODEL_FILENAME)
    classes = sorted(list(pipeline.classes_))
    expected = sorted(TARGET_CLASSES)
    assert classes == expected


def test_invalid_categorical_value_rejected():
    sample = get_synthetic_test_case()
    sample["Polyuria"] = "sometimes"
    with pytest.raises(ValueError, match="unsupported value"):
        validate_input_data(sample)
