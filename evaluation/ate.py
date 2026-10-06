"""Absolute Trajectory Error (ATE) Evaluation Module for VYRA.

Computes point-wise Euclidean errors, summary statistics (mean ATE, median,
RMSE, max, P95, final drift), and threshold-bound violation metrics against
ground-truth reference positions in local tangent (ENU) coordinates.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ATESummary:
    """Comprehensive Absolute Trajectory Error summary metrics."""

    mean_ate_m: float
    median_ate_m: float
    rmse_m: float
    max_error_m: float
    p95_error_m: float
    final_drift_m: float
    violation_rate_5m_pct: float
    violation_rate_10m_pct: float
    violation_time_5m_s: float
    total_epochs: int


def compute_pointwise_position_error(
    est_e: np.ndarray,
    est_n: np.ndarray,
    gt_e: np.ndarray,
    gt_n: np.ndarray,
) -> np.ndarray:
    """Compute 2D horizontal Euclidean position error per epoch (meters)."""
    est_e = np.asarray(est_e, dtype=float)
    est_n = np.asarray(est_n, dtype=float)
    gt_e = np.asarray(gt_e, dtype=float)
    gt_n = np.asarray(gt_n, dtype=float)
    return np.sqrt((est_e - gt_e) ** 2 + (est_n - gt_n) ** 2)


def compute_ate_summary(
    errors: np.ndarray,
    sample_rate_hz: float = 10.0,
    threshold_5m: float = 5.0,
    threshold_10m: float = 10.0,
) -> ATESummary:
    """Compute comprehensive ATE statistics from pointwise error vector."""
    err = np.asarray(errors, dtype=float)
    n = len(err)
    if n == 0:
        return ATESummary(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0)

    mean_ate = float(np.mean(err))
    median_ate = float(np.median(err))
    rmse = float(np.sqrt(np.mean(err ** 2)))
    max_err = float(np.max(err))
    p95_err = float(np.percentile(err, 95))
    final_drift = float(err[-1])

    viol_5m_count = int(np.sum(err > threshold_5m))
    viol_10m_count = int(np.sum(err > threshold_10m))

    viol_rate_5m = float(viol_5m_count / n * 100.0)
    viol_rate_10m = float(viol_10m_count / n * 100.0)
    viol_time_5m = float(viol_5m_count / sample_rate_hz)

    return ATESummary(
        mean_ate_m=round(mean_ate, 4),
        median_ate_m=round(median_ate, 4),
        rmse_m=round(rmse, 4),
        max_error_m=round(max_err, 4),
        p95_error_m=round(p95_err, 4),
        final_drift_m=round(final_drift, 4),
        violation_rate_5m_pct=round(viol_rate_5m, 2),
        violation_rate_10m_pct=round(viol_rate_10m, 2),
        violation_time_5m_s=round(viol_time_5m, 2),
        total_epochs=n,
    )
