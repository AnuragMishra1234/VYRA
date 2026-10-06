"""Playback controls and WebSocket telemetry streaming router."""

import json
import logging
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from backend.schemas.playback import PlaybackControlRequest, PlaybackStateResponse, PlaybackTelemetry
from backend.services.playback_engine import playback_engine

router = APIRouter(prefix="/playback", tags=["Playback"])
logger = logging.getLogger(__name__)


@router.get("/state", response_model=PlaybackStateResponse)
async def get_playback_state():
    """Retrieve current playback state and telemetry snapshot."""
    return playback_engine.get_state()


@router.post("/control", response_model=PlaybackStateResponse)
async def control_playback(req: PlaybackControlRequest):
    """Execute playback action: play, pause, stop, reset, step, seek, or change speed."""
    state = await playback_engine.control(
        action=req.action,
        target_index=req.target_index,
        speed=req.speed_multiplier,
    )
    # Broadcast state change to all active WebSocket listeners
    await playback_engine.broadcast(state.model_dump())
    return state


@router.get("/telemetry/{index}", response_model=PlaybackTelemetry)
async def get_epoch_telemetry(index: int):
    """Fetch exact research telemetry for a specific epoch index."""
    telem = playback_engine.get_telemetry_at_index(index)
    if telem is None:
        raise HTTPException(status_code=404, detail=f"Epoch index {index} out of bounds")
    return telem


@router.websocket("/stream")
async def websocket_playback_stream(websocket: WebSocket):
    """Real-time bidirectional WebSocket stream for playback telemetry and client controls."""
    await playback_engine.register_ws(websocket)
    try:
        while True:
            # Listen for client-side control commands sent over WebSocket
            text_data = await websocket.receive_text()
            try:
                cmd = json.loads(text_data)
                action = cmd.get("action")
                target_idx = cmd.get("target_index")
                speed = cmd.get("speed_multiplier")
                if action:
                    state = await playback_engine.control(action=action, target_index=target_idx, speed=speed)
                    await playback_engine.broadcast(state.model_dump())
            except Exception as ex:
                logger.warning("Error parsing WS control payload: %s", ex)
    except WebSocketDisconnect:
        playback_engine.unregister_ws(websocket)
    except Exception as ex:
        logger.error("WebSocket unexpected termination: %s", ex)
        playback_engine.unregister_ws(websocket)
