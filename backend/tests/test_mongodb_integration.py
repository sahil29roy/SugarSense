from datetime import datetime, timezone
from typing import Any, Dict, List
from unittest.mock import MagicMock, patch
from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo.errors import ConnectionFailure, PyMongoError
import pytest

from app.db.mongodb import (
    DEFAULT_MONGODB_DATABASE,
    DEFAULT_MONGODB_URI,
    connect_to_mongodb,
    get_database_name,
    get_mongodb_uri,
    init_db_indexes,
    ping_mongodb,
)
from app.main import app
from app.schemas.prediction import PredictionResponse, SymptomQuestionnaireRequest
from app.services.prediction_service import PredictionService, get_prediction_service
from app.services.screening_service import ScreeningService, get_screening_service


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_questionnaire_payload() -> Dict[str, Any]:
    """Valid questionnaire input payload."""
    return {
        "Age": 55,
        "Gender": "Female",
        "Polyuria": "Yes",
        "Polydipsia": "Yes",
        "sudden weight loss": "Yes",
        "weakness": "Yes",
        "Polyphagia": "Yes",
        "Genital thrush": "No",
        "visual blurring": "Yes",
        "Itching": "Yes",
        "Irritability": "No",
        "delayed healing": "Yes",
        "partial paresis": "Yes",
        "muscle stiffness": "No",
        "Alopecia": "No",
        "Obesity": "Yes",
    }


def test_mongodb_configuration_defaults(monkeypatch):
    """Verify that MongoDB URI and database name use defaults and respect environment overrides."""
    monkeypatch.delenv("MONGODB_URI", raising=False)
    monkeypatch.delenv("MONGODB_DATABASE", raising=False)

    assert get_mongodb_uri() == DEFAULT_MONGODB_URI
    assert get_database_name() == DEFAULT_MONGODB_DATABASE

    monkeypatch.setenv("MONGODB_URI", "mongodb://custom_host:27018/")
    monkeypatch.setenv("MONGODB_DATABASE", "custom_db")

    assert get_mongodb_uri() == "mongodb://custom_host:27018/"
    assert get_database_name() == "custom_db"


def test_mongodb_ping_failure():
    """Verify that ping_mongodb gracefully catches connection errors and returns False."""
    with patch("app.db.mongodb.get_mongodb_client") as mock_client_getter:
        mock_client = MagicMock()
        mock_client.admin.command.side_effect = ConnectionFailure("Connection timed out")
        mock_client_getter.return_value = mock_client

        assert ping_mongodb() is False


def test_mongodb_connect_and_index_handling():
    """Verify connect_to_mongodb behavior when reachable vs unreachable."""
    with patch("app.db.mongodb.ping_mongodb", return_value=True), \
         patch("app.db.mongodb.init_db_indexes", return_value=True) as mock_idx:
        res = connect_to_mongodb()
        assert res is True
        mock_idx.assert_called_once()

    with patch("app.db.mongodb.ping_mongodb", return_value=False):
        res_fail = connect_to_mongodb()
        assert res_fail is False


def test_screening_service_save_and_retrieve_by_id():
    """Test saving a screening and retrieving it by MongoDB ObjectId using mock collection."""
    mock_collection = MagicMock()
    mock_id = ObjectId("507f1f77bcf86cd799439011")
    mock_collection.insert_one.return_value = MagicMock(inserted_id=mock_id)

    mock_doc = {
        "_id": mock_id,
        "created_at": datetime.now(timezone.utc),
        "questionnaire": {"Age": 55, "Gender": "Female", "Polyuria": "Yes"},
        "prediction": "Positive",
        "risk_assessment": "Elevated Risk Detected",
        "model_score": 1.0,
        "class_probabilities": {"Negative": 0.0, "Positive": 1.0},
        "model_version": "Decision Tree",
        "disclaimer": "Educational disclaimer",
    }
    mock_collection.find_one.return_value = mock_doc

    service = ScreeningService(collection_getter=lambda: mock_collection)

    q = SymptomQuestionnaireRequest(
        Age=55,
        Gender="Female",
        Polyuria="Yes",
        Polydipsia="Yes",
        sudden_weight_loss="Yes",
        weakness="Yes",
        Polyphagia="Yes",
        genital_thrush="No",
        visual_blurring="Yes",
        Itching="Yes",
        Irritability="No",
        delayed_healing="Yes",
        partial_paresis="Yes",
        muscle_stiffness="No",
        Alopecia="No",
        Obesity="Yes",
    )
    pred = PredictionResponse(
        prediction="Positive",
        risk_assessment="Elevated Risk Detected",
        model_score=1.0,
        class_probabilities={"Negative": 0.0, "Positive": 1.0},
        disclaimer="Educational disclaimer",
    )

    # 1. Save screening
    saved_id = service.save_screening(q, pred)
    assert saved_id == str(mock_id)
    mock_collection.insert_one.assert_called_once()

    # 2. Retrieve screening
    record = service.get_screening_by_id(saved_id)
    assert record.id == str(mock_id)
    assert record.prediction == "Positive"
    assert record.questionnaire["Age"] == 55


