"""Unit tests for Policy Thresholds Module."""

import pytest

from policy.thresholds import PolicyThresholds


def test_default_thresholds():
    t = PolicyThresholds()
    assert t.error_threshold_m == 5.0
    assert t.emergency_threshold_m == 15.0
    assert t.dwell_time_seconds == 3.0
    assert t.sampling_rate_hz == 10.0
    assert t.dwell_steps == 30
    assert t.switching_penalty_m == 1.0
    assert t.hysteresis_margin_m == 1.5


def test_thresholds_immutability():
    t = PolicyThresholds()
    with pytest.raises(Exception):
        t.error_threshold_m = 10.0  # dataclass is frozen


def test_from_dict():
    cfg = {
        "dataset": {"sampling_rate_hz": 20.0},
        "policy": {
            "acceptable_error_bound_meters": 4.0,
            "dwell_time_seconds": 1.5,
            "switching_penalty_weight": 0.8,
            "hysteresis_margin_m": 2.5,
        },
    }
    t = PolicyThresholds.from_dict(cfg)
    assert t.error_threshold_m == 4.0
    assert t.dwell_time_seconds == 1.5
    assert t.sampling_rate_hz == 20.0
    assert t.dwell_steps == 30
    assert t.switching_penalty_m == 0.8
    assert t.hysteresis_margin_m == 2.5
