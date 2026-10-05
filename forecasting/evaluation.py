"""Forecast Evaluation Module for VYRA.

Evaluates predicted vs. actual observed future localization errors across candidate
modes to empirically validate the action-conditioned forecasting engine.

Metrics:
- Continuous Error Forecasting: RMSE, MAE, R^2, Spearman rank correlation, Pearson correlation.
- Action Ranking Fidelity: Top-1 action match accuracy, pairwise ranking accuracy, decision regret.
- Safety & Underestimation Risk: P95 error, maximum underestimation error (true > pred).
- Binary Violation Classification: AUROC, AUPRC, Brier Score, F1, Precision, Recall.

ANTI-LEAKAGE SPECIFICATION:
Evaluation routines accept strictly aligned arrays of pre-computed predictions and
held-out ground truth targets. No test labels or future observations are exposed to model inputs.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from scipy.stats import spearmanr, pearsonr
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)

from forecasting.action_conditioning import ACTION_NAMES, NavigationAction

logger = logging.getLogger(__name__)


def evaluate_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """Compute comprehensive regression evaluation metrics for error forecasts.

    Args:
        y_true: Ground truth observed maximum localization error array (meters).
        y_pred: Model predicted maximum localization error array (meters).

    Returns:
        Dictionary of computed metric names and floating point values.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    if len(y_t) != len(y_p):
        raise ValueError(f"Length mismatch: y_true ({len(y_t)}) vs y_pred ({len(y_p)}).")

    if len(y_t) == 0:
        return {
            "rmse": 0.0,
            "mae": 0.0,
            "r2": 0.0,
            "spearman_rho": 0.0,
            "pearson_r": 0.0,
            "max_underestimation": 0.0,
            "p95_absolute_error": 0.0,
            "count": 0,
        }

    rmse = float(np.sqrt(mean_squared_error(y_t, y_p)))
    mae = float(mean_absolute_error(y_t, y_p))

    # Guard against zero-variance edge cases in R^2
    var_true = float(np.var(y_t))
    r2 = float(r2_score(y_t, y_p)) if var_true > 1e-9 else 0.0

    # Correlation metrics
    if var_true > 1e-9 and float(np.var(y_p)) > 1e-9:
        s_corr, _ = spearmanr(y_t, y_p)
        p_corr, _ = pearsonr(y_t, y_p)
        spearman_rho = float(s_corr) if not np.isnan(s_corr) else 0.0
        pearson_r = float(p_corr) if not np.isnan(p_corr) else 0.0
    else:
        spearman_rho = 0.0
        pearson_r = 0.0

    # Safety-critical metrics: underestimation (system thought error was small, but actual was large)
    residuals = y_t - y_p  # positive when true > pred
    max_underestimation = float(np.max(np.maximum(0.0, residuals)))
    p95_abs_err = float(np.percentile(np.abs(residuals), 95))

    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2": round(r2, 4),
        "spearman_rho": round(spearman_rho, 4),
        "pearson_r": round(pearson_r, 4),
        "max_underestimation": round(max_underestimation, 4),
        "p95_absolute_error": round(p95_abs_err, 4),
        "count": len(y_t),
    }


