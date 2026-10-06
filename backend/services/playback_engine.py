"""Real-Time Playback Engine for Recorded Trajectories.

Replays precomputed research telemetry (10 Hz ground-truth, sensor streams,
GNSS reliability Q_t, DR uncertainty sigma, action-conditioned forecasts, and policy decisions)
with zero latency and sub-millisecond seek times.
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import numpy as np
import pandas as pd
from starlette.websockets import WebSocket, WebSocketState

from backend.schemas.playback import (
    CandidateForecastItem,
    LatLon,
    PlaybackStateResponse,
    PlaybackTelemetry,
)

logger = logging.getLogger(__name__)


class PlaybackEngine:
    """Singleton playback engine managing trajectory replay state and WebSocket distribution."""

    def __init__(self, repo_root: Optional[Path] = None) -> None:
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent
        self.cache_path = self.repo_root / "results" / "processed" / "v_s3a_playback_cache.parquet"

        self.trajectory_id: str = "V-S3a"
        self.status: str = "paused"  # "playing", "paused", "stopped"
        self.current_index: int = 0
        self.total_epochs: int = 0
        self.speed_multiplier: float = 1.0  # 1.0x = 10 Hz (0.1s real-time step)
        self.base_dt: float = 0.1  # 10 Hz sampling

        # Fast in-memory numpy storage
        self._data: Optional[Dict[str, np.ndarray]] = None
        self._str_data: Optional[Dict[str, List[str]]] = None

        # WebSocket management
        self.active_connections: Set[WebSocket] = set()
        self._playback_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

        self._load_cache()

    def _load_cache(self) -> None:
        """Load parquet telemetry cache into memory arrays for instant indexing."""
        if not self.cache_path.is_file():
            logger.error("Playback cache not found at %s", self.cache_path)
            return

        try:
            logger.info("Loading playback cache from %s...", self.cache_path)
            df = pd.read_parquet(self.cache_path)
            self.total_epochs = len(df)

            # Split into float/bool numeric columns and string columns
            self._str_data = {
                "scenario": df["scenario"].astype(str).tolist(),
                "selected_mode": df["selected_mode"].astype(str).tolist(),
                "decision_reason": df["decision_reason"].astype(str).tolist(),
            }

            self._data = {
                "index": df["index"].to_numpy(dtype=np.int64),
                "timestamp": df["timestamp"].to_numpy(dtype=np.float64),
                "relative_time_s": df["relative_time_s"].to_numpy(dtype=np.float64),
                "is_outage": df["is_outage"].to_numpy(dtype=bool),
                "is_degraded": df["is_degraded"].to_numpy(dtype=bool),
                "gnss_quality": df["gnss_quality"].to_numpy(dtype=np.float64),
                "degradation_prob": df["degradation_prob"].to_numpy(dtype=np.float64),
                "dr_uncertainty_std_m": df["dr_uncertainty_std_m"].to_numpy(dtype=np.float64),
                "dr_survivability_s": df["dr_survivability_s"].to_numpy(dtype=np.float64),
                "forecast_gnss": df["forecast_gnss"].to_numpy(dtype=np.float64),
                "forecast_hybrid": df["forecast_hybrid"].to_numpy(dtype=np.float64),
                "forecast_dr": df["forecast_dr"].to_numpy(dtype=np.float64),
                "current_error_m": df["current_error_m"].to_numpy(dtype=np.float64),
                "gt_lat": df["gt_lat"].to_numpy(dtype=np.float64),
                "gt_lon": df["gt_lon"].to_numpy(dtype=np.float64),
                "gnss_lat": df["gnss_lat"].to_numpy(dtype=np.float64),
                "gnss_lon": df["gnss_lon"].to_numpy(dtype=np.float64),
                "vyra_lat": df["vyra_lat"].to_numpy(dtype=np.float64),
                "vyra_lon": df["vyra_lon"].to_numpy(dtype=np.float64),
                "hybrid_lat": df["hybrid_lat"].to_numpy(dtype=np.float64),
                "hybrid_lon": df["hybrid_lon"].to_numpy(dtype=np.float64),
                "dr_lat": df["dr_lat"].to_numpy(dtype=np.float64),
                "dr_lon": df["dr_lon"].to_numpy(dtype=np.float64),
                "vyra_e": df["vyra_e"].to_numpy(dtype=np.float64),
                "vyra_n": df["vyra_n"].to_numpy(dtype=np.float64),
                "gt_e": df["gt_e"].to_numpy(dtype=np.float64),
                "gt_n": df["gt_n"].to_numpy(dtype=np.float64),
            }
            logger.info("Successfully cached %d epochs for trajectory %s", self.total_epochs, self.trajectory_id)
        except Exception as ex:
            logger.error("Failed to load playback cache: %s", ex)

    def get_telemetry_at_index(self, idx: int) -> Optional[PlaybackTelemetry]:
        """Construct PlaybackTelemetry for a specific epoch index with 0.01 ms latency."""
        if self._data is None or self._str_data is None or self.total_epochs == 0:
            return None

        idx = max(0, min(idx, self.total_epochs - 1))
        d = self._data
        s = self._str_data

        selected = s["selected_mode"][idx]
        f_gnss = float(d["forecast_gnss"][idx])
        f_hybrid = float(d["forecast_hybrid"][idx])
        f_dr = float(d["forecast_dr"][idx])

        candidates = [
            CandidateForecastItem(
                action="GNSS",
                forecasted_error_m=round(f_gnss, 4),
                horizon_s=3.0,
                is_selected=(selected == "GNSS"),
            ),
            CandidateForecastItem(
                action="HYBRID",
                forecasted_error_m=round(f_hybrid, 4),
                horizon_s=3.0,
                is_selected=(selected == "HYBRID"),
            ),
            CandidateForecastItem(
                action="DR",
                forecasted_error_m=round(f_dr, 4),
                horizon_s=3.0,
                is_selected=(selected == "DR"),
            ),
        ]

        return PlaybackTelemetry(
            index=int(d["index"][idx]),
            timestamp=round(float(d["timestamp"][idx]), 2),
            relative_time_s=round(float(d["relative_time_s"][idx]), 2),
            scenario=s["scenario"][idx],
            is_outage=bool(d["is_outage"][idx]),
            is_degraded=bool(d["is_degraded"][idx]),
            gnss_quality=round(float(d["gnss_quality"][idx]), 4),
            degradation_prob=round(float(d["degradation_prob"][idx]), 4),
            dr_uncertainty_std_m=round(float(d["dr_uncertainty_std_m"][idx]), 4),
            dr_survivability_s=round(float(d["dr_survivability_s"][idx]), 2),
            forecast_gnss=round(f_gnss, 4),
            forecast_hybrid=round(f_hybrid, 4),
            forecast_dr=round(f_dr, 4),
            candidates=candidates,
            selected_mode=selected,
            decision_reason=s["decision_reason"][idx],
            current_error_m=round(float(d["current_error_m"][idx]), 4),
            gt_coord=LatLon(lat=float(d["gt_lat"][idx]), lon=float(d["gt_lon"][idx])),
            gnss_coord=LatLon(lat=float(d["gnss_lat"][idx]), lon=float(d["gnss_lon"][idx])),
            vyra_coord=LatLon(lat=float(d["vyra_lat"][idx]), lon=float(d["vyra_lon"][idx])),
            hybrid_coord=LatLon(lat=float(d["hybrid_lat"][idx]), lon=float(d["hybrid_lon"][idx])),
            dr_coord=LatLon(lat=float(d["dr_lat"][idx]), lon=float(d["dr_lon"][idx])),
            vyra_e=round(float(d["vyra_e"][idx]), 3),
            vyra_n=round(float(d["vyra_n"][idx]), 3),
            gt_e=round(float(d["gt_e"][idx]), 3),
            gt_n=round(float(d["gt_n"][idx]), 3),
        )

    def get_state(self) -> PlaybackStateResponse:
        """Return the current playback engine status and latest telemetry snapshot."""
        telemetry = self.get_telemetry_at_index(self.current_index)
        scenario = telemetry.scenario if telemetry else "NORMAL"
        return PlaybackStateResponse(
            status=self.status,
            current_index=self.current_index,
            total_epochs=self.total_epochs,
            speed_multiplier=self.speed_multiplier,
            scenario=scenario,
            trajectory_id=self.trajectory_id,
            telemetry=telemetry,
        )

    def get_trajectory_paths(self, stride: int = 10) -> Dict[str, Any]:
        """Downsample full trajectories for lightweight polyline map rendering."""
        if self._data is None or self.total_epochs == 0:
            return {"gt": [], "gnss": [], "vyra": [], "hybrid": [], "dr": [], "stride": stride}

        stride = max(1, stride)
        idxs = np.arange(0, self.total_epochs, stride)
        d = self._data

        gt_path = np.column_stack((d["gt_lat"][idxs], d["gt_lon"][idxs])).tolist()
        gnss_path = np.column_stack((d["gnss_lat"][idxs], d["gnss_lon"][idxs])).tolist()
        vyra_path = np.column_stack((d["vyra_lat"][idxs], d["vyra_lon"][idxs])).tolist()
        hybrid_path = np.column_stack((d["hybrid_lat"][idxs], d["hybrid_lon"][idxs])).tolist()
        dr_path = np.column_stack((d["dr_lat"][idxs], d["dr_lon"][idxs])).tolist()

        return {
            "trajectory_id": self.trajectory_id,
            "stride": stride,
            "sample_count": len(idxs),
            "paths": {
                "offline_reference_gt": gt_path,
                "gnss": gnss_path,
                "vyra": vyra_path,
                "hybrid": hybrid_path,
                "dr": dr_path,
            },
        }

    async def control(self, action: str, target_index: Optional[int] = None, speed: Optional[float] = None) -> PlaybackStateResponse:
        """Process transport controls: play, pause, stop, reset, step, seek."""
        async with self._lock:
            if speed is not None and speed > 0:
                self.speed_multiplier = float(speed)

            if action == "play":
                self.status = "playing"
                self._ensure_loop_running()
            elif action == "pause":
                self.status = "paused"
            elif action == "stop":
                self.status = "stopped"
                self.current_index = 0
            elif action == "reset":
                self.current_index = 0
                self.status = "paused"
            elif action == "step":
                self.status = "paused"
                self.current_index = min(self.total_epochs - 1, self.current_index + 1)
            elif action == "step_back":
                self.status = "paused"
                self.current_index = max(0, self.current_index - 1)
            elif action == "seek" and target_index is not None:
                self.current_index = max(0, min(target_index, self.total_epochs - 1))

        return self.get_state()

    def _ensure_loop_running(self) -> None:
        """Ensure background playback streaming loop is active."""
        if self._playback_task is None or self._playback_task.done():
            self._playback_task = asyncio.create_task(self._playback_loop())

    async def _playback_loop(self) -> None:
        """Asynchronous playback ticker that broadcasts updates to WebSocket clients."""
        try:
            while self.status == "playing" and self.current_index < self.total_epochs - 1:
                sleep_sec = max(0.01, self.base_dt / max(0.1, self.speed_multiplier))
                await asyncio.sleep(sleep_sec)

                if self.status != "playing":
                    break

                self.current_index += 1
                state = self.get_state()
                await self.broadcast(state.model_dump())

            if self.current_index >= self.total_epochs - 1:
                self.status = "paused"
                await self.broadcast(self.get_state().model_dump())
        except asyncio.CancelledError:
            pass
        except Exception as ex:
            logger.error("Playback loop error: %s", ex)

    async def register_ws(self, websocket: WebSocket) -> None:
        """Register a connected WebSocket client and send initial telemetry."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info("WebSocket connected. Active clients: %d", len(self.active_connections))
        initial_state = self.get_state().model_dump()
        await websocket.send_text(json.dumps(initial_state))

    def unregister_ws(self, websocket: WebSocket) -> None:
        """Unregister a disconnected WebSocket client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket disconnected. Remaining clients: %d", len(self.active_connections))

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        """Broadcast state payload to all active WebSocket connections."""
        if not self.active_connections:
            return

        message = json.dumps(payload)
        dead_connections: List[WebSocket] = []

        for ws in list(self.active_connections):
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(message)
                else:
                    dead_connections.append(ws)
            except Exception:
                dead_connections.append(ws)

        for ws in dead_connections:
            self.unregister_ws(ws)


# Global singleton instance
playback_engine = PlaybackEngine()
