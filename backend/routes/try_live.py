"""TRY-LIVE API Router: Session management, phone telemetry ingestion, and WebSocket streaming."""

from __future__ import annotations

import json
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from backend.schemas.try_live import (
    CreateSessionRequest,
    CreateSessionResponse,
    PhoneTelemetryPayload,
    SessionStatusResponse,
)
from backend.services.try_live_service import try_live_service

router = APIRouter(prefix="/try-live", tags=["Try Live"])
logger = logging.getLogger(__name__)


class ControlRequest(BaseModel):
    action: str  # start, pause, stop, clear_trail


@router.post("/session", response_model=CreateSessionResponse)
async def create_tracking_session(
    req: Optional[CreateSessionRequest] = None,
    port: int = Query(default=8000, description="Server port for connection URLs"),
):
    """Create a new TRY-LIVE smartphone demonstration session with local LAN connection URLs."""
    host_override = req.host_override if req else None
    return try_live_service.create_session(port=port, host_override=host_override)


@router.get("/session/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """Retrieve the current telemetry snapshot, connection health, and VYRA decision for a session."""
    session = try_live_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session.to_status_response()


@router.post("/session/{session_id}/telemetry", response_model=SessionStatusResponse)
async def post_phone_telemetry(session_id: str, payload: PhoneTelemetryPayload):
    """HTTP REST fallback endpoint for streaming smartphone GPS and motion telemetry."""
    if payload.session_id != session_id:
        payload.session_id = session_id
    return await try_live_service.process_telemetry(session_id, payload)


@router.post("/session/{session_id}/control", response_model=SessionStatusResponse)
async def session_control(session_id: str, req: ControlRequest):
    """Send tracking session controls (start, pause, stop, clear_trail)."""
    return await try_live_service.handle_phone_control(session_id, req.action)


@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str):
    """Retrieve full breadcrumb trajectory trail of recorded phone positions."""
    session = try_live_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {
        "session_id": session_id,
        "count": len(session.history),
        "history": list(session.history),
    }


@router.websocket("/ws/{session_id}/{role}")
async def websocket_try_live_relay(websocket: WebSocket, session_id: str, role: str):
    """Bidirectional WebSocket relay connecting phone sensor stream to laptop dashboard.
    
    Roles:
      - 'laptop': Receives live telemetry updates and event broadcasts.
      - 'phone': Transmits sensor readings at 5-10 Hz and receives session commands.
    """
    if role not in ("laptop", "phone"):
        await websocket.close(code=1008, reason="Invalid role; must be 'laptop' or 'phone'")
        return

    session = await try_live_service.register_ws(session_id, role, websocket)
    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                msg_type = msg.get("type", "telemetry")

                if msg_type == "telemetry" and role == "phone":
                    payload = PhoneTelemetryPayload(**msg)
                    await try_live_service.process_telemetry(session_id, payload)

                elif msg_type == "control":
                    action = msg.get("action", "")
                    if action:
                        await try_live_service.handle_phone_control(session_id, action)

                elif msg_type == "permission_status" and role == "phone":
                    perm_type = msg.get("permission", "location")
                    status = msg.get("status", "granted")
                    session.record_event(
                        category="PERMISSION",
                        level="success" if status == "granted" else "warning",
                        title=f"{perm_type.capitalize()} Permission {status.capitalize()}",
                        description=f"Mobile browser reported {perm_type} access status as '{status}'.",
                        details=msg,
                    )
                    await try_live_service.broadcast_to_laptop(session)

                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "t": msg.get("t")}))

            except Exception as ex:
                logger.warning("Error processing WS frame in session %s (%s): %s", session_id, role, ex)

    except WebSocketDisconnect:
        await try_live_service.unregister_ws(session_id, role)
    except Exception as ex:
        logger.error("WebSocket exception in session %s (%s): %s", session_id, role, ex)
        await try_live_service.unregister_ws(session_id, role)