def evaluate_action_ranking(
    action_preds: Dict[str, np.ndarray],
    action_trues: Dict[str, np.ndarray],
) -> Dict[str, Any]:
    """Evaluate fidelity of candidate action ranking and decision regret.

    Assesses how well the model identifies the optimal navigation mode at each epoch:
    - Top-1 Accuracy: predicted min-error action matches true min-error action.
    - Pairwise Accuracy: fraction of pairs (A_i, A_j) correctly ordered.
    - Regret: true error of chosen action minus true error of oracle optimal action.

    Args:
        action_preds: Mapping of action name -> 1D array of predicted errors.
        action_trues: Mapping of action name -> 1D array of actual observed errors.

    Returns:
        Dictionary of ranking metrics, regret statistics, and mode selection frequencies.
    """
    actions = list(action_preds.keys())
    if len(actions) < 2:
        raise ValueError("At least 2 candidate actions required for ranking evaluation.")

    n = len(next(iter(action_preds.values())))
    for act in actions:
        if len(action_preds[act]) != n or len(action_trues[act]) != n:
            raise ValueError(f"Array length mismatch for action '{act}'.")

    # Stack into N x M matrices
    pred_mat = np.column_stack([action_preds[a] for a in actions])  # N x M
    true_mat = np.column_stack([action_trues[a] for a in actions])  # N x M

    # Best action indices
    best_pred_idx = np.argmin(pred_mat, axis=1)  # N
    best_true_idx = np.argmin(true_mat, axis=1)  # N

    # 1. Top-1 match accuracy
    top1_matches = (best_pred_idx == best_true_idx)
    top1_accuracy = float(np.mean(top1_matches))

    # 2. Decision Regret
    # True error achieved by following model recommendation vs oracle
    err_chosen = true_mat[np.arange(n), best_pred_idx]
    err_oracle = true_mat[np.arange(n), best_true_idx]
    regret = err_chosen - err_oracle  # Always >= 0

    mean_regret = float(np.mean(regret))
    median_regret = float(np.median(regret))
    p95_regret = float(np.percentile(regret, 95))
    max_regret = float(np.max(regret))

    # 3. Pairwise Ranking Accuracy across all distinct action pairs
    num_pairs = 0
    correct_pairs = 0
    m = len(actions)
    for i in range(m):
        for j in range(i + 1, m):
            pred_diff = pred_mat[:, i] - pred_mat[:, j]
            true_diff = true_mat[:, i] - true_mat[:, j]

            # Consistent if signs match (or both zero)
            pair_correct = np.sign(pred_diff) == np.sign(true_diff)
            correct_pairs += int(np.sum(pair_correct))
            num_pairs += n

    pairwise_accuracy = float(correct_pairs / num_pairs) if num_pairs > 0 else 0.0

    # 4. Action recommendation distributions
    pred_counts = {actions[i]: int(np.sum(best_pred_idx == i)) for i in range(m)}
    true_counts = {actions[i]: int(np.sum(best_true_idx == i)) for i in range(m)}

    return {
        "top1_ranking_accuracy": round(top1_accuracy, 4),
        "pairwise_ranking_accuracy": round(pairwise_accuracy, 4),
        "mean_regret_m": round(mean_regret, 4),
        "median_regret_m": round(median_regret, 4),
        "p95_regret_m": round(p95_regret, 4),
        "max_regret_m": round(max_regret, 4),
        "predicted_mode_counts": pred_counts,
        "oracle_mode_counts": true_counts,
        "sample_count": n,
    }


def evaluate_violation_classification(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5,
) -> Dict[str, float]:
    """Evaluate binary error-bound violation prediction performance.

    Args:
        y_true: Binary ground truth violation indicators (1 if error > threshold else 0).
        y_prob: Predicted violation probabilities in [0.0, 1.0].
        threshold: Decision threshold for discrete classification metrics.

    Returns:
        Dictionary of AUROC, AUPRC, Brier Score, and thresholded classification metrics.
    """
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.asarray(y_prob, dtype=float)

    if len(y_t) != len(y_p):
        raise ValueError(f"Length mismatch: {len(y_t)} vs {len(y_p)}")

    n_pos = int(np.sum(y_t == 1))
    n_neg = int(np.sum(y_t == 0))

    if n_pos == 0 or n_neg == 0:
        return {
            "auroc": 0.5,
            "auprc": float(n_pos / len(y_t)) if len(y_t) > 0 else 0.0,
            "brier_score": float(np.mean((y_p - y_t) ** 2)),
            "accuracy": float(np.mean((y_p >= threshold) == y_t)),
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
        }

    auroc = float(roc_auc_score(y_t, y_p))
    auprc = float(average_precision_score(y_t, y_p))
    brier = float(brier_score_loss(y_t, y_p))

    # Thresholded metrics
    y_pred_bin = (y_p >= threshold).astype(int)
    tp = int(np.sum((y_pred_bin == 1) & (y_t == 1)))
    fp = int(np.sum((y_pred_bin == 1) & (y_t == 0)))
    fn = int(np.sum((y_pred_bin == 0) & (y_t == 1)))
    tn = int(np.sum((y_pred_bin == 0) & (y_t == 0)))

    accuracy = float((tp + tn) / len(y_t))
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    return {
        "auroc": round(auroc, 4),
        "auprc": round(auprc, 4),
        "brier_score": round(brier, 4),
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
    }
