from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.prediction import EDUCATIONAL_DISCLAIMER

STATS_DISCLAIMER = (
    "These statistics describe application screening submissions and model estimates, "
    "not the epidemiological prevalence of diabetes in a general population."
)


class ScreeningRecordResponse(BaseModel):
    """Schema for a persisted screening record."""
    id: str = Field(
        ...,
        description="Unique MongoDB document ObjectId represented as a string.",
        examples=["67213bfa7f21e51b145d8123"],
    )
    created_at: datetime = Field(
        ...,
        description="Timestamp when the screening was recorded in UTC.",
    )
    questionnaire: Dict[str, Any] = Field(
        ...,
        description="Validated symptom and demographic responses submitted by the user.",
    )
    prediction: str = Field(
        ...,
        description="Predicted risk class ('Positive' or 'Negative').",
        examples=["Positive"],
    )
    risk_assessment: str = Field(
        ...,
        description="Educational risk classification indicator.",
        examples=["Elevated Risk Detected"],
    )
    model_score: float = Field(
        ...,
        description="Model decision score / positive class probability (0.0 - 1.0).",
        examples=[1.0],
    )
    class_probabilities: Dict[str, float] = Field(
        ...,
        description="Probability distribution across target classes.",
        examples=[{"Negative": 0.0, "Positive": 1.0}],
    )
    model_version: Optional[str] = Field(
        default="Decision Tree",
        description="Machine learning model architecture or version identifier.",
        examples=["Decision Tree"],
    )
    disclaimer: str = Field(
        default=EDUCATIONAL_DISCLAIMER,
        description="Educational disclaimer confirming screening is not a clinical diagnosis.",
    )


class ScreeningListResponse(BaseModel):
    """Paginated list response for screening history."""
    items: List[ScreeningRecordResponse] = Field(
        default_factory=list,
        description="List of screening records in descending chronological order.",
    )
    total: int = Field(
        ...,
        ge=0,
        description="Total count of screening records in the database.",
        examples=[42],
    )
    limit: int = Field(
        ...,
        ge=1,
        le=100,
        description="Maximum number of items requested.",
        examples=[20],
    )
    offset: int = Field(
        ...,
        ge=0,
        description="Number of records skipped for pagination.",
        examples=[0],
    )


class SymptomStat(BaseModel):
    """Frequency metric for a specific reported symptom."""
    symptom: str = Field(..., description="Symptom name matching dataset schema.")
    count: int = Field(..., ge=0, description="Total times reported as 'Yes'.")
    percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of submissions containing this symptom.",
    )


class ScreeningStatsResponse(BaseModel):
    """Aggregate screening history statistics calculated from actual database records."""
    total_screenings: int = Field(
        ...,
        ge=0,
        description="Total completed screenings recorded in the database.",
        examples=[100],
    )
    positive_predictions: int = Field(
        ...,
        ge=0,
        description="Number of screenings resulting in an elevated risk ('Positive') prediction.",
        examples=[60],
    )
    negative_predictions: int = Field(
        ...,
        ge=0,
        description="Number of screenings resulting in a low risk ('Negative') prediction.",
        examples=[40],
    )
    positive_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of recorded screenings with a Positive prediction.",
        examples=[60.0],
    )
    negative_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of recorded screenings with a Negative prediction.",
        examples=[40.0],
    )
    top_reported_symptoms: List[SymptomStat] = Field(
        default_factory=list,
        description="Most frequently reported symptoms across all recorded screenings.",
    )
    disclaimer: str = Field(
        default=STATS_DISCLAIMER,
        description="Important clinical context explaining statistics represent application data, not public prevalence.",
    )
