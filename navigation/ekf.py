"""Extended Kalman Filter (EKF) Fusion Engine for VYRA.

Implements loosely-coupled 6-state EKF fusing inertial dead reckoning propagation
with GNSS position and velocity innovation updates:
State Vector:
  x = [p_E, p_N, v_E, v_N, theta, b_g]^T ∈ R^6
where:
  p_E, p_N: East and North position (meters)
  v_E, v_N: East and North velocity (m/s)
  theta: ENU yaw angle (radians, counter-clockwise from East)
  b_g: Gyroscope yaw rate bias (rad/s)

Key Features:
- IMU Kinematic Prediction Step using wheel speed odometry and yaw rate.
- Quality-Adaptive GNSS Measurement Covariance R_k conditioned on Phase 2 Q_t.
- Normalized Innovation Squared (NIS) Chi-Square outlier gating.
- Full covariance P_k propagation with Joseph-form covariance updates.
- Graceful degradation and outage bridging (pure DR propagation when GNSS lost).

ANTI-LEAKAGE SPECIFICATION:
All state estimates and covariance updates at epoch k strictly depend on
causal observations from epochs <= k. Future measurements are NEVER accessed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import numpy as np

from navigation.coordinate_frames import wrap_angle_pi
from navigation.imu_processing import IMUObservation
from navigation.uncertainty import NavigationUncertainty, extract_uncertainty

logger = logging.getLogger(__name__)

# Chi-Square 99% threshold for 4 degrees of freedom (p_E, p_N, v_E, v_N)
NIS_GATE_CHI2_4DOF_99: float = 13.2767


@dataclass
class EKFState:
    """Estimated state, covariance, and operational flags at epoch t."""

    timestamp: float
    pos_e: float
    pos_n: float
    vel_e: float
    vel_n: float
    yaw: float
    gyro_bias: float
    covariance: np.ndarray
    uncertainty: NavigationUncertainty
    is_outage: bool
    is_degraded: bool
    gnss_gated: bool
    innovation_norm: float


class ExtendedKalmanFilter:
    """Loosely-coupled 6-DOF Extended Kalman Filter for GNSS/IMU navigation."""

    def __init__(
        self,
        pos_noise_std_m: float = 0.5,
        vel_noise_std_mps: float = 0.2,
        yaw_noise_std_rad: float = 0.02,
        gyro_bias_noise_std: float = 1e-4,
        gnss_pos_noise_std_m: float = 2.0,
        gnss_vel_noise_std_mps: float = 0.3,
        adaptive_noise_scale: float = 5.0,
        enable_nis_gating: bool = True,
        nis_gate_threshold: float = NIS_GATE_CHI2_4DOF_99,
    ) -> None:
        self.state_dim: int = 6
        self.meas_dim: int = 4

        self.adaptive_noise_scale = adaptive_noise_scale
        self.enable_nis_gating = enable_nis_gating
        self.nis_gate_threshold = nis_gate_threshold

        # Process Noise Matrix Q
        self.Q = np.zeros((6, 6), dtype=float)
        self.Q[0, 0] = pos_noise_std_m**2
        self.Q[1, 1] = pos_noise_std_m**2
        self.Q[2, 2] = vel_noise_std_mps**2
        self.Q[3, 3] = vel_noise_std_mps**2
        self.Q[4, 4] = yaw_noise_std_rad**2
        self.Q[5, 5] = gyro_bias_noise_std**2

        # Nominal Measurement Noise Matrix R_nominal
        self.R_nominal = np.zeros((4, 4), dtype=float)
        self.R_nominal[0, 0] = gnss_pos_noise_std_m**2
        self.R_nominal[1, 1] = gnss_pos_noise_std_m**2
        self.R_nominal[2, 2] = gnss_vel_noise_std_mps**2
        self.R_nominal[3, 3] = gnss_vel_noise_std_mps**2

        # State Vector x and Covariance P
        self.x = np.zeros(6, dtype=float)
        self.P = np.eye(6, dtype=float)
        self.timestamp: float = 0.0
        self.is_initialized: bool = False

    def reset(
        self,
        pos_e: float = 0.0,
        pos_n: float = 0.0,
        vel_e: float = 0.0,
        vel_n: float = 0.0,
        yaw: float = 0.0,
        gyro_bias: float = 0.0,
        initial_pos_var: float = 4.0,
        initial_vel_var: float = 1.0,
        initial_yaw_var: float = 0.1,
        initial_bias_var: float = 1e-4,
        timestamp: float = 0.0,
    ) -> None:
        """Reset state vector and initialize covariance."""
        self.x = np.array([pos_e, pos_n, vel_e, vel_n, wrap_angle_pi(yaw), gyro_bias], dtype=float)
        self.P = np.zeros((6, 6), dtype=float)
        self.P[0, 0] = initial_pos_var
        self.P[1, 1] = initial_pos_var
        self.P[2, 2] = initial_vel_var
        self.P[3, 3] = initial_vel_var
        self.P[4, 4] = initial_yaw_var
        self.P[5, 5] = initial_bias_var
        self.timestamp = float(timestamp)
        self.is_initialized = True

    def predict(self, obs: IMUObservation) -> None:
        """Propagate state and covariance forward using causal IMU/odometry."""
        if not self.is_initialized:
            raise RuntimeError("ExtendedKalmanFilter must be initialized before predict().")

        dt = obs.dt
        prev_yaw = self.x[4]
        prev_bias = self.x[5]

        # 1. Propagate un-biased yaw
        unbiased_gyro = obs.yaw_rate_rad_s - prev_bias
        new_yaw = wrap_angle_pi(prev_yaw + unbiased_gyro * dt)

        # 2. Forward speed from wheel odometry
        speed = 0.0 if obs.is_stationary else obs.wheel_speed_mps

        # 3. Velocity in ENU frame
        new_vel_e = speed * np.cos(new_yaw)
        new_vel_n = speed * np.sin(new_yaw)

        # 4. Position update
        new_pos_e = self.x[0] + new_vel_e * dt
        new_pos_n = self.x[1] + new_vel_n * dt

        # Update state vector
        self.x[0] = new_pos_e
        self.x[1] = new_pos_n
        self.x[2] = new_vel_e
        self.x[3] = new_vel_n
        self.x[4] = new_yaw
        # Gyro bias follows random walk (x[5] stays same)
        self.timestamp = obs.timestamp

        # 5. Linearized Process Jacobian F_k
        F = np.eye(6, dtype=float)
        F[0, 2] = dt
        F[1, 3] = dt
        # d(v_E)/d(theta) = -speed * sin(new_yaw)
        F[2, 4] = -speed * np.sin(new_yaw)
        F[2, 5] = -speed * np.sin(new_yaw) * (-dt)
        # d(v_N)/d(theta) = speed * cos(new_yaw)
        F[3, 4] = speed * np.cos(new_yaw)
        F[3, 5] = speed * np.cos(new_yaw) * (-dt)
        # d(theta)/d(b_g) = -dt
        F[4, 5] = -dt

        # 6. Propagate Covariance: P = F * P * F^T + Q * dt
        self.P = F @ self.P @ F.T + self.Q * dt
        # Ensure symmetry
        self.P = 0.5 * (self.P + self.P.T)

    def update_gnss(
        self,
        meas_pos_e: float,
        meas_pos_n: float,
        meas_vel_e: float,
        meas_vel_n: float,
        quality_score: float = 1.0,
        is_outage: bool = False,
    ) -> Tuple[bool, float]:
        """Perform GNSS measurement update with quality-adaptive R and NIS gating.

        Returns:
            Tuple of (update_accepted: bool, innovation_norm: float).
        """
        if is_outage or quality_score <= 0.01:
            # Outage: skip update, continue DR propagation
            return False, 0.0

        # Quality-Adaptive Covariance Inflation
        # When quality drops, inflate R proportionally
        inflation = 1.0 + self.adaptive_noise_scale * (
            (1.0 - quality_score) / max(0.01, quality_score)
        )
        R_k = self.R_nominal * inflation

        # Observation matrix H = [I_4x4 | 0_4x2]
        H = np.zeros((4, 6), dtype=float)
        H[0, 0] = 1.0
        H[1, 1] = 1.0
        H[2, 2] = 1.0
        H[3, 3] = 1.0

        z = np.array([meas_pos_e, meas_pos_n, meas_vel_e, meas_vel_n], dtype=float)
        z_pred = H @ self.x
        innovation = z - z_pred
        innov_norm = float(np.linalg.norm(innovation[:2]))

        # Innovation Covariance S_k = H * P * H^T + R_k
        S_k = H @ self.P @ H.T + R_k

        # Normalized Innovation Squared (NIS) Gating
        try:
            S_inv = np.linalg.inv(S_k)
        except np.linalg.LinAlgError:
            logger.warning("Singular innovation covariance S_k; skipping update.")
            return False, innov_norm

        nis = float(innovation @ S_inv @ innovation)
        if self.enable_nis_gating and nis > self.nis_gate_threshold:
            # Gated outlier
            return False, innov_norm

        # Kalman Gain K_k = P * H^T * S_k^-1
        K = self.P @ H.T @ S_inv

        # State Correction
        self.x = self.x + K @ innovation
        self.x[4] = wrap_angle_pi(self.x[4])

        # Joseph Form Covariance Update: P = (I - KH) P (I - KH)^T + K R K^T
        I_KH = np.eye(6, dtype=float) - K @ H
        self.P = I_KH @ self.P @ I_KH.T + K @ R_k @ K.T
        self.P = 0.5 * (self.P + self.P.T)

        return True, innov_norm

    def get_current_state(
        self,
        is_outage: bool = False,
        is_degraded: bool = False,
        gnss_gated: bool = False,
        innov_norm: float = 0.0,
    ) -> EKFState:
        """Snapshot current state, covariance, and uncertainty metrics."""
        unc = extract_uncertainty(self.P)
        return EKFState(
            timestamp=float(self.timestamp),
            pos_e=float(self.x[0]),
            pos_n=float(self.x[1]),
            vel_e=float(self.x[2]),
            vel_n=float(self.x[3]),
            yaw=float(self.x[4]),
            gyro_bias=float(self.x[5]),
            covariance=self.P.copy(),
            uncertainty=unc,
            is_outage=bool(is_outage),
            is_degraded=bool(is_degraded),
            gnss_gated=bool(gnss_gated),
            innovation_norm=float(innov_norm),
        )
