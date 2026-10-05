"""Unit Tests for Dead Reckoning Navigation Mechanization."""

import numpy as np
import pytest

from navigation.dead_reckoning import DeadReckoningEngine
from navigation.imu_processing import IMUObservation


def test_dead_reckoning_straight_east() -> None:
    engine = DeadReckoningEngine(use_wheel_speed=True)
    # Start at (0, 0), yaw = 0 (pointing East), speed = 10 m/s
    engine.reset(pos_e=0.0, pos_n=0.0, yaw=0.0, speed=10.0, timestamp=0.0)

    # Move 10 steps of dt=0.1s (total 1.0s, 10 meters East)
    for i in range(10):
        obs = IMUObservation(
            timestamp=(i + 1) * 0.1,
            dt=0.1,
            acc_long_mps2=0.0,
            acc_lat_mps2=0.0,
            yaw_rate_rad_s=0.0,
            wheel_speed_mps=10.0,
            is_stationary=False,
        )
        st = engine.step(obs)

    assert np.isclose(st.pos_e, 10.0)
    assert np.isclose(st.pos_n, 0.0)
    assert np.isclose(st.yaw, 0.0)


def test_dead_reckoning_straight_north() -> None:
    engine = DeadReckoningEngine(use_wheel_speed=True)
    # Start at (0, 0), yaw = pi/2 (pointing North)
    engine.reset(pos_e=0.0, pos_n=0.0, yaw=np.pi / 2.0, speed=20.0, timestamp=0.0)

    # Move 10 steps of dt=0.1s (total 1.0s, 20 meters North)
    for i in range(10):
        obs = IMUObservation(
            timestamp=(i + 1) * 0.1,
            dt=0.1,
            acc_long_mps2=0.0,
            acc_lat_mps2=0.0,
            yaw_rate_rad_s=0.0,
            wheel_speed_mps=20.0,
            is_stationary=False,
        )
        st = engine.step(obs)

    assert np.isclose(st.pos_e, 0.0, atol=1e-4)
    assert np.isclose(st.pos_n, 20.0)
    assert np.isclose(st.yaw, np.pi / 2.0)


def test_dead_reckoning_turn() -> None:
    engine = DeadReckoningEngine(use_wheel_speed=True)
    engine.reset(pos_e=0.0, pos_n=0.0, yaw=0.0, speed=10.0, timestamp=0.0)

    # Turn left (yaw_rate = +1.0 rad/s) for 1 second (10 steps)
    for i in range(10):
        obs = IMUObservation(
            timestamp=(i + 1) * 0.1,
            dt=0.1,
            acc_long_mps2=0.0,
            acc_lat_mps2=0.0,
            yaw_rate_rad_s=1.0,
            wheel_speed_mps=10.0,
            is_stationary=False,
        )
        st = engine.step(obs)

    # Heading should have increased by ~1.0 radian
    assert np.isclose(st.yaw, 1.0, atol=1e-3)
    # Position should have moved both East and North
    assert st.pos_e > 0.0
    assert st.pos_n > 0.0
