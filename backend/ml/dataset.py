from pathlib import Path
from typing import Any, Dict, List, Tuple
import pandas as pd

EXPECTED_NUMERIC_FEATURES: List[str] = ["Age"]

EXPECTED_CATEGORICAL_FEATURES: List[str] = [
    "Gender",
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

ALL_FEATURES: List[str] = EXPECTED_NUMERIC_FEATURES + EXPECTED_CATEGORICAL_FEATURES
TARGET_COLUMN: str = "class"
ALL_COLUMNS: List[str] = ALL_FEATURES + [TARGET_COLUMN]

EXPECTED_GENDERS: List[str] = ["Male", "Female"]
EXPECTED_SYMPTOM_VALUES: List[str] = ["No", "Yes"]
EXPECTED_TARGET_VALUES: List[str] = ["Negative", "Positive"]
TARGET_CLASSES: List[str] = EXPECTED_TARGET_VALUES


def get_default_dataset_path() -> Path:
    """Return default path to dataset file relative to repository layout."""
    base_dir = Path(__file__).resolve().parent.parent.parent
    return base_dir / "data" / "diabetes_data_upload.csv"


def load_dataset(csv_path: Path | str | None = None) -> pd.DataFrame:
    """Load dataset from disk without altering original content."""
    path = Path(csv_path) if csv_path else get_default_dataset_path()
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file not found at: {path}")

    df = pd.read_csv(path)
    return df


def validate_schema(df: pd.DataFrame) -> None:
    """Validate that dataframe strictly matches the expected column names and non-empty criteria."""
    if df.empty:
        raise ValueError("Dataset is empty.")

    missing_cols = [c for c in ALL_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing required columns: {missing_cols}")
    missing_values = df[ALL_COLUMNS].isnull().sum()
    if int(missing_values.sum()) > 0:
        raise ValueError(f"Dataset contains missing values: {missing_values[missing_values > 0].to_dict()}")
    invalid_targets = set(df[TARGET_COLUMN].unique()) - set(EXPECTED_TARGET_VALUES)
    if invalid_targets:
        raise ValueError(f"Dataset contains unsupported target value(s): {sorted(invalid_targets)}")
    if not pd.api.types.is_numeric_dtype(df["Age"]):
        raise ValueError("Dataset feature 'Age' must be numeric.")
    for col in EXPECTED_CATEGORICAL_FEATURES:
        allowed = EXPECTED_GENDERS if col == "Gender" else EXPECTED_SYMPTOM_VALUES
        invalid_values = set(df[col].unique()) - set(allowed)
        if invalid_values:
            raise ValueError(f"Dataset feature '{col}' contains unsupported value(s): {sorted(invalid_values)}")


def analyze_dataset(csv_path: Path | str | None = None) -> Dict[str, Any]:
    """Inspect dataset, validate data integrity, and return diagnostic statistics."""
    df = load_dataset(csv_path)
    validate_schema(df)

    rows, cols = df.shape
    missing_counts = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())

    # Age sanity checks
    age_min = int(df["Age"].min())
    age_max = int(df["Age"].max())
    age_mean = float(df["Age"].mean())
    age_median = float(df["Age"].median())

    # Categorical sanity checks
    gender_values = sorted(df["Gender"].unique().tolist())
    target_counts = df[TARGET_COLUMN].value_counts().to_dict()

    symptom_inconsistencies: Dict[str, List[str]] = {}
    for col in EXPECTED_CATEGORICAL_FEATURES:
        if col == "Gender":
            continue
        col_vals = sorted(df[col].unique().tolist())
        unexpected = [v for v in col_vals if v not in EXPECTED_SYMPTOM_VALUES]
        if unexpected:
            symptom_inconsistencies[col] = unexpected

    summary: Dict[str, Any] = {
        "rows": rows,
        "columns": cols,
        "total_missing_values": total_missing,
        "duplicate_rows": duplicate_count,
        "age_summary": {
            "min": age_min,
            "max": age_max,
            "mean": round(age_mean, 2),
            "median": round(age_median, 2),
        },
        "gender_distribution": df["Gender"].value_counts().to_dict(),
        "target_distribution": target_counts,
        "symptom_inconsistencies": symptom_inconsistencies,
        "missing_counts": missing_counts,
    }

    return summary


def print_dataset_report(csv_path: Path | str | None = None) -> Dict[str, Any]:
    """Generate and display formatted console analysis of dataset integrity."""
    summary = analyze_dataset(csv_path)

    print("=" * 60)
    print("SUGARSENSE DATASET ANALYSIS REPORT")
    print("=" * 60)
    print(f"Total Rows:     {summary['rows']}")
    print(f"Total Columns:  {summary['columns']}")
    print(f"Missing Values: {summary['total_missing_values']}")
    print(f"Duplicate Rows: {summary['duplicate_rows']} (identical survey response profiles)")
    print("-" * 60)
    print("Age Distribution:")
    age = summary["age_summary"]
    print(f"  Range: {age['min']} to {age['max']} years (Mean: {age['mean']}, Median: {age['median']})")
    print("-" * 60)
    print("Gender Distribution:")
    for gender, count in summary["gender_distribution"].items():
        print(f"  {gender}: {count} ({count / summary['rows'] * 100:.1f}%)")
    print("-" * 60)
    print("Target Distribution ('class'):")
    for label, count in summary["target_distribution"].items():
        print(f"  {label}: {count} ({count / summary['rows'] * 100:.1f}%)")
    print("-" * 60)

    inconsistencies = summary["symptom_inconsistencies"]
    if inconsistencies:
        print("WARNING: Inconsistent symptom values detected:")
        for col, bad_vals in inconsistencies.items():
            print(f"  {col}: {bad_vals}")
    else:
        print("Symptom Consistency: All 14 symptom columns contain strictly 'Yes' and 'No' values.")
    print("=" * 60)

    return summary


def get_features_and_target(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Extract features dataframe and target series according to schema rules."""
    validate_schema(df)

    # Ensure target column is never included in features
    X = df[ALL_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()

    return X, y


if __name__ == "__main__":
    print_dataset_report()
