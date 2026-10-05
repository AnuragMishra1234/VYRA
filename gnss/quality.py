"""GNSS Quality Engine for VYRA.

Determines the current instantaneous reliability and quality score of GNSS signals
using observable measurements available at epoch t:
- Satellite visibility & effective constellation size
- Kinematic consistency between GNSS velocity and vehicle wheel odometry
- Position displacement stability and innovation jumps

CRITICAL DISTINCTION:
This module characterizes CURRENT quality at epoch t.
It does NOT predict future states (which is the responsibility of gnss/predictor.py).
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Standard Operational Thresholds (Derived from Navigation Integrity Standards)
MIN_SATELLITES_3D_FIX: int = 4         # Mathematical minimum for 3D geodetic positioning
NOMINAL_SATELLITES_HEALTHY: int = 8    # Standard healthy constellation tracking
MAX_NOMINAL_VELOCITY_DIFF_MPS: float = 0.5   # 1.8 km/h nominal wheel slip / Doppler jitter
CRITICAL_VELOCITY_DIFF_MPS: float = 2.0      # 7.2 km/h indicates acute velocity corruption
CRITICAL_POSITION_JUMP_MPS: float = 5.0      # Step jump residual indicating multipath pop


def extract_effective_satellites(raw_sat_values: np.ndarray) -> np.ndarray:
    """Normalize raw satellite counts into effective constellation counts.

    In Ford ECU CAN logs (IO-VNBD), values > 100 represent tracking status flags
    added to satellite count (e.g., 138 corresponds to 38 tracking channels / dual-band).
    When signal is completely lost, satellite count is explicitly 0.

    Args:
        raw_sat_values: Array of raw satellite indicator values.

    Returns:
        Array of effective satellite counts clamped between 0 and 24.
    """
    sats = np.array(raw_sat_values, dtype=float)
    # Extract channel count modulo 100 for status-offset values
    effective = np.where(sats > 100.0, sats % 100.0, sats)
    # Ensure non-negative
    effective = np.clip(effective, 0.0, 24.0)
    return effective


def compute_satellite_quality_score(effective_sats: np.ndarray) -> np.ndarray:
    """Map effective satellite count to a continuous normalized score in [0.0, 1.0].

    - 0 satellites -> 0.0 (total outage)
    - 1-3 satellites -> 0.1 (no 3D fix possible)
    - 4-5 satellites -> 0.3-0.5 (marginal fix, poor geometry)
    - >= 8 satellites -> 1.0 (healthy constellation)
    """
    scores = np.zeros_like(effective_sats, dtype=float)

    # Linear ramp from 4 satellites (0.4) to 8 satellites (1.0)
    ramp_mask = (effective_sats >= MIN_SATELLITES_3D_FIX) & (
        effective_sats < NOMINAL_SATELLITES_HEALTHY
    )
    scores[ramp_mask] = 0.4 + 0.6 * (
        (effective_sats[ramp_mask] - MIN_SATELLITES_3D_FIX)
        / (NOMINAL_SATELLITES_HEALTHY - MIN_SATELLITES_3D_FIX)
    )

    # 1 to 3 satellites: severely degraded fix
    marginal_mask = (effective_sats > 0.0) & (effective_sats < MIN_SATELLITES_3D_FIX)
    scores[marginal_mask] = 0.1 * (effective_sats[marginal_mask] / MIN_SATELLITES_3D_FIX)

    # 8+ satellites: fully healthy
    scores[effective_sats >= NOMINAL_SATELLITES_HEALTHY] = 1.0

    return np.clip(scores, 0.0, 1.0)


def compute_kinematic_consistency_score(
    velocity_diff_mps: np.ndarray,
) -> np.ndarray:
    """Map velocity discrepancy |v_gps - v_wheel| to quality score in [0.0, 1.0].

    - diff <= 0.5 m/s -> 1.0
    - diff in [0.5, 2.0] -> linear degradation from 1.0 to 0.0
    - diff >= 2.0 m/s -> 0.0
    """
    scores = np.ones_like(velocity_diff_mps, dtype=float)
    degraded_mask = velocity_diff_mps > MAX_NOMINAL_VELOCITY_DIFF_MPS
    scores[degraded_mask] = 1.0 - (
        (velocity_diff_mps[degraded_mask] - MAX_NOMINAL_VELOCITY_DIFF_MPS)
        / (CRITICAL_VELOCITY_DIFF_MPS - MAX_NOMINAL_VELOCITY_DIFF_MPS)
    )
    return np.clip(scores, 0.0, 1.0)


def compute_position_jump_residual(
    timestamps: np.ndarray,
    latitudes: np.ndarray,
    longitudes: np.ndarray,
    speeds_mps: np.ndarray,
) -> np.ndarray:
    """Compute step position jump residual: |displacement - v * dt| in meters.

    Uses haversine approximation for consecutive points.
    """
    n = len(timestamps)
    residuals = np.zeros(n, dtype=float)
    if n < 2:
        return residuals

    # Haversine distance between adjacent steps
    lat_rad = np.radians(latitudes)
    lon_rad = np.radians(longitudes)

    dlat = np.diff(lat_rad)
    dlon = np.diff(lon_rad)
    a = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(lat_rad[:-1]) * np.cos(lat_rad[1:]) * np.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    step_distances = 6371000.0 * c  # Earth radius in meters

    dt = np.diff(timestamps)
    dt = np.where(dt <= 0, 0.1, dt)

    expected_distances = speeds_mps[:-1] * dt
    step_residuals = np.abs(step_distances - expected_distances)
    residuals[1:] = step_residuals

    return residuals


def compute_gnss_quality(
    df: pd.DataFrame,
    quality_threshold: float = 0.70,
) -> pd.DataFrame:
    """Compute all instantaneous GNSS quality metrics for a trajectory.

    Args:
        df: Input trajectory DataFrame.
        quality_threshold: Threshold below which GNSS is flagged as degraded.

    Returns:
        DataFrame with appended GNSS quality indicator columns.
    """
    df = df.copy()
    n_samples = len(df)

    # 1. Satellites
    if "satellites_available" in df.columns:
        raw_sats = df["satellites_available"].fillna(0.0).values
        eff_sats = extract_effective_satellites(raw_sats)
        sat_quality = compute_satellite_quality_score(eff_sats)
    else:
        logger.warning("Feature 'satellites_available' unavailable in dataset.")
        eff_sats = np.full(n_samples, 8.0)
        sat_quality = np.ones(n_samples)

    df["effective_satellites"] = eff_sats
    df["satellite_quality_score"] = sat_quality

    # 2. Kinematic Consistency (GPS speed vs Wheel/ECU speed)
    if "speed_mps" in df.columns and "indicated_speed_kmh" in df.columns:
        v_gps = df["speed_mps"].fillna(0.0).values
        v_wheel = (df["indicated_speed_kmh"] / 3.6).fillna(0.0).values
        v_diff = np.abs(v_gps - v_wheel)
        kinematic_quality = compute_kinematic_consistency_score(v_diff)
    elif "speed_mps" in df.columns and "velocity_kmh" in df.columns:
        v_diff = np.zeros(n_samples)
        kinematic_quality = np.ones(n_samples)
    else:
        v_diff = np.zeros(n_samples)
        kinematic_quality = np.ones(n_samples)

    df["kinematic_discrepancy_mps"] = v_diff
    df["kinematic_quality_score"] = kinematic_quality

    # 3. Position Jump Residuals
    if "latitude" in df.columns and "longitude" in df.columns and "timestamp" in df.columns:
        ts = df["timestamp"].values
        lats = df["latitude"].fillna(0.0).values
        lons = df["longitude"].fillna(0.0).values
        speeds = df["speed_mps"].fillna(0.0).values if "speed_mps" in df.columns else np.zeros(n_samples)
        jump_residuals = compute_position_jump_residual(ts, lats, lons, speeds)
    else:
        jump_residuals = np.zeros(n_samples)

    df["position_jump_residual_m"] = jump_residuals

    # 4. Composite Quality Score Q_t in [0.0, 1.0]
    # Weighted harmonic/geometric mean prioritizing satellite availability
    # If satellites are 0, composite quality MUST be 0.0
    composite = sat_quality * 0.70 + kinematic_quality * 0.30
    # Zero satellites forces complete zero quality
    composite = np.where(eff_sats == 0.0, 0.0, composite)
    # Position jump > 5m penalizes quality
    jump_penalty = np.clip(jump_residuals / CRITICAL_POSITION_JUMP_MPS, 0.0, 0.5)
    composite = np.clip(composite - jump_penalty, 0.0, 1.0)

    df["composite_quality_score"] = composite
    df["is_currently_degraded"] = (
        (composite < quality_threshold)
        | (eff_sats < MIN_SATELLITES_3D_FIX)
        | (v_diff > CRITICAL_VELOCITY_DIFF_MPS)
    )

    return df
