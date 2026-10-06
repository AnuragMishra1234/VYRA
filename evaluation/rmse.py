"""Root Mean Square Error (RMSE) Evaluation Module for VYRA.

Computes horizontal, individual axis, and velocity RMSE metrics.
"""

from __future__ import annotations

import numpy as np


def compute_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Compute standard Root Mean Square Error."""
    diff = np.asarray(y_true, dtype=float) - np.asarray(y_pred, dtype=float)
    return float(np.sqrt(np.mean(diff ** 2)))


def compute_horizontal_rmse(
    est_e: np.ndarray,
    est_n: np.ndarray,
    gt_e: np.ndarray,
    gt_n: np.ndarray,
) -> float:
    """Compute 2D horizontal Root Mean Square Error (meters)."""
    de = np.asarray(est_e, dtype=float) - np.asarray(gt_e, dtype=float)
    dn = np.asarray(est_n, dtype=float) - np.asarray(gt_n, dtype=float)
    return float(np.sqrt(np.mean(de ** 2 + dn ** 2)))
