"""Unit tests for Forecasting Targets Module."""

import numpy as np
import pytest

from forecasting.targets import (
    compute_future_horizon_targets,
    generate_action_conditioned_dataset,
)


def test_compute_future_horizon_targets_causal_forward():
    # Sequence of 10 steps, e.g. at 1 Hz, errors are [1, 2, 3, 10, 2, 2, 2, 2, 2, 2]
    errors = np.array([1.0, 2.0, 3.0, 10.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0])
    cont, bin_tar = compute_future_horizon_targets(
        error_series=errors,
        horizons_seconds=[2.0],
        sampling_rate_hz=1.0,
        error_threshold_m=5.0,
    )

    # For index 0: forward window is (1, 2] -> errors[1:3] are [2.0, 3.0] -> max is 3.0
    assert cont["2s"][0] == 3.0
    assert bin_tar["2s"][0] == 0

    # For index 1: forward window is (2, 3] -> errors[2:4] are [3.0, 10.0] -> max is 10.0
    assert cont["2s"][1] == 10.0
    assert bin_tar["2s"][1] == 1  # 10.0 > 5.0 -> violation!


def test_generate_action_conditioned_dataset():
    n = 25
    d = 4
    X_base = np.random.randn(n, d)
    action_errors = {
        "GNSS": np.full(n, 4.0),
        "HYBRID": np.full(n, 1.5),
        "DR": np.full(n, 6.0),
    }

    X_all, y_cont, y_bin = generate_action_conditioned_dataset(
        X_base=X_base,
        action_error_dict=action_errors,
        horizon_seconds=3.0,
        error_threshold_m=5.0,
        sampling_rate_hz=10.0,
    )

    # 3 actions stacked
    assert len(X_all) == n * 3
    assert len(y_cont) == n * 3
    assert len(y_bin) == n * 3
    assert np.all(y_bin[n * 2 :] == 1)  # DR error 6.0 > 5.0 -> all violations
    assert np.all(y_bin[: n * 2] == 0)  # GNSS 4.0 and HYBRID 1.5 <= 5.0 -> no violations
