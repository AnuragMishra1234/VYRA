"""Unit tests for Navigation Policy implementations."""

import numpy as np
import pytest

from policy.adaptive import VYRAAdaptivePolicy
from policy.hybrid import FixedHybridPolicy
from policy.reactive import ReactiveBaselinePolicy
from policy.thresholds import PolicyThresholds


def test_fixed_hybrid_policy():
    policy = FixedHybridPolicy()
    mode, meta = policy.select_mode(observation={"quality": 0.1}, timestamp=1.0)
    assert mode == "HYBRID"
    assert meta["selected_mode"] == "HYBRID"


def test_reactive_baseline_policy():
    thresh = PolicyThresholds(dwell_time_seconds=0.4, sampling_rate_hz=10.0)  # dwell = 4 steps
    policy = ReactiveBaselinePolicy(thresholds=thresh)

    obs_healthy = {
        "composite_quality_score": 0.95,
        "effective_satellites": 9.0,
        "kinematic_discrepancy_mps": 0.1,
        "is_outage": False,
    }
    mode, _ = policy.select_mode(obs_healthy, timestamp=0.1)
    assert mode == "HYBRID"

    # Step 2: degraded condition -> attempts DR, but blocked by dwell time (step 2 < 4)
    obs_bad = {
        "composite_quality_score": 0.35,
        "effective_satellites": 3.0,
        "kinematic_discrepancy_mps": 3.5,
        "is_outage": False,
    }
    mode, meta = policy.select_mode(obs_bad, timestamp=0.2)
    assert mode == "HYBRID"  # Dwell constraint blocked switch

    # Step 3: still blocked (step 3 < 4)
    mode, meta = policy.select_mode(obs_bad, timestamp=0.3)
    assert mode == "HYBRID"

    # Step 4: dwell elapsed (step 4 >= 4), switch succeeds!
    mode, meta = policy.select_mode(obs_bad, timestamp=0.4)
    assert mode == "DR"
    assert meta["switched"]


def test_vyra_adaptive_policy_optimization():
    thresh = PolicyThresholds(dwell_time_seconds=0.2, sampling_rate_hz=10.0, switching_penalty_m=1.0)
    policy = VYRAAdaptivePolicy(thresholds=thresh)

    # Initially in HYBRID
    # When HYBRID has high predicted error (e.g. 10m) and DR has low predicted error (e.g. 1.2m)
    forecasts = {
        "GNSS": 8.0,
        "HYBRID": 10.0,
        "DR": 1.2,
    }
    costs, best_candidate = policy.evaluate_action_costs(
        forecasts=forecasts,
        dr_surv_duration_s=5.0,
        active_mode="HYBRID",
    )
    assert best_candidate == "DR"
    assert costs["DR"] < costs["HYBRID"]


def test_vyra_adaptive_policy_dr_survivability_penalty():
    thresh = PolicyThresholds(forecast_horizon_seconds=3.0)
    policy = VYRAAdaptivePolicy(thresholds=thresh)

    # DR has low error, but survivability remaining is only 0.5s (< 3.0s horizon)
    forecasts = {
        "GNSS": 4.0,
        "HYBRID": 3.0,
        "DR": 1.0,
    }
    costs, best_candidate = policy.evaluate_action_costs(
        forecasts=forecasts,
        dr_surv_duration_s=0.5,  # Insufficient survivability
        active_mode="HYBRID",
    )
    # DR should be penalized and HYBRID should be chosen
    assert costs["DR"] > costs["HYBRID"]
    assert best_candidate == "HYBRID"


def test_vyra_adaptive_policy_outage_disqualification():
    """Verify ISSUE-01 fix: GNSS is disqualified during outage, even with low DR survivability."""
    thresh = PolicyThresholds(forecast_horizon_seconds=3.0)
    policy = VYRAAdaptivePolicy(thresholds=thresh)

    forecasts = {
        "GNSS": 2.0,  # Model might mistakenly predict low error
        "HYBRID": 8.0,
        "DR": 6.0,
    }

    # Case A: Sensor outage is True, DR survivability is 0.0s (severe DR penalty)
    costs, best_candidate = policy.evaluate_action_costs(
        forecasts=forecasts,
        dr_surv_duration_s=0.0,
        active_mode="DR",
        is_sensor_outage=True,
    )
    assert np.isinf(costs["GNSS"])
    assert best_candidate in ("HYBRID", "DR")
    assert best_candidate != "GNSS"

    # Case B: Mode selection during outage never selects GNSS
    mode, telem = policy.select_mode(
        forecasts=forecasts,
        dr_surv_duration_s=0.0,
        timestamp=10.0,
        is_sensor_outage=True,
    )
    assert mode != "GNSS"
    assert telem["candidate_mode"] != "GNSS"

    # Case C: Normal GNSS conditions (not outage) -> GNSS is finite and eligible
    costs_norm, best_norm = policy.evaluate_action_costs(
        forecasts=forecasts,
        dr_surv_duration_s=10.0,
        active_mode="GNSS",
        is_sensor_outage=False,
    )
    assert np.isfinite(costs_norm["GNSS"])
    assert best_norm == "GNSS"

    # Case D: Degraded GNSS (quality_score=0.4, not outage) -> GNSS is evaluated with finite cost
    costs_deg, _ = policy.evaluate_action_costs(
        forecasts=forecasts,
        dr_surv_duration_s=10.0,
        active_mode="HYBRID",
        is_sensor_outage=False,
        quality_score=0.4,
    )
    assert np.isfinite(costs_deg["GNSS"])

