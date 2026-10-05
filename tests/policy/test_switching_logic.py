"""Unit tests for Policy Switching Logic and Anti-Chattering Module."""

import pytest

from policy.switching_logic import HandoverEvent, SwitchingManager


def test_initial_state():
    sm = SwitchingManager(initial_mode="HYBRID", dwell_steps=5, sampling_rate_hz=10.0)
    assert sm.current_mode == "HYBRID"
    assert sm.dwell_steps == 5
    assert len(sm.handover_history) == 0


def test_dwell_blocking_and_elapsed_transition():
    sm = SwitchingManager(initial_mode="HYBRID", dwell_steps=3, sampling_rate_hz=10.0)

    # Step 1: attempt switch to DR (dwell not satisfied, only 1 step)
    mode, switched = sm.request_transition("DR", reason="test_switch", timestamp=0.1)
    assert mode == "HYBRID"
    assert not switched
    assert len(sm.handover_history) == 0

    # Step 2: attempt switch to DR again (dwell still 2 < 3)
    mode, switched = sm.request_transition("DR", reason="test_switch", timestamp=0.2)
    assert mode == "HYBRID"
    assert not switched

    # Step 3: dwell is now 3 >= 3, switch should succeed!
    mode, switched = sm.request_transition("DR", reason="test_switch", timestamp=0.3)
    assert mode == "DR"
    assert switched
    assert len(sm.handover_history) == 1
    assert sm.handover_history[0].from_mode == "HYBRID"
    assert sm.handover_history[0].to_mode == "DR"
    assert not sm.handover_history[0].is_chattering


def test_emergency_override():
    sm = SwitchingManager(initial_mode="HYBRID", dwell_steps=10, sampling_rate_hz=10.0)

    # Immediate emergency switch on step 1 (before dwell time)
    mode, switched = sm.request_transition("DR", reason="emergency_loss", timestamp=0.1, emergency=True)
    assert mode == "DR"
    assert switched
    assert len(sm.handover_history) == 1
    assert sm.handover_history[0].is_chattering  # Switched before dwell elapsed
    assert sm.handover_history[0].reason == "emergency_loss"


def test_metrics_collection():
    sm = SwitchingManager(initial_mode="HYBRID", dwell_steps=2, sampling_rate_hz=10.0)

    # 2 steps in HYBRID
    sm.request_transition("HYBRID", reason="keep", timestamp=0.1)
    sm.request_transition("HYBRID", reason="keep", timestamp=0.2)

    # Switch to DR
    sm.request_transition("DR", reason="degraded", timestamp=0.3)

    metrics = sm.get_metrics()
    assert metrics["total_handovers"] == 1
    assert "mode_percentages" in metrics
    assert "mean_dwell_seconds" in metrics
