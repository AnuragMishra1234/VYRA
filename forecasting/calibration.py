"""Forecast Calibration and Uncertainty Quantification Module for VYRA.

Quantifies uncertainty and assesses calibration of predicted future errors:
1. Conformal Prediction Intervals: Non-parametric, finite-sample prediction intervals
   with empirical coverage guarantees for continuous error forecasts.
2. Probability Calibration: Expected Calibration Error (ECE), Maximum Calibration Error (MCE),
   Brier score, and reliability curve binning for threshold-violation risk estimates.
3. Post-Hoc Calibrator: Isotonic regression and temperature/sigmoid calibration on validation data.

ANTI-LEAKAGE SPECIFICATION:
Calibration quantiles and scaling maps are fitted exclusively on the validation split (V-S2).
They are frozen and evaluated out-of-sample on the held-out test split (V-S3a).
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.isotonic import IsotonicRegression

logger = logging.getLogger(__name__)


def compute_expected_calibration_error(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10,
) -> Tuple[float, float, Dict[str, np.ndarray]]:
    """Compute Expected Calibration Error (ECE) and reliability curve bins.

    Args:
        y_true: Ground truth binary indicators in {0, 1}.
        y_prob: Predicted probabilities in [0.0, 1.0].
        n_bins: Number of equal-width bins across [0.0, 1.0].

    Returns:
        Tuple of (ECE, MCE, curve dictionary containing bin_centers, bin_accuracies, bin_counts).
    """
    y_t = np.asarray(y_true, dtype=int)
    y_p = np.clip(np.asarray(y_prob, dtype=float), 0.0, 1.0)
    n = len(y_t)

    if n == 0:
        return 0.0, 0.0, {"bin_centers": np.array([]), "bin_accuracies": np.array([]), "bin_counts": np.array([])}

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    bin_centers = 0.5 * (bin_edges[:-1] + bin_edges[1:])

    ece = 0.0
    mce = 0.0
    bin_accs = np.zeros(n_bins, dtype=float)
    bin_counts = np.zeros(n_bins, dtype=int)

    for i in range(n_bins):
        low, high = bin_edges[i], bin_edges[i + 1]
        if i == n_bins - 1:
            in_bin = (y_p >= low) & (y_p <= high)
        else:
            in_bin = (y_p >= low) & (y_p < high)

        count = int(np.sum(in_bin))
        bin_counts[i] = count

        if count > 0:
            avg_prob = float(np.mean(y_p[in_bin]))
            avg_true = float(np.mean(y_t[in_bin]))
            bin_accs[i] = avg_true
            diff = abs(avg_prob - avg_true)
            ece += (count / n) * diff
            mce = max(mce, diff)
        else:
            bin_accs[i] = bin_centers[i]

    curve_data = {
        "bin_centers": bin_centers,
        "bin_accuracies": bin_accs,
        "bin_counts": bin_counts,
    }

    return float(ece), float(mce), curve_data


class ConformalResidualCalibrator:
    """Computes distribution-free conformal safety bounds on predicted error.

    Fits the 1 - alpha quantile of non-conformity residuals on calibration data:
      R_i = y_i - y_hat_i
    Guarantees:
      P(y_test <= y_hat_test + q_{1-alpha}) >= 1 - alpha
    """

    def __init__(self, coverage_level: float = 0.95) -> None:
        self.coverage_level = coverage_level
        self.quantile_margin: float = 0.0
        self.is_fitted: bool = False

    def fit(self, y_true_cal: np.ndarray, y_pred_cal: np.ndarray) -> ConformalResidualCalibrator:
        """Calibrate residual quantile margin on held-out validation split."""
        y_t = np.asarray(y_true_cal, dtype=float)
        y_p = np.asarray(y_pred_cal, dtype=float)
        n = len(y_t)

        if n == 0:
            raise ValueError("Calibration set cannot be empty.")

        # Non-conformity score: signed underestimation residual
        residuals = y_t - y_p
        # Finite-sample conformal quantile: ceil((n+1) * coverage_level) / n
        alpha = 1.0 - self.coverage_level
        q_level = min(1.0, np.ceil((n + 1) * (1.0 - alpha)) / n)
        self.quantile_margin = float(np.quantile(residuals, q_level))
        self.is_fitted = True
        return self

    def predict_upper_bound(self, y_pred: np.ndarray) -> np.ndarray:
        """Construct safe upper error bounds with theoretical coverage guarantee."""
        if not self.is_fitted:
            raise RuntimeError("Calibrator must be fitted before predict_upper_bound.")
        return np.asarray(y_pred, dtype=float) + self.quantile_margin

    def evaluate_test_coverage(self, y_true_test: np.ndarray, y_pred_test: np.ndarray) -> Dict[str, float]:
        """Evaluate empirical coverage and interval properties on held-out test data."""
        upper = self.predict_upper_bound(y_pred_test)
        covered = np.asarray(y_true_test, dtype=float) <= upper
        empirical_coverage = float(np.mean(covered))
        return {
            "target_coverage": self.coverage_level,
            "empirical_coverage": round(empirical_coverage, 4),
            "safety_margin_m": round(self.quantile_margin, 4),
            "coverage_gap": round(empirical_coverage - self.coverage_level, 4),
        }


class ProbabilityCalibrator:
    """Non-parametric isotonic regression calibrator for error violation risk."""

    def __init__(self) -> None:
        self.model = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
        self.is_fitted: bool = False

    def fit(self, y_true_cal: np.ndarray, y_prob_cal: np.ndarray) -> ProbabilityCalibrator:
        self.model.fit(np.asarray(y_prob_cal, dtype=float), np.asarray(y_true_cal, dtype=int))
        self.is_fitted = True
        return self

    def calibrate(self, y_prob: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("ProbabilityCalibrator must be fitted before calibrate.")
        return np.asarray(self.model.predict(np.asarray(y_prob, dtype=float)), dtype=float)
