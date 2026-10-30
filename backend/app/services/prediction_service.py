import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
import joblib
import pandas as pd

from app.schemas.prediction import (
    ModelInfoResponse,
    PredictionResponse,
    SymptomQuestionnaireRequest,
)

logger = logging.getLogger("sugarsense.prediction_service")


class PredictionService:
    """Service managing ML model loading, feature translation, and educational screening prediction."""

    def __init__(self, artifacts_dir: Optional[Path] = None) -> None:
        if artifacts_dir is None:
            # Anchor path relative to backend root: backend/ml/saved_model/
            backend_root = Path(__file__).resolve().parent.parent.parent
            self.artifacts_dir = backend_root / "ml" / "saved_model"
        else:
            self.artifacts_dir = Path(artifacts_dir)

        self.model_filename = "sugarsense_model.joblib"
        self.metadata_filename = "model_metadata.json"

        self.pipeline: Any = None
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None

    def load_model(self) -> bool:
        """Load the serialized model pipeline and metadata from disk once during startup."""
        model_path = self.artifacts_dir / self.model_filename
        metadata_path = self.artifacts_dir / self.metadata_filename

        try:
            if not model_path.is_file():
                err_msg = f"Model artifact file not found at: {model_path}"
                logger.error(err_msg)
                self.load_error = "Model artifact file missing"
                self.is_loaded = False
                return False

            if not metadata_path.is_file():
                err_msg = f"Model metadata file not found at: {metadata_path}"
                logger.error(err_msg)
                self.load_error = "Model metadata file missing"
                self.is_loaded = False
                return False

            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

            self.pipeline = joblib.load(model_path)

            # Sanity verification of loaded pipeline interface
            if not hasattr(self.pipeline, "predict"):
                raise ValueError("Loaded object does not implement a predict() method.")

            self.is_loaded = True
            self.load_error = None
            logger.info("Successfully loaded ML model pipeline '%s'", self.metadata.get("model_name", "Unknown"))
            return True

        except Exception as exc:
            logger.exception("Failed to load model pipeline: %s", exc)
            self.is_loaded = False
            self.load_error = str(exc)
            return False

    def predict(self, questionnaire: SymptomQuestionnaireRequest) -> PredictionResponse:
        """Execute inference on validated symptom questionnaire and return formatted risk estimation."""
        if not self.is_loaded or self.pipeline is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prediction model is currently unavailable.",
            )

        try:
            # Convert to dictionary with exact dataset schema names
            feature_dict = questionnaire.to_feature_dict()

            # Ensure DataFrame strictly preserves expected feature order
            expected_order = self.metadata.get("features", {}).get("order")
            if expected_order:
                df = pd.DataFrame([feature_dict])[expected_order]
            else:
                df = pd.DataFrame([feature_dict])

            # Generate prediction
            predicted_raw = self.pipeline.predict(df)[0]
            prediction_str = str(predicted_raw)

            # Calculate probabilities if supported by pipeline
            class_probabilities: Dict[str, float] = {}
            model_score: float = 0.0

            if hasattr(self.pipeline, "predict_proba"):
                probs = self.pipeline.predict_proba(df)[0]
                classes = self.pipeline.classes_
                if len(classes) != len(probs):
                    raise ValueError("Model classes and probability outputs do not align.")
                for cls_name, prob_val in zip(classes, probs):
                    value = float(prob_val)
                    if not pd.notna(value) or value < 0.0 or value > 1.0:
                        raise ValueError("Model returned an invalid class probability.")
                    class_probabilities[str(cls_name)] = round(value, 6)

                # Score representing positive risk probability
                if "Positive" not in class_probabilities:
                    raise ValueError("Model does not expose the Positive target class.")
                model_score = class_probabilities["Positive"]
            else:
                # Fallback score if probabilities are unsupported
                model_score = 1.0 if prediction_str == "Positive" else 0.0

            risk_assessment = (
                "Elevated Risk Detected" if prediction_str == "Positive" else "Low Risk Detected"
            )

            return PredictionResponse(
                prediction=prediction_str,
                risk_assessment=risk_assessment,
                model_score=model_score,
                class_probabilities=class_probabilities,
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Unexpected error during inference execution: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An internal error occurred during risk screening evaluation.",
            ) from exc

    def get_model_info(self) -> ModelInfoResponse:
        """Return safe architectural and performance metadata without exposing internal filesystem paths."""
        if not self.is_loaded or not self.metadata:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model metadata is currently unavailable.",
            )

        features = self.metadata.get("features", {}).get("order", [])
        target_classes = self.metadata.get("target", {}).get("classes", ["Negative", "Positive"])

        # Filter safe metrics only (exclude internal paths and sensitive structure)
        selected_metrics = self.metadata.get("selected_model_metrics", {})
        safe_metrics = {
            "cross_validation": selected_metrics.get("cross_validation", {}),
            "test_metrics": {
                "accuracy": selected_metrics.get("test_metrics", {}).get("accuracy"),
                "recall_positive": selected_metrics.get("test_metrics", {}).get("recall_positive"),
                "precision_positive": selected_metrics.get("test_metrics", {}).get("precision_positive"),
                "f1_positive": selected_metrics.get("test_metrics", {}).get("f1_positive"),
                "confusion_matrix": selected_metrics.get("test_metrics", {}).get("confusion_matrix"),
            },
        }

        dataset_summary = self.metadata.get("dataset_summary", {})

        return ModelInfoResponse(
            model_name=self.metadata.get("model_name", "Decision Tree"),
            target_classes=target_classes,
            features=features,
            metrics=safe_metrics,
            dataset_summary=dataset_summary,
        )


# Global service instance
_prediction_service_instance: Optional[PredictionService] = None


def get_prediction_service() -> PredictionService:
    """Dependency provider returning singleton prediction service instance."""
    global _prediction_service_instance
    if _prediction_service_instance is None:
        _prediction_service_instance = PredictionService()
        _prediction_service_instance.load_model()
    return _prediction_service_instance
