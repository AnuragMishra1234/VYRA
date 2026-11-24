"""VYRA TRY-LIVE Real-Time Smartphone Sensor Demonstration Service.

Manages sessions between mobile browser sensors and laptop research dashboard,
performs telemetry validation, GPS degradation and staleness detection,
and executes the VYRA multi-objective navigation decision policy.
"""

from __future__ import annotations

import asyncio
from collections import deque
from datetime import datetime, timezone
import json
import logging
import math
import secrets
import socket
import time
from typing import Any, Dict, List, Optional
from fastapi import WebSocket

from backend.schemas.try_live import (
    ConnectionUrls,
    CostBreakdown,
    CreateSessionResponse,
    PhoneTelemetryPayload,
    SessionStatusResponse,
    TimelineEvent,
    VyraDecisionSnapshot,
)

logger = logging.getLogger("vyra.try_live")


def get_local_lan_ips() -> List[str]:
    """Discover host machine local LAN IPv4 addresses."""
    ips: List[str] = []
    # 1. Primary outgoing interface probe (UDP connect to public resolver; no packets sent)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
        if primary_ip and not primary_ip.startswith("127."):
            ips.append(primary_ip)
    except Exception:
        pass

    # 2. Hostname addresses
    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    if not ips:
        ips.append("127.0.0.1")
    return ips


