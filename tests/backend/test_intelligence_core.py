"""Unit and integration tests for Engineering Intelligence Core API."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.engineering_intelligence_service import engineering_intelligence_service

client = TestClient(app)


def test_get_fault_catalog():
    """Verify fault catalog returns all 6 authentic fault models."""
    response = client.get("/api/intelligence/faults")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 6
    fault_ids = [f["id"] for f in data["faults"]]
    assert "COMPLETE_GPS_LOSS" in fault_ids
    assert "GRADUAL_DEGRADATION" in fault_ids
    assert "MULTIPATH_JITTER" in fault_ids
    assert "EXTENDED_OUTAGE" in fault_ids
    assert "GYRO_NOISE_BIAS" in fault_ids
    assert "SENSOR_DROPOUT" in fault_ids


def test_run_fault_experiment():
    """Verify experiment execution generates valid metrics, timeline, and validation checks."""
    payload = {
        "fault_type": "COMPLETE_GPS_LOSS",
        "severity": "CRITICAL",
        "duration_s": 8.0,
        "start_epoch": 30,
        "slice_count": 100,
        "seed": 42,
        "error_threshold_m": 5.0,
        "prediction_horizon_s": 3.0,
        "enforce_dwell": True,
    }
    response = client.post("/api/intelligence/experiment", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "experiment_id" in data
    assert "summary_metrics" in data
    assert "validation_suite" in data
    assert "timeline_events" in data
    assert "engineering_insights" in data
    assert "epochs" in data

    # Verify metrics
    metrics = data["summary_metrics"]
    assert metrics["vyra_ate_m"] > 0.0
    assert metrics["ate_reduction_vs_gps_pct"] >= 0.0
    assert "mode_distribution" in metrics
    assert metrics["mode_distribution"]["DR_epochs"] > 0  # Should switch to DR under GPS loss

    # Verify 8 validation checks
    val = data["validation_suite"]
    assert val["total_checks"] == 8
    assert val["overall_status"] in ["PASS", "WARNING"]
    check_ids = [c["id"] for c in val["checks"]]
    assert "CHK_01_INPUT_AVAILABILITY" in check_ids
    assert "CHK_02_TIMESTAMP_MONOTONICITY" in check_ids
    assert "CHK_03_NUMERICAL_STABILITY" in check_ids
    assert "CHK_04_MODEL_BOUNDEDNESS" in check_ids
    assert "CHK_05_DWELL_COMPLIANCE" in check_ids
    assert "CHK_06_COVARIANCE_STABILITY" in check_ids
    assert "CHK_07_CHATTERING_RATIO" in check_ids
    assert "CHK_08_SAFETY_BOUND_ENFORCEMENT" in check_ids

    # Verify engineering insights
    insights = data["engineering_insights"]
    assert "what_happened" in insights
    assert "why_it_happened" in insights
    assert "system_response" in insights
    assert "what_worked_well" in insights
    assert "improvement_scope" in insights


def test_replay_experiment_determinism():
    """Verify deterministic replay achieves 100% decision concordance and delta ATE = 0.000m."""
    # First run an experiment
    payload = {
        "fault_type": "MULTIPATH_JITTER",
        "severity": "HIGH",
        "duration_s": 6.0,
        "start_epoch": 50,
        "slice_count": 80,
        "seed": 101,
        "error_threshold_m": 5.0,
        "prediction_horizon_s": 3.0,
        "enforce_dwell": True,
    }
    exp_res = client.post("/api/intelligence/experiment", json=payload)
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    exp_id = exp_data["experiment_id"]
    orig_hash = exp_data["state_hash"]

    # Replay experiment
    replay_payload = {
        "experiment_id": exp_id,
        "config": payload,
    }
    replay_res = client.post("/api/intelligence/replay", json=replay_payload)
    assert replay_res.status_code == 200
    replay_data = replay_res.json()

    assert replay_data["status"] == "SUCCESS"
    assert replay_data["determinism_certified"] is True
    assert replay_data["concordance_rate_pct"] == 100.0
    assert replay_data["delta_ate_m"] < 0.0001
    assert replay_data["max_coordinate_delta_m"] < 0.00001
    assert replay_data["hash_match"] is True
    assert replay_data["original_hash"] == orig_hash
    assert replay_data["replay_hash"] == orig_hash


def test_decision_inspection_endpoint():
    """Verify deep candidate cost breakdown J(A) inspection."""
    # Run a quick run
    payload = {
        "fault_type": "GRADUAL_DEGRADATION",
        "severity": "MEDIUM",
        "duration_s": 5.0,
        "start_epoch": 25,
        "slice_count": 70,
        "seed": 42,
    }
    exp_res = client.post("/api/intelligence/experiment", json=payload)
    assert exp_res.status_code == 200
    exp_id = exp_res.json()["experiment_id"]

    # Query inspection for epoch index 25
    insp_res = client.get(f"/api/intelligence/decision?epoch_index=25&experiment_id={exp_id}")
    assert insp_res.status_code == 200
    insp_data = insp_res.json()

    assert "observation" in insp_data
    assert "candidates" in insp_data
    assert "GNSS" in insp_data["candidates"]
    assert "HYBRID" in insp_data["candidates"]
    assert "DR" in insp_data["candidates"]
    assert "total_cost_J" in insp_data["candidates"]["HYBRID"]
    assert "selected_mode" in insp_data
    assert "result" in insp_data
    assert "fidelity_pct" in insp_data["result"]
