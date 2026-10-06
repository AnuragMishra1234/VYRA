"""Sensor Noise Simulation Module for VYRA Robustness Testing.

Provides controlled Gaussian perturbation and random-walk bias injection
for accelerometer, gyroscope, and GNSS channels to evaluate policy stability
and state estimation robustness under adverse sensor conditions.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class NoiseParameters:
    """Configurable noise standard deviations and biases."""

    accel_noise_std_mps2: float = 0.0
    gyro_noise_std_rads: float = 0.0
    gnss_pos_noise_std_m: float = 0.0
    gyro_bias_rads: float = 0.0
    seed: int = 42


def inject_sensor_noise(
    df: pd.DataFrame,
    params: NoiseParameters,
) -> pd.DataFrame:
    """Inject controlled noise into sensor channels while preserving ground truth.

    Args:
        df: Trajectory DataFrame.
        params: Noise parameters specification.

    Returns:
        DataFrame with perturbed sensor measurements.
    """
    df_out = df.copy()
    n = len(df_out)
    rng = np.random.RandomState(params.seed)

    # 1. Accelerometer noise
    for col in ["longitudinal_acceleration_mps2", "lateral_acceleration_mps2", "vertical_acceleration_mps2"]:
        if col in df_out.columns and params.accel_noise_std_mps2 > 0.0:
            noise = rng.normal(0.0, params.accel_noise_std_mps2, size=n)
            df_out[col] = df_out[col] + noise

    # 2. Gyroscope noise & bias
    for col in ["yaw_rate_deg_s", "yaw_rate_rad_s"]:
        if col in df_out.columns:
            is_deg = "deg" in col
            scale = 180.0 / np.pi if is_deg else 1.0
            if params.gyro_noise_std_rads > 0.0:
                noise = rng.normal(0.0, params.gyro_noise_std_rads * scale, size=n)
                df_out[col] = df_out[col] + noise
            if params.gyro_bias_rads != 0.0:
                df_out[col] = df_out[col] + (params.gyro_bias_rads * scale)

    # 3. GNSS position noise (in meters converted to lat/lon)
    if params.gnss_pos_noise_std_m > 0.0 and "latitude" in df_out.columns and "longitude" in df_out.columns:
        lats = df_out["latitude"].to_numpy(dtype=float)
        lons = df_out["longitude"].to_numpy(dtype=float)
        noise_m = rng.normal(0.0, params.gnss_pos_noise_std_m, size=(n, 2))
        d_lat = noise_m[:, 1] / 111139.0
        d_lon = noise_m[:, 0] / (111139.0 * np.maximum(1e-3, np.cos(np.radians(lats))))
        df_out["latitude"] = lats + d_lat
        df_out["longitude"] = lons + d_lon

    return df_out
