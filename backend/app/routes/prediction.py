from fastapi import APIRouter, Depends, status

from app.schemas.prediction import (
    ModelInfoResponse,
    PredictionResponse,
    SymptomQuestionnaireRequest,
)
from app.services.prediction_service import PredictionService, get_prediction_service

router = APIRouter(prefix="/api/v1", tags=["Screening & Prediction"])


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Get Machine Learning Model Information",
    description="Retrieve model architecture, feature expectations, target classes, and validation metrics.",
)
def get_model_information(
    service: PredictionService = Depends(get_prediction_service),
) -> ModelInfoResponse:
    """Return verified public metadata for the active risk screening model."""
    return service.get_model_info()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform Diabetes Risk Screening",
    description=(
        "Accept a complete 16-feature questionnaire, validate types and values, "
        "and return educational symptom-based risk estimation with probabilities."
    ),
)
def predict_risk(
    request: SymptomQuestionnaireRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    """Run model inference against validated questionnaire inputs."""
    return service.predict(request)
