"""Unit Tests for Dead Reckoning Survivability Estimator."""

import numpy as np
import pytest

from policy.survivability import (
    DRSurvivabilityEstimator,
    evaluate_survivability_performance,
)


def test_survivability_probability_bounds() -> None:
    estimator = DRSurvivabilityEstimator()

    # Instantaneous outage (T = 0s) -> probability should be near 1.0 if variance is small
    p0 = estimator.compute_survivability_probability(
        initial_pos_var=1.0, speed_mps=10.0, initial_yaw_var=0.01, outage_duration_s=0.0, error_threshold_m=5.0
    )
    assert p0 > 0.99

    # Long outage (T = 60s) at 20 m/s -> variance blows up, survivability drops to 0.0
    p_long = estimator.compute_survivability_probability(
        initial_pos_var=1.0, speed_mps=20.0, initial_yaw_var=0.01, outage_duration_s=60.0, error_threshold_m=5.0
    )
    assert p_long < 0.05

    # Monotonicity with respect to duration
    p1 = estimator.compute_survivability_probability(
        initial_pos_var=1.0, speed_mps=15.0, initial_yaw_var=0.01, outage_duration_s=2.0, error_threshold_m=5.0
    )
    p2 = estimator.compute_survivability_probability(
        initial_pos_var=1.0, speed_mps=15.0, initial_yaw_var=0.01, outage_duration_s=10.0, error_threshold_m=5.0
    )
    assert p1 > p2


def test_survivable_duration_search() -> None:
    estimator = DRSurvivabilityEstimator()

    # Low speed -> should survive longer
    dur_slow = estimator.estimate_survivable_duration(
        initial_pos_var=1.0, speed_mps=2.0, initial_yaw_var=0.01, error_threshold_m=5.0
    )
    # High speed -> should survive shorter
    dur_fast = estimator.estimate_survivable_duration(
        initial_pos_var=1.0, speed_mps=25.0, initial_yaw_var=0.01, error_threshold_m=5.0
    )
    assert dur_slow > dur_fast


def test_evaluate_survivability_performance() -> None:
    preds = [5.0, 10.0, 15.0]
    acts = [5.0, 8.0, 20.0]

    perf = evaluate_survivability_performance(preds, acts)
    assert "mean_absolute_error_seconds" in perf
    assert perf["total_evaluated_events"] == 3
    assert perf["over_confidence_rate"] == round(1.0 / 3.0, 4)  # event 2 predicted 10, survived 8
    assert perf["over_conservatism_rate"] == round(1.0 / 3.0, 4)  # event 3 predicted 15, survived 20
