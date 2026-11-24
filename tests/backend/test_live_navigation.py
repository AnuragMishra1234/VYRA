"""Unit and integration tests for Live Navigation API endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_live_simulation_slice():
    response = client.get("/api/live-navigation/simulate?start_index=0&count=20")
    assert response.status_code == 200
    data = response.json()
    assert "epochs" in data
    assert len(data["epochs"]) == 20
    assert data["epochs"][0]["selected_mode"] in ["GNSS", "HYBRID", "DR"]
    assert "gt_coord" in data["epochs"][0]


def test_live_simulation_outage_injection():
    response = client.get("/api/live-navigation/simulate?start_index=100&count=50&injected_outage_start=110&injected_outage_duration_s=2.0")
    assert response.status_code == 200
    data = response.json()
    # Check that injected outage epochs have is_outage = True and gnss_quality = 0.0
    outage_epochs = [e for e in data["epochs"] if e["index"] >= 110 and e["index"] < 130]
    assert len(outage_epochs) == 20
    for e in outage_epochs:
        assert e["is_outage"] is True
        assert e["gnss_quality"] == 0.0


def test_what_if_scenario_evaluation():
    payload = {
        "gnss_quality": 0.2,
        "satellite_count": 4,
        "outage_duration_s": 0.0,
        "vehicle_speed_mps": 15.0,
        "prediction_horizon_s": 3.0,
        "error_threshold_m": 5.0,
        "initial_mode": "HYBRID",
        "degradation_level": "SEVERE",
    }
    response = client.post("/api/live-navigation/what-if", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["selected_mode"] in ["HYBRID", "DR"]
    assert "costs" in data
    assert "forecasts" in data
    assert data["forecasts"]["GNSS"] > data["forecasts"]["HYBRID"]


def test_algorithm_comparison_endpoint():
    response = client.get("/api/live-navigation/comparison")
    assert response.status_code == 200
    data = response.json()
    assert "policies" in data
    assert len(data["policies"]) >= 4
    policy_names = [p["policy"] for p in data["policies"]]
    assert any("VYRA" in name for name in policy_names)
    assert any("Reactive" in name for name in policy_names)


def test_chatbot_technical_query():
    payload = {
        "query": "How does the EKF work in VYRA?",
        "context": {
            "current_mode": "HYBRID",
            "is_outage": False,
            "gnss_quality": 0.92,
        },
    }
    response = client.post("/api/live-navigation/chatbot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "EKF" in data["answer"] or "Extended Kalman Filter" in data["answer"]


def test_report_pdf_generation():
    payload = {
        "experiment_id": "TEST-EXP-999",
        "title": "Automated Verification Test Report",
        "scenario": "GNSS 10s Outage Injection",
        "outage_duration_s": 10.0,
        "notes": "Automated test suite verification run.",
    }
    response = client.post("/api/live-navigation/report/pdf", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")