def test_get_screenings_pagination():
    """Verify paginated listing with limits and offsets."""
    mock_collection = MagicMock()
    docs = [
        {
            "_id": ObjectId("507f1f77bcf86cd799439011"),
            "created_at": datetime.now(timezone.utc),
            "questionnaire": {"Age": 40},
            "prediction": "Positive",
            "risk_assessment": "Elevated Risk Detected",
            "model_score": 1.0,
            "class_probabilities": {"Negative": 0.0, "Positive": 1.0},
        },
        {
            "_id": ObjectId("507f1f77bcf86cd799439012"),
            "created_at": datetime.now(timezone.utc),
            "questionnaire": {"Age": 30},
            "prediction": "Negative",
            "risk_assessment": "Low Risk Detected",
            "model_score": 0.0,
            "class_probabilities": {"Negative": 1.0, "Positive": 0.0},
        },
    ]

    mock_collection.count_documents.return_value = 2
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value.skip.return_value.limit.return_value = docs
    mock_collection.find.return_value = mock_cursor

    service = ScreeningService(collection_getter=lambda: mock_collection)
    res = service.get_screenings(limit=10, offset=0)

    assert res.total == 2
    assert len(res.items) == 2
    assert res.items[0].id == "507f1f77bcf86cd799439011"
    assert res.items[1].id == "507f1f77bcf86cd799439012"


def test_api_list_screenings_endpoint(client: TestClient):
    """Verify GET /api/v1/screenings returns list response."""
    mock_service = MagicMock(spec=ScreeningService)
    mock_service.get_screenings.return_value = {
        "items": [],
        "total": 0,
        "limit": 20,
        "offset": 0,
    }

    app.dependency_overrides[get_screening_service] = lambda: mock_service
    try:
        res = client.get("/api/v1/screenings?limit=20&offset=0")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 0
        assert data["items"] == []
    finally:
        app.dependency_overrides.clear()


def test_api_get_screening_by_id_endpoints(client: TestClient):
    """Verify GET /api/v1/screenings/{id} handles valid, not found, and invalid ID formats."""
    # 1. Invalid hex ObjectId -> 400
    res_bad = client.get("/api/v1/screenings/not-a-valid-object-id")
    assert res_bad.status_code == 400
    assert "invalid screening id format" in res_bad.json()["detail"].lower()

    # 2. Valid hex format but non-existent record -> 404
    mock_service = MagicMock(spec=ScreeningService)
    from fastapi import HTTPException
    mock_service.get_screening_by_id.side_effect = HTTPException(status_code=404, detail="Screening record not found.")

    app.dependency_overrides[get_screening_service] = lambda: mock_service
    try:
        valid_id = "507f1f77bcf86cd799439011"
        res_not_found = client.get(f"/api/v1/screenings/{valid_id}")
        assert res_not_found.status_code == 404
        assert "not found" in res_not_found.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_api_get_stats_calculation(client: TestClient):
    """Verify GET /api/v1/stats accurately computes summary metrics from actual DB records."""
    mock_collection = MagicMock()
    # Mock counts: total=10, positive=6, negative=4
    def count_mock(query):
        if not query:
            return 10
        if query.get("prediction") == "Positive":
            return 6
        if query.get("prediction") == "Negative":
            return 4
        if "questionnaire.Polyuria" in query:
            return 5
        if "questionnaire.Polydipsia" in query:
            return 4
        return 0

    mock_collection.count_documents.side_effect = count_mock

    real_service = ScreeningService(collection_getter=lambda: mock_collection)
    app.dependency_overrides[get_screening_service] = lambda: real_service

    try:
        res = client.get("/api/v1/stats")
        assert res.status_code == 200
        data = res.json()

        assert data["total_screenings"] == 10
        assert data["positive_predictions"] == 6
        assert data["negative_predictions"] == 4
        assert data["positive_percentage"] == 60.0
        assert data["negative_percentage"] == 40.0
        assert len(data["top_reported_symptoms"]) > 0
        assert data["top_reported_symptoms"][0]["symptom"] == "Polyuria"
        assert data["top_reported_symptoms"][0]["count"] == 5
        assert data["top_reported_symptoms"][0]["percentage"] == 50.0
    finally:
        app.dependency_overrides.clear()


