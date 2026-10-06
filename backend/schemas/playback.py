"""Pydantic schemas for Playback controls and telemetry streaming."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LatLon(BaseModel):
    """Geodetic coordinate pair."""

    lat: float = Field(..., description="WGS-84 latitude in degrees")
    lon: float = Field(..., description="WGS-84 longitude in degrees")


class CandidateForecastItem(BaseModel):
    """Individual candidate navigation mode forecast."""

    action: str = Field(..., description="Candidate action: GNSS, HYBRID, or DR")
    forecasted_error_m: float = Field(..., description="Predicted future max position error in meters")
    horizon_s: float = Field(default=3.0, description="Forecast lookahead horizon in seconds")
    is_selected: bool = Field(default=False, description="Whether this candidate was chosen by VYRA policy")
    decision_cost: Optional[float] = Field(default=None, description="Multi-objective decision cost J(A)")


class PlaybackTelemetry(BaseModel):
    """Rich research telemetry for a single replayed epoch."""

    index: int = Field(..., description="Epoch index (0-based)")
    timestamp: float = Field(..., description="Time since start of day in seconds")
    relative_time_s: float = Field(..., description="Relative seconds from trajectory start")
    scenario: str = Field(..., description="Operational regime: NORMAL, DEGRADED, OUTAGE, or RECOVERY")
    is_outage: bool = Field(..., description="Whether GNSS is currently in active outage")
    is_degraded: bool = Field(..., description="Whether GNSS signal is degraded")

    # Quality & Reliability Subsystem
    gnss_quality: float = Field(..., description="Instantaneous composite GNSS quality score Q_t in [0.0, 1.0]")
    degradation_prob: float = Field(..., description="Predicted probability of degradation P(degradation | s_t) in [0.0, 1.0]")

    # Navigation & Uncertainty Subsystem
    dr_uncertainty_std_m: float = Field(..., description="Inertial horizontal position uncertainty 1-sigma in meters")
    dr_survivability_s: float = Field(..., description="Estimated DR survivable duration T_surv under 5.0m bound in seconds")

    # Action-Conditioned Forecasting
    forecast_gnss: float = Field(..., description="Forecasted future max error for GNSS in meters")
    forecast_hybrid: float = Field(..., description="Forecasted future max error for HYBRID in meters")
    forecast_dr: float = Field(..., description="Forecasted future max error for DR in meters")
    candidates: List[CandidateForecastItem] = Field(default_factory=list, description="Structured candidate forecast cards")

    # Adaptive Policy Decision
    selected_mode: str = Field(..., description="Selected navigation mode: GNSS, HYBRID, or DR")
    decision_reason: str = Field(..., description="Formal policy switching rationale or audit trigger")
    current_error_m: float = Field(..., description="True horizontal tracking error relative to ground truth in meters")

    # Coordinates
    gt_coord: Optional[LatLon] = Field(None, description="Ground-truth reference position (labeled OFFLINE REFERENCE)")
    gnss_coord: LatLon = Field(..., description="Raw satellite receiver fix")
    vyra_coord: LatLon = Field(..., description="Proposed VYRA adaptive filter position")
    hybrid_coord: LatLon = Field(..., description="Fixed HYBRID continuous EKF position")
    dr_coord: LatLon = Field(..., description="Pure inertial dead-reckoning position")

    # Local ENU Cartesians (meters)
    vyra_e: float
    vyra_n: float
    gt_e: float
    gt_n: float


class PlaybackControlRequest(BaseModel):
    """Command payload for controlling the playback engine."""

    action: str = Field(..., description="Action: 'play', 'pause', 'stop', 'reset', 'step', 'seek'")
    target_index: Optional[int] = Field(default=None, description="Target epoch index for seek command")
    speed_multiplier: Optional[float] = Field(default=None, description="Playback rate multiplier (e.g. 1.0, 2.0, 5.0, 10.0)")


class PlaybackStateResponse(BaseModel):
    """Current status and telemetry snapshot of the playback engine."""

    status: str = Field(..., description="'playing', 'paused', or 'stopped'")
    current_index: int
    total_epochs: int
    speed_multiplier: float
    scenario: str
    trajectory_id: str
    telemetry: Optional[PlaybackTelemetry] = None
