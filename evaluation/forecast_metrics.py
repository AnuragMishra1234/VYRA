"""Forecast Metrics and Action Ranking Evaluation Module for VYRA.

Computes regression metrics (RMSE, MAE, bias, Spearman rho), action-ranking
fidelity (Top-1 match, pairwise accuracy), and decision regret relative to
an offline empirical oracle.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from scipy.stats import spearmanr

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ForecastRegressionMetrics:
    """Standard evaluation metrics for continuous error forecasts."""

    rmse: float
    mae: float
    bias: float
    spearman_rho: float
    p95_error: float


@dataclass(frozen=True)
class ActionRankingMetrics:
    """Action ranking and policy decision metrics relative to empirical oracle."""

    top1_match_accuracy_pct: float
    pairwise_ranking_accuracy_pct: float
    mean_regret_m: float
    median_regret_m: float
    p95_regret_m: float
    excess_error_m: float


def compute_forecast_regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> ForecastRegressionMetrics:
    """Compute regression metrics between true and predicted future error."""
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.asarray(y_pred, dtype=float)

    diff = y_p - y_t
    rmse = float(np.sqrt(np.mean(diff ** 2)))
    mae = float(np.mean(np.abs(diff)))
    bias = float(np.mean(diff))

    rho, _ = spearmanr(y_t, y_p)
    if np.isnan(rho):
        rho = 0.0

    p95 = float(np.percentile(np.abs(diff), 95))

    return ForecastRegressionMetrics(
        rmse=round(rmse, 4),
        mae=round(mae, 4),
        bias=round(bias, 4),
        spearman_rho=round(float(rho), 4),
        p95_error=round(p95, 4),
    )


def compute_action_ranking_metrics(
    true_action_errors: Dict[str, np.ndarray],
    pred_action_errors: Dict[str, np.ndarray],
) -> ActionRankingMetrics:
    """Compute action-ranking accuracy and regret across candidate navigation modes.

    Args:
        true_action_errors: Dict mapping mode name -> array of realized future errors.
        pred_action_errors: Dict mapping mode name -> array of predicted future errors.

    Returns:
        ActionRankingMetrics summary.
    """
    action_names = list(true_action_errors.keys())
    n = len(true_action_errors[action_names[0]])

    true_mat = np.column_stack([true_action_errors[a] for a in action_names])
    pred_mat = np.column_stack([pred_action_errors[a] for a in action_names])

    oracle_best_idx = np.argmin(true_mat, axis=1)
    pred_best_idx = np.argmin(pred_mat, axis=1)

    # Top-1 match
    top1_matches = (oracle_best_idx == pred_best_idx)
    top1_acc = float(np.mean(top1_matches) * 100.0)

    # Regret = true_error(pred_best) - true_error(oracle_best)
    chosen_true_err = true_mat[np.arange(n), pred_best_idx]
    oracle_true_err = true_mat[np.arange(n), oracle_best_idx]
    regret = np.maximum(0.0, chosen_true_err - oracle_true_err)

    mean_regret = float(np.mean(regret))
    median_regret = float(np.median(regret))
    p95_regret = float(np.percentile(regret, 95))
    excess_err = float(np.mean(chosen_true_err) - np.mean(oracle_true_err))

    # Pairwise ranking accuracy
    num_pairs = 0
    correct_pairs = 0
    num_acts = len(action_names)
    for i in range(num_acts):
        for j in range(i + 1, num_acts):
            true_order = true_mat[:, i] < true_mat[:, j]
            pred_order = pred_mat[:, i] < pred_mat[:, j]
            correct_pairs += int(np.sum(true_order == pred_order))
            num_pairs += n

    pairwise_acc = float(correct_pairs / max(1, num_pairs) * 100.0)

    return ActionRankingMetrics(
        top1_match_accuracy_pct=round(top1_acc, 2),
        pairwise_ranking_accuracy_pct=round(pairwise_acc, 2),
        mean_regret_m=round(mean_regret, 4),
        median_regret_m=round(median_regret, 4),
        p95_regret_m=round(p95_regret, 4),
        excess_error_m=round(excess_err, 4),
    )
