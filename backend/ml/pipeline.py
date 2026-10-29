from pathlib import Path
import sys
from typing import Any, Dict, List

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier

from ml.dataset import (
    ALL_FEATURES,
    EXPECTED_CATEGORICAL_FEATURES,
    EXPECTED_NUMERIC_FEATURES,
)


def build_preprocessor() -> ColumnTransformer:
    """Build a ColumnTransformer that scales numeric features and one-hot encodes categoricals."""
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(
        drop="if_binary",
        handle_unknown="ignore",
        sparse_output=False,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, EXPECTED_NUMERIC_FEATURES),
            ("cat", categorical_transformer, EXPECTED_CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )
    return preprocessor


def build_pipeline(
    model_type: str = "decision_tree",
    random_state: int = 42,
    **classifier_kwargs: Any,
) -> Pipeline:
    """Build a full machine learning Pipeline with preprocessing and classifier."""
    preprocessor = build_preprocessor()

    if model_type == "logistic_regression":
        kwargs: Dict[str, Any] = {"max_iter": 1000, "random_state": random_state}
        kwargs.update(classifier_kwargs)
        classifier = LogisticRegression(**kwargs)
    elif model_type == "decision_tree":
        kwargs = {"random_state": random_state}
        kwargs.update(classifier_kwargs)
        classifier = DecisionTreeClassifier(**kwargs)
    else:
        raise ValueError(
            f"Unsupported model type '{model_type}'. Choose 'logistic_regression' or 'decision_tree'."
        )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )
    return pipeline


def validate_input_data(data: Dict[str, Any] | List[Dict[str, Any]] | pd.DataFrame) -> pd.DataFrame:
    """Validate and normalize inference input into a DataFrame with required features and order."""
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    elif isinstance(data, list):
        if not data:
            raise ValueError("Input sample list cannot be empty.")
        df = pd.DataFrame(data)
    elif isinstance(data, pd.DataFrame):
        df = data.copy()
    else:
        raise TypeError(f"Unsupported input data type: {type(data)}. Expected dict, list, or DataFrame.")

    missing = [f for f in ALL_FEATURES if f not in df.columns]
    if missing:
        raise ValueError(f"Input is missing required features: {missing}")

    # Validate Age
    if not pd.api.types.is_numeric_dtype(df["Age"]):
        try:
            df["Age"] = pd.to_numeric(df["Age"])
        except Exception as exc:
            raise ValueError(f"Feature 'Age' must be numeric. Encountered error: {exc}") from exc

    if (df["Age"] < 0).any() or (df["Age"] > 120).any():
        raise ValueError("Feature 'Age' must be within a realistic physiological range (0-120).")

    # Validate categorical columns are non-empty
    for col in EXPECTED_CATEGORICAL_FEATURES:
        if df[col].isnull().any():
            raise ValueError(f"Feature '{col}' contains null or missing values.")

    # Return DataFrame strictly matching the expected feature order
    return df[ALL_FEATURES]
