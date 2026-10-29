from datetime import datetime, timezone
import logging
from typing import Any, Callable, Dict, List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.db.mongodb import get_screening_collection, ping_mongodb
from app.schemas.prediction import PredictionResponse, SymptomQuestionnaireRequest
from app.schemas.screening import (
    ScreeningListResponse,
    ScreeningRecordResponse,
    ScreeningStatsResponse,
    SymptomStat,
)

logger = logging.getLogger("sugarsense.screening_service")

TRACKED_SYMPTOMS = [
    "Polyuria",
    "Polydipsia",
    "sudden weight loss",
    "weakness",
    "Polyphagia",
    "Genital thrush",
    "visual blurring",
    "Itching",
    "Irritability",
    "delayed healing",
    "partial paresis",
    "muscle stiffness",
    "Alopecia",
    "Obesity",
]


class ScreeningService:
    """Service managing database interactions for screening records and history."""

    def __init__(self, collection_getter: Optional[Callable[[], Collection]] = None) -> None:
        self._get_collection = collection_getter or get_screening_collection

    def get_collection(self) -> Collection:
        """Return the active MongoDB screening collection."""
        return self._get_collection()

    def save_screening(
        self,
        questionnaire: SymptomQuestionnaireRequest,
        prediction_res: PredictionResponse,
    ) -> str:
        """Persist a completed screening record and return the generated MongoDB document ID."""
        record: Dict[str, Any] = {
            "created_at": datetime.now(timezone.utc),
            "questionnaire": questionnaire.to_feature_dict(),
            "prediction": prediction_res.prediction,
            "risk_assessment": prediction_res.risk_assessment,
            "model_score": prediction_res.model_score,
            "class_probabilities": prediction_res.class_probabilities,
            "model_version": "Decision Tree",
            "disclaimer": prediction_res.disclaimer,
        }

        try:
            collection = self.get_collection()
            result = collection.insert_one(record)
            inserted_id = str(result.inserted_id)
            logger.info("Persisted screening record with id '%s'", inserted_id)
            return inserted_id
        except (PyMongoError, Exception) as exc:
            logger.error("Failed to persist screening record to database: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Screening persistence failed. Database is currently unavailable.",
            ) from exc

    def get_screenings(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> ScreeningListResponse:
        """Retrieve paginated list of recent screening records ordered by newest first."""
        limit = min(max(1, limit), 100)
        offset = max(0, offset)

        try:
            collection = self.get_collection()
            total = collection.count_documents({})

            cursor = (
                collection.find({})
                .sort("created_at", -1)
                .skip(offset)
                .limit(limit)
            )

            items: List[ScreeningRecordResponse] = []
            for doc in cursor:
                items.append(self._doc_to_response(doc))

            return ScreeningListResponse(
                items=items,
                total=total,
                limit=limit,
                offset=offset,
            )
        except HTTPException:
            raise
        except (PyMongoError, Exception) as exc:
            logger.error("Failed to retrieve screenings from database: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is currently unavailable.",
            ) from exc

    def get_screening_by_id(self, screening_id: str) -> ScreeningRecordResponse:
        """Retrieve a specific screening record by its MongoDB ObjectId string."""
        if not ObjectId.is_valid(screening_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid screening ID format.",
            )

        try:
            collection = self.get_collection()
            doc = collection.find_one({"_id": ObjectId(screening_id)})
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Screening record not found.",
                )

            return self._doc_to_response(doc)
        except HTTPException:
            raise
        except (PyMongoError, Exception) as exc:
            logger.error("Failed to retrieve screening by ID: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is currently unavailable.",
            ) from exc

    def get_stats(self) -> ScreeningStatsResponse:
        """Calculate screening statistics and symptom frequency from actual database records."""
        try:
            collection = self.get_collection()
            total = collection.count_documents({})

            if total == 0:
                return ScreeningStatsResponse(
                    total_screenings=0,
                    positive_predictions=0,
                    negative_predictions=0,
                    positive_percentage=0.0,
                    negative_percentage=0.0,
                    top_reported_symptoms=[],
                )

            positive_count = collection.count_documents({"prediction": "Positive"})
            negative_count = collection.count_documents({"prediction": "Negative"})

            pos_pct = round((positive_count / total) * 100.0, 1)
            neg_pct = round((negative_count / total) * 100.0, 1)

            # Compute symptom reporting frequencies
            symptom_stats: List[SymptomStat] = []
            for symptom in TRACKED_SYMPTOMS:
                symptom_yes_count = collection.count_documents(
                    {f"questionnaire.{symptom}": "Yes"}
                )
                if symptom_yes_count > 0:
                    pct = round((symptom_yes_count / total) * 100.0, 1)
                    symptom_stats.append(
                        SymptomStat(
                            symptom=symptom,
                            count=symptom_yes_count,
                            percentage=pct,
                        )
                    )

            # Sort top symptoms by frequency descending
            symptom_stats.sort(key=lambda s: s.count, reverse=True)

            return ScreeningStatsResponse(
                total_screenings=total,
                positive_predictions=positive_count,
                negative_predictions=negative_count,
                positive_percentage=pos_pct,
                negative_percentage=neg_pct,
                top_reported_symptoms=symptom_stats,
            )
        except (PyMongoError, Exception) as exc:
            logger.error("Failed to compute screening statistics: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is currently unavailable.",
            ) from exc

    @staticmethod
    def _doc_to_response(doc: Dict[str, Any]) -> ScreeningRecordResponse:
        """Map raw MongoDB document into clean ScreeningRecordResponse."""
        return ScreeningRecordResponse(
            id=str(doc["_id"]),
            created_at=doc.get("created_at") or datetime.now(timezone.utc),
            questionnaire=doc.get("questionnaire", {}),
            prediction=doc.get("prediction", "Unknown"),
            risk_assessment=doc.get("risk_assessment", "Unknown"),
            model_score=float(doc.get("model_score", 0.0)),
            class_probabilities=doc.get("class_probabilities", {}),
            model_version=doc.get("model_version", "Decision Tree"),
            disclaimer=doc.get("disclaimer", ""),
        )


# Global service instance
_screening_service_instance: Optional[ScreeningService] = None


def get_screening_service() -> ScreeningService:
    """Dependency provider returning singleton screening service instance."""
    global _screening_service_instance
    if _screening_service_instance is None:
        _screening_service_instance = ScreeningService()
    return _screening_service_instance
