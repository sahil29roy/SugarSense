from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any, Dict, Tuple

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    make_scorer,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split

from ml.dataset import ALL_FEATURES, TARGET_CLASSES, get_features_and_target, load_dataset
from ml.pipeline import build_pipeline

RANDOM_SEED: int = 42
TEST_SIZE: float = 0.20
SAVED_MODEL_DIR = Path(__file__).resolve().parent / "saved_model"
MODEL_FILENAME = "sugarsense_model.joblib"
METADATA_FILENAME = "model_metadata.json"


def evaluate_model_pipeline(
    name: str,
    pipeline: Any,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    cv_folds: int = 5,
) -> Dict[str, Any]:
    """Train a pipeline, run cross-validation on training data, and evaluate on held-out test data."""
    scoring = {
        "accuracy": "accuracy",
        "recall": make_scorer(recall_score, pos_label="Positive"),
        "precision": make_scorer(precision_score, pos_label="Positive"),
        "f1": make_scorer(f1_score, pos_label="Positive"),
    }

    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=RANDOM_SEED)
    cv_results = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring)

    # Fit exclusively on training data
    pipeline.fit(X_train, y_train)

    # Evaluate on held-out test set
    y_pred = pipeline.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred, pos_label="Positive"))
    prec = float(precision_score(y_test, y_pred, pos_label="Positive"))
    f1 = float(f1_score(y_test, y_pred, pos_label="Positive"))
    cm = confusion_matrix(y_test, y_pred, labels=["Negative", "Positive"]).tolist()
    cr = classification_report(y_test, y_pred, labels=["Negative", "Positive"], output_dict=True)

    cv_acc_mean = float(cv_results["test_accuracy"].mean())
    cv_rec_mean = float(cv_results["test_recall"].mean())
    cv_prec_mean = float(cv_results["test_precision"].mean())
    cv_f1_mean = float(cv_results["test_f1"].mean())

    metrics: Dict[str, Any] = {
        "model_name": name,
        "cross_validation": {
            "folds": cv_folds,
            "mean_accuracy": round(cv_acc_mean, 4),
            "mean_recall": round(cv_rec_mean, 4),
            "mean_precision": round(cv_prec_mean, 4),
            "mean_f1": round(cv_f1_mean, 4),
        },
        "test_metrics": {
            "accuracy": round(acc, 4),
            "recall_positive": round(rec, 4),
            "precision_positive": round(prec, 4),
            "f1_positive": round(f1, 4),
            "confusion_matrix": {
                "true_negative": cm[0][0],
                "false_positive": cm[0][1],
                "false_negative": cm[1][0],
                "true_positive": cm[1][1],
            },
            "classification_report": cr,
        },
    }
    return metrics


def print_evaluation_summary(metrics: Dict[str, Any]) -> None:
    """Print readable evaluation summary for a trained model."""
    name = metrics["model_name"]
    cv = metrics["cross_validation"]
    test = metrics["test_metrics"]
    cm = test["confusion_matrix"]

    print(f"\n{'=' * 65}")
    print(f"EVALUATION: {name.upper()}")
    print(f"{'=' * 65}")
    print(f"5-Fold CV on Training Data:")
    print(f"  Accuracy:  {cv['mean_accuracy']:.4f}")
    print(f"  Recall:    {cv['mean_recall']:.4f} (Positive Class)")
    print(f"  Precision: {cv['mean_precision']:.4f}")
    print(f"  F1-Score:  {cv['mean_f1']:.4f}")
    print("-" * 65)
    print(f"Held-Out Test Set Metrics (N={cm['true_negative'] + cm['false_positive'] + cm['false_negative'] + cm['true_positive']}):")
    print(f"  Accuracy:  {test['accuracy']:.4f}")
    print(f"  Recall:    {test['recall_positive']:.4f} (Positive Class)")
    print(f"  Precision: {test['precision_positive']:.4f}")
    print(f"  F1-Score:  {test['f1_positive']:.4f}")
    print(f"Confusion Matrix:")
    print(f"  True Negatives (TN):  {cm['true_negative']}")
    print(f"  False Positives (FP): {cm['false_positive']}")
    print(f"  False Negatives (FN): {cm['false_negative']} (CRITICAL SCREENING RISK)")
    print(f"  True Positives (TP):  {cm['true_positive']}")
    print(f"{'=' * 65}")


