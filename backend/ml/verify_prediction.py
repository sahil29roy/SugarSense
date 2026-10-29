from pathlib import Path
import sys
from typing import Any, Dict
import joblib

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.dataset import TARGET_CLASSES
from ml.pipeline import validate_input_data
from ml.train import MODEL_FILENAME, SAVED_MODEL_DIR


def get_synthetic_test_case() -> Dict[str, Any]:
    """Return an explicitly synthetic test sample for technical smoke-testing only."""
    return {
        "Age": 48,
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


def verify_saved_pipeline(model_path: Path | str | None = None) -> Dict[str, Any]:
    """Load serialized pipeline, run a synthetic inference smoke test, and verify outputs."""
    resolved_path = Path(model_path) if model_path else SAVED_MODEL_DIR / MODEL_FILENAME
    if not resolved_path.is_file():
        raise FileNotFoundError(f"Saved model pipeline not found at: {resolved_path}")

    # 1. Load pipeline
    pipeline = joblib.load(resolved_path)

    # 2. Construct synthetic sample
    sample = get_synthetic_test_case()

    # 3. Validate features and structure
    df_sample = validate_input_data(sample)

    # 4. Predict class
    prediction = pipeline.predict(df_sample)[0]
    if prediction not in TARGET_CLASSES:
        raise ValueError(
            f"Prediction '{prediction}' is not in known target classes: {TARGET_CLASSES}"
        )

    # 5. Extract probabilities if supported
    probabilities: Dict[str, float] = {}
    if hasattr(pipeline, "predict_proba"):
        probs = pipeline.predict_proba(df_sample)[0]
        classes = pipeline.classes_
        for cls_name, prob in zip(classes, probs):
            probabilities[str(cls_name)] = round(float(prob), 4)

    # 6. Verify missing feature rejection
    invalid_sample = {k: v for k, v in sample.items() if k != "Polyuria"}
    missing_feature_caught = False
    try:
        validate_input_data(invalid_sample)
    except ValueError:
        missing_feature_caught = True

    if not missing_feature_caught:
        raise AssertionError("Validation failed to reject an input missing required feature 'Polyuria'.")

    result = {
        "model_file": str(resolved_path),
        "synthetic_input": sample,
        "predicted_class": prediction,
        "probabilities": probabilities,
        "missing_feature_handling_verified": True,
    }
    return result


def main() -> None:
    """Execute smoke test and display result."""
    print("=" * 65)
    print("SUGARSENSE ML PIPELINE VERIFICATION SMOKE TEST")
    print("=" * 65)
    print("Note: This synthetic test is for technical verification only and")
    print("does not represent actual patient data or clinical diagnosis.")
    print("-" * 65)

    result = verify_saved_pipeline()
    print(f"Model Path:         {result['model_file']}")
    print(f"Predicted Class:    {result['predicted_class']}")
    print("Class Probabilities:")
    for cls_name, prob in result["probabilities"].items():
        print(f"  {cls_name}: {prob * 100:.1f}%")
    print(f"Schema Enforcement: Successfully rejected incomplete inputs (missing features).")
    print("=" * 65)
    print("Verification completed successfully.")


if __name__ == "__main__":
    main()
