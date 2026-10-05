"""GNSS Degradation Probability Calibration Module for VYRA.

Evaluates and calibrates predicted degradation probabilities to ensure
predicted risks align with empirical degradation frequencies:
- Expected Calibration Error (ECE)
- Maximum Calibration Error (MCE)
- Brier Score
- Reliability diagram binning
- Platt Scaling (Logistic Calibration)
- Isotonic Regression Calibration

ANTI-LEAKAGE SPECIFICATION:
Calibration models (Platt / Isotonic) MUST be fit strictly on the
Validation set and applied out-of-sample to the Test set.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss

logger = logging.getLogger(__name__)


@dataclass
class CalibrationMetrics:
    """Summary metrics of probability calibration."""

    ece: float
    mce: float
    brier_score: float
    num_bins: int
    bin_accuracies: List[float]
    bin_confidences: List[float]
    bin_counts: List[int]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ece": round(float(self.ece), 5),
            "mce": round(float(self.mce), 5),
            "brier_score": round(float(self.brier_score), 5),
            "num_bins": self.num_bins,
            "bin_accuracies": [round(float(a), 4) for a in self.bin_accuracies],
            "bin_confidences": [round(float(c), 4) for c in self.bin_confidences],
            "bin_counts": [int(cnt) for cnt in self.bin_counts],
        }


def compute_calibration_metrics(
    y_true: Union[np.ndarray, List[int]],
    y_prob: Union[np.ndarray, List[float]],
    num_bins: int = 10,
) -> CalibrationMetrics:
    """Compute Expected Calibration Error, MCE, Brier score, and bin stats.

    Args:
        y_true: Ground truth binary labels (0 or 1).
        y_prob: Predicted probabilities in [0.0, 1.0].
        num_bins: Number of equal-width bins across [0.0, 1.0].

    Returns:
        CalibrationMetrics object.
    """
    y_t = np.asarray(y_true, dtype=float)
    y_p = np.clip(np.asarray(y_prob, dtype=float), 0.0, 1.0)
    n = len(y_t)

    if n == 0:
        return CalibrationMetrics(0.0, 0.0, 0.0, num_bins, [], [], [])

    brier = float(brier_score_loss(y_t, y_p))

    bin_boundaries = np.linspace(0.0, 1.0, num_bins + 1)
    bin_accuracies: List[float] = []
    bin_confidences: List[float] = []
    bin_counts: List[int] = []

    ece = 0.0
    mce = 0.0

    for i in range(num_bins):
        low, high = bin_boundaries[i], bin_boundaries[i + 1]
        if i == num_bins - 1:
            in_bin = (y_p >= low) & (y_p <= high)
        else:
            in_bin = (y_p >= low) & (y_p < high)

        count = int(np.sum(in_bin))
        bin_counts.append(count)

        if count > 0:
            acc = float(np.mean(y_t[in_bin]))
            conf = float(np.mean(y_p[in_bin]))
            gap = abs(acc - conf)

            bin_accuracies.append(acc)
            bin_confidences.append(conf)

            ece += (count / n) * gap
            if gap > mce:
                mce = gap
        else:
            bin_accuracies.append(0.0)
            bin_confidences.append(float((low + high) / 2.0))

    return CalibrationMetrics(
        ece=float(ece),
        mce=float(mce),
        brier_score=brier,
        num_bins=num_bins,
        bin_accuracies=bin_accuracies,
        bin_confidences=bin_confidences,
        bin_counts=bin_counts,
    )


class PlattCalibrator:
    """Platt scaling (univariate logistic calibration) fitted on validation set."""

    def __init__(self) -> None:
        self.model: LogisticRegression = LogisticRegression(C=1.0, solver="lbfgs")
        self.is_fitted: bool = False

    def fit(
        self, y_val_prob: np.ndarray, y_val_true: np.ndarray
    ) -> PlattCalibrator:
        """Fit Platt scaling using validation probabilities and labels."""
        probs = np.clip(np.asarray(y_val_prob, dtype=float), 1e-6, 1.0 - 1e-6)
        # Log-odds logit transform
        logits = np.log(probs / (1.0 - probs)).reshape(-1, 1)
        labels = np.asarray(y_val_true, dtype=int)

        # Handle edge case where validation has only 1 class
        unique_classes = np.unique(labels)
        if len(unique_classes) < 2:
            logger.warning("Validation data contains only 1 class; skipping Platt calibration.")
            self.is_fitted = False
            return self

        self.model.fit(logits, labels)
        self.is_fitted = True
        return self

    def calibrate(self, probs: np.ndarray) -> np.ndarray:
        """Map raw probabilities to calibrated probabilities."""
        if not self.is_fitted:
            return np.asarray(probs, dtype=float)

        p = np.clip(np.asarray(probs, dtype=float), 1e-6, 1.0 - 1e-6)
        logits = np.log(p / (1.0 - p)).reshape(-1, 1)
        calibrated = self.model.predict_proba(logits)[:, 1]
        return calibrated


class IsotonicCalibrator:
    """Isotonic regression probability calibrator fitted on validation set."""

    def __init__(self) -> None:
        self.model: IsotonicRegression = IsotonicRegression(
            out_of_bounds="clip", y_min=0.0, y_max=1.0
        )
        self.is_fitted: bool = False

    def fit(
        self, y_val_prob: np.ndarray, y_val_true: np.ndarray
    ) -> IsotonicCalibrator:
        """Fit monotonic calibration mapping."""
        probs = np.asarray(y_val_prob, dtype=float)
        labels = np.asarray(y_val_true, dtype=float)

        unique_classes = np.unique(labels)
        if len(unique_classes) < 2:
            logger.warning("Validation data contains only 1 class; skipping Isotonic calibration.")
            self.is_fitted = False
            return self

        self.model.fit(probs, labels)
        self.is_fitted = True
        return self

    def calibrate(self, probs: np.ndarray) -> np.ndarray:
        """Apply monotonic calibration to input probabilities."""
        if not self.is_fitted:
            return np.asarray(probs, dtype=float)
        p = np.asarray(probs, dtype=float)
        return np.clip(self.model.predict(p), 0.0, 1.0)
