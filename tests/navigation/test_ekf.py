"""Unit Tests for Extended Kalman Filter Fusion Engine."""

import numpy as np
import pytest

from navigation.ekf import ExtendedKalmanFilter
from navigation.imu_processing import IMUObservation


def test_ekf_prediction_and_covariance_growth() -> None:
    ekf = ExtendedKalmanFilter()
    ekf.reset(pos_e=0.0, pos_n=0.0, vel_e=10.0, vel_n=0.0, yaw=0.0, timestamp=0.0)

    initial_trace = np.trace(ekf.P)

    # Propagate 5 prediction steps without GNSS update
    for i in range(5):
        obs = IMUObservation(
            timestamp=(i + 1) * 0.1,
            dt=0.1,
            acc_long_mps2=0.0,
            acc_lat_mps2=0.0,
            yaw_rate_rad_s=0.0,
            wheel_speed_mps=10.0,
            is_stationary=False,
        )
        ekf.predict(obs)

    # Position should have moved East by 5 m
    assert np.isclose(ekf.x[0], 5.0, atol=0.1)
    # Covariance trace must strictly increase due to process noise Q
    assert np.trace(ekf.P) > initial_trace


def test_ekf_measurement_update_reduces_uncertainty() -> None:
    ekf = ExtendedKalmanFilter()
    ekf.reset(pos_e=0.0, pos_n=0.0, vel_e=10.0, vel_n=0.0, yaw=0.0, initial_pos_var=10.0)

    prior_trace = np.trace(ekf.P)

    # Perform GNSS update with high quality
    accepted, innov = ekf.update_gnss(
        meas_pos_e=0.1, meas_pos_n=-0.1, meas_vel_e=9.9, meas_vel_n=0.0, quality_score=1.0
    )

    assert accepted == True
    # Uncertainty must decrease after measurement update
    assert np.trace(ekf.P) < prior_trace


def test_ekf_adaptive_r_inflation() -> None:
    ekf = ExtendedKalmanFilter(adaptive_noise_scale=10.0)
    ekf.reset(pos_e=0.0, pos_n=0.0, vel_e=10.0, vel_n=0.0, yaw=0.0, initial_pos_var=5.0)

    obs = IMUObservation(
        timestamp=0.1, dt=0.1, acc_long_mps2=0.0, acc_lat_mps2=0.0,
        yaw_rate_rad_s=0.0, wheel_speed_mps=10.0, is_stationary=False,
    )
    ekf.predict(obs)
    p_pred = ekf.P.copy()

    # Highly degraded GNSS update (quality = 0.10)
    accepted, innov = ekf.update_gnss(
        meas_pos_e=5.0, meas_pos_n=5.0, meas_vel_e=10.0, meas_vel_n=0.0, quality_score=0.10
    )

    assert accepted == True
    # State should barely move toward the corrupted fix because of R inflation
    assert abs(ekf.x[1]) < 0.5  # North was 0, noisy measurement was 5


def test_ekf_outage_skips_update() -> None:
    ekf = ExtendedKalmanFilter()
    ekf.reset(pos_e=0.0, pos_n=0.0, vel_e=10.0, vel_n=0.0, yaw=0.0)

    obs = IMUObservation(
        timestamp=0.1, dt=0.1, acc_long_mps2=0.0, acc_lat_mps2=0.0,
        yaw_rate_rad_s=0.0, wheel_speed_mps=10.0, is_stationary=False,
    )
    ekf.predict(obs)
    pos_before = ekf.x[0]

    # Outage update
    accepted, innov = ekf.update_gnss(
        meas_pos_e=100.0, meas_pos_n=100.0, meas_vel_e=0.0, meas_vel_n=0.0, is_outage=True
    )

    assert accepted == False
    assert ekf.x[0] == pos_before  # state untouched by outage measurement
