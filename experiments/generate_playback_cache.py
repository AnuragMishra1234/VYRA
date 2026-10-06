"""Playback Cache Generator for VYRA Research Dashboard.

Executes the validated research pipeline across the held-out test trajectory (V-S3a)
and saves rich epoch-by-epoch telemetry to enable instant, high-rate, zero-latency
playback in the backend and frontend dashboard.

NO MOCK DATA:
All fields are strictly computed by the validated research pipeline modules.
"""

from __future__ import annotations

import json
import logging
import pickle
import sys
from pathlib import Path

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import numpy as np
import pandas as pd

from forecasting.action_conditioning import ACTION_NAMES, assemble_action_conditioned_matrix
from forecasting.features import ForecastingFeatureExtractor
from gnss.predictor import GNSSDegradationPredictor
from gnss.quality import compute_gnss_quality
from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    enu_to_geodetic,
    geodetic_to_enu,
)
from navigation.dead_reckoning import DeadReckoningEngine
from navigation.ekf import ExtendedKalmanFilter
from navigation.imu_processing import IMUProcessor
from policy.adaptive import VYRAAdaptivePolicy
from policy.survivability import DRSurvivabilityEstimator
from policy.thresholds import PolicyThresholds
from preprocessing.dataset_loader import discover_and_load_trajectories
from simulation.gnss_degradation import (
    generate_gradual_degradation_schedule,
    inject_controlled_degradation,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def generate_v_s3a_playback_cache() -> Path:
    """Generate and serialize the complete playback telemetry bundle for V-S3a."""
    logger.info("Generating playback telemetry bundle for held-out test split V-S3a...")

    # 1. Load Data
    trajs = discover_and_load_trajectories(REPO_ROOT / "data" / "raw")
    with open(REPO_ROOT / "data" / "splits" / "splits.json", "r", encoding="utf-8") as f:
        splits_cfg = json.load(f)

    test_ids = splits_cfg["test_ids"]
    test_df = trajs[test_ids[0]].df.copy().reset_index(drop=True)
    q_test_df = compute_gnss_quality(test_df)
    n = len(q_test_df)

    # Load pre-trained models
    forecast_model_path = REPO_ROOT / "models" / "trained" / "forecast_xgboost_3s.pkl"
    with open(forecast_model_path, "rb") as f:
        forecast_model = pickle.load(f)

    predictor = GNSSDegradationPredictor.load(REPO_ROOT / "models" / "trained" / "gnss_predictor_logistic.pkl")

    # 2. Schedule Controlled Degradation Events (Identical to Phase 5 Protocol)
    durations_sweep = [2.0, 5.0, 10.0, 20.0, 30.0]
    gradual_events = generate_gradual_degradation_schedule(
        q_test_df,
        durations_s=durations_sweep,
        decline_duration_s=4.0,
        recovery_duration_s=3.0,
        inter_event_spacing_s=60.0,
        warmup_s=30.0,
        cooldown_s=30.0,
    )
    sim_df = inject_controlled_degradation(q_test_df, gradual_events, seed=42)

    # Extract scenario state per epoch
    scenario_states = ["NORMAL"] * n
    ts_arr = sim_df["timestamp"].to_numpy(dtype=float)
    for ev in gradual_events:
        for idx in range(max(0, ev.start_idx - 50), min(n, ev.end_idx + 50)):
            t_curr = ts_arr[idx]
            if ev.degradation_onset_time <= t_curr < ev.outage_onset_time:
                scenario_states[idx] = "DEGRADED"
            elif ev.start_time <= t_curr <= ev.end_time:
                scenario_states[idx] = "OUTAGE"
            elif ev.end_time < t_curr <= ev.recovery_end_time:
                scenario_states[idx] = "RECOVERY"

    outage_mask = sim_df["is_simulated_outage"].to_numpy(dtype=bool)
    degraded_mask = sim_df["is_simulated_degraded"].to_numpy(dtype=bool)

    # 3. Ground Truth & Coordinate Conversion
    anchor = ENUAnchor(
        lat0_deg=float(sim_df["gt_latitude"].iloc[0] if "gt_latitude" in sim_df.columns else sim_df["latitude"].iloc[0]),
        lon0_deg=float(sim_df["gt_longitude"].iloc[0] if "gt_longitude" in sim_df.columns else sim_df["longitude"].iloc[0]),
        alt0_m=float(sim_df["gt_altitude"].iloc[0] if "gt_altitude" in sim_df.columns else 0.0),
    )

    gt_lats = sim_df["gt_latitude"].to_numpy(dtype=float) if "gt_latitude" in sim_df.columns else sim_df["latitude"].to_numpy(dtype=float)
    gt_lons = sim_df["gt_longitude"].to_numpy(dtype=float) if "gt_longitude" in sim_df.columns else sim_df["longitude"].to_numpy(dtype=float)
    gt_alts = sim_df["gt_altitude"].to_numpy(dtype=float) if "gt_altitude" in sim_df.columns else np.zeros(n)
    gt_e, gt_n, _ = geodetic_to_enu(gt_lats, gt_lons, gt_alts, anchor)

    obs_lats = sim_df["latitude"].to_numpy(dtype=float)
    obs_lons = sim_df["longitude"].to_numpy(dtype=float)
    obs_alts = sim_df["altitude"].to_numpy(dtype=float) if "altitude" in sim_df.columns else np.zeros(n)
    meas_e, meas_n, _ = geodetic_to_enu(obs_lats, obs_lons, obs_alts, anchor)

    speeds = sim_df["speed_mps"].to_numpy(dtype=float) if "speed_mps" in sim_df.columns else np.zeros(n)
    headings = sim_df["heading_deg"].to_numpy(dtype=float) if "heading_deg" in sim_df.columns else np.zeros(n)
    enu_yaws = compass_heading_to_enu_yaw(headings)
    gnss_v_e = speeds * np.cos(enu_yaws)
    gnss_v_n = speeds * np.sin(enu_yaws)

    processor = IMUProcessor()
    imu_obs = processor.process_trajectory(sim_df)
    timestamps = np.array([obs.timestamp for obs in imu_obs], dtype=float)
    relative_times = timestamps - timestamps[0]

    q_scores = sim_df["composite_quality_score"].to_numpy(dtype=float)
    disc = sim_df["kinematic_discrepancy_mps"].to_numpy(dtype=float)

    # 4. Predict degradation probabilities
    deg_probs = np.zeros(n, dtype=float)
    try:
        from gnss.features import extract_gnss_temporal_features
        feat_df, cols = extract_gnss_temporal_features(sim_df)
        deg_probs = predictor.predict_proba(feat_df[cols].to_numpy(), horizon=3.0)[:, 1]
    except Exception as ex:
        logger.warning(f"Feature extraction for degradation probability fell back to quality inverse: {ex}")
        deg_probs = np.clip(1.0 - q_scores, 0.0, 1.0)

    # 5. Extract forecasting base features & precompute batch model forecasts
    feature_extractor = ForecastingFeatureExtractor()
    X_base, _ = feature_extractor.extract_features(df=sim_df)

    precomputed_forecasts: dict[str, np.ndarray] = {}
    for act in ACTION_NAMES:
        X_act = assemble_action_conditioned_matrix(X_base, action=act, horizon_seconds=3.0)
        precomputed_forecasts[act] = forecast_model.predict(X_act)

    # 6. Initialize Navigation Filters
    thresholds = PolicyThresholds.from_yaml(REPO_ROOT / "config" / "config.yaml")
    policy = VYRAAdaptivePolicy(thresholds=thresholds, initial_mode="HYBRID")
    surv_estimator = DRSurvivabilityEstimator()

    # EKF for VYRA
    ekf_vyra = ExtendedKalmanFilter(
        pos_noise_std_m=0.3,
        vel_noise_std_mps=0.15,
        yaw_noise_std_rad=0.015,
        gnss_pos_noise_std_m=1.5,
        gnss_vel_noise_std_mps=0.25,
        adaptive_noise_scale=5.0,
    )
    ekf_vyra.reset(gt_e[0], gt_n[0], gnss_v_e[0], gnss_v_n[0], enu_yaws[0], 0.0, 2.25, 0.5, 0.05, timestamps[0])

    # EKF for Fixed HYBRID
    ekf_hybrid = ExtendedKalmanFilter(
        pos_noise_std_m=0.3,
        vel_noise_std_mps=0.15,
        yaw_noise_std_rad=0.015,
        gnss_pos_noise_std_m=1.5,
        gnss_vel_noise_std_mps=0.25,
        adaptive_noise_scale=5.0,
    )
    ekf_hybrid.reset(gt_e[0], gt_n[0], gnss_v_e[0], gnss_v_n[0], enu_yaws[0], 0.0, 2.25, 0.5, 0.05, timestamps[0])

    # Output arrays
    vyra_e = np.zeros(n, dtype=float)
    vyra_n = np.zeros(n, dtype=float)
    hybrid_e = np.zeros(n, dtype=float)
    hybrid_n = np.zeros(n, dtype=float)
    dr_e = np.zeros(n, dtype=float)
    dr_n = np.zeros(n, dtype=float)
    curr_dr_yaw = enu_yaws[0]
    dr_e[0] = gt_e[0]
    dr_n[0] = gt_n[0]

    selected_modes: list[str] = []
    decision_reasons: list[str] = []
    dr_uncertainties_std_m = np.zeros(n, dtype=float)
    dr_survivabilities_s = np.zeros(n, dtype=float)
    errors_m = np.zeros(n, dtype=float)

    last_valid_gnss_e = meas_e[0]
    last_valid_gnss_n = meas_n[0]

    logger.info("Executing closed-loop simulation loop for V-S3a...")
    for i in range(n):
        obs = imu_obs[i]
        t = timestamps[i]
        is_out = bool(outage_mask[i])

        # A. Pure DR propagation
        if i > 0:
            dt_dr = max(1e-4, obs.dt)
            curr_dr_yaw += obs.yaw_rate_rad_s * dt_dr
            sp = obs.wheel_speed_mps if obs.wheel_speed_mps > 0 else speeds[i]
            dr_e[i] = dr_e[i - 1] + sp * np.cos(curr_dr_yaw) * dt_dr
            dr_n[i] = dr_n[i - 1] + sp * np.sin(curr_dr_yaw) * dt_dr
        else:
            dr_e[i] = dr_e[0]
            dr_n[i] = dr_n[0]

        # B. Fixed HYBRID EKF update
        if i > 0:
            ekf_hybrid.predict(obs)
        if not is_out:
            ekf_hybrid.update_gnss(meas_e[i], meas_n[i], gnss_v_e[i], gnss_v_n[i], q_scores[i], False)
        hyb_state = ekf_hybrid.get_current_state(is_outage=is_out)
        hybrid_e[i] = hyb_state.pos_e
        hybrid_n[i] = hyb_state.pos_n

        # C. VYRA Adaptive Navigation
        if i > 0:
            ekf_vyra.predict(obs)

        current_vyra_state = ekf_vyra.get_current_state(is_outage=is_out)
        dr_sigma = float(current_vyra_state.uncertainty.sigma_horiz)
        dr_uncertainties_std_m[i] = dr_sigma

        v_i = float(obs.wheel_speed_mps) if obs.wheel_speed_mps > 0 else float(speeds[i])
        pv_i = float(current_vyra_state.uncertainty.covariance_trace / 2.0)
        yv_i = 0.05
        surv_dur = surv_estimator.estimate_survivable_duration(pv_i, v_i, yv_i, error_threshold_m=thresholds.error_threshold_m)
        dr_survivabilities_s[i] = round(surv_dur, 2)

        # Candidate forecasts from precomputed XGBoost model
        fc = {act: float(precomputed_forecasts[act][i]) for act in ACTION_NAMES}

        # Policy decision (pure ML, hard physical unavailability gating during outage)
        mode_choice, telem = policy.select_mode(
            forecasts=fc,
            dr_surv_duration_s=surv_dur,
            timestamp=t,
            is_sensor_outage=is_out,
            quality_score=q_scores[i],
        )

        selected_modes.append(mode_choice)
        decision_reasons.append(telem["reason"])

        # Filter update conditioned on mode
        if mode_choice == "HYBRID" and not is_out:
            ekf_vyra.update_gnss(meas_e[i], meas_n[i], gnss_v_e[i], gnss_v_n[i], q_scores[i], False)
            last_valid_gnss_e = meas_e[i]
            last_valid_gnss_n = meas_n[i]
        elif mode_choice == "DR":
            pass
        elif mode_choice == "GNSS" and not is_out:
            ekf_vyra.update_gnss(meas_e[i], meas_n[i], gnss_v_e[i], gnss_v_n[i], q_scores[i], False)
            last_valid_gnss_e = meas_e[i]
            last_valid_gnss_n = meas_n[i]

        updated_vyra_state = ekf_vyra.get_current_state(is_outage=is_out)
        if mode_choice in ("HYBRID", "DR"):
            vyra_e[i] = updated_vyra_state.pos_e
            vyra_n[i] = updated_vyra_state.pos_n
        elif mode_choice == "GNSS":
            if is_out:
                vyra_e[i] = last_valid_gnss_e
                vyra_n[i] = last_valid_gnss_n
            else:
                vyra_e[i] = meas_e[i]
                vyra_n[i] = meas_n[i]

        errors_m[i] = np.sqrt((vyra_e[i] - gt_e[i]) ** 2 + (vyra_n[i] - gt_n[i]) ** 2)

    # Convert coordinates back to Geodetic for map rendering
    logger.info("Converting ENU trajectories back to WGS-84 geodetic for Leaflet mapping...")
    vyra_lats, vyra_lons, _ = enu_to_geodetic(vyra_e, vyra_n, np.zeros(n), anchor)
    hyb_lats, hyb_lons, _ = enu_to_geodetic(hybrid_e, hybrid_n, np.zeros(n), anchor)
    dr_lats, dr_lons, _ = enu_to_geodetic(dr_e, dr_n, np.zeros(n), anchor)

    # 7. Assemble Telemetry DataFrame
    out_df = pd.DataFrame({
        "index": np.arange(n),
        "timestamp": timestamps,
        "relative_time_s": np.round(relative_times, 2),
        "scenario": scenario_states,
        "is_outage": outage_mask,
        "is_degraded": degraded_mask,
        "gnss_quality": np.round(q_scores, 4),
        "degradation_prob": np.round(deg_probs, 4),
        "dr_uncertainty_std_m": np.round(dr_uncertainties_std_m, 4),
        "dr_survivability_s": dr_survivabilities_s,
        "forecast_gnss": np.round(precomputed_forecasts["GNSS"], 4),
        "forecast_hybrid": np.round(precomputed_forecasts["HYBRID"], 4),
        "forecast_dr": np.round(precomputed_forecasts["DR"], 4),
        "selected_mode": selected_modes,
        "decision_reason": decision_reasons,
        "current_error_m": np.round(errors_m, 4),
        # Geodetic Coordinates for Map
        "gt_lat": np.round(gt_lats, 7),
        "gt_lon": np.round(gt_lons, 7),
        "gnss_lat": np.round(obs_lats, 7),
        "gnss_lon": np.round(obs_lons, 7),
        "vyra_lat": np.round(vyra_lats, 7),
        "vyra_lon": np.round(vyra_lons, 7),
        "hybrid_lat": np.round(hyb_lats, 7),
        "hybrid_lon": np.round(hyb_lons, 7),
        "dr_lat": np.round(dr_lats, 7),
        "dr_lon": np.round(dr_lons, 7),
        # Local Cartesian ENU
        "vyra_e": np.round(vyra_e, 3),
        "vyra_n": np.round(vyra_n, 3),
        "gt_e": np.round(gt_e, 3),
        "gt_n": np.round(gt_n, 3),
    })

    out_path_parquet = REPO_ROOT / "results" / "processed" / "v_s3a_playback_cache.parquet"
    out_df.to_parquet(out_path_parquet, index=False)
    logger.info(f"Saved playback cache to {out_path_parquet} ({len(out_df)} epochs, {out_path_parquet.stat().st_size / 1024:.1f} KB)")

    return out_path_parquet


if __name__ == "__main__":
    generate_v_s3a_playback_cache()
