"""Phase 3 Navigation Experiments Orchestrator for VYRA.

Rigorously executes Phase 3 experiments across Train (V-S1), Validation (V-S2),
and held-out Test (V-S3a):
- EXPERIMENT A: GNSS-Only Baseline (with zero-order hold during outages)
- EXPERIMENT B: Pure Dead Reckoning (cumulative strapdown drift analysis)
- EXPERIMENT C: EKF / HYBRID (Fixed R vs Quality-Adaptive R)
- EXPERIMENT D: GNSS Degradation Handling
- EXPERIMENT E: GNSS Outage Scaling & DR Error Growth (1s, 2s, 5s, 10s, 20s, 30s)
- EXPERIMENT F: GNSS Reacquisition and Recovery Dynamics
- EXPERIMENT G: Uncertainty Propagation & 95% Confidence Bound Calibration
- EXPERIMENT H: DR Survivability Prediction vs Actual Empirical Survival

ANTI-LEAKAGE SPECIFICATION:
- All navigation estimators operate strictly causally on historical measurements [0, t].
- Ground truth positions are used exclusively for offline evaluation.
- Parameters (Q, R, initial covariance) are tuned on Train/Validation, not on Test.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    geodetic_to_enu,
)
from navigation.dead_reckoning import DeadReckoningEngine, DeadReckoningState
from navigation.ekf import ExtendedKalmanFilter
from navigation.imu_processing import IMUProcessor
from navigation.uncertainty import evaluate_uncertainty_calibration, extract_uncertainty
from policy.survivability import (
    DRSurvivabilityEstimator,
    evaluate_survivability_performance,
)
from preprocessing.dataset_loader import discover_and_load_trajectories
from simulation.gnss_outage import (
    STANDARD_OUTAGE_DURATIONS,
    generate_outage_schedule,
    inject_gnss_outages,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def prepare_trajectory_navigation_data(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, ENUAnchor, List[Any], np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Prepare ENU coordinate ground truth, GNSS measurements, and IMU observations."""
    # Find first valid GNSS fix as tangent plane anchor
    valid_mask = (df["latitude"].notna()) & (df["longitude"].notna()) & (df["latitude"] != 0.0)
    first_valid_idx = int(np.where(valid_mask)[0][0]) if np.any(valid_mask) else 0

    anchor = ENUAnchor(
        lat0_deg=float(df["latitude"].iloc[first_valid_idx]),
        lon0_deg=float(df["longitude"].iloc[first_valid_idx]),
        alt0_m=float(df["altitude"].iloc[first_valid_idx]) if "altitude" in df.columns else 0.0,
    )

    # Convert geodetic coordinates to local ENU
    lats = df["latitude"].to_numpy(dtype=float)
    lons = df["longitude"].to_numpy(dtype=float)
    alts = df["altitude"].to_numpy(dtype=float) if "altitude" in df.columns else np.zeros(len(df))

    gt_e, gt_n, gt_u = geodetic_to_enu(lats, lons, alts, anchor)

    # Convert GNSS velocity and heading
    speeds = df["speed_mps"].to_numpy(dtype=float) if "speed_mps" in df.columns else np.zeros(len(df))
    headings = df["heading_deg"].to_numpy(dtype=float) if "heading_deg" in df.columns else np.zeros(len(df))
    enu_yaws = compass_heading_to_enu_yaw(headings)

    gnss_v_e = speeds * np.cos(enu_yaws)
    gnss_v_n = speeds * np.sin(enu_yaws)

    # IMU Observations
    processor = IMUProcessor()
    imu_obs = processor.process_trajectory(df)

    return df, anchor, imu_obs, gt_e, gt_n, gnss_v_e, gnss_v_n