class TryLiveSession:
    """Represents an active or waiting TRY-LIVE real-time demonstration session."""

    def __init__(self, session_id: str, host_port: int = 8000, host_override: Optional[str] = None):
        self.session_id = session_id
        self.created_at = time.time()
        self.last_activity_time = self.created_at
        self.status = "WAITING_FOR_PHONE"  # WAITING_FOR_PHONE, CONNECTED, STREAMING, PAUSED, STOPPED
        self.host_port = host_port
        self.host_override = host_override

        # WebSockets
        self.laptop_ws: Optional[WebSocket] = None
        self.phone_ws: Optional[WebSocket] = None
        self.phone_connected = False
        self.laptop_connected = False

        # Telemetry & State
        self.latest_telemetry: Optional[Dict[str, Any]] = None
        self.history: deque = deque(maxlen=500)
        self.events: deque = deque(maxlen=100)
        self.packet_times: deque = deque(maxlen=30)
        self.accel_window: deque = deque(maxlen=40)  # for movement activity detection

        # GPS & Motion trackers
        self.last_gps_fix_time: Optional[float] = None
        self.last_gps_coord: Optional[Dict[str, float]] = None
        self.last_reported_accuracy: Optional[float] = None
        self.gps_status = "UNAVAILABLE"  # AVAILABLE, WEAK, UPDATE_DELAYED, UNAVAILABLE
        self.motion_status = "IDLE"      # ACTIVE, IDLE, UNAVAILABLE
        self.motion_activity = "UNKNOWN" # STATIONARY, WALKING, IN_MOTION, UNKNOWN

        # Experimental phone DR accumulator (relative step/integrated displacement)
        self.phone_dr_position: Optional[Dict[str, float]] = None
        self.last_step_time = 0.0

        # Current VYRA Decision
        self.current_decision: Optional[VyraDecisionSnapshot] = None
        self.previous_mode: str = "HYBRID"

        # Record initial creation event
        self.record_event(
            category="CONNECTION",
            level="info",
            title="Session Initialized",
            description=f"TRY-LIVE session {session_id} created on dashboard.",
            details={"session_id": session_id, "port": host_port},
        )

    def record_event(
        self,
        category: str,
        level: str,
        title: str,
        description: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> TimelineEvent:
        """Append an auditable event to the session timeline."""
        now = time.time()
        iso = datetime.now(timezone.utc).strftime("%H:%M:%S")
        evt_id = f"EVT-{secrets.token_hex(4)}"
        event = TimelineEvent(
            id=evt_id,
            timestamp_iso=iso,
            timestamp_epoch=now,
            category=category,
            level=level,
            title=title,
            description=description,
            details=details,
        )
        self.events.append(event)
        return event

    def get_packet_rate(self) -> float:
        """Calculate rolling incoming packet rate in Hz."""
        if len(self.packet_times) < 2:
            return 0.0
        elapsed = self.packet_times[-1] - self.packet_times[0]
        if elapsed <= 0:
            return 0.0
        return round((len(self.packet_times) - 1) / elapsed, 1)

    def evaluate_gps_health(self) -> str:
        """Evaluate real GPS status based on timestamps and reported accuracy."""
        now = time.time()
        if self.last_gps_fix_time is None:
            return "UNAVAILABLE"

        age_s = now - self.last_gps_fix_time
        if age_s > 6.0:
            return "UNAVAILABLE"
        if age_s > 2.5:
            return "UPDATE_DELAYED"

        acc = self.last_reported_accuracy
        if acc is not None:
            if acc > 30.0:
                return "WEAK"
            if acc > 15.0:
                return "WEAK"

        return "AVAILABLE"

    def detect_motion_activity(self) -> str:
        """Estimate whether user is stationary or walking from accelerometer norm variance."""
        if len(self.accel_window) < 8:
            return "UNKNOWN"
        norms = [
            math.sqrt(x**2 + y**2 + z**2)
            for (x, y, z) in self.accel_window
            if None not in (x, y, z)
        ]
        if len(norms) < 8:
            return "UNKNOWN"

        mean = sum(norms) / len(norms)
        variance = sum((v - mean) ** 2 for v in norms) / len(norms)

        # Standard earth gravity ~ 9.8 m/s^2. Walking typically generates variance > 1.2
        if variance > 1.8:
            return "WALKING"
        elif variance > 0.4:
            return "IN_MOTION"
        else:
            return "STATIONARY"

    def compute_vyra_decision(self, gps_status: str, accuracy_m: Optional[float]) -> VyraDecisionSnapshot:
        """Execute VYRA Multi-Objective Adaptive Cost Equation J(A) on live phone telemetry."""
        acc = accuracy_m if accuracy_m is not None else 25.0

        if gps_status == "AVAILABLE":
            # GNSS: Direct GNSS observation cost based on reported accuracy variance
            c_gnss = round(acc * 0.35, 3)
            # HYBRID: Kalman filtering balances GNSS variance with smooth IMU kinematic propagation
            c_hybrid = round(acc * 0.22 + 0.15, 3)
            # DR: Movement sensing without absolute GPS bounds accumulates unbounded error over time
            c_dr = round(3.8 + (1.2 if self.motion_activity == "WALKING" else 0.4), 3)

            selected = "HYBRID" if c_hybrid <= c_gnss else "GNSS"
            reason = "maintain_optimal_mode"
            plain = "Phone GPS is actively tracking with high accuracy. VYRA maintains combined navigation."
            tech = f"J(Hybrid)={c_hybrid:.2f} < J(GNSS)={c_gnss:.2f} < J(DR)={c_dr:.2f}. GNSS innovation active."
            quality = min(1.0, max(0.1, 1.0 - (acc / 40.0)))

        elif gps_status in ("UPDATE_DELAYED", "WEAK"):
            # When GPS delays or degrades (e.g. entering doorway/covered walkway)
            c_gnss = round(acc * 1.5 + 8.5, 3)
            c_hybrid = round(acc * 0.8 + 4.2, 3)
            # DR remains stable over short horizons
            c_dr = round(2.5 + (0.5 if self.motion_activity == "WALKING" else 0.2), 3)

            selected = "DR"
            reason = "gps_degraded_switched_to_movement_sensing"
            plain = "GPS updates have become delayed or degraded. VYRA detects signal degradation and switches to Movement-Based Navigation."
            tech = f"GPS age/uncertainty surge: J(GNSS)={c_gnss:.2f}, J(Hybrid)={c_hybrid:.2f}. J(DR)={c_dr:.2f} optimal under outage."
            quality = 0.35

        else:  # UNAVAILABLE / LOST
            # Signal completely absent (e.g. deep indoors or simulated outage)
            c_gnss = 999.0
            c_hybrid = 120.0  # Hybrid diverges without GPS updates
            c_dr = round(3.2 + (0.8 if self.motion_activity == "WALKING" else 0.3), 3)

            selected = "DR"
            reason = "gps_unavailable_movement_dead_reckoning_engaged"
            plain = "GPS is unavailable. VYRA selected Movement-Based Navigation to continue tracking vehicle without satellite fixes."
            tech = f"Outage active. J(GNSS)=INF, J(Hybrid)={c_hybrid:.2f}. Minimum bounded cost J(DR)={c_dr:.2f} selected."
            quality = 0.0

        snapshot = VyraDecisionSnapshot(
            selected_mode=selected,
            plain_explanation=plain,
            technical_explanation=tech,
            costs=CostBreakdown(gnss=c_gnss, hybrid=c_hybrid, dr=c_dr),
            reason=reason,
            gps_quality_metric=quality,
            motion_activity=self.motion_activity,
        )
        return snapshot

    def to_status_response(self) -> SessionStatusResponse:
        """Convert session state into API response model."""
        return SessionStatusResponse(
            session_id=self.session_id,
            status=self.status,
            phone_connected=self.phone_connected,
            laptop_connected=self.laptop_connected,
            packet_count=len(self.history),
            packet_rate_hz=self.get_packet_rate(),
            gps_status=self.gps_status,
            motion_status=self.motion_status,
            current_mode=self.current_decision.selected_mode if self.current_decision else "HYBRID",
            decision=self.current_decision,
            latest_telemetry=self.latest_telemetry,
            recent_events=list(self.events)[-30:],
        )


class TryLiveService:
    """Singleton service orchestrating TRY-LIVE sessions and real-time sensor streams."""

    def __init__(self):
        self.sessions: Dict[str, TryLiveSession] = {}
        self._background_task: Optional[asyncio.Task] = None

    def start_background_watcher(self):
        """Start the background GPS staleness and cleanup watcher loop."""
        if self._background_task is None or self._background_task.done():
            self._background_task = asyncio.create_task(self._staleness_loop())

    async def _staleness_loop(self):
        """Continuously check active sessions for GPS staleness or disconnect timeouts."""
        while True:
            try:
                await asyncio.sleep(1.0)
                now = time.time()
                for session in list(self.sessions.values()):
                    if session.status not in ("STREAMING", "CONNECTED"):
                        continue

                    # 1. Evaluate GPS Health change
                    prev_gps = session.gps_status
                    current_gps = session.evaluate_gps_health()
                    session.gps_status = current_gps

                    # Check if transitioned to UPDATE_DELAYED or UNAVAILABLE
                    if prev_gps == "AVAILABLE" and current_gps in ("UPDATE_DELAYED", "UNAVAILABLE"):
                        session.record_event(
                            category="DEGRADATION",
                            level="warning",
                            title="GPS Signal Update Delayed",
                            description="No GPS fix received for > 2.5s. Signal may be blocked by indoor roof or structure.",
                            details={"previous_status": prev_gps, "current_status": current_gps},
                        )
                        # Re-evaluate VYRA decision under degradation
                        session.current_decision = session.compute_vyra_decision(
                            current_gps, session.last_reported_accuracy
                        )
                        await self.broadcast_to_laptop(session)

                    elif prev_gps in ("UPDATE_DELAYED", "UNAVAILABLE") and current_gps == "AVAILABLE":
                        session.record_event(
                            category="GPS_FIX",
                            level="success",
                            title="GPS Signal Recovered",
                            description="Fresh GPS fix received. High-accuracy satellite tracking resumed.",
                            details={"accuracy_m": session.last_reported_accuracy},
                        )
                        session.current_decision = session.compute_vyra_decision(
                            current_gps, session.last_reported_accuracy
                        )
                        await self.broadcast_to_laptop(session)

            except asyncio.CancelledError:
                break
            except Exception as ex:
                logger.warning("Error in TryLive staleness watcher: %s", ex)

    def create_session(
        self,
        port: int = 8000,
        host_override: Optional[str] = None,
    ) -> CreateSessionResponse:
        """Create a new unique tracking session and return candidate connection URLs."""
        session_id = f"SES-{secrets.token_hex(3).upper()}"
        session = TryLiveSession(session_id, host_port=port, host_override=host_override)
        self.sessions[session_id] = session

        # Ensure background loop is running
        self.start_background_watcher()

        local_ips = get_local_lan_ips()
        primary_ip = host_override if host_override else local_ips[0]

        primary_url = f"http://{primary_ip}:{port}/try-live/mobile?session={session_id}"
        localhost_url = f"http://localhost:{port}/try-live/mobile?session={session_id}"
        all_lan_urls = [
            f"http://{ip}:{port}/try-live/mobile?session={session_id}"
            for ip in local_ips
        ]

        logger.info("Created TRY-LIVE session %s. Primary URL: %s", session_id, primary_url)
        return CreateSessionResponse(
            session_id=session_id,
            status=session.status,
            created_at=session.created_at,
            local_ips=local_ips,
            connection_urls=ConnectionUrls(
                primary_lan=primary_url,
                localhost=localhost_url,
                all_lan=all_lan_urls,
            ),
        )

    def get_session(self, session_id: str) -> Optional[TryLiveSession]:
        """Fetch session by ID."""
        return self.sessions.get(session_id)

    async def register_ws(self, session_id: str, role: str, websocket: WebSocket) -> TryLiveSession:
        """Register a WebSocket client (phone or laptop) for a session."""
        session = self.get_session(session_id)
        if not session:
            # Create session on-demand if connecting with an existing ID
            session = TryLiveSession(session_id)
            self.sessions[session_id] = session
            self.start_background_watcher()

        await websocket.accept()

        if role == "laptop":
            session.laptop_ws = websocket
            session.laptop_connected = True
            session.record_event(
                category="CONNECTION",
                level="info",
                title="Laptop Dashboard Connected",
                description="Laptop browser successfully subscribed to telemetry stream.",
            )
            logger.info("Laptop connected to TRY-LIVE session %s", session_id)
            # Immediately send initial state snapshot
            await self.broadcast_to_laptop(session)

        elif role == "phone":
            session.phone_ws = websocket
            session.phone_connected = True
            session.status = "CONNECTED"
            session.record_event(
                category="CONNECTION",
                level="success",
                title="Phone Connected",
                description="Android smartphone paired with tracking session.",
            )
            logger.info("Phone connected to TRY-LIVE session %s", session_id)
            # Notify laptop of phone connection
            await self.broadcast_to_laptop(session)

        return session

    async def unregister_ws(self, session_id: str, role: str):
        """Unregister a disconnected WebSocket client."""
        session = self.get_session(session_id)
        if not session:
            return

        if role == "laptop":
            session.laptop_ws = None
            session.laptop_connected = False
            logger.info("Laptop disconnected from TRY-LIVE session %s", session_id)

        elif role == "phone":
            session.phone_ws = None
            session.phone_connected = False
            session.status = "DISCONNECTED" if session.status == "STREAMING" else session.status
            session.record_event(
                category="CONNECTION",
                level="warning",
                title="Phone Disconnected",
                description="Phone sensor socket closed. Waiting for reconnection.",
            )
            logger.info("Phone disconnected from TRY-LIVE session %s", session_id)
            await self.broadcast_to_laptop(session)

    async def process_telemetry(
        self,
        session_id: str,
        payload: PhoneTelemetryPayload,
    ) -> SessionStatusResponse:
        """Ingest, validate, and evaluate incoming smartphone telemetry."""
        session = self.get_session(session_id)
        if not session:
            session = TryLiveSession(session_id)
            self.sessions[session_id] = session
            self.start_background_watcher()

        now = time.time()
        session.last_activity_time = now
        session.packet_times.append(now)

        # Transition to STREAMING if first packet
        if session.status in ("WAITING_FOR_PHONE", "CONNECTED"):
            session.status = "STREAMING"

        # 1. Process GPS Data
        gps_valid = False
        if payload.gps and payload.gps.latitude is not None and payload.gps.longitude is not None:
            lat = float(payload.gps.latitude)
            lon = float(payload.gps.longitude)
            # Coordinate range check
            if -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0 and not (lat == 0.0 and lon == 0.0):
                gps_valid = True
                session.last_gps_fix_time = now
                session.last_reported_accuracy = payload.gps.accuracy_m
                session.last_gps_coord = {"lat": lat, "lon": lon}

                if session.gps_status in ("UNAVAILABLE", "UPDATE_DELAYED", "WEAK"):
                    # Check first fix event
                    if len([e for e in session.events if e.category == "GPS_FIX"]) == 0:
                        session.record_event(
                            category="GPS_FIX",
                            level="success",
                            title="First GPS Fix Received",
                            description=f"Lat {lat:.6f}, Lon {lon:.6f} with accuracy ±{payload.gps.accuracy_m or 5.0:.1f}m.",
                            details={"lat": lat, "lon": lon, "accuracy_m": payload.gps.accuracy_m},
                        )

        session.gps_status = session.evaluate_gps_health()

        # 2. Process Motion Data
        if payload.motion:
            session.motion_status = "ACTIVE"
            ax = payload.motion.accel_x
            ay = payload.motion.accel_y
            az = payload.motion.accel_z
            if ax is not None and ay is not None and az is not None:
                session.accel_window.append((ax, ay, az))
                session.motion_activity = session.detect_motion_activity()
        else:
            session.motion_status = "IDLE"

        # 3. Execute VYRA Multi-Objective Adaptive Decision
        decision = session.compute_vyra_decision(session.gps_status, session.last_reported_accuracy)
        session.current_decision = decision

        # Check for mode change event
        if decision.selected_mode != session.previous_mode:
            session.record_event(
                category="DECISION",
                level="info" if decision.selected_mode == "HYBRID" else "warning",
                title=f"Navigation Mode Switch: {decision.selected_mode}",
                description=decision.plain_explanation,
                details={
                    "previous_mode": session.previous_mode,
                    "new_mode": decision.selected_mode,
                    "costs": decision.costs.model_dump(),
                    "reason": decision.reason,
                },
            )
            session.previous_mode = decision.selected_mode

        # 4. Pack normalized telemetry snapshot
        telem_record = {
            "timestamp": now,
            "timestamp_ms": payload.timestamp_ms,
            "gps": payload.gps.model_dump() if payload.gps else None,
            "motion": payload.motion.model_dump() if payload.motion else None,
            "device": payload.device.model_dump() if payload.device else None,
            "gps_status": session.gps_status,
            "motion_status": session.motion_status,
            "motion_activity": session.motion_activity,
            "selected_mode": decision.selected_mode,
            "coord": session.last_gps_coord,
            "accuracy_m": session.last_reported_accuracy,
        }

        session.latest_telemetry = telem_record
        session.history.append(telem_record)

        # 5. Broadcast to subscribed laptop client
        await self.broadcast_to_laptop(session)

        return session.to_status_response()

    async def broadcast_to_laptop(self, session: TryLiveSession):
        """Send current session state update over WebSocket to laptop client."""
        if not session.laptop_ws:
            return

        try:
            status_data = session.to_status_response().model_dump()
            await session.laptop_ws.send_text(json.dumps(status_data))
        except Exception as ex:
            logger.debug("Failed sending WS frame to laptop: %s", ex)
            session.laptop_ws = None
            session.laptop_connected = False

    async def handle_phone_control(self, session_id: str, action: str) -> SessionStatusResponse:
        """Handle control action from phone: start, pause, stop, reset."""
        session = self.get_session(session_id)
        if not session:
            session = TryLiveSession(session_id)
            self.sessions[session_id] = session

        if action == "start":
            session.status = "STREAMING"
            session.record_event(
                category="CONNECTION",
                level="info",
                title="Tracking Started",
                description="Phone user initiated continuous sensor transmission.",
            )
        elif action == "pause":
            session.status = "PAUSED"
            session.record_event(
                category="CONNECTION",
                level="info",
                title="Tracking Paused",
                description="Phone user paused sensor streaming.",
            )
        elif action == "stop":
            session.status = "STOPPED"
            session.record_event(
                category="CONNECTION",
                level="info",
                title="Tracking Stopped",
                description="Phone tracking session terminated by user.",
            )
        elif action == "clear_trail":
            session.history.clear()
            session.record_event(
                category="CONNECTION",
                level="info",
                title="Map Trail Cleared",
                description="User cleared historical GPS breadcrumb path.",
            )

        await self.broadcast_to_laptop(session)
        return session.to_status_response()


# Global Singleton Service Instance
try_live_service = TryLiveService()
