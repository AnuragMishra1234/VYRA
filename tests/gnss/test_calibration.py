"""Unit Tests for Probability Calibration Metrics and Calibrators."""

import numpy as np
import pytest

from gnss.calibration import (
    IsotonicCalibrator,
    PlattCalibrator,
    compute_calibration_metrics,
)


def test_compute_calibration_metrics() -> None:
    # Perfect calibration case
    y_true = np.array([0, 0, 0, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9])
    metrics = compute_calibration_metrics(y_true, y_prob, num_bins=5)

    assert metrics.num_bins == 5
    assert metrics.ece >= 0.0
    assert metrics.brier_score >= 0.0
    assert len(metrics.bin_accuracies) == 5
    assert len(metrics.bin_confidences) == 5


def test_platt_calibrator() -> None:
    # Synthetic uncalibrated overconfident probabilities
    y_val_true = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
    y_val_prob = np.array([0.01, 0.02, 0.05, 0.1, 0.15, 0.8, 0.85, 0.9, 0.95, 0.99])

    calibrator = PlattCalibrator()
    calibrator.fit(y_val_prob, y_val_true)
    assert calibrator.is_fitted

    test_probs = np.array([0.1, 0.5, 0.9])
    calibrated = calibrator.calibrate(test_probs)
    assert len(calibrated) == 3
    assert np.all(calibrated >= 0.0) and np.all(calibrated <= 1.0)
    # Monotonic property of sigmoid logit transform
    assert calibrated[0] < calibrated[1] < calibrated[2]


def test_isotonic_calibrator() -> None:
    y_val_true = np.array([0, 0, 0, 1, 1, 1])
    y_val_prob = np.array([0.1, 0.2, 0.3, 0.6, 0.7, 0.8])

    calibrator = IsotonicCalibrator()
    calibrator.fit(y_val_prob, y_val_true)
    assert calibrator.is_fitted

    test_probs = np.array([0.15, 0.5, 0.75])
    calibrated = calibrator.calibrate(test_probs)
    assert len(calibrated) == 3
    assert np.all(calibrated >= 0.0) and np.all(calibrated <= 1.0)
    assert calibrated[0] <= calibrated[1] <= calibrated[2]