def save_artifacts(
    pipeline: Any,
    metadata: Dict[str, Any],
    output_dir: Path = SAVED_MODEL_DIR,
) -> Tuple[Path, Path]:
    """Safely serialize model pipeline and write metadata JSON."""
    output_dir.mkdir(parents=True, exist_ok=True)
    model_path = output_dir / MODEL_FILENAME
    metadata_path = output_dir / METADATA_FILENAME

    # Atomic write pattern using temporary file for pipeline
    temp_model_path = output_dir / f"{MODEL_FILENAME}.tmp"
    joblib.dump(pipeline, temp_model_path)
    temp_model_path.replace(model_path)

    # Write metadata JSON
    temp_meta_path = output_dir / f"{METADATA_FILENAME}.tmp"
    with open(temp_meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    temp_meta_path.replace(metadata_path)

    return model_path, metadata_path


def run_training_workflow(csv_path: Path | str | None = None) -> Dict[str, Any]:
    """Execute complete dataset splitting, training, model comparison, selection, and artifact persistence."""
    df = load_dataset(csv_path)
    X, y = get_features_and_target(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=y,
    )

    models_to_evaluate = [
        ("Logistic Regression", build_pipeline("logistic_regression", random_state=RANDOM_SEED)),
        ("Decision Tree", build_pipeline("decision_tree", random_state=RANDOM_SEED)),
    ]

    evaluated_results = []
    trained_pipelines = {}

    for name, pipe in models_to_evaluate:
        metrics = evaluate_model_pipeline(name, pipe, X_train, y_train, X_test, y_test)
        print_evaluation_summary(metrics)
        evaluated_results.append(metrics)
        trained_pipelines[name] = pipe

    # Model Selection Logic:
    # In educational health screening, high sensitivity (positive-class recall) is paramount
    # to avoid false negatives (missing individuals with diabetes risk indicators).
    # Secondary criteria: F1-score and Accuracy.
    best_candidate = max(
        evaluated_results,
        key=lambda m: (
            m["test_metrics"]["recall_positive"],
            m["test_metrics"]["f1_positive"],
            m["test_metrics"]["accuracy"],
        ),
    )

    selected_model_name = best_candidate["model_name"]
    selected_pipeline = trained_pipelines[selected_model_name]

    print(f"\nMODEL SELECTION RESULT:")
    print(f"  Selected Model: {selected_model_name}")
    print(
        f"  Rationale: Prioritized positive-class recall ({best_candidate['test_metrics']['recall_positive']:.4f}) "
        f"and minimal false negatives ({best_candidate['test_metrics']['confusion_matrix']['false_negative']}) "
        f"to maximize risk detection efficacy in an educational screening setting."
    )

    metadata: Dict[str, Any] = {
        "model_name": selected_model_name,
        "model_file": MODEL_FILENAME,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "dataset_summary": {
            "total_rows": len(df),
            "train_rows": len(X_train),
            "test_rows": len(X_test),
            "train_test_split_ratio": f"{int((1 - TEST_SIZE) * 100)}/{int(TEST_SIZE * 100)}",
        },
        "features": {
            "order": ALL_FEATURES,
            "count": len(ALL_FEATURES),
        },
        "target": {
            "column": "class",
            "classes": TARGET_CLASSES,
        },
        "selected_model_metrics": best_candidate,
        "all_model_evaluations": evaluated_results,
        "clinical_tradeoff_note": (
            "In health screening applications, false negatives (failing to identify at-risk users) carry "
            "greater clinical cost than false positives (which merely trigger confirmatory clinical evaluation). "
            "The final model was selected primarily for high positive-class sensitivity and overall discrimination."
        ),
    }

    model_path, metadata_path = save_artifacts(selected_pipeline, metadata)
    print(f"\nArtifacts saved successfully:")
    print(f"  Pipeline: {model_path}")
    print(f"  Metadata: {metadata_path}")

    return metadata


if __name__ == "__main__":
    run_training_workflow()
