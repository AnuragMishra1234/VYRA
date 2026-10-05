"""Phase 4 Navigation Policy Experiments Orchestrator for VYRA.

Rigorously executes closed-loop comparative policy experiments across held-out Test (V-S3a):
1. Evaluates all 5 specified navigation policies:
   - Policy 1: GNSS-Only Baseline (zero-order hold during outage)
   - Policy 2: Pure Dead Reckoning Baseline (open-loop strapdown drift)
   - Policy 3: Fixed HYBRID Baseline (continuous loosely coupled EKF)
   - Policy 4: Reactive Baseline Policy (instantaneous threshold-based switching)
   - Policy 5: VYRA Forecast-Driven Adaptive Policy (short-horizon action-conditioned risk)
2. Scenarios Evaluated:
   - Scenario 1: Nominal Real-World Operation (authentic CAN/GNSS dynamics)
   - Scenario 2: Simulated GNSS Outage / Jamming Injections (T in {2s, 5s, 10s, 20s, 30s})
3. Policy Stability & Switching Analysis:
   - Total handovers, chattering rate, unnecessary switches, mean dwell time.
4. Policy Ablations:
   - Dwell time ablation (tau_dwell = 0 vs 2.0s)
   - Switching penalty ablation (lambda_switch = 0 vs 1.0m)
   - Risk weight Pareto analysis (beta in {0.5, 1.0, 2.0, 5.0})
5. Produces publication-quality figures and JSON result artifacts.

ANTI-LEAKAGE SPECIFICATION:
All policies operate in strict temporal sequence. At epoch t, only observations and forecasts
up to time t are accessible. Future measurements are strictly withheld.
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

from forecasting.action_conditioning import ACTION_NAMES
from forecasting.features import ForecastingFeatureExtractor
from forecasting.models import XGBoostForecastModel
from gnss.quality import compute_gnss_quality
from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    geodetic_to_enu,
)
from navigation.dead_reckoning import DeadReckoningEngine
from navigation.ekf import ExtendedKalmanFilter
from navigation.imu_processing import IMUProcessor
from policy.adaptive import VYRAAdaptivePolicy
from policy.hybrid import FixedHybridPolicy
from policy.reactive import ReactiveBaselinePolicy
from policy.survivability import DRSurvivabilityEstimator
from policy.thresholds import PolicyThresholds
from preprocessing.dataset_loader import discover_and_load_trajectories
from simulation.gnss_outage import generate_outage_schedule, inject_gnss_outages

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def run_closed_loop_policy_simulation(
    df: pd.DataFrame,
    policy: Any,
    forecast_model: Optional[Any] = None,
    outage_mask: Optional[np.ndarray] = None,
    policy_name: str = "policy",
) -> Dict[str, Any]:
    """Execute closed-loop trajectory simulation for a candidate navigation policy.

    Args:
        df: Trajectory DataFrame (with quality metrics precomputed).
        policy: Instantiated policy object.
        forecast_model: Pre-trained action-conditioned forecast model (required for VYRA).
        outage_mask: Optional boolean mask indicating injected GNSS outages.
        policy_name: Identifier for the policy.

    Returns:
        Dictionary of navigation errors, state trajectories, switching events, and summary metrics.
    """
    n = len(df)
    if outage_mask is None:
        outage_mask = np.zeros(n, dtype=bool)

    # 1. Setup Ground Truth & Sensor Observations
    valid_mask = (df["latitude"].notna()) & (df["longitude"].notna()) & (df["latitude"] != 0.0)
    first_idx = int(np.where(valid_mask)[0][0]) if np.any(valid_mask) else 0

    anchor = ENUAnchor(
        lat0_deg=float(df["latitude"].iloc[first_idx]),
        lon0_deg=float(df["longitude"].iloc[first_idx]),
        alt0_m=float(df["altitude"].iloc[first_idx]) if "altitude" in df.columns else 0.0,
    )

    lats = df["latitude"].to_numpy(dtype=float)
    lons = df["longitude"].to_numpy(dtype=float)
    alts = df["altitude"].to_numpy(dtype=float) if "altitude" in df.columns else np.zeros(n)
    gt_e, gt_n, _ = geodetic_to_enu(lats, lons, alts, anchor)

    speeds = df["speed_mps"].to_numpy(dtype=float) if "speed_mps" in df.columns else np.zeros(n)
    headings = df["heading_deg"].to_numpy(dtype=float) if "heading_deg" in df.columns else np.zeros(n)
    enu_yaws = compass_heading_to_enu_yaw(headings)
    gnss_v_e = speeds * np.cos(enu_yaws)
    gnss_v_n = speeds * np.sin(enu_yaws)

    processor = IMUProcessor()
    imu_obs = processor.process_trajectory(df)

    # Pre-extract quality indicators
    q_scores = df["composite_quality_score"].to_numpy(dtype=float)
    eff_sats = df["effective_satellites"].to_numpy(dtype=float)
    disc = df["kinematic_discrepancy_mps"].to_numpy(dtype=float)
    timestamps = [obs.timestamp for obs in imu_obs]

    # Pre-extract feature matrix if VYRA adaptive policy
    feature_extractor = ForecastingFeatureExtractor()
    surv_estimator = DRSurvivabilityEstimator()

    # Filters and dead reckoning integrators
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

    precomputed_forecasts: Dict[str, np.ndarray] = {}
    if forecast_model is not None and policy_name == "vyra_adaptive":
        feat_extractor = ForecastingFeatureExtractor()
        X_test_base, _ = feat_extractor.extract_features(df=df)
        from forecasting.action_conditioning import assemble_action_conditioned_matrix
        for act in ACTION_NAMES:
            X_act = assemble_action_conditioned_matrix(X_test_base, action=act, horizon_seconds=3.0)
            precomputed_forecasts[act] = forecast_model.predict(X_act)

    # State tracking arrays
    est_e = np.zeros(n, dtype=float)
    est_n = np.zeros(n, dtype=float)
    active_modes: List[str] = []
    mode_switches: List[Dict[str, Any]] = []

    current_pos_e = gt_e[0]
    current_pos_n = gt_n[0]
    current_yaw = enu_yaws[0]
    last_known_gnss_e = gt_e[0]
    last_known_gnss_n = gt_n[0]

    # Simulation loop
    for i in range(n):
        obs = imu_obs[i]
        t = timestamps[i]
        is_out = bool(outage_mask[i])

        # Always maintain background EKF state
        if i > 0:
            ekf.predict(obs)
        if not is_out:
            ekf.update_gnss(
                meas_pos_e=gt_e[i],
                meas_pos_n=gt_n[i],
                meas_vel_e=gnss_v_e[i],
                meas_vel_n=gnss_v_n[i],
                quality_score=q_scores[i],
                is_outage=False,
            )
            last_known_gnss_e = gt_e[i]
            last_known_gnss_n = gt_n[i]

        ekf_state = ekf.get_current_state(is_outage=is_out)

        # Policy Mode Selection
        selected_mode = "HYBRID"
        telemetry: Dict[str, Any] = {}

        if policy_name == "gnss_only":
            selected_mode = "GNSS"
        elif policy_name == "pure_dr":
            selected_mode = "DR"
        elif policy_name == "fixed_hybrid":
            selected_mode = "HYBRID"
        elif policy_name == "reactive":
            obs_dict = {
                "composite_quality_score": q_scores[i] if not is_out else 0.0,
                "effective_satellites": eff_sats[i] if not is_out else 0.0,
                "kinematic_discrepancy_mps": disc[i],
                "is_outage": is_out,
            }
            selected_mode, telemetry = policy.select_mode(obs_dict, timestamp=t)
        elif policy_name == "vyra_adaptive":
            # Decision-time survivability and forecasts
            v_i = float(obs.wheel_speed_mps) if obs.wheel_speed_mps > 0 else float(speeds[i])
            pv_i = float(ekf_state.uncertainty.covariance_trace / 2.0)
            yv_i = 0.05
            surv_dur = surv_estimator.estimate_survivable_duration(pv_i, v_i, yv_i, error_threshold_m=5.0)

            forecasts = {
                act: float(precomputed_forecasts[act][i])
                for act in ACTION_NAMES
            } if precomputed_forecasts else {"GNSS": 2.0, "HYBRID": 1.5, "DR": 2.5}

            # If outage is active, GNSS forecast is high
            if is_out:
                forecasts["GNSS"] = max(forecasts["GNSS"], 30.0)

            selected_mode, telemetry = policy.select_mode(
                forecasts=forecasts,
                dr_surv_duration_s=surv_dur,
                timestamp=t,
                is_sensor_outage=is_out,
            )

        active_modes.append(selected_mode)

        # State Execution
        if selected_mode == "GNSS":
            # Zero-order hold during outage
            current_pos_e = last_known_gnss_e
            current_pos_n = last_known_gnss_n
            current_yaw = enu_yaws[i]
        elif selected_mode == "HYBRID":
            current_pos_e = ekf_state.pos_e
            current_pos_n = ekf_state.pos_n
            current_yaw = ekf_state.yaw
        elif selected_mode == "DR":
            # Propagate from last state using strapdown dead reckoning step
            dt = 0.1 if i == 0 else max(1e-4, obs.dt)
            yaw_rate = obs.yaw_rate_rad_s
            current_yaw += yaw_rate * dt
            speed_val = obs.wheel_speed_mps if obs.wheel_speed_mps > 0 else speeds[i]
            current_pos_e += speed_val * np.cos(current_yaw) * dt
            current_pos_n += speed_val * np.sin(current_yaw) * dt

        est_e[i] = current_pos_e
        est_n[i] = current_pos_n

    # Compute errors
    errors = np.sqrt((est_e - gt_e) ** 2 + (est_n - gt_n) ** 2)
    ate = float(np.mean(errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    max_err = float(np.max(errors))
    viol_5m = float(np.mean(errors > 5.0) * 100.0)
    viol_10m = float(np.mean(errors > 10.0) * 100.0)
    final_drift = float(errors[-1])

    # Switching metrics
    switching_metrics = policy.get_metrics() if hasattr(policy, "get_metrics") else {
        "total_handovers": 0,
        "chattering_handovers": 0,
        "chattering_rate": 0.0,
        "unnecessary_handovers": 0,
        "mean_dwell_seconds": 0.0,
        "mode_percentages": {m: 100.0 if m == active_modes[0] else 0.0 for m in ACTION_NAMES},
    }

    return {
        "policy_name": policy_name,
        "ate_m": round(ate, 3),
        "rmse_m": round(rmse, 3),
        "max_error_m": round(max_err, 3),
        "violation_rate_5m_pct": round(viol_5m, 2),
        "violation_rate_10m_pct": round(viol_10m, 2),
        "final_drift_m": round(final_drift, 3),
        "errors": errors,
        "est_e": est_e,
        "est_n": est_n,
        "gt_e": gt_e,
        "gt_n": gt_n,
        "active_modes": active_modes,
        "switching_metrics": switching_metrics,
    }


def run_policy_experiments() -> Dict[str, Any]:
    """Execute complete Phase 4 navigation policy experiments."""
    logger.info("============================================================")
    logger.info("EXECUTING PHASE 4 NAVIGATION POLICY EXPERIMENTS")
    logger.info("============================================================")

    # Load trajectories
    trajs = discover_and_load_trajectories("data/raw")
    with open("data/splits/splits.json", "r", encoding="utf-8") as f:
        splits_cfg = json.load(f)

    # Held-out test split (V-S3a)
    test_dfs = [trajs[tid].df for tid in splits_cfg["test_ids"]]
    test_df = pd.concat(test_dfs, ignore_index=True)
    q_test_df = compute_gnss_quality(test_df)
    n = len(q_test_df)

    # Train a lightweight XGBoost forecast model on Train split for VYRA policy
    train_dfs = [trajs[tid].df for tid in splits_cfg["train_ids"]]
    train_df = pd.concat(train_dfs, ignore_index=True)
    q_train_df = compute_gnss_quality(train_df)

    # Load or train XGBoost forecast model for VYRA policy
    model_path = Path("models/trained/forecast_xgboost_3s.pkl")
    if model_path.is_file():
        logger.info(f"Loading pre-trained forecast engine from {model_path}...")
        forecast_model = XGBoostForecastModel.load(model_path)
    else:
        logger.info("Training lightweight XGBoost forecast engine for policy decisions...")
        from experiments.forecast_experiments import compute_trajectory_counterfactual_errors, build_split_matrices
        X_tr_base, cont_tr, bin_tr, _, _ = compute_trajectory_counterfactual_errors(train_df)
        X_tr_stack, y_tr_cont, _, _, _ = build_split_matrices(X_tr_base, cont_tr, bin_tr, "3s", 3.0, subsample_stride=4)
        forecast_model = XGBoostForecastModel(n_estimators=80, max_depth=5, learning_rate=0.1, n_jobs=-1)
        forecast_model.fit(X_tr_stack, y_tr_cont)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        forecast_model.save(model_path)
    logger.info("Forecast engine ready.")

    # Generate standard GNSS outage masks
    scenarios = generate_outage_schedule(
        df=q_test_df,
        durations_s=[2.0, 5.0, 10.0, 20.0, 30.0],
        inter_outage_spacing_s=90.0,
        warmup_s=30.0,
    )
    outage_mask = np.zeros(n, dtype=bool)
    for sc in scenarios:
        outage_mask[sc.start_idx : sc.end_idx] = True
    logger.info(f"Generated outage schedule: {int(np.sum(outage_mask))} outage epochs ({np.mean(outage_mask)*100:.2f}% of trajectory).")

    # 1. EVALUATE 5 POLICIES UNDER OUTAGE CONDITIONS
    logger.info("--- Evaluating Policies Under Standard Outage Conditions ---")
    thresholds = PolicyThresholds(error_threshold_m=5.0, dwell_time_seconds=2.0, switching_penalty_m=1.0)

    policies = {
        "GNSS-Only": ("gnss_only", None),
        "Pure DR": ("pure_dr", None),
        "Fixed HYBRID": ("fixed_hybrid", FixedHybridPolicy()),
        "Reactive Baseline": ("reactive", ReactiveBaselinePolicy(thresholds=thresholds)),
        "VYRA Adaptive": ("vyra_adaptive", VYRAAdaptivePolicy(thresholds=thresholds)),
    }

    outage_results: Dict[str, Dict[str, Any]] = {}
    for pol_name, (pol_id, pol_obj) in policies.items():
        logger.info(f"Simulating policy: {pol_name}...")
        res = run_closed_loop_policy_simulation(
            df=q_test_df,
            policy=pol_obj,
            forecast_model=forecast_model if pol_id == "vyra_adaptive" else None,
            outage_mask=outage_mask,
            policy_name=pol_id,
        )
        outage_results[pol_name] = res
        logger.info(
            f"[{pol_name}] ATE={res['ate_m']:.3f}m, MaxErr={res['max_error_m']:.3f}m, "
            f"5m Viol={res['violation_rate_5m_pct']:.2f}%, Handovers={res['switching_metrics']['total_handovers']}"
        )

    # 2. EVALUATE POLICIES UNDER NOMINAL CONDITIONS (NO OUTAGE)
    logger.info("--- Evaluating Policies Under Nominal Conditions ---")
    nominal_results: Dict[str, Dict[str, Any]] = {}
    for pol_name, (pol_id, pol_obj) in policies.items():
        # Fresh instances
        inst = (
            FixedHybridPolicy() if pol_id == "fixed_hybrid"
            else ReactiveBaselinePolicy(thresholds=thresholds) if pol_id == "reactive"
            else VYRAAdaptivePolicy(thresholds=thresholds) if pol_id == "vyra_adaptive"
            else None
        )
        res_nom = run_closed_loop_policy_simulation(
            df=q_test_df,
            policy=inst,
            forecast_model=forecast_model if pol_id == "vyra_adaptive" else None,
            outage_mask=np.zeros(n, dtype=bool),
            policy_name=pol_id,
        )
        nominal_results[pol_name] = res_nom

    # 3. POLICY ABLATIONS & PARETO SENSITIVITY
    logger.info("--- Evaluating Policy Ablations and Parameter Sensitivity ---")
    ablations: Dict[str, Dict[str, Any]] = {}

    # Ablation 1: Full VYRA
    ablations["Full VYRA"] = outage_results["VYRA Adaptive"]

    # Ablation 2: No Dwell Time Constraint (tau_dwell = 0)
    thresh_no_dwell = PolicyThresholds(error_threshold_m=5.0, dwell_time_seconds=0.0, switching_penalty_m=1.0)
    pol_no_dwell = VYRAAdaptivePolicy(thresholds=thresh_no_dwell, enforce_dwell=False)
    ablations["No Dwell Time"] = run_closed_loop_policy_simulation(
        df=q_test_df, policy=pol_no_dwell, forecast_model=forecast_model, outage_mask=outage_mask, policy_name="vyra_adaptive"
    )

    # Ablation 3: No Switching Penalty (lambda_switch = 0.0)
    thresh_no_pen = PolicyThresholds(error_threshold_m=5.0, dwell_time_seconds=2.0, switching_penalty_m=0.0)
    pol_no_pen = VYRAAdaptivePolicy(thresholds=thresh_no_pen)
    ablations["No Switching Penalty"] = run_closed_loop_policy_simulation(
        df=q_test_df, policy=pol_no_pen, forecast_model=forecast_model, outage_mask=outage_mask, policy_name="vyra_adaptive"
    )

    # Ablation 4: Pareto Risk Weight Sweep (beta in {0.5, 1.0, 2.0, 5.0})
    pareto_points: List[Dict[str, Any]] = []
    for beta_val in [0.5, 1.0, 2.0, 5.0]:
        thresh_beta = PolicyThresholds(error_threshold_m=5.0, dwell_time_seconds=2.0, switching_penalty_m=1.0, risk_weight_beta=beta_val)
        pol_beta = VYRAAdaptivePolicy(thresholds=thresh_beta)
        res_beta = run_closed_loop_policy_simulation(
            df=q_test_df, policy=pol_beta, forecast_model=forecast_model, outage_mask=outage_mask, policy_name="vyra_adaptive"
        )
        pareto_points.append({
            "beta": beta_val,
            "ate_m": res_beta["ate_m"],
            "violation_rate_5m_pct": res_beta["violation_rate_5m_pct"],
            "total_handovers": res_beta["switching_metrics"]["total_handovers"],
        })

    # 4. SAVE RESULT JSONS
    out_dir = Path("results/processed")
    out_dir.mkdir(parents=True, exist_ok=True)

    summary_metrics = {
        pol: {
            "ate_m": r["ate_m"],
            "rmse_m": r["rmse_m"],
            "max_error_m": r["max_error_m"],
            "violation_rate_5m_pct": r["violation_rate_5m_pct"],
            "violation_rate_10m_pct": r["violation_rate_10m_pct"],
            "final_drift_m": r["final_drift_m"],
            "total_handovers": r["switching_metrics"]["total_handovers"],
            "chattering_handovers": r["switching_metrics"]["chattering_handovers"],
            "chattering_rate": r["switching_metrics"]["chattering_rate"],
            "unnecessary_handovers": r["switching_metrics"]["unnecessary_handovers"],
            "mean_dwell_seconds": r["switching_metrics"]["mean_dwell_seconds"],
            "mode_percentages": r["switching_metrics"]["mode_percentages"],
        }
        for pol, r in outage_results.items()
    }

    with open(out_dir / "policy_metrics.json", "w", encoding="utf-8") as f:
        json.dump(summary_metrics, f, indent=2)

    with open(out_dir / "policy_ablations.json", "w", encoding="utf-8") as f:
        json.dump({
            "ablations": {
                k: {
                    "ate_m": v["ate_m"],
                    "violation_rate_5m_pct": v["violation_rate_5m_pct"],
                    "total_handovers": v["switching_metrics"]["total_handovers"],
                    "chattering_rate": v["switching_metrics"]["chattering_rate"],
                }
                for k, v in ablations.items()
            },
            "pareto_front": pareto_points,
        }, f, indent=2)

    logger.info("Saved policy result artifacts.")

    # 5. GENERATE PUBLICATION FIGURES
    fig_dir = Path("results/figures")
    fig_dir.mkdir(parents=True, exist_ok=True)
    generate_policy_figures(
        outage_results=outage_results,
        ablations=ablations,
        pareto_points=pareto_points,
        outage_mask=outage_mask,
        timestamps=np.array([i * 0.1 for i in range(n)]),
        q_scores=q_test_df["composite_quality_score"].to_numpy(dtype=float),
        out_dir=fig_dir,
    )

    logger.info("Policy experiments completed successfully.")
    return summary_metrics


def generate_policy_figures(
    outage_results: Dict[str, Dict[str, Any]],
    ablations: Dict[str, Dict[str, Any]],
    pareto_points: List[Dict[str, Any]],
    outage_mask: np.ndarray,
    timestamps: np.ndarray,
    q_scores: np.ndarray,
    out_dir: Path,
) -> None:
    """Generate high-resolution policy performance figures."""
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

    # Figure 1: Mode Selection Timeline (Reactive vs VYRA) alongside Outage/Quality
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(15, 8), sharex=True)
    t_min, t_max = 200.0, 600.0  # Focus on informative 400-second window
    idx = (timestamps >= t_min) & (timestamps <= t_max)
    t_sub = timestamps[idx]

    # Subplot 1: GNSS Quality & Injected Outages
    ax1.plot(t_sub, q_scores[idx], color="#1f77b4", lw=1.5, label="Composite GNSS Quality")
    out_sub = outage_mask[idx]
    if np.any(out_sub):
        ax1.fill_between(t_sub, 0, 1, where=out_sub, color="#d62728", alpha=0.3, label="GNSS Outage Event")
    ax1.axhline(0.70, color="orange", linestyle="--", lw=1.2, label="Reactive Threshold (0.70)")
    ax1.set_ylim(-0.05, 1.05)
    ax1.set_ylabel("Quality Score", fontsize=11)
    ax1.set_title("Environmental GNSS Integrity and Outage Events", fontsize=12, fontweight="bold")
    ax1.legend(loc="upper right", framealpha=0.9)

    # Mode mapping for stepped timeline: GNSS=0, HYBRID=1, DR=2
    mode_map = {"GNSS": 0, "HYBRID": 1, "DR": 2}

    # Subplot 2: Reactive Mode Selection
    reac_modes = [mode_map[m] for m in outage_results["Reactive Baseline"]["active_modes"]]
    reac_sub = np.array(reac_modes)[idx]
    ax2.step(t_sub, reac_sub, where="post", color="#ff7f0e", lw=1.8, label="Reactive Baseline")
    ax2.set_yticks([0, 1, 2])
    ax2.set_yticklabels(["GNSS", "HYBRID", "DR"], fontsize=11)
    ax2.set_ylabel("Active Mode", fontsize=11)
    ax2.set_title("Reactive Baseline: Delayed Chattering Responses", fontsize=12, fontweight="bold")
    ax2.legend(loc="upper right")

    # Subplot 3: VYRA Adaptive Mode Selection
    vyra_modes = [mode_map[m] for m in outage_results["VYRA Adaptive"]["active_modes"]]
    vyra_sub = np.array(vyra_modes)[idx]
    ax3.step(t_sub, vyra_sub, where="post", color="#2ca02c", lw=1.8, label="VYRA Adaptive (Proposed)")
    ax3.set_yticks([0, 1, 2])
    ax3.set_yticklabels(["GNSS", "HYBRID", "DR"], fontsize=11)
    ax3.set_ylabel("Active Mode", fontsize=11)
    ax3.set_xlabel("Trajectory Time (seconds)", fontsize=11)
    ax3.set_title("VYRA Adaptive: Anticipatory Handover with Dwell Stability", fontsize=12, fontweight="bold")
    ax3.legend(loc="upper right")

    plt.tight_layout()
    fig.savefig(out_dir / "policy_mode_selection_timeline.png", dpi=300)
    plt.close(fig)

    # Figure 2: Error Bound Violations and CDF Comparison
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    policy_names = list(outage_results.keys())
    viols_5m = [outage_results[p]["violation_rate_5m_pct"] for p in policy_names]
    viols_10m = [outage_results[p]["violation_rate_10m_pct"] for p in policy_names]

    x = np.arange(len(policy_names))
    w = 0.35
    ax1.bar(x - w / 2, viols_5m, w, label="> 5.0m Error Violation (%)", color="#d95f02")
    ax1.bar(x + w / 2, viols_10m, w, label="> 10.0m Severe Violation (%)", color="#7570b3")
    ax1.set_xticks(x)
    ax1.set_xticklabels(policy_names, rotation=15, ha="right", fontsize=10)
    ax1.set_ylabel("Violation Percentage (%)", fontsize=11)
    ax1.set_title("Operational Error-Bound Violation Rates", fontsize=12, fontweight="bold")
    ax1.legend()

    for i in range(len(policy_names)):
        ax1.text(x[i] - w / 2, viols_5m[i] + 0.5, f"{viols_5m[i]:.1f}%", ha="center", fontsize=9, fontweight="bold")
        ax1.text(x[i] + w / 2, viols_10m[i] + 0.5, f"{viols_10m[i]:.1f}%", ha="center", fontsize=9)

    # Error CDF Comparison
    for p in policy_names:
        errs = np.sort(outage_results[p]["errors"])
        cdf = np.linspace(0, 1, len(errs))
        ax2.plot(errs, cdf, lw=1.8, label=p)

    ax2.axvline(5.0, color="red", linestyle="--", label="E_thresh (5.0m)")
    ax2.set_xlim(0, 20.0)
    ax2.set_xlabel("Horizontal Localization Error (meters)", fontsize=11)
    ax2.set_ylabel("Cumulative Probability P(Error <= e)", fontsize=11)
    ax2.set_title("Empirical Localization Error Cumulative Distribution", fontsize=12, fontweight="bold")
    ax2.legend(loc="lower right")

    plt.tight_layout()
    fig.savefig(out_dir / "policy_error_bound_violations.png", dpi=300)
    plt.close(fig)

    # Figure 3: Policy Ablations (Stability vs Error)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
    abl_names = list(ablations.keys())
    abl_viols = [ablations[k]["violation_rate_5m_pct"] for k in abl_names]
    abl_handovers = [ablations[k]["switching_metrics"]["total_handovers"] for k in abl_names]

    y_pos = np.arange(len(abl_names))
    ax1.barh(y_pos, abl_viols, color="#2b83ba", edgecolor="black", alpha=0.85)
    ax1.set_yticks(y_pos)
    ax1.set_yticklabels(abl_names, fontsize=11)
    ax1.invert_yaxis()
    ax1.set_xlabel("5.0m Violation Rate (%) [Lower is Better]", fontsize=11)
    ax1.set_title("Ablation: Safety Impact of Policy Constraints", fontsize=12, fontweight="bold")

    for i, v in enumerate(abl_viols):
        ax1.text(v + 0.3, i, f"{v:.1f}%", va="center", fontsize=9, fontweight="bold")

    ax2.barh(y_pos, abl_handovers, color="#fdae61", edgecolor="black", alpha=0.85)
    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(abl_names, fontsize=11)
    ax2.invert_yaxis()
    ax2.set_xlabel("Total Handover Count [Lower / Stable is Better]", fontsize=11)
    ax2.set_title("Ablation: Chattering Mitigation Impact", fontsize=12, fontweight="bold")

    for i, v in enumerate(abl_handovers):
        ax2.text(v + 1, i, f"{v}", va="center", fontsize=9, fontweight="bold")

    plt.tight_layout()
    fig.savefig(out_dir / "policy_ablation_comparison.png", dpi=300)
    plt.close(fig)

    # Figure 4: Pareto Front (Error Violations vs Switching Count)
    fig, ax = plt.subplots(figsize=(8, 5))
    betas = [p["beta"] for p in pareto_points]
    viols = [p["violation_rate_5m_pct"] for p in pareto_points]
    switches = [p["total_handovers"] for p in pareto_points]

    ax.plot(switches, viols, "o--", color="#7570b3", lw=2, markersize=9)
    for b, s, v in zip(betas, switches, viols):
        ax.annotate(f"beta={b}", (s, v), textcoords="offset points", xytext=(8, 8), fontweight="bold")

    # Mark baseline points
    reac_viol = outage_results["Reactive Baseline"]["violation_rate_5m_pct"]
    reac_sw = outage_results["Reactive Baseline"]["switching_metrics"]["total_handovers"]
    ax.scatter([reac_sw], [reac_viol], color="#d95f02", s=130, marker="s", label="Reactive Baseline", zorder=5)

    ax.set_xlabel("Total Handover Transitions (Switching Frequency)", fontsize=11)
    ax.set_ylabel("5.0m Error Violation Rate (%)", fontsize=11)
    ax.set_title("Pareto Frontier: Safety vs Mode Switching Overhead", fontsize=13, fontweight="bold")
    ax.legend()

    plt.tight_layout()
    fig.savefig(out_dir / "policy_pareto_front.png", dpi=300)
    plt.close(fig)


if __name__ == "__main__":
    run_policy_experiments()
