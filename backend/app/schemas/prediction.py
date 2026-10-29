from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

EDUCATIONAL_DISCLAIMER = (
    "SugarSense is an educational risk-screening application powered by machine learning patterns "
    "from questionnaire data. This assessment does not constitute medical diagnosis, clinical advice, "
    "or definitive diabetes confirmation. Please consult a qualified medical professional for clinical "
    "evaluation and diagnostic testing."
)


class GenderEnum(str, Enum):
    """Supported gender categories according to dataset schema."""
    MALE = "Male"
    FEMALE = "Female"


class YesNoEnum(str, Enum):
    """Explicit binary symptom values."""
    YES = "Yes"
    NO = "No"


class SymptomQuestionnaireRequest(BaseModel):
    """Symptom questionnaire input schema matching empirical clinical feature schema."""
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
    )

    Age: int = Field(
        ...,
        ge=1,
        le=120,
        description="Patient age in years (valid range: 1 to 120).",
        examples=[45],
    )
    Gender: GenderEnum = Field(
        ...,
        description="Biological sex ('Male' or 'Female').",
        examples=["Male"],
    )
    Polyuria: YesNoEnum = Field(
        ...,
        description="Excessive or frequent urination ('Yes' or 'No').",
        examples=["Yes"],
    )
    Polydipsia: YesNoEnum = Field(
        ...,
        description="Excessive thirst ('Yes' or 'No').",
        examples=["Yes"],
    )
    sudden_weight_loss: YesNoEnum = Field(
        ...,
        alias="sudden weight loss",
        description="Unexplained or sudden weight loss ('Yes' or 'No').",
        examples=["No"],
    )
    weakness: YesNoEnum = Field(
        ...,
        description="Generalized physical weakness ('Yes' or 'No').",
        examples=["Yes"],
    )
    Polyphagia: YesNoEnum = Field(
        ...,
        description="Excessive hunger or appetite ('Yes' or 'No').",
        examples=["No"],
    )
    genital_thrush: YesNoEnum = Field(
        ...,
        alias="Genital thrush",
        description="Genital yeast infection or thrush ('Yes' or 'No').",
        examples=["No"],
    )
    visual_blurring: YesNoEnum = Field(
        ...,
        alias="visual blurring",
        description="Blurring of vision ('Yes' or 'No').",
        examples=["Yes"],
    )
    Itching: YesNoEnum = Field(
        ...,
        description="Generalized itching or pruritus ('Yes' or 'No').",
        examples=["No"],
    )
    Irritability: YesNoEnum = Field(
        ...,
        description="Frequent or unexplained irritability ('Yes' or 'No').",
        examples=["Yes"],
    )
    delayed_healing: YesNoEnum = Field(
        ...,
        alias="delayed healing",
        description="Slow healing of cuts or wounds ('Yes' or 'No').",
        examples=["No"],
    )
    partial_paresis: YesNoEnum = Field(
        ...,
        alias="partial paresis",
        description="Partial muscle weakness or paresis ('Yes' or 'No').",
        examples=["No"],
    )
    muscle_stiffness: YesNoEnum = Field(
        ...,
        alias="muscle stiffness",
        description="Stiffness in muscles ('Yes' or 'No').",
        examples=["No"],
    )
    Alopecia: YesNoEnum = Field(
        ...,
        description="Noticeable hair loss or alopecia ('Yes' or 'No').",
        examples=["Yes"],
    )
    Obesity: YesNoEnum = Field(
        ...,
        description="Clinical obesity ('Yes' or 'No').",
        examples=["No"],
    )

    def to_feature_dict(self) -> Dict[str, Any]:
        """Convert validated request fields to dictionary with exact dataset column names and order."""
        return {
            "Age": self.Age,
            "Gender": self.Gender.value,
            "Polyuria": self.Polyuria.value,
            "Polydipsia": self.Polydipsia.value,
            "sudden weight loss": self.sudden_weight_loss.value,
            "weakness": self.weakness.value,
            "Polyphagia": self.Polyphagia.value,
            "Genital thrush": self.genital_thrush.value,
            "visual blurring": self.visual_blurring.value,
            "Itching": self.Itching.value,
            "Irritability": self.Irritability.value,
            "delayed healing": self.delayed_healing.value,
            "partial paresis": self.partial_paresis.value,
            "muscle stiffness": self.muscle_stiffness.value,
            "Alopecia": self.Alopecia.value,
            "Obesity": self.Obesity.value,
        }


class PredictionResponse(BaseModel):
    """Response schema for educational risk screening prediction."""
    prediction: str = Field(
        ...,
        description="Predicted class: 'Positive' or 'Negative'.",
        examples=["Positive"],
    )
    risk_assessment: str = Field(
        ...,
        description="Educational risk classification indicator.",
        examples=["Elevated Risk Detected"],
    )
    model_score: float = Field(
        ...,
        description="Calculated model decision score / positive class probability (0.0 - 1.0).",
        examples=[1.0],
    )
    class_probabilities: Dict[str, float] = Field(
        ...,
        description="Class probability distribution for all known classes.",
        examples=[{"Negative": 0.0, "Positive": 1.0}],
    )
    disclaimer: str = Field(
        default=EDUCATIONAL_DISCLAIMER,
        description="Educational disclaimer confirming this is a statistical estimate rather than a medical diagnosis.",
    )
    screening_id: Optional[str] = Field(
        default=None,
        description="Unique MongoDB document ObjectId if persisted to screening history.",
        examples=["67213bfa7f21e51b145d8123"],
    )


class ModelInfoResponse(BaseModel):
    """Response schema for model architecture and validation metadata."""
    model_name: str
    target_classes: List[str]
    features: List[str]
    metrics: Dict[str, Any]
    dataset_summary: Dict[str, Any]
    disclaimer: str = EDUCATIONAL_DISCLAIMER


class HealthResponse(BaseModel):
    """Health check status response."""
    status: str = Field(..., description="'healthy' or 'degraded'")
    service: str = Field(default="sugarsense-backend")
    model_loaded: bool
    model_name: Optional[str] = None
    database_connected: bool = Field(default=False, description="Whether MongoDB is reachable.")
