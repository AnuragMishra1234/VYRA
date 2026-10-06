"""Integration tests for VYRA FastAPI Backend routes and services."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "VYRA"

    # Root endpoint serves index.html or json
    res_root = client.get("/")
    assert res_root.status_code == 200


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["cache_loaded"] is True
    assert data["total_cached_epochs"] == 24621


def test_trajectories_list():
    response = client.get("/api/trajectories")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 1
    assert data["default_test_id"] == "V-S3a"
    trajs = {t["trajectory_id"]: t for t in data["trajectories"]}
    assert "V-S3a" in trajs
    assert trajs["V-S3a"]["split"] == "test"


def test_trajectory_paths():
    response = client.get("/api/trajectories/V-S3a/paths?stride=50")
    assert response.status_code == 200
    data = response.json()
    assert "paths" in data
    paths = data["paths"]
    assert "offline_reference_gt" in paths
    assert "gnss" in paths
    assert "vyra" in paths
    assert len(paths["offline_reference_gt"]) > 100


def test_playback_state():
    response = client.get("/api/playback/state")
    assert response.status_code == 200
    data = response.json()
    assert data["total_epochs"] == 24621
    assert data["trajectory_id"] == "V-S3a"
    assert "telemetry" in data
    telem = data["telemetry"]
    assert "gnss_quality" in telem
    assert "degradation_prob" in telem
    assert "dr_uncertainty_std_m" in telem
    assert "dr_survivability_s" in telem
    assert "candidates" in telem
    assert len(telem["candidates"]) == 3


def test_playback_control():
    # Test seek
    response = client.post("/api/playback/control", json={"action": "seek", "target_index": 120})
    assert response.status_code == 200
    data = response.json()
    assert data["current_index"] == 120
    assert data["telemetry"]["index"] == 120

    # Test step
    response = client.post("/api/playback/control", json={"action": "step"})
    assert response.status_code == 200
    data = response.json()
    assert data["current_index"] == 121

    # Test speed change
    response = client.post("/api/playback/control", json={"action": "pause", "speed_multiplier": 2.0})
    assert response.status_code == 200
    data = response.json()
    assert data["speed_multiplier"] == 2.0
    assert data["status"] == "paused"

    # Reset
    response = client.post("/api/playback/control", json={"action": "reset"})
    assert response.status_code == 200
    data = response.json()
    assert data["current_index"] == 0


def test_results_master():
    response = client.get("/api/results/master")
    assert response.status_code == 200
    data = response.json()
    assert "metadata" in data
    assert "table1_navigation_comparison" in data
    assert len(data["table1_navigation_comparison"]) == 5
    # Check Table 1 VYRA row
    vyra_row = next(r for r in data["table1_navigation_comparison"] if r["Policy"] == "VYRA Adaptive (Proposed)")
    assert vyra_row["ATE (m)"] == pytest.approx(0.399, rel=1e-2)


def test_results_tables():
    for table_num in range(1, 9):
        response = client.get(f"/api/results/tables/{table_num}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0


def test_results_figures():
    response = client.get("/api/results/figures")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 16
    fig01 = next(f for f in data if "fig01" in f["id"])
    assert fig01["url"].startswith("/api/figures/")


def test_logo_endpoint():
    response = client.get("/vyra-logo.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert len(response.content) > 10000
