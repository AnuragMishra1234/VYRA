"""Relative Trajectory Error (RTE) Module for VYRA.

Computes sequence-relative displacement drift errors over sliding evaluation
sub-windows of fixed duration (e.g. 5s, 10s) or fixed travel distance.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


def compute_relative_trajectory_error(
    est_e: np.ndarray,
    est_n: np.ndarray,
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    delta_epochs: int = 100,  # 10.0 seconds at 10 Hz
) -> Dict[str, float]:
    """Compute Relative Trajectory Error (RTE) over window intervals of delta_epochs.

    RTE_k = || (p_est(k+delta) - p_est(k)) - (p_gt(k+delta) - p_gt(k)) ||

    Args:
        est_e, est_n: Estimated ENU positions.
        gt_e, gt_n: Ground truth ENU positions.
        delta_epochs: Epoch separation for relative evaluation.

    Returns:
        Dict with mean_rte_m, median_rte_m, max_rte_m, rmse_rte_m.
    """
    n = len(est_e)
    if n <= delta_epochs:
        return {"mean_rte_m": 0.0, "median_rte_m": 0.0, "max_rte_m": 0.0, "rmse_rte_m": 0.0}

    disp_est_e = est_e[delta_epochs:] - est_e[:-delta_epochs]
    disp_est_n = est_n[delta_epochs:] - est_n[:-delta_epochs]

    disp_gt_e = gt_e[delta_epochs:] - gt_e[:-delta_epochs]
    disp_gt_n = gt_n[delta_epochs:] - gt_n[:-delta_epochs]

    diff_e = disp_est_e - disp_gt_e
    diff_n = disp_est_n - disp_gt_n

    rte_vals = np.sqrt(diff_e ** 2 + diff_n ** 2)

    return {
        "mean_rte_m": round(float(np.mean(rte_vals)), 4),
        "median_rte_m": round(float(np.median(rte_vals)), 4),
        "max_rte_m": round(float(np.max(rte_vals)), 4),
        "rmse_rte_m": round(float(np.sqrt(np.mean(rte_vals ** 2))), 4),
    }
