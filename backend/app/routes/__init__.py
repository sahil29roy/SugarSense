"""Routes package for SugarSense backend."""
from app.routes.prediction import router as prediction_router
from app.routes.screenings import router as screenings_router

__all__ = ["prediction_router", "screenings_router"]
