"""GNSS Degradation Prediction Experiments Orchestrator for VYRA.

Rigorously executes Phase 2 experiments:
- Trains candidate models (Persistence, Logistic, Random Forest, XGBoost) on Train (V-S1).
- Tunes decision thresholds and calibrates probabilities on Validation (V-S2).
- Evaluates out-of-sample on held-out Test (V-S3a).
- Computes Precision, Recall, F1, PR-AUC, ROC-AUC, Brier score, ECE.
- Analyzes warning lead-time distributions and false alarm rates per hour.
- Generates publication-ready figures and saves comprehensive result artifacts.

ANTI-LEAKAGE SPECIFICATION:
- Features are strictly causal (historical window [t - L, t]).
- Threshold tuning and probability calibration are strictly performed on Validation.
- Test trajectory (V-S3a) is evaluated only once with frozen models and parameters.
"""

from __future__ import annotations

import json
import logging
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless execution
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)

from gnss.calibration import compute_calibration_metrics
from gnss.degradation_labels import generate_degradation_labels_for_trajectory
from gnss.features import PREDICTION_FEATURE_COLUMNS, extract_gnss_temporal_features
from gnss.predictor import GNSSDegradationPredictor, HORIZON_TO_SECONDS, STANDARD_HORIZONS
from gnss.quality import compute_gnss_quality
from preprocessing.dataset_loader import discover_and_load_trajectories

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def prepare_datasets(
    raw_dir: Union[str, Path] = "data/raw",
    splits_path: Union[str, Path] = "data/splits/splits.json",
    quality_threshold: float = 0.70,
) -> Tuple[Dict[str, pd.DataFrame], Dict[str, Dict[str, Any]]]:
    """Load trajectories, compute quality, causal features, and forward labels.

    Returns:
        Tuple of (Dict of processed DataFrames by split, Dict of prepared arrays and targets).
    """
    logger.info("Loading trajectories and preparing feature matrices...")
    trajs = discover_and_load_trajectories(raw_dir)

    with open(splits_path, "r", encoding="utf-8") as f:
        splits_cfg = json.load(f)

    processed_dfs: Dict[str, pd.DataFrame] = {}
    for tid, traj in trajs.items():
        df_q = compute_gnss_quality(traj.df, quality_threshold=quality_threshold)
        df_feat, _ = extract_gnss_temporal_features(df_q)
        df_labeled, _ = generate_degradation_labels_for_trajectory(
            df_feat, quality_threshold=quality_threshold
        )
        processed_dfs[tid] = df_labeled

    # Map trajectory IDs to splits
    split_dfs: Dict[str, pd.DataFrame] = {
        "train": pd.concat([processed_dfs[tid] for tid in splits_cfg["train_ids"]], ignore_index=True),
        "val": pd.concat([processed_dfs[tid] for tid in splits_cfg["val_ids"]], ignore_index=True),
        "test": pd.concat([processed_dfs[tid] for tid in splits_cfg["test_ids"]], ignore_index=True),
    }

    # Extract numpy arrays
    data_arrays: Dict[str, Dict[str, Any]] = {}
    for split_name, df_split in split_dfs.items():
        X = df_split[PREDICTION_FEATURE_COLUMNS].to_numpy(dtype=float)
        # Handle any possible NaN/inf in input features causally
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        targets: Dict[str, np.ndarray] = {
            "1s": df_split["target_degraded_1s"].to_numpy(dtype=int),
            "3s": df_split["target_degraded_3s"].to_numpy(dtype=int),
            "5s": df_split["target_degraded_5s"].to_numpy(dtype=int),
            "10s": df_split["target_degraded_10s"].to_numpy(dtype=int),
        }
        current_deg = df_split["is_currently_degraded"].to_numpy(dtype=bool)

        data_arrays[split_name] = {
            "X": X,
            "y": targets,
            "current_degraded": current_deg,
            "df": df_split,
        }

    return split_dfs, data_arrays