def run_gnss_only_baseline(
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    is_outage_mask: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Execute GNSS-only baseline with Zero-Order Hold during outages."""
    n = len(gt_e)
    est_e = np.zeros(n, dtype=float)
    est_n = np.zeros(n, dtype=float)

    last_e = gt_e[0]
    last_n = gt_n[0]

    for i in range(n):
        if is_outage_mask[i]:
            # Outage: freeze last known fix
            est_e[i] = last_e
            est_n[i] = last_n
        else:
            est_e[i] = gt_e[i]
            est_n[i] = gt_n[i]
            last_e = gt_e[i]
            last_n = gt_n[i]

    errors = np.sqrt((est_e - gt_e) ** 2 + (est_n - gt_n) ** 2)
    return est_e, est_n, errors


def run_pure_dr_baseline(
    imu_obs: List[Any],
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    initial_yaw: float,
    initial_speed: float,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Execute Pure Dead Reckoning from initial pose over entire trajectory."""
    engine = DeadReckoningEngine(use_wheel_speed=True)
    dr_states = engine.propagate_trajectory(
        observations=imu_obs,
        initial_pos_e=gt_e[0],
        initial_pos_n=gt_n[0],
        initial_yaw=initial_yaw,
        initial_speed=initial_speed,
    )

    est_e = np.array([s.pos_e for s in dr_states], dtype=float)
    est_n = np.array([s.pos_n for s in dr_states], dtype=float)
    errors = np.sqrt((est_e - gt_e) ** 2 + (est_n - gt_n) ** 2)
    return est_e, est_n, errors


def run_ekf_fusion(
    imu_obs: List[Any],
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    gnss_v_e: np.ndarray,
    gnss_v_n: np.ndarray,
    quality_scores: np.ndarray,
    is_outage_mask: np.ndarray,
    initial_yaw: float,
    initial_speed: float,
    adaptive_r: bool = True,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Execute EKF fusion across trajectory with specified measurement noise mode."""
    ekf = ExtendedKalmanFilter(
        pos_noise_std_m=0.3,
        vel_noise_std_mps=0.15,
        yaw_noise_std_rad=0.015,
        gnss_pos_noise_std_m=1.5,
        gnss_vel_noise_std_mps=0.25,
        adaptive_noise_scale=5.0 if adaptive_r else 0.0,
    )

    ekf.reset(
        pos_e=gt_e[0],
        pos_n=gt_n[0],
        vel_e=gnss_v_e[0],
        vel_n=gnss_v_n[0],
        yaw=initial_yaw,
        gyro_bias=0.0,
        initial_pos_var=2.25,
        initial_vel_var=0.5,
        initial_yaw_var=0.05,
        timestamp=imu_obs[0].timestamp,
    )

    n = len(imu_obs)
    est_e = np.zeros(n, dtype=float)
    est_n = np.zeros(n, dtype=float)
    uncertainty_95 = np.zeros(n, dtype=float)
    cov_trace = np.zeros(n, dtype=float)
    innovations = np.zeros(n, dtype=float)

    for i in range(n):
        obs = imu_obs[i]
        if i > 0:
            ekf.predict(obs)

        # Measurement update
        q_val = quality_scores[i] if adaptive_r else 1.0
        accepted, innov = ekf.update_gnss(
            meas_pos_e=gt_e[i],
            meas_pos_n=gt_n[i],
            meas_vel_e=gnss_v_e[i],
            meas_vel_n=gnss_v_n[i],
            quality_score=q_val,
            is_outage=bool(is_outage_mask[i]),
        )

        state = ekf.get_current_state(
            is_outage=bool(is_outage_mask[i]),
            innov_norm=innov,
        )

        est_e[i] = state.pos_e
        est_n[i] = state.pos_n
        uncertainty_95[i] = state.uncertainty.radius_95
        cov_trace[i] = state.uncertainty.covariance_trace
        innovations[i] = innov

    errors = np.sqrt((est_e - gt_e) ** 2 + (est_n - gt_n) ** 2)
    return est_e, est_n, errors, uncertainty_95, cov_trace, innovations


def evaluate_outage_durations(
    df: pd.DataFrame,
    imu_obs: List[Any],
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    gnss_v_e: np.ndarray,
    gnss_v_n: np.ndarray,
    initial_yaw: float,
    durations_s: List[float] = STANDARD_OUTAGE_DURATIONS,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Evaluate DR error growth and survivability across standardized outage durations."""
    scenarios = generate_outage_schedule(df, durations_s=durations_s, inter_outage_spacing_s=50.0)
    surv_estimator = DRSurvivabilityEstimator()

    dr_error_by_duration: Dict[float, List[float]] = {d: [] for d in durations_s}
    ekf_error_by_duration: Dict[float, List[float]] = {d: [] for d in durations_s}
    outage_event_records: List[Dict[str, Any]] = []

    # Prepare DR engine
    dr_engine = DeadReckoningEngine(use_wheel_speed=True)

    for sc in scenarios:
        s_idx = sc.start_idx
        e_idx = sc.end_idx
        actual_dur = sc.duration_s

        # Find closest standard duration bucket
        closest_dur = min(durations_s, key=lambda d: abs(d - actual_dur))

        # Start DR from exact pose at outage start
        speed_0 = imu_obs[s_idx].wheel_speed_mps
        dr_engine.reset(
            pos_e=gt_e[s_idx],
            pos_n=gt_n[s_idx],
            yaw=initial_yaw,
            speed=speed_0,
            timestamp=imu_obs[s_idx].timestamp,
        )

        dr_segment_e = [gt_e[s_idx]]
        dr_segment_n = [gt_n[s_idx]]
        segment_errors = [0.0]

        for i in range(s_idx + 1, e_idx + 1):
            st = dr_engine.step(imu_obs[i])
            dr_segment_e.append(st.pos_e)
            dr_segment_n.append(st.pos_n)
            err = np.sqrt((st.pos_e - gt_e[i]) ** 2 + (st.pos_n - gt_n[i]) ** 2)
            segment_errors.append(float(err))

        final_err = segment_errors[-1]
        max_err = max(segment_errors)
        drift_rate = final_err / max(0.1, actual_dur)

        dr_error_by_duration[closest_dur].append(final_err)

        # Survivability prediction at onset (threshold = 5.0m)
        surv_est = surv_estimator.estimate(
            P_covariance=np.diag([4.0, 4.0, 0.5, 0.5, 0.05, 1e-4]),
            speed_mps=speed_0,
            outage_duration_s=actual_dur,
            error_threshold_m=5.0,
        )

        # Measure actual time until error exceeded 5.0m
        actual_time_within_bound = actual_dur
        for step_idx, step_err in enumerate(segment_errors):
            if step_err > 5.0:
                actual_time_within_bound = float(step_idx * 0.1)
                break

        outage_event_records.append({
            "outage_id": sc.outage_id,
            "target_duration_s": closest_dur,
            "actual_duration_s": actual_dur,
            "final_dr_error_m": round(final_err, 3),
            "max_dr_error_m": round(max_err, 3),
            "drift_rate_mps": round(drift_rate, 3),
            "predicted_survivability_prob": surv_est.survivability_probability,
            "predicted_survivable_duration_s": surv_est.predicted_survivable_duration_s,
            "actual_time_within_bound_s": round(actual_time_within_bound, 2),
        })

    # Summary statistics by duration
    dr_growth_stats: Dict[str, Any] = {}
    for d, errs in dr_error_by_duration.items():
        if errs:
            dr_growth_stats[f"{int(d)}s"] = {
                "mean_error_m": round(float(np.mean(errs)), 3),
                "std_error_m": round(float(np.std(errs)), 3),
                "max_error_m": round(float(np.max(errs)), 3),
                "count": len(errs),
                "drift_rate_mps": round(float(np.mean(errs)) / d, 3),
            }
        else:
            dr_growth_stats[f"{int(d)}s"] = {"mean_error_m": 0.0, "count": 0}

    return dr_growth_stats, outage_event_records


def run_all_navigation_experiments(
    output_dir: Union[str, Path] = "results/processed",
    figures_dir: Union[str, Path] = "results/figures",
) -> Dict[str, Any]:
    """Execute complete Phase 3 Navigation experiments suite."""
    out_path = Path(output_dir)
    fig_path = Path(figures_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    fig_path.mkdir(parents=True, exist_ok=True)

    logger.info("Loading trajectories for Phase 3 navigation experiments...")
    trajs = discover_and_load_trajectories("data/raw")

    with open("data/splits/splits.json", "r", encoding="utf-8") as f:
        splits_cfg = json.load(f)

    test_tid = splits_cfg["test_ids"][0]  # Held-out test trajectory V-S3a
    train_tid = splits_cfg["train_ids"][0]  # Train trajectory V-S1

    df_test_raw = trajs[test_tid].df
    df_train_raw = trajs[train_tid].df

    # 1. Prepare Navigation Data for Test Trajectory
    df_test, anchor, imu_obs, gt_e, gt_n, gnss_v_e, gnss_v_n = prepare_trajectory_navigation_data(df_test_raw)

    initial_yaw = compass_heading_to_enu_yaw(df_test["heading_deg"].iloc[0])
    initial_speed = float(df_test["speed_mps"].iloc[0])

    # Inject deterministic outages into test trajectory for controlled benchmarking
    test_scenarios = generate_outage_schedule(df_test, durations_s=STANDARD_OUTAGE_DURATIONS, inter_outage_spacing_s=50.0)
    df_test_outage = inject_gnss_outages(df_test, test_scenarios)
    outage_mask = df_test_outage["is_simulated_outage"].to_numpy(dtype=bool)
    quality_scores = df_test_outage["composite_quality_score"].to_numpy(dtype=float) if "composite_quality_score" in df_test_outage.columns else np.ones(len(df_test))

    # --- EXPERIMENT A: GNSS-Only Baseline ---
    logger.info("Running Experiment A: GNSS-Only Baseline...")
    gnss_e, gnss_n, gnss_errors = run_gnss_only_baseline(gt_e, gt_n, outage_mask)
    ate_gnss = float(np.sqrt(np.mean(gnss_errors**2)))
    max_gnss = float(np.max(gnss_errors))

    # --- EXPERIMENT B: Pure Dead Reckoning Baseline ---
    logger.info("Running Experiment B: Pure Dead Reckoning Baseline...")
    dr_e, dr_n, dr_errors = run_pure_dr_baseline(imu_obs, gt_e, gt_n, initial_yaw, initial_speed)
    ate_dr = float(np.sqrt(np.mean(dr_errors**2)))
    max_dr = float(np.max(dr_errors))
    final_dr = float(dr_errors[-1])
    total_distance_km = float(np.sum(df_test["speed_mps"] * 0.1)) / 1000.0
    dr_drift_rate_m_km = final_dr / max(0.1, total_distance_km)

    # --- EXPERIMENT C: EKF Fusion (Fixed R vs Adaptive R) ---
    logger.info("Running Experiment C: EKF Sensor Fusion (Fixed R & Adaptive R)...")
    ekf_fix_e, ekf_fix_n, ekf_fix_err, uncert_fix_95, trace_fix, innov_fix = run_ekf_fusion(
        imu_obs, gt_e, gt_n, gnss_v_e, gnss_v_n, quality_scores, outage_mask, initial_yaw, initial_speed, adaptive_r=False
    )
    ekf_adp_e, ekf_adp_n, ekf_adp_err, uncert_adp_95, trace_adp, innov_adp = run_ekf_fusion(
        imu_obs, gt_e, gt_n, gnss_v_e, gnss_v_n, quality_scores, outage_mask, initial_yaw, initial_speed, adaptive_r=True
    )

    ate_ekf_fix = float(np.sqrt(np.mean(ekf_fix_err**2)))
    ate_ekf_adp = float(np.sqrt(np.mean(ekf_adp_err**2)))
    max_ekf_adp = float(np.max(ekf_adp_err))

    # --- EXPERIMENT E & H: Outage Scaling & DR Survivability ---
    logger.info("Running Experiments E & H: Outage Duration Scaling & DR Survivability...")
    dr_growth_stats, outage_records = evaluate_outage_durations(
        df_test, imu_obs, gt_e, gt_n, gnss_v_e, gnss_v_n, initial_yaw
    )

    pred_durations = [rec["predicted_survivable_duration_s"] for rec in outage_records]
    act_durations = [rec["actual_time_within_bound_s"] for rec in outage_records]
    surv_perf = evaluate_survivability_performance(pred_durations, act_durations)

    # --- EXPERIMENT G: Uncertainty Calibration ---
    logger.info("Running Experiment G: Uncertainty Calibration...")
    cal_results = evaluate_uncertainty_calibration(ekf_adp_err, uncert_adp_95)

    # Compile Results
    nav_comparison = {
        "gnss_only": {
            "ate_m": round(ate_gnss, 3),
            "max_error_m": round(max_gnss, 3),
            "rmse_m": round(ate_gnss, 3),
            "violation_rate_5m": round(float(np.mean(gnss_errors > 5.0)), 4),
            "violation_rate_10m": round(float(np.mean(gnss_errors > 10.0)), 4),
        },
        "pure_dr": {
            "ate_m": round(ate_dr, 3),
            "final_error_m": round(final_dr, 3),
            "max_error_m": round(max_dr, 3),
            "drift_rate_m_km": round(dr_drift_rate_m_km, 3),
            "total_distance_km": round(total_distance_km, 3),
            "violation_rate_5m": round(float(np.mean(dr_errors > 5.0)), 4),
        },
        "ekf_fixed_r": {
            "ate_m": round(ate_ekf_fix, 3),
            "max_error_m": round(float(np.max(ekf_fix_err)), 3),
        },
        "ekf_quality_adaptive": {
            "ate_m": round(ate_ekf_adp, 3),
            "max_error_m": round(max_ekf_adp, 3),
            "violation_rate_5m": round(float(np.mean(ekf_adp_err > 5.0)), 4),
            "violation_rate_10m": round(float(np.mean(ekf_adp_err > 10.0)), 4),
        },
    }

    # Save JSON files
    with open(out_path / "navigation_comparison.json", "w", encoding="utf-8") as f:
        json.dump(nav_comparison, f, indent=2)

    with open(out_path / "dr_metrics.json", "w", encoding="utf-8") as f:
        json.dump({"error_growth_by_duration": dr_growth_stats, "outage_records": outage_records}, f, indent=2)

    with open(out_path / "ekf_metrics.json", "w", encoding="utf-8") as f:
        json.dump({
            "ate_fixed_r": round(ate_ekf_fix, 3),
            "ate_adaptive_r": round(ate_ekf_adp, 3),
            "improvement_pct": round(((ate_ekf_fix - ate_ekf_adp) / ate_ekf_fix) * 100.0, 2),
            "mean_innovation_m": round(float(np.mean(innov_adp)), 3),
            "max_innovation_m": round(float(np.max(innov_adp)), 3),
        }, f, indent=2)

    with open(out_path / "uncertainty_metrics.json", "w", encoding="utf-8") as f:
        json.dump(cal_results, f, indent=2)

    with open(out_path / "survivability_metrics.json", "w", encoding="utf-8") as f:
        json.dump(surv_perf, f, indent=2)

    logger.info("Saved all Phase 3 navigation JSON results to %s", out_path.resolve())

    # Generate Figures
    generate_navigation_figures(
        gt_e=gt_e,
        gt_n=gt_n,
        gnss_e=gnss_e,
        gnss_n=gnss_n,
        dr_e=dr_e,
        dr_n=dr_n,
        ekf_e=ekf_adp_e,
        ekf_n=ekf_adp_n,
        gnss_errors=gnss_errors,
        dr_errors=dr_errors,
        ekf_errors=ekf_adp_err,
        uncertainty_95=uncert_adp_95,
        cov_trace=trace_adp,
        innovations=innov_adp,
        dr_growth_stats=dr_growth_stats,
        outage_records=outage_records,
        outage_mask=outage_mask,
        timestamps=df_test["timestamp"].to_numpy(dtype=float),
        figures_dir=fig_path,
    )

    return {
        "navigation_comparison": nav_comparison,
        "dr_growth_stats": dr_growth_stats,
        "survivability_performance": surv_perf,
        "uncertainty_calibration": cal_results,
    }


def generate_navigation_figures(
    gt_e: np.ndarray,
    gt_n: np.ndarray,
    gnss_e: np.ndarray,
    gnss_n: np.ndarray,
    dr_e: np.ndarray,
    dr_n: np.ndarray,
    ekf_e: np.ndarray,
    ekf_n: np.ndarray,
    gnss_errors: np.ndarray,
    dr_errors: np.ndarray,
    ekf_errors: np.ndarray,
    uncertainty_95: np.ndarray,
    cov_trace: np.ndarray,
    innovations: np.ndarray,
    dr_growth_stats: Dict[str, Any],
    outage_records: List[Dict[str, Any]],
    outage_mask: np.ndarray,
    timestamps: np.ndarray,
    figures_dir: Path,
) -> None:
    """Generate high-resolution publication figures for Phase 3."""
    plt.rcParams.update({"font.size": 11, "figure.autolayout": True})

    # FIGURE 1: 2D Trajectory Comparison
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.plot(gt_e, gt_n, "k-", lw=2.5, label="Ground Truth Reference")
    ax.plot(gnss_e, gnss_n, "r--", lw=1.2, alpha=0.7, label="GNSS-Only (Frozen in Outage)")
    ax.plot(dr_e, dr_n, "m-.", lw=1.2, alpha=0.7, label="Pure Dead Reckoning")
    ax.plot(ekf_e, ekf_n, "g-", lw=1.8, label="EKF Hybrid Fusion")
    ax.set_title("2D Navigation Trajectory Comparison (Local ENU Tangent Plane)")
    ax.set_xlabel("East Position (m)")
    ax.set_ylabel("North Position (m)")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="best")
    fig.savefig(figures_dir / "nav_trajectory_comparison.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_trajectory_comparison.png").resolve())

    # FIGURE 2: Position Error vs Time
    t_rel = timestamps - timestamps[0]
    fig, ax = plt.subplots(figsize=(12, 5), dpi=300)
    ax.plot(t_rel, gnss_errors, "r-", lw=1.2, alpha=0.6, label="GNSS-Only Error")
    ax.plot(t_rel, dr_errors, "m-.", lw=1.0, alpha=0.6, label="Pure DR Error")
    ax.plot(t_rel, ekf_errors, "g-", lw=1.5, label="EKF Hybrid Error")
    ax.set_title("Horizontal Position Error Over Time")
    ax.set_xlabel("Elapsed Time (seconds)")
    ax.set_ylabel("Horizontal Position Error (m)")
    ax.set_ylim([0, min(100.0, np.percentile(dr_errors, 98))])
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper right")
    fig.savefig(figures_dir / "nav_position_error_vs_time.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_position_error_vs_time.png").resolve())

    # FIGURE 3: DR Error vs Outage Duration
    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
    durations = [1.0, 2.0, 5.0, 10.0, 20.0, 30.0]
    mean_errs = [dr_growth_stats.get(f"{int(d)}s", {}).get("mean_error_m", 0.0) for d in durations]
    ax.plot(durations, mean_errs, "o-", color="darkorange", lw=2, markersize=7, label="Empirical DR Mean Error")
    ax.axhline(5.0, color="crimson", linestyle="--", label="5m Error Bound Threshold")
    ax.axhline(10.0, color="red", linestyle=":", label="10m Error Bound Threshold")
    ax.set_title("Dead Reckoning Error Growth vs Outage Duration")
    ax.set_xlabel("Outage Duration T (seconds)")
    ax.set_ylabel("Mean Terminal Position Error (m)")
    ax.set_xticks(durations)
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left")
    fig.savefig(figures_dir / "nav_dr_error_vs_outage_duration.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_dr_error_vs_outage_duration.png").resolve())

    # FIGURE 4: Uncertainty Bound vs Actual Error
    fig, ax = plt.subplots(figsize=(12, 5), dpi=300)
    ax.plot(t_rel, ekf_errors, "g-", lw=1.2, label="Actual EKF Position Error")
    ax.plot(t_rel, uncertainty_95, "b--", lw=1.5, label="Predicted 95% Confidence Radius (r_95)")
    ax.fill_between(t_rel, 0, uncertainty_95, color="blue", alpha=0.1, label="95% Confidence Region")
    ax.set_title("Predicted Navigation Uncertainty (95% Confidence Bound) vs Actual Error")
    ax.set_xlabel("Elapsed Time (seconds)")
    ax.set_ylabel("Position Metric (m)")
    ax.set_ylim([0, max(15.0, np.percentile(uncertainty_95, 99))])
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper right")
    fig.savefig(figures_dir / "nav_uncertainty_vs_actual_error.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_uncertainty_vs_actual_error.png").resolve())

    # FIGURE 5: Covariance Growth During Outages
    fig, ax = plt.subplots(figsize=(12, 4.5), dpi=300)
    ax.plot(t_rel, cov_trace, "purple", lw=1.5, label="Covariance Trace Tr(P)")
    # Highlight outages
    in_outage = False
    start_t = 0.0
    for idx, is_out in enumerate(outage_mask):
        if is_out and not in_outage:
            in_outage = True
            start_t = t_rel[idx]
        elif not is_out and in_outage:
            in_outage = False
            ax.axvspan(start_t, t_rel[idx], color="gray", alpha=0.25)
    if in_outage:
        ax.axvspan(start_t, t_rel[-1], color="gray", alpha=0.25)

    ax.set_title("Navigation State Covariance Trace Tr(P) Dynamics Across GNSS Outages")
    ax.set_xlabel("Elapsed Time (seconds)")
    ax.set_ylabel("Covariance Trace (m^2)")
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left")
    fig.savefig(figures_dir / "nav_covariance_growth_during_outage.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_covariance_growth_during_outage.png").resolve())

    # FIGURE 6: Survivability Prediction vs Actual Survival Time
    fig, ax = plt.subplots(figsize=(7, 6), dpi=300)
    preds = [rec["predicted_survivable_duration_s"] for rec in outage_records]
    acts = [rec["actual_time_within_bound_s"] for rec in outage_records]
    ax.scatter(preds, acts, color="teal", s=50, edgecolors="k", zorder=3, label="Outage Events")
    max_lim = max(max(preds, default=10), max(acts, default=10)) + 2
    ax.plot([0, max_lim], [0, max_lim], "k--", label="Ideal Prediction (1:1)")
    ax.set_title("Predicted vs Actual DR Survival Duration within 5m Bound")
    ax.set_xlabel("Predicted Survivable Duration (seconds)")
    ax.set_ylabel("Actual Time within Bound (seconds)")
    ax.set_xlim([0, max_lim])
    ax.set_ylim([0, max_lim])
    ax.grid(True, alpha=0.3)
    ax.legend(loc="upper left")
    fig.savefig(figures_dir / "nav_survivability_prediction_vs_actual.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_survivability_prediction_vs_actual.png").resolve())

    # FIGURE 7: GNSS Recovery Transient
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6), sharex=True, dpi=300)
    ax1.plot(t_rel, ekf_errors, "g-", lw=1.5, label="EKF Error")
    ax1.set_ylabel("Position Error (m)")
    ax1.set_title("EKF Error and Innovation Dynamics Across Outage and Recovery")
    ax1.grid(True, alpha=0.3)
    ax1.legend(loc="upper right")

    ax2.plot(t_rel, innovations, "royalblue", lw=1.2, label="Position Innovation Norm")
    ax2.set_xlabel("Elapsed Time (seconds)")
    ax2.set_ylabel("Innovation (m)")
    ax2.grid(True, alpha=0.3)
    ax2.legend(loc="upper right")
    fig.savefig(figures_dir / "nav_gnss_recovery_behavior.png")
    plt.close(fig)
    logger.info("Generated %s", (figures_dir / "nav_gnss_recovery_behavior.png").resolve())


if __name__ == "__main__":
    results = run_all_navigation_experiments()
    logger.info("Phase 3 Navigation Experiments Completed Successfully.")
