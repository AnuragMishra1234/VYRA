"""Unit Tests for Navigation Uncertainty and Covariance Calibration."""

import numpy as np
import pytest

from navigation.uncertainty import (
    evaluate_uncertainty_calibration,
    extract_uncertainty,
)


def test_extract_uncertainty_from_covariance() -> None:
    # Diagonal covariance: var_E = 4.0 (sigma=2), var_N = 9.0 (sigma=3)
    P = np.diag([4.0, 9.0, 0.25, 0.25, 0.01, 1e-4])

    unc = extract_uncertainty(P)
    assert np.isclose(unc.sigma_e, 2.0)
    assert np.isclose(unc.sigma_n, 3.0)
    assert np.isclose(unc.sigma_horiz, np.sqrt(13.0))

    # lambda_max = 9.0 -> r_95 = sqrt(5.99146 * 9.0) ~ 7.343
    assert np.isclose(unc.max_eigenvalue, 9.0)
    assert np.isclose(unc.radius_95, np.sqrt(5.99146 * 9.0))


def test_evaluate_uncertainty_calibration() -> None:
    errors = np.array([1.0, 2.0, 3.0, 10.0])  # 3 within 5.0m, 1 outside
    bounds = np.full(4, 5.0)

    res = evaluate_uncertainty_calibration(errors, bounds)
    assert np.isclose(res["empirical_coverage"], 0.75)
    assert np.isclose(res["calibration_gap"], 0.20)  # |0.75 - 0.95|
    assert res["total_evaluated_samples"] == 4
