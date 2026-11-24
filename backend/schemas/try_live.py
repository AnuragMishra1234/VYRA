"""Pydantic schemas for VYRA TRY-LIVE Real-Time Smartphone Sensor Demonstration."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    client_name: str = "Laptop Dashboard"
    host_override: Optional[str] = None


class ConnectionUrls(BaseModel):
    primary_lan: str
    localhost: str
    all_lan: List[str] = Field(default_factory=list)


class CreateSessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: float
    local_ips: List[str]
    connection_urls: ConnectionUrls


class PhoneTelemetryGps(BaseModel):
    latitude: float
    longitude: float
    accuracy_m: Optional[float] = None
    altitude_m: Optional[float] = None
    speed_mps: Optional[float] = None
    heading_deg: Optional[float] = None
    timestamp_ms: Optional[float] = None


class PhoneTelemetryMotion(BaseModel):
    accel_x: Optional[float] = None
    accel_y: Optional[float] = None
    accel_z: Optional[float] = None
    gyro_x: Optional[float] = None
    gyro_y: Optional[float] = None
    gyro_z: Optional[float] = None
    alpha: Optional[float] = None
    beta: Optional[float] = None
    gamma: Optional[float] = None


class PhoneDeviceStatus(BaseModel):
    battery_level: Optional[float] = None
    user_agent: Optional[str] = None


class PhoneTelemetryPayload(BaseModel):
    session_id: str
    type: str = "telemetry"
    timestamp_ms: float
    gps: Optional[PhoneTelemetryGps] = None
    motion: Optional[PhoneTelemetryMotion] = None
    device: Optional[PhoneDeviceStatus] = None


class TimelineEvent(BaseModel):
    id: str
    timestamp_iso: str
    timestamp_epoch: float
    category: str  # CONNECTION, PERMISSION, GPS_FIX, DEGRADATION, DECISION
    level: str     # info, success, warning, critical
    title: str
    description: str
    details: Optional[Dict[str, Any]] = None


class CostBreakdown(BaseModel):
    gnss: float
    hybrid: float
    dr: float


class VyraDecisionSnapshot(BaseModel):
    selected_mode: str  # GNSS, HYBRID, DR
    plain_explanation: str
    technical_explanation: str
    costs: CostBreakdown
    reason: str
    gps_quality_metric: float
    motion_activity: str  # STATIONARY, WALKING, IN_MOTION, UNKNOWN


class SessionStatusResponse(BaseModel):
    session_id: str
    status: str  # WAITING_FOR_PHONE, CONNECTED, STREAMING, PAUSED, STOPPED
    phone_connected: bool
    laptop_connected: bool
    packet_count: int
    packet_rate_hz: float
    gps_status: str  # AVAILABLE, WEAK, UPDATE_DELAYED, UNAVAILABLE, PERMISSION_DENIED
    motion_status: str  # ACTIVE, IDLE, UNAVAILABLE, PERMISSION_DENIED
    current_mode: str
    decision: Optional[VyraDecisionSnapshot] = None
    latest_telemetry: Optional[Dict[str, Any]] = None
    recent_events: List[TimelineEvent] = Field(default_factory=list)
