"""Dead Reckoning (DR) Navigation Mechanization Module for VYRA.

Implements physically grounded strapdown 2D dead-reckoning navigation in local
East-North-Up (ENU) coordinates using vehicle wheel odometry and IMU angular rate:
- Heading propagation: theta_k = theta_{k-1} + omega_{z, k} * dt
- Velocity decomposition: v_E = v * cos(theta), v_N = v * sin(theta)
- Position integration: p_k = p_{k-1} + 0.5 * (v_{k-1} + v_k) * dt

ANTI-LEAKAGE SPECIFICATION:
All state updates at epoch k strictly depend on observations up to epoch k.
Future measurements or future ground-truth positions are NEVER accessed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from navigation.coordinate_frames import wrap_angle_pi
from navigation.imu_processing import IMUObservation

logger = logging.getLogger(__name__)


@dataclass
class DeadReckoningState:
    """Estimated navigation state from Dead Reckoning mechanization."""

    timestamp: float
    pos_e: float
    pos_n: float
    vel_e: float
    vel_n: float
    yaw: float  # ENU yaw angle in radians
    speed: float


class DeadReckoningEngine:
    """Strapdown 2D dead-reckoning inertial propagator."""

    def __init__(self, use_wheel_speed: bool = True) -> None:
        self.use_wheel_speed = use_wheel_speed
        self.state: Optional[DeadReckoningState] = None

    def reset(
        self,
        pos_e: float = 0.0,
        pos_n: float = 0.0,
        yaw: float = 0.0,
        speed: float = 0.0,
        timestamp: float = 0.0,
    ) -> DeadReckoningState:
        """Initialize the dead-reckoning state vector."""
        vel_e = speed * np.cos(yaw)
        vel_n = speed * np.sin(yaw)
        self.state = DeadReckoningState(
            timestamp=float(timestamp),
            pos_e=float(pos_e),
            pos_n=float(pos_n),
            vel_e=float(vel_e),
            vel_n=float(vel_n),
            yaw=float(wrap_angle_pi(yaw)),
            speed=float(speed),
        )
        return self.state

    def step(self, obs: IMUObservation) -> DeadReckoningState:
        """Propagate state forward by time interval dt using causal IMU observation."""
        if self.state is None:
            raise RuntimeError("DeadReckoningEngine must be initialized via reset() before step().")

        dt = obs.dt
        prev = self.state

        # 1. Propagate ENU Heading
        new_yaw = wrap_angle_pi(prev.yaw + obs.yaw_rate_rad_s * dt)

        # 2. Determine forward velocity
        if self.use_wheel_speed:
            new_speed = obs.wheel_speed_mps
        else:
            # Integrate longitudinal acceleration if wheel speed disabled
            new_speed = max(0.0, prev.speed + obs.acc_long_mps2 * dt)

        if obs.is_stationary:
            new_speed = 0.0

        # 3. Decompose velocity into ENU frame
        new_vel_e = new_speed * np.cos(new_yaw)
        new_vel_n = new_speed * np.sin(new_yaw)

        # 4. Integrate position (trapezoidal rule)
        new_pos_e = prev.pos_e + 0.5 * (prev.vel_e + new_vel_e) * dt
        new_pos_n = prev.pos_n + 0.5 * (prev.vel_n + new_vel_n) * dt

        self.state = DeadReckoningState(
            timestamp=obs.timestamp,
            pos_e=float(new_pos_e),
            pos_n=float(new_pos_n),
            vel_e=float(new_vel_e),
            vel_n=float(new_vel_n),
            yaw=float(new_yaw),
            speed=float(new_speed),
        )
        return self.state

    def propagate_trajectory(
        self,
        observations: List[IMUObservation],
        initial_pos_e: float = 0.0,
        initial_pos_n: float = 0.0,
        initial_yaw: float = 0.0,
        initial_speed: float = 0.0,
    ) -> List[DeadReckoningState]:
        """Propagate entire sequence of observations from initial pose."""
        if not observations:
            return []

        self.reset(
            pos_e=initial_pos_e,
            pos_n=initial_pos_n,
            yaw=initial_yaw,
            speed=initial_speed,
            timestamp=observations[0].timestamp,
        )

        history: List[DeadReckoningState] = [self.state]
        for obs in observations[1:]:
            s = self.step(obs)
            history.append(s)

        return history