def compute_binary_metrics(
    y_true: np.ndarray, y_prob: np.ndarray, threshold: float
) -> Dict[str, Any]:
    """Compute comprehensive classification and calibration metrics."""
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.clip(np.asarray(y_prob, dtype=float), 0.0, 1.0)
    y_pred = (y_p >= threshold).astype(int)

    # Classification metrics
    pos_count = int(np.sum(y_t == 1))
    neg_count = int(np.sum(y_t == 0))

    if pos_count > 0 and neg_count > 0:
        roc_auc = float(roc_auc_score(y_t, y_p))
        pr_auc = float(average_precision_score(y_t, y_p))
    else:
        roc_auc = 0.50
        pr_auc = float(pos_count / max(1, len(y_t)))

    precision = float(precision_score(y_t, y_pred, zero_division=0))
    recall = float(recall_score(y_t, y_pred, zero_division=0))
    f1 = float(f1_score(y_t, y_pred, zero_division=0))

    # Confusion matrix
    tn, fp, fn, tp = confusion_matrix(y_t, y_pred, labels=[0, 1]).ravel()

    # Calibration
    cal_metrics = compute_calibration_metrics(y_t, y_p, num_bins=10)

    return {
        "threshold": round(float(threshold), 3),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(cal_metrics.brier_score, 5),
        "ece": round(cal_metrics.ece, 5),
        "mce": round(cal_metrics.mce, 5),
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
        "total_positives": pos_count,
        "total_negatives": neg_count,
    }


def analyze_warning_lead_time(
    df: pd.DataFrame,
    y_prob: np.ndarray,
    threshold: float,
    horizon_seconds: float,
    sampling_rate_hz: float = 10.0,
) -> Dict[str, Any]:
    """Calculate empirical warning lead time and event-level detection statistics.

    Lead time t_lead = t_onset - t_warning (seconds), evaluated for each contiguous
    degradation event.
    """
    is_degraded = df["is_currently_degraded"].to_numpy(dtype=bool)
    timestamps = df["timestamp"].to_numpy(dtype=float)
    y_warn = (y_prob >= threshold).astype(bool)
    n = len(df)

    # 1. Identify distinct degradation events (contiguous stretches of True)
    events: List[Tuple[int, int]] = []
    in_event = False
    start_idx = 0

    for i in range(n):
        if is_degraded[i] and not in_event:
            in_event = True
            start_idx = i
        elif not is_degraded[i] and in_event:
            in_event = False
            events.append((start_idx, i - 1))
    if in_event:
        events.append((start_idx, n - 1))

    # 2. Evaluate warning lead time for each event
    horizon_steps = int(round(horizon_seconds * sampling_rate_hz))
    detected_events = 0
    lead_times_sec: List[float] = []

    for s_idx, e_idx in events:
        t_onset = timestamps[s_idx]
        # Look backwards in the forward horizon window [s_idx - horizon_steps, s_idx)
        lookback_start = max(0, s_idx - horizon_steps)
        warn_indices = np.where(y_warn[lookback_start:s_idx])[0]

        if len(warn_indices) > 0:
            first_warn_idx = lookback_start + warn_indices[0]
            t_first_warn = timestamps[first_warn_idx]
            lead_time = max(0.0, t_onset - t_first_warn)
            lead_times_sec.append(float(lead_time))
            detected_events += 1
        else:
            lead_times_sec.append(0.0)

    # 3. False Alarm Analysis
    # A warning at epoch t is a False Alarm if NO degradation occurs within [t + 1, min(t + horizon_steps, n - 1)]
    # We use the target column (which is 1 if any degradation occurs in that horizon)
    target_col = f"target_degraded_{int(horizon_seconds)}s" if horizon_seconds.is_integer() else f"target_degraded_{horizon_seconds}s"
    target_arr = df[target_col].to_numpy(dtype=int)

    false_alarms = int(np.sum(y_warn & (target_arr == 0)))
    total_non_degraded_epochs = int(np.sum(target_arr == 0))
    total_hours = (len(df) / sampling_rate_hz) / 3600.0

    false_alarm_rate_per_hour = round(false_alarms / max(0.001, total_hours), 2)
    detection_rate = round(detected_events / max(1, len(events)), 4) if events else 1.0

    mean_lead_time = round(float(np.mean(lead_times_sec)), 3) if lead_times_sec else 0.0
    median_lead_time = round(float(np.median(lead_times_sec)), 3) if lead_times_sec else 0.0
    max_lead_time = round(float(np.max(lead_times_sec)), 3) if lead_times_sec else 0.0

    return {
        "horizon_seconds": horizon_seconds,
        "total_degradation_events": len(events),
        "detected_events": detected_events,
        "missed_events": len(events) - detected_events,
        "event_detection_rate": detection_rate,
        "mean_lead_time_seconds": mean_lead_time,
        "median_lead_time_seconds": median_lead_time,
        "max_lead_time_seconds": max_lead_time,
        "lead_times_seconds": [round(t, 2) for t in lead_times_sec],
        "false_alarms_count": false_alarms,
        "total_non_degraded_epochs": total_non_degraded_epochs,
        "false_alarm_rate_per_hour": false_alarm_rate_per_hour,
    }


