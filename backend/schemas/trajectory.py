"""Pydantic schemas for Trajectory discovery and metadata."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrajectoryMetadata(BaseModel):
    """Metadata describing a single recorded vehicle drive."""

    trajectory_id: str = Field(..., description="Unique trajectory sequence identifier (e.g. V-S3a)")
    total_epochs: int = Field(..., description="Number of recorded 10 Hz epochs")
    duration_seconds: float = Field(..., description="Total driving duration in seconds")
    sampling_rate_hz: float = Field(default=10.0, description="Nominal sampling rate")
    split: str = Field(..., description="Dataset split assignment: train, val, or test")
    has_ground_truth: bool = Field(default=True, description="Whether reference RTK/tactical INS is available")
    lat_min: float = Field(..., description="Minimum latitude bound")
    lat_max: float = Field(..., description="Maximum latitude bound")
    lon_min: float = Field(..., description="Minimum longitude bound")
    lon_max: float = Field(..., description="Maximum longitude bound")


class TrajectoryListResponse(BaseModel):
    """Response containing all discovered benchmark trajectories."""

    trajectories: List[TrajectoryMetadata]
    total_count: int
    default_test_id: str = "V-S3a"
