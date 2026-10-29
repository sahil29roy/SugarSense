from contextlib import asynccontextmanager
import os
from typing import Any, Dict
from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.routes.prediction import router as prediction_router
from app.schemas.prediction import HealthResponse
from app.services.prediction_service import PredictionService, get_prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize model pipeline once on startup."""
    service = get_prediction_service()
    service.load_model()
    yield


app = FastAPI(
    title="SugarSense API",
    description="Educational symptom-based diabetes risk-screening API powered by FastAPI and scikit-learn.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
permitted_origins = [
    origin.strip()
    for origin in [frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"]
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(permitted_origins)),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(prediction_router)


@app.get(
    "/",
    tags=["General"],
    summary="Application Root",
    description="Operational status and service identity for SugarSense API.",
)
def read_root() -> Dict[str, Any]:
    """Return basic operational status and service information."""
    return {
        "app": "SugarSense API",
        "status": "online",
        "version": "0.1.0",
        "message": "Welcome to SugarSense API. Educational diabetes risk-screening service.",
    }


@app.get(
    "/health",
    tags=["Health"],
    response_model=HealthResponse,
    summary="Application Health Status",
    description="Verify server process health and confirmation of loaded ML model artifact.",
)
def health_check(
    response: Response,
    service: PredictionService = Depends(get_prediction_service),
) -> HealthResponse:
    """Check application health and ML model availability."""
    if service.is_loaded:
        return HealthResponse(
            status="healthy",
            service="sugarsense-backend",
            model_loaded=True,
            model_name=service.metadata.get("model_name"),
        )

    # Return degraded status and 503 if required model artifact is unavailable
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="degraded",
        service="sugarsense-backend",
        model_loaded=False,
        model_name=None,
    )