def run_all_prediction_experiments(
    output_dir: Union[str, Path] = "results/processed",
    figures_dir: Union[str, Path] = "results/figures",
    models_dir: Union[str, Path] = "models/trained",
) -> Dict[str, Any]:
    """Execute end-to-end multi-model, multi-horizon experiments."""
    out_path = Path(output_dir)
    fig_path = Path(figures_dir)
    mod_path = Path(models_dir)

    out_path.mkdir(parents=True, exist_ok=True)
    fig_path.mkdir(parents=True, exist_ok=True)
    mod_path.mkdir(parents=True, exist_ok=True)

    # 1. Prepare data
    split_dfs, data_arrays = prepare_datasets()

    X_train = data_arrays["train"]["X"]
    y_train = data_arrays["train"]["y"]
    curr_deg_train = data_arrays["train"]["current_degraded"]

    X_val = data_arrays["val"]["X"]
    y_val = data_arrays["val"]["y"]
    curr_deg_val = data_arrays["val"]["current_degraded"]

    X_test = data_arrays["test"]["X"]
    y_test = data_arrays["test"]["y"]
    curr_deg_test = data_arrays["test"]["current_degraded"]
    df_test = data_arrays["test"]["df"]

    candidate_model_types = ["persistence", "logistic", "random_forest", "xgboost"]
    model_comparison_results: Dict[str, Dict[str, Any]] = {}
    calibration_summary: Dict[str, Dict[str, Any]] = {}
    lead_time_summary: Dict[str, Dict[str, Any]] = {}

    # Storage for curves
    test_predictions: Dict[str, Dict[str, np.ndarray]] = {}
    fitted_predictors: Dict[str, GNSSDegradationPredictor] = {}

    for m_type in candidate_model_types:
        logger.info("Training and tuning model family: %s", m_type.upper())

        # Fit predictor across all horizons
        predictor = GNSSDegradationPredictor(model_type=m_type)
        predictor.fit(
            X_train=X_train,
            y_train_dict=y_train,
            feature_names=PREDICTION_FEATURE_COLUMNS,
            current_degraded_train=curr_deg_train,
        )

        # Tune thresholds & calibrate on Validation set (V-S2)
        tuning_info = predictor.tune_thresholds_and_calibrate(
            X_val=X_val,
            y_val_dict=y_val,
            calibration_method="platt",
            current_degraded_val=curr_deg_val,
        )
        logger.info("  %s validation tuning results: %s", m_type, tuning_info)

        # Save bundle
        save_path = mod_path / f"gnss_predictor_{m_type}.pkl"
        predictor.save(save_path)
        fitted_predictors[m_type] = predictor

        # Evaluate on held-out Test set (V-S3a)
        model_comparison_results[m_type] = {}
        calibration_summary[m_type] = {}
        lead_time_summary[m_type] = {}
        test_predictions[m_type] = {}

        for h_name in STANDARD_HORIZONS:
            h_sec = HORIZON_TO_SECONDS[h_name]
            bundle = predictor.bundles[h_name]
            theta = bundle.optimal_threshold

            # Raw and Calibrated predictions
            raw_prob = predictor.predict_proba(
                X_test, h_name, calibrated=False, current_degraded=curr_deg_test
            )
            cal_prob = predictor.predict_proba(
                X_test, h_name, calibrated=True, current_degraded=curr_deg_test
            )
            test_predictions[m_type][h_name] = cal_prob

            # Test metrics using validation-tuned threshold
            metrics = compute_binary_metrics(y_test[h_name], cal_prob, threshold=theta)
            metrics["optimal_val_threshold"] = theta
            model_comparison_results[m_type][h_name] = metrics

            # Calibration comparison: Raw vs Calibrated
            raw_cal = compute_calibration_metrics(y_test[h_name], raw_prob)
            post_cal = compute_calibration_metrics(y_test[h_name], cal_prob)
            calibration_summary[m_type][h_name] = {
                "raw": raw_cal.to_dict(),
                "calibrated": post_cal.to_dict(),
            }

            # Lead time analysis
            lead_analysis = analyze_warning_lead_time(
                df=df_test,
                y_prob=cal_prob,
                threshold=theta,
                horizon_seconds=h_sec,
            )
            lead_time_summary[m_type][h_name] = lead_analysis

    # 4. Save JSON Results
    with open(out_path / "model_comparison.json", "w", encoding="utf-8") as f:
        json.dump(model_comparison_results, f, indent=2)

    with open(out_path / "calibration_results.json", "w", encoding="utf-8") as f:
        json.dump(calibration_summary, f, indent=2)

    with open(out_path / "warning_lead_time.json", "w", encoding="utf-8") as f:
        json.dump(lead_time_summary, f, indent=2)

    logger.info("Saved all processed JSON results to %s", out_path.resolve())

    # 5. Generate Publication-Quality Figures
    generate_evaluation_figures(
        test_predictions=test_predictions,
        y_test=y_test,
        lead_time_summary=lead_time_summary,
        fitted_predictors=fitted_predictors,
        figures_dir=fig_path,
    )

    return {
        "model_comparison": model_comparison_results,
        "calibration_summary": calibration_summary,
        "lead_time_summary": lead_time_summary,
    }


