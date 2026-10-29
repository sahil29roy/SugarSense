import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DiaPredict API",
    description="Educational symptom-based diabetes risk-screening API",
    version="0.1.0",
)

# CORS configuration
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def read_root():
    """Return basic application information and operational status."""
    return {
        "app": "DiaPredict API",
        "status": "online",
        "version": "0.1.0",
        "message": "Welcome to DiaPredict API. Educational diabetes risk-screening service.",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Basic health check endpoint that does not depend on database or ML models."""
    return {
        "status": "healthy",
        "service": "diapredict-backend",
    }
