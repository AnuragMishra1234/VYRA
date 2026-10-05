"""IMU and Odometry Preprocessing Module for VYRA.

Processes raw automotive sensor channels into calibrated kinematic quantities:
- Longitudinal Acceleration: a_long (m/s^2 forward)
- Lateral Acceleration: a_lat (m/s^2 right)
- Yaw Rate: omega_z (rad/s around vertical axis, counter-clockwise positive)
- Wheel Speed Odometry: v_wheel (m/s)
- Causal Time Increments: dt (seconds)
- Zero Velocity Update (ZUPT) detection

ANTI-LEAKAGE SPECIFICATION:
All filters, causal smoothers, and ZUPT detectors use exclusively
past observations [0, t]. No future measurements are accessed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

STANDARD_GRAVITY: float = 9.80665  # m/s^2
NOMINAL_DT: float = 0.1           # 10 Hz nominal


@dataclass(frozen=True)
class IMUObservation:
    """Calibrated kinematic measurement at epoch t."""

    timestamp: float
    dt: float
    acc_long_mps2: float
    acc_lat_mps2: float
    yaw_rate_rad_s: float
    wheel_speed_mps: float
    is_stationary: bool


class IMUProcessor:
    """Streamlined causal IMU preprocessor and kinematic observer."""

    def __init__(
        self,
        nominal_dt: float = NOMINAL_DT,
        zupt_velocity_threshold_mps: float = 0.15,
        zupt_acc_threshold_mps2: float = 0.30,
        gyro_bias_prior_rad_s: float = 0.0,
    ) -> None:
        self.nominal_dt = nominal_dt
        self.zupt_velocity_threshold = zupt_velocity_threshold_mps
        self.zupt_acc_threshold = zupt_acc_threshold_mps2
        self.gyro_bias_prior = gyro_bias_prior_rad_s

    def process_trajectory(self, df: pd.DataFrame) -> List[IMUObservation]:
        """Process an entire trajectory DataFrame into a sequence of IMUObservations."""
        n = len(df)
        if n == 0:
            return []

        # 1. Timestamps & dt
        ts = df["timestamp"].to_numpy(dtype=float)
        dts = np.diff(ts, prepend=ts[0] - self.nominal_dt)
        # Clamp anomalous or zero dts to nominal
        dts = np.where((dts <= 0.01) | (dts > 1.0), self.nominal_dt, dts)

        # 2. Longitudinal Acceleration
        if "acc_y" in df.columns:
            a_long = df["acc_y"].fillna(0.0).to_numpy(dtype=float)
        elif "indicated_longitudinal_acceleration_g" in df.columns:
            a_long = (
                df["indicated_longitudinal_acceleration_g"].fillna(0.0).to_numpy(dtype=float)
                * STANDARD_GRAVITY
            )
        else:
            a_long = np.zeros(n, dtype=float)

        # 3. Lateral Acceleration
        if "acc_x" in df.columns:
            a_lat = df["acc_x"].fillna(0.0).to_numpy(dtype=float)
        elif "indicated_lateral_acceleration_g" in df.columns:
            a_lat = (
                df["indicated_lateral_acceleration_g"].fillna(0.0).to_numpy(dtype=float)
                * STANDARD_GRAVITY
            )
        else:
            a_lat = np.zeros(n, dtype=float)

        # 4. Yaw Rate (rad/s)
        if "gyro_z" in df.columns:
            omega_z = df["gyro_z"].fillna(0.0).to_numpy(dtype=float)
        elif "yaw_rate_deg_s" in df.columns:
            omega_z = np.radians(df["yaw_rate_deg_s"].fillna(0.0).to_numpy(dtype=float))
        elif "yaw_rate_deg_sec" in df.columns:
            omega_z = np.radians(df["yaw_rate_deg_sec"].fillna(0.0).to_numpy(dtype=float))
        else:
            omega_z = np.zeros(n, dtype=float)

        # Apply prior gyro bias if specified
        omega_z = omega_z - self.gyro_bias_prior

        # 5. Wheel Speed Odometry (m/s)
        if "indicated_speed_kmh" in df.columns:
            v_wheel = (df["indicated_speed_kmh"].fillna(0.0).to_numpy(dtype=float)) / 3.6
        elif "speed_mps" in df.columns:
            v_wheel = df["speed_mps"].fillna(0.0).to_numpy(dtype=float)
        else:
            v_wheel = np.zeros(n, dtype=float)

        # Ensure speed is non-negative
        v_wheel = np.maximum(0.0, v_wheel)

        # 6. Zero Velocity Update (ZUPT) Detection
        is_stationary = (v_wheel < self.zupt_velocity_threshold) & (
            np.abs(a_long) < self.zupt_acc_threshold
        )

        # Stationary condition zeroes out rotational drift
        omega_z = np.where(is_stationary, 0.0, omega_z)

        observations: List[IMUObservation] = []
        for i in range(n):
            observations.append(
                IMUObservation(
                    timestamp=float(ts[i]),
                    dt=float(dts[i]),
                    acc_long_mps2=float(a_long[i]),
                    acc_lat_mps2=float(a_lat[i]),
                    yaw_rate_rad_s=float(omega_z[i]),
                    wheel_speed_mps=float(v_wheel[i]),
                    is_stationary=bool(is_stationary[i]),
                )
            )

        return observations