def generate_evaluation_figures(
    test_predictions: Dict[str, Dict[str, np.ndarray]],
    y_test: Dict[str, np.ndarray],
    lead_time_summary: Dict[str, Dict[str, Any]],
    fitted_predictors: Dict[str, GNSSDegradationPredictor],
    figures_dir: Path,
) -> None:
    """Generate high-resolution scientific figures."""
    plt.rcParams.update({"font.size": 11, "figure.autolayout": True})

    # FIGURE 1: ROC Curves Across Models (at 3s and 5s Horizons)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
    for h_name, ax in [("3s", ax1), ("5s", ax2)]:
        y_true = y_test[h_name]
        for m_type, preds_dict in test_predictions.items():
            prob = preds_dict[h_name]
            fpr, tpr, _ = roc_curve(y_true, prob)
            auc = roc_auc_score(y_true, prob)
            ax.plot(fpr, tpr, label=f"{m_type.upper()} (AUC = {auc:.3f})", lw=2)

        ax.plot([0, 1], [0, 1], "k--", label="Chance Baseline (AUC = 0.50)")
        ax.set_title(f"ROC Curve — Forward Horizon {h_name}")
        ax.set_xlabel("False Positive Rate (FPR)")
        ax.set_ylabel("True Positive Rate (TPR)")
        ax.grid(True, alpha=0.3)
        ax.legend(loc="lower right")

    fig.savefig(figures_dir / "gnss_roc_curves.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "gnss_roc_curves.png").resolve())

    # FIGURE 2: Precision-Recall Curves (3s and 5s Horizons)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6), dpi=300)
    for h_name, ax in [("3s", ax1), ("5s", ax2)]:
        y_true = y_test[h_name]
        base_rate = np.mean(y_true)
        for m_type, preds_dict in test_predictions.items():
            prob = preds_dict[h_name]
            prec, rec, _ = precision_recall_curve(y_true, prob)
            ap = average_precision_score(y_true, prob)
            ax.plot(rec, prec, label=f"{m_type.upper()} (PR-AUC = {ap:.3f})", lw=2)

        ax.axhline(base_rate, color="k", linestyle="--", label=f"Base Rate ({base_rate:.4f})")
        ax.set_title(f"Precision-Recall Curve — Horizon {h_name}")
        ax.set_xlabel("Recall")
        ax.set_ylabel("Precision")
        ax.grid(True, alpha=0.3)
        ax.legend(loc="upper right")

    fig.savefig(figures_dir / "gnss_pr_curves.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "gnss_pr_curves.png").resolve())

    # FIGURE 3: Reliability Diagram / Calibration Curve (XGBoost at 3s Horizon)
    fig, ax = plt.subplots(figsize=(8, 6), dpi=300)
    xgb_probs = test_predictions["xgboost"]["3s"]
    y_true_3s = y_test["3s"]
    cal_info = compute_calibration_metrics(y_true_3s, xgb_probs, num_bins=10)

    ax.plot([0, 1], [0, 1], "k--", label="Perfect Calibration")
    ax.plot(
        cal_info.bin_confidences,
        cal_info.bin_accuracies,
        "s-",
        color="crimson",
        label=f"XGBoost (ECE = {cal_info.ece:.4f}, Brier = {cal_info.brier_score:.4f})",
        lw=2,
        markersize=6,
    )
    ax.set_title("Reliability Diagram — XGBoost Degradation Predictor (H = 3s)")
    ax.set_xlabel("Mean Predicted Degradation Probability")
    ax.set_ylabel("Empirical Degradation Frequency")
    ax.set_xlim([0, 1])
    ax.set_ylim([0, 1])
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left")

    fig.savefig(figures_dir / "gnss_calibration_curves.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "gnss_calibration_curves.png").resolve())

    # FIGURE 4: Warning Lead Time Distributions
    fig, ax = plt.subplots(figsize=(9, 5), dpi=300)
    models_to_plot = ["persistence", "logistic", "random_forest", "xgboost"]
    horizons = ["1s", "3s", "5s", "10s"]

    bar_width = 0.20
    x_indices = np.arange(len(horizons))

    for idx, m_type in enumerate(models_to_plot):
        mean_leads = [
            lead_time_summary[m_type][h]["mean_lead_time_seconds"] for h in horizons
        ]
        ax.bar(
            x_indices + idx * bar_width,
            mean_leads,
            width=bar_width,
            label=m_type.upper(),
        )

    ax.set_title("Mean Warning Lead Time Before Degradation Onset (Test Set V-S3a)")
    ax.set_xlabel("Prediction Horizon Target")
    ax.set_ylabel("Empirical Lead Time (Seconds)")
    ax.set_xticks(x_indices + bar_width * 1.5)
    ax.set_xticklabels([f"H = {h}" for h in horizons])
    ax.grid(True, axis="y", alpha=0.3)
    ax.legend()

    fig.savefig(figures_dir / "gnss_lead_time_distribution.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "gnss_lead_time_distribution.png").resolve())

    # FIGURE 5: Feature Importances (XGBoost & Random Forest at 3s Horizon)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7), dpi=300)
    for model_key, ax, title in [
        ("xgboost", ax1, "XGBoost Feature Attributions (Gain)"),
        ("random_forest", ax2, "Random Forest Feature Importances (Gini)"),
    ]:
        predictor = fitted_predictors[model_key]
        bundle_3s = predictor.bundles["3s"]
        imp_dict = bundle_3s.model.get_feature_importances()
        sorted_feats = sorted(imp_dict.items(), key=lambda item: item[1], reverse=True)
        top_k = sorted_feats[:10]

        names = [item[0] for item in top_k][::-1]
        vals = [item[1] for item in top_k][::-1]

        ax.barh(names, vals, color="teal" if model_key == "xgboost" else "navy")
        ax.set_title(f"{title} — H = 3s")
        ax.set_xlabel("Importance Metric")
        ax.grid(True, axis="x", alpha=0.3)

    fig.savefig(figures_dir / "gnss_feature_importance.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "gnss_feature_importance.png").resolve())


if __name__ == "__main__":
    results = run_all_prediction_experiments()
    logger.info("Phase 2 Prediction Experiments Completed Successfully.")
