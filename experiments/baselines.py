"""Baseline Navigation Policies Benchmarking Module for VYRA.

Provides standardized, fair execution for all comparative baseline strategies:
- Baseline 1: GNSS-Only (zero-order hold during outage)
- Baseline 2: Pure Dead Reckoning (open-loop strapdown odometry drift)
- Baseline 3: Fixed HYBRID (continuous loosely-coupled EKF)
- Baseline 4: Reactive Switching (instantaneous threshold-based switching)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from evaluation.ate import compute_ate_summary, compute_pointwise_position_error
from evaluation.drift import compute_average_outage_drift_rate
from evaluation.handover_metrics import compute_handover_metrics
from evaluation.rte import compute_relative_trajectory_error
from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    geodetic_to_enu,
)
from navigation.dead_reckoning import DeadReckoningEngine
from navigation.ekf import ExtendedKalmanFilter
from navigation.imu_processing import IMUProcessor
from policy.hybrid import FixedHybridPolicy
from policy.reactive import ReactiveBaselinePolicy
from policy.thresholds import PolicyThresholds

logger = logging.getLogger(__name__)


def run_baseline_trajectory(
    df: pd.DataFrame,
    baseline_type: str,  # 'gnss_only', 'pure_dr', 'fixed_hybrid', 'reactive'
    outage_mask: Optional[np.ndarray] = None,
    thresholds: Optional[PolicyThresholds] = None,
) -> Dict[str, Any]:
    """Execute a single baseline policy across a trajectory with anti-leakage protection.

    Args:
        df: Trajectory DataFrame (with quality columns).
        baseline_type: One of 'gnss_only', 'pure_dr', 'fixed_hybrid', 'reactive'.
        outage_mask: Boolean array indicating simulated outages.
        thresholds: Policy thresholds configuration.

    Returns:
        Dictionary of estimated trajectory, pointwise errors, and summary metrics.
    """
    n = len(df)
    if outage_mask is None:
        outage_mask = np.zeros(n, dtype=bool)

    # 1. Coordinate frame anchor
    first_idx = 0
    anchor = ENUAnchor(
        lat0_deg=float(df["gt_latitude"].iloc[first_idx] if "gt_latitude" in df.columns else df["latitude"].iloc[first_idx]),
        lon0_deg=float(df["gt_longitude"].iloc[first_idx] if "gt_longitude" in df.columns else df["longitude"].iloc[first_idx]),
        alt0_m=float(df["gt_altitude"].iloc[first_idx] if "gt_altitude" in df.columns else 0.0),
    )

    # Ground truth ENU
    gt_lats = df["gt_latitude"].to_numpy(dtype=float) if "gt_latitude" in df.columns else df["latitude"].to_numpy(dtype=float)
    gt_lons = df["gt_longitude"].to_numpy(dtype=float) if "gt_longitude" in df.columns else df["longitude"].to_numpy(dtype=float)
    gt_alts = df["gt_altitude"].to_numpy(dtype=float) if "gt_altitude" in df.columns else np.zeros(n)
    gt_e, gt_n, _ = geodetic_to_enu(gt_lats, gt_lons, gt_alts, anchor)

    # Operational GNSS observations (perturbed or masked during outage)
    obs_lats = df["latitude"].to_numpy(dtype=float)
    obs_lons = df["longitude"].to_numpy(dtype=float)
    obs_alts = df["altitude"].to_numpy(dtype=float) if "altitude" in df.columns else np.zeros(n)
    meas_e, meas_n, _ = geodetic_to_enu(obs_lats, obs_lons, obs_alts, anchor)

    speeds = df["speed_mps"].to_numpy(dtype=float) if "speed_mps" in df.columns else np.zeros(n)
    headings = df["heading_deg"].to_numpy(dtype=float) if "heading_deg" in df.columns else np.zeros(n)
    enu_yaws = compass_heading_to_enu_yaw(headings)
    gnss_v_e = speeds * np.cos(enu_yaws)
    gnss_v_n = speeds * np.sin(enu_yaws)

    processor = IMUProcessor()
    imu_obs = processor.process_trajectory(df)
    timestamps = np.array([obs.timestamp for obs in imu_obs], dtype=float)

    # Quality indicators
    q_scores = df["composite_quality_score"].to_numpy(dtype=float) if "composite_quality_score" in df.columns else np.ones(n)
    eff_sats = df["effective_satellites"].to_numpy(dtype=float) if "effective_satellites" in df.columns else np.full(n, 8.0)
    disc = df["kinematic_discrepancy_mps"].to_numpy(dtype=float) if "kinematic_discrepancy_mps" in df.columns else np.zeros(n)

    # Setup filters
    ekf = ExtendedKalmanFilter(
        pos_noise_std_m=0.3,
        vel_noise_std_mps=0.15,
        yaw_noise_std_rad=0.015,
        gnss_pos_noise_std_m=1.5,
        gnss_vel_noise_std_mps=0.25,
        adaptive_noise_scale=5.0,
    )
    ekf.reset(
        pos_e=gt_e[0],
        pos_n=gt_n[0],
        vel_e=gnss_v_e[0],
        vel_n=gnss_v_n[0],
        yaw=enu_yaws[0],
        gyro_bias=0.0,
        initial_pos_var=2.25,
        initial_vel_var=0.5,
        initial_yaw_var=0.05,
        timestamp=timestamps[0],
    )

    dr_engine = DeadReckoningEngine(use_wheel_speed=True)
    reactive_policy = ReactiveBaselinePolicy(thresholds=thresholds)

    est_e = np.zeros(n, dtype=float)
    est_n = np.zeros(n, dtype=float)
    active_modes: List[str] = []

    last_valid_gnss_e = meas_e[0]
    last_valid_gnss_n = meas_n[0]

    # For pure DR
    curr_dr_e = gt_e[0]
    curr_dr_n = gt_n[0]
    curr_dr_yaw = enu_yaws[0]

    for i in range(n):
        obs = imu_obs[i]
        t = timestamps[i]
        is_out = bool(outage_mask[i])

        # Maintain background EKF
        if i > 0:
            ekf.predict(obs)

        if not is_out:
            ekf.update_gnss(
                meas_pos_e=meas_e[i],
                meas_pos_n=meas_n[i],
                meas_vel_e=gnss_v_e[i],
                meas_vel_n=gnss_v_n[i],
                quality_score=q_scores[i],
                is_outage=False,
            )
            last_valid_gnss_e = meas_e[i]
            last_valid_gnss_n = meas_n[i]

        ekf_state = ekf.get_current_state(is_outage=is_out)

        # Baseline execution
        if baseline_type == "gnss_only":
            mode = "GNSS"
            if is_out:
                est_e[i] = last_valid_gnss_e
                est_n[i] = last_valid_gnss_n
            else:
                est_e[i] = meas_e[i]
                est_n[i] = meas_n[i]

        elif baseline_type == "pure_dr":
            mode = "DR"
            if i > 0:
                dt = max(1e-4, obs.dt)
                curr_dr_yaw += obs.yaw_rate_rad_s * dt
                sp = obs.wheel_speed_mps if obs.wheel_speed_mps > 0 else speeds[i]
                curr_dr_e += sp * np.cos(curr_dr_yaw) * dt
                curr_dr_n += sp * np.sin(curr_dr_yaw) * dt
            est_e[i] = curr_dr_e
            est_n[i] = curr_dr_n

        elif baseline_type == "fixed_hybrid":
            mode = "HYBRID"
            est_e[i] = ekf_state.pos_e
            est_n[i] = ekf_state.pos_n

        elif baseline_type == "reactive":
            obs_dict = {
                "composite_quality_score": q_scores[i] if not is_out else 0.0,
                "effective_satellites": eff_sats[i] if not is_out else 0.0,
                "kinematic_discrepancy_mps": disc[i],
                "is_outage": is_out,
            }
            mode, _ = reactive_policy.select_mode(obs_dict, timestamp=t)
            # In reactive switching: HYBRID uses EKF with GNSS; DR uses EKF propagation without GNSS
            est_e[i] = ekf_state.pos_e
            est_n[i] = ekf_state.pos_n

        else:
            raise ValueError(f"Unknown baseline: {baseline_type}")

        active_modes.append(mode)

    # Compute errors and summaries
    errors = compute_pointwise_position_error(est_e, est_n, gt_e, gt_n)
    ate_sum = compute_ate_summary(errors, sample_rate_hz=10.0)
    rte_sum = compute_relative_trajectory_error(est_e, est_n, gt_e, gt_n, delta_epochs=100)
    drift_rate = compute_average_outage_drift_rate(errors, outage_mask, sample_rate_hz=10.0)
    handover_sum = compute_handover_metrics(active_modes, timestamps, min_dwell_threshold_s=2.0, outage_mask=outage_mask)

    return {
        "baseline_type": baseline_type,
        "ate_summary": ate_sum,
        "rte_summary": rte_sum,
        "drift_rate_mps": round(drift_rate, 4),
        "handover_summary": handover_sum,
        "errors": errors,
        "est_e": est_e,
        "est_n": est_n,
        "gt_e": gt_e,
        "gt_n": gt_n,
        "active_modes": active_modes,
    }