def test_failed_prediction_does_not_save_record(client: TestClient):
    """Verify that failed validation prevents any database insertion."""
    mock_service = MagicMock(spec=ScreeningService)
    app.dependency_overrides[get_screening_service] = lambda: mock_service

    try:
        # Invalid payload (missing Age)
        bad_payload = {"Gender": "Male", "Polyuria": "Yes"}
        res = client.post("/api/v1/predict", json=bad_payload)
        assert res.status_code == 422
        # Database save method must NEVER have been called
        mock_service.save_screening.assert_not_called()
    finally:
        app.dependency_overrides.clear()


def test_api_list_screenings_database_failure_returns_503(client: TestClient):
    """Verify GET /api/v1/screenings returns HTTP 503 when database fails."""
    mock_service = MagicMock(spec=ScreeningService)
    from fastapi import HTTPException
    mock_service.get_screenings.side_effect = HTTPException(
        status_code=503, detail="Database is currently unavailable."
    )
    app.dependency_overrides[get_screening_service] = lambda: mock_service
    try:
        res = client.get("/api/v1/screenings")
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_api_get_stats_database_failure_returns_503(client: TestClient):
    """Verify GET /api/v1/stats returns HTTP 503 when database fails."""
    mock_service = MagicMock(spec=ScreeningService)
    from fastapi import HTTPException
    mock_service.get_stats.side_effect = HTTPException(
        status_code=503, detail="Database is currently unavailable."
    )
    app.dependency_overrides[get_screening_service] = lambda: mock_service
    try:
        res = client.get("/api/v1/stats")
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_api_get_screening_by_id_database_failure_returns_503(client: TestClient):
    """Verify GET /api/v1/screenings/{id} returns HTTP 503 when database fails."""
    mock_service = MagicMock(spec=ScreeningService)
    from fastapi import HTTPException
    mock_service.get_screening_by_id.side_effect = HTTPException(
        status_code=503, detail="Database is currently unavailable."
    )
    app.dependency_overrides[get_screening_service] = lambda: mock_service
    try:
        valid_id = "507f1f77bcf86cd799439011"
        res = client.get(f"/api/v1/screenings/{valid_id}")
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_live_mongodb_integration_optional():
    """Optional non-destructive integration test against live local MongoDB if running."""
    if not ping_mongodb():
        pytest.skip("Local MongoDB is currently stopped or unavailable; skipping live integration check.")

    from app.db.mongodb import get_mongodb_client
    client = get_mongodb_client()
    test_db = client["sugarsense_test_db"]
    test_collection = test_db["screenings_test"]

    try:
        test_doc = {
            "created_at": datetime.now(timezone.utc),
            "questionnaire": {"Age": 45, "Gender": "Male"},
            "prediction": "Positive",
            "model_score": 1.0,
        }
        res = test_collection.insert_one(test_doc)
        doc_id = res.inserted_id

        found = test_collection.find_one({"_id": doc_id})
        assert found is not None
        assert found["prediction"] == "Positive"
    finally:
        # Clean up test database completely
        client.drop_database("sugarsense_test_db")
