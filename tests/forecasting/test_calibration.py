"""Unit tests for Forecasting Calibration Module."""

import numpy as np
import pytest

from forecasting.calibration import (
    ConformalResidualCalibrator,
    ProbabilityCalibrator,
    compute_expected_calibration_error,
)


def test_expected_calibration_error():
    y_true = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.1, 0.3, 0.7, 0.8, 0.9, 0.9])

    ece, mce, curve = compute_expected_calibration_error(y_true, y_prob, n_bins=5)

    assert 0.0 <= ece <= 1.0
    assert 0.0 <= mce <= 1.0
    assert len(curve["bin_centers"]) == 5
    assert len(curve["bin_accuracies"]) == 5


def test_conformal_residual_calibrator():
    # Calibration set
    y_cal_true = np.array([2.0, 3.5, 4.0, 5.0, 6.0])
    y_cal_pred = np.array([1.8, 3.0, 3.8, 4.5, 5.5])

    calibrator = ConformalResidualCalibrator(coverage_level=0.90)
    calibrator.fit(y_cal_true, y_cal_pred)

    assert calibrator.is_fitted
    assert calibrator.quantile_margin > 0.0

    # Test coverage evaluation
    y_test_true = np.array([2.1, 3.2, 4.1])
    y_test_pred = np.array([1.9, 3.0, 3.9])
    res = calibrator.evaluate_test_coverage(y_test_true, y_test_pred)

    assert "empirical_coverage" in res
    assert res["empirical_coverage"] >= 0.90


def test_probability_calibrator():
    y_true = np.array([0, 0, 0, 1, 1, 1])
    y_prob = np.array([0.2, 0.3, 0.4, 0.6, 0.7, 0.8])

    calibrator = ProbabilityCalibrator()
    calibrator.fit(y_true, y_prob)
    assert calibrator.is_fitted

    cal_probs = calibrator.calibrate(np.array([0.25, 0.75]))
    assert len(cal_probs) == 2
    assert 0.0 <= cal_probs[0] <= cal_probs[1] <= 1.0
