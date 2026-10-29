from fastapi import APIRouter, Depends, status

from app.schemas.prediction import (
    ModelInfoResponse,
    PredictionResponse,
    SymptomQuestionnaireRequest,
)
from app.services.prediction_service import PredictionService, get_prediction_service
from app.services.screening_service import ScreeningService, get_screening_service

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
        "execute model prediction, persist the screening record to MongoDB, "
        "and return the educational risk assessment with its generated screening ID."
    ),
)
def predict_risk(
    request: SymptomQuestionnaireRequest,
    prediction_service: PredictionService = Depends(get_prediction_service),
    screening_service: ScreeningService = Depends(get_screening_service),
) -> PredictionResponse:
    """Run model inference against validated questionnaire inputs and persist screening record."""
    # 1. Generate prediction from saved ML pipeline
    prediction = prediction_service.predict(request)

    # 2. Persist screening record to MongoDB (raises 503 if DB is unavailable)
    screening_id = screening_service.save_screening(request, prediction)

    # 3. Attach persisted ID to response
    prediction.screening_id = screening_id

    return prediction
