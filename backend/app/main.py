from contextlib import asynccontextmanager
import os
from typing import Any, Dict
from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.db.mongodb import close_mongodb_connection, connect_to_mongodb, ping_mongodb
from app.routes.prediction import router as prediction_router
from app.routes.screenings import router as screenings_router
from app.schemas.prediction import HealthResponse
from app.services.prediction_service import PredictionService, get_prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: initialize model pipeline and database on startup, close on shutdown."""
    # 1. Initialize ML model pipeline
    service = get_prediction_service()
    service.load_model()

    # 2. Establish and verify MongoDB connection
    connect_to_mongodb()

    yield

    # 3. Clean up database connection
    close_mongodb_connection()


app = FastAPI(
    title="SugarSense API",
    description="Educational symptom-based diabetes risk-screening API powered by FastAPI, scikit-learn, and MongoDB.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration
raw_cors = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
default_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:4173"]
configured_origins = [o.strip() for o in raw_cors.split(",") if o.strip()]
permitted_origins = list(set(configured_origins + default_dev_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=permitted_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(prediction_router)
app.include_router(screenings_router)


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
    description="Verify server process health, loaded ML model artifact, and MongoDB connection status.",
)
def health_check(
    response: Response,
    service: PredictionService = Depends(get_prediction_service),
) -> HealthResponse:
    """Check application health, ML model availability, and database connectivity."""
    db_connected = ping_mongodb()

    if service.is_loaded:
        return HealthResponse(
            status="healthy",
            service="sugarsense-backend",
            model_loaded=True,
            model_name=service.metadata.get("model_name"),
            database_connected=db_connected,
        )

    # Return degraded status and 503 if required model artifact is unavailable
    response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="degraded",
        service="sugarsense-backend",
        model_loaded=False,
        model_name=None,
        database_connected=db_connected,
    )
