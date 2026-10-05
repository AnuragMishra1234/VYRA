"""Unit Tests for IMU and Odometry Preprocessing."""

import numpy as np
import pandas as pd
import pytest

from navigation.imu_processing import IMUProcessor, STANDARD_GRAVITY


def test_imu_processor_calibration() -> None:
    n = 10
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "acc_y": np.full(n, 1.0),  # 1 m/s^2 forward
        "acc_x": np.full(n, 0.5),  # 0.5 m/s^2 right
        "gyro_z": np.full(n, 0.1), # 0.1 rad/s
        "speed_mps": np.full(n, 10.0),
    })

    processor = IMUProcessor()
    obs = processor.process_trajectory(df)

    assert len(obs) == n
    assert np.isclose(obs[0].acc_long_mps2, 1.0)
    assert np.isclose(obs[0].acc_lat_mps2, 0.5)
    assert np.isclose(obs[0].yaw_rate_rad_s, 0.1)
    assert np.isclose(obs[0].wheel_speed_mps, 10.0)
    assert obs[0].is_stationary == False


def test_imu_processor_g_conversion() -> None:
    n = 5
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "indicated_longitudinal_acceleration_g": np.full(n, 0.1),
        "indicated_lateral_acceleration_g": np.full(n, -0.05),
        "yaw_rate_deg_s": np.full(n, 10.0),
        "indicated_speed_kmh": np.full(n, 36.0),  # 36 km/h = 10 m/s
    })

    processor = IMUProcessor()
    obs = processor.process_trajectory(df)

    assert np.isclose(obs[0].acc_long_mps2, 0.1 * STANDARD_GRAVITY)
    assert np.isclose(obs[0].acc_lat_mps2, -0.05 * STANDARD_GRAVITY)
    assert np.isclose(obs[0].yaw_rate_rad_s, np.radians(10.0))
    assert np.isclose(obs[0].wheel_speed_mps, 10.0)


def test_zupt_stationary_detection() -> None:
    n = 5
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "acc_y": np.full(n, 0.01),
        "acc_x": np.full(n, 0.01),
        "gyro_z": np.full(n, 0.05),  # small drift
        "speed_mps": np.full(n, 0.0), # completely stopped
    })

    processor = IMUProcessor(zupt_velocity_threshold_mps=0.1)
    obs = processor.process_trajectory(df)

    assert obs[0].is_stationary == True
    # In stationary mode, yaw rate drift is clamped to zero
    assert obs[0].yaw_rate_rad_s == 0.0
