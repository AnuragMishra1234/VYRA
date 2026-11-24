"""Integration and unit tests for VYRA TRY-LIVE Real-Time Mobile Sensor Demonstration."""

import time
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_create_session():
    """Verify session creation endpoint returns unique ID and valid network connection URLs."""
    res = client.post("/api/try-live/session?port=8000")
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert data["session_id"].startswith("SES-")
    assert data["status"] == "WAITING_FOR_PHONE"
    assert "local_ips" in data
    assert len(data["local_ips"]) > 0
    assert "connection_urls" in data
    assert "/try-live/mobile?session=" in data["connection_urls"]["primary_lan"]


def test_get_session_status():
    """Verify session status retrieval."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    res = client.get(f"/api/try-live/session/{sid}")
    assert res.status_code == 200
    status_data = res.json()
    assert status_data["session_id"] == sid
    assert status_data["phone_connected"] is False
    assert status_data["gps_status"] == "UNAVAILABLE"
    assert len(status_data["recent_events"]) >= 1


def test_post_phone_telemetry_nominal_gps():
    """Verify phone telemetry ingestion under nominal high-accuracy GPS."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    payload = {
        "session_id": sid,
        "type": "telemetry",
        "timestamp_ms": int(time.time() * 1000),
        "gps": {
            "latitude": 52.406254,
            "longitude": -1.481777,
            "accuracy_m": 4.5,
            "altitude_m": 115.0,
            "speed_mps": 1.4,
            "heading_deg": 48.0,
            "timestamp_ms": int(time.time() * 1000),
        },
        "motion": {
            "accel_x": 0.05,
            "accel_y": 0.12,
            "accel_z": 9.81,
            "gyro_x": 0.01,
            "gyro_y": 0.02,
            "gyro_z": 0.005,
            "alpha": 48.0,
            "beta": 12.0,
            "gamma": -2.0,
        },
        "device": {
            "battery_level": 0.88,
            "user_agent": "Mozilla/5.0 (Linux; Android 14)",
        },
    }

    res = client.post(f"/api/try-live/session/{sid}/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["packet_count"] >= 1
    assert data["gps_status"] == "AVAILABLE"
    assert data["motion_status"] == "ACTIVE"
    assert data["decision"] is not None
    assert data["decision"]["selected_mode"] in ("HYBRID", "GNSS")
    assert "Phone GPS is actively tracking" in data["decision"]["plain_explanation"]


def test_gps_degradation_evaluation():
    """Verify that when GPS degrades or reports low accuracy (>35m), VYRA switches to Movement-Based mode."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    # Post degraded GPS with 45m accuracy (indoor/urban canyon multipath)
    payload = {
        "session_id": sid,
        "type": "telemetry",
        "timestamp_ms": int(time.time() * 1000),
        "gps": {
            "latitude": 52.406254,
            "longitude": -1.481777,
            "accuracy_m": 45.0,  # Weak / degraded
            "altitude_m": 115.0,
            "speed_mps": 0.2,
            "heading_deg": 48.0,
            "timestamp_ms": int(time.time() * 1000),
        },
        "motion": {
            "accel_x": 0.45,
            "accel_y": 1.82,
            "accel_z": 9.75,
        },
    }

    res = client.post(f"/api/try-live/session/{sid}/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["gps_status"] == "WEAK"
    assert data["decision"]["selected_mode"] == "DR"
    assert "Movement-Based Navigation" in data["decision"]["plain_explanation"]


def test_session_controls():
    """Verify pause, resume, clear_trail, and stop controls."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    # Pause
    res = client.post(f"/api/try-live/session/{sid}/control", json={"action": "pause"})
    assert res.status_code == 200
    assert res.json()["status"] == "PAUSED"

    # Start
    res = client.post(f"/api/try-live/session/{sid}/control", json={"action": "start"})
    assert res.status_code == 200
    assert res.json()["status"] == "STREAMING"

    # Clear trail
    res = client.post(f"/api/try-live/session/{sid}/control", json={"action": "clear_trail"})
    assert res.status_code == 200

    # Stop
    res = client.post(f"/api/try-live/session/{sid}/control", json={"action": "stop"})
    assert res.status_code == 200
    assert res.json()["status"] == "STOPPED"


def test_get_session_history():
    """Verify breadcrumb trajectory retrieval."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    # Post a point
    client.post(
        f"/api/try-live/session/{sid}/telemetry",
        json={
            "session_id": sid,
            "timestamp_ms": int(time.time() * 1000),
            "gps": {"latitude": 52.40625, "longitude": -1.48177, "accuracy_m": 5.0},
        },
    )

    hist_res = client.get(f"/api/try-live/session/{sid}/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["count"] == 1
    assert len(hist_data["history"]) == 1


def test_invalid_coordinates_handled_safely():
    """Verify invalid or NaN latitude/longitude does not corrupt state or cause 500 error."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    # Out of range coordinates
    res = client.post(
        f"/api/try-live/session/{sid}/telemetry",
        json={
            "session_id": sid,
            "timestamp_ms": int(time.time() * 1000),
            "gps": {"latitude": 195.0, "longitude": -350.0},
        },
    )
    assert res.status_code == 200
    # Coordinate was ignored so last_gps_coord remains null
    assert res.json()["gps_status"] == "UNAVAILABLE"


def test_websocket_relay_phone_to_laptop():
    """Verify real-time WebSocket connection between phone transmitter and laptop receiver."""
    create_res = client.post("/api/try-live/session")
    sid = create_res.json()["session_id"]

    with client.websocket_connect(f"/api/try-live/ws/{sid}/laptop") as laptop_ws:
        # Initial status frame received by laptop on subscribe
        init_frame = laptop_ws.receive_json()
        assert init_frame["session_id"] == sid
        assert init_frame["laptop_connected"] is True

        # Now connect phone and send telemetry
        with client.websocket_connect(f"/api/try-live/ws/{sid}/phone") as phone_ws:
            # Laptop receives notification of phone connection
            phone_conn_frame = laptop_ws.receive_json()
            assert phone_conn_frame["phone_connected"] is True

            # Phone transmits live sensor payload
            phone_ws.send_json({
                "type": "telemetry",
                "session_id": sid,
                "timestamp_ms": int(time.time() * 1000),
                "gps": {
                    "latitude": 52.4063,
                    "longitude": -1.4818,
                    "accuracy_m": 3.8,
                },
                "motion": {
                    "accel_x": 0.1,
                    "accel_y": 0.2,
                    "accel_z": 9.8,
                },
            })

            # Laptop receives forwarded frame in real time
            telemetry_frame = laptop_ws.receive_json()
            assert telemetry_frame["latest_telemetry"] is not None
            assert telemetry_frame["latest_telemetry"]["coord"]["lat"] == 52.4063
            assert telemetry_frame["gps_status"] == "AVAILABLE"
            assert telemetry_frame["decision"]["selected_mode"] in ("HYBRID", "GNSS")
