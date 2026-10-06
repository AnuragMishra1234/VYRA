"""Robustness, Noise Sensitivity, and Sensor Dropout Experiments for VYRA.

Evaluates navigation policies under:
1. Multi-segment held-out trajectory variance (evaluating performance distribution)
2. Controlled additional sensor noise sweeps (accelerometer, gyroscope, GNSS)
3. Sensor dropout / packet loss sweeps (burst GNSS loss)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from evaluation.ate import compute_ate_summary
from experiments.baselines import run_baseline_trajectory
from simulation.gnss_degradation import (
    DegradationEvent,
    generate_gradual_degradation_schedule,
    inject_controlled_degradation,
)
from simulation.sensor_dropout import inject_sensor_dropout
from simulation.sensor_noise import NoiseParameters, inject_sensor_noise

logger = logging.getLogger(__name__)


def run_noise_robustness_sweep(
    clean_df: pd.DataFrame,
    events: List[DegradationEvent],
    policy_runner_fn: Any,
    seed: int = 42,
) -> Dict[str, Dict[str, Any]]:
    """Evaluate policies under nominal, moderate, and severe sensor noise."""
    noise_levels = {
        "Nominal (Clean)": NoiseParameters(accel_noise_std_mps2=0.0, gyro_noise_std_rads=0.0, gnss_pos_noise_std_m=0.0, seed=seed),
        "Moderate Noise": NoiseParameters(accel_noise_std_mps2=0.10, gyro_noise_std_rads=0.01, gnss_pos_noise_std_m=2.0, seed=seed),
        "Severe Noise": NoiseParameters(accel_noise_std_mps2=0.30, gyro_noise_std_rads=0.03, gnss_pos_noise_std_m=5.0, seed=seed),
    }

    outage_mask = np.zeros(len(clean_df), dtype=bool)
    for ev in events:
        outage_mask[ev.start_idx : ev.end_idx + 1] = True

    results: Dict[str, Dict[str, Any]] = {}

    for level_name, n_params in noise_levels.items():
        logger.info("Evaluating robustness under %s...", level_name)
        degraded_df = inject_controlled_degradation(clean_df, events, seed=seed)
        perturbed_df = inject_sensor_noise(degraded_df, n_params)

        level_res: Dict[str, Any] = {}
        # Run baselines
        for b_name in ["fixed_hybrid", "reactive"]:
            b_out = run_baseline_trajectory(perturbed_df, baseline_type=b_name, outage_mask=outage_mask)
            level_res[b_name] = {
                "ate_m": b_out["ate_summary"].mean_ate_m,
                "rmse_m": b_out["ate_summary"].rmse_m,
                "max_error_m": b_out["ate_summary"].max_error_m,
                "viol_5m_pct": b_out["ate_summary"].violation_rate_5m_pct,
                "handovers": b_out["handover_summary"].total_handovers,
            }

        # Run VYRA
        vyra_out = policy_runner_fn(perturbed_df, outage_mask=outage_mask)
        level_res["vyra_adaptive"] = {
            "ate_m": vyra_out["ate_summary"].mean_ate_m,
            "rmse_m": vyra_out["ate_summary"].rmse_m,
            "max_error_m": vyra_out["ate_summary"].max_error_m,
            "viol_5m_pct": vyra_out["ate_summary"].violation_rate_5m_pct,
            "handovers": vyra_out["handover_summary"].total_handovers,
        }

        results[level_name] = level_res

    return results


def run_dropout_robustness_sweep(
    clean_df: pd.DataFrame,
    events: List[DegradationEvent],
    policy_runner_fn: Any,
    seed: int = 42,
) -> Dict[str, Dict[str, Any]]:
    """Evaluate policies under packet dropout (0%, 5%, 10%)."""
    dropout_rates = {
        "0% Dropout": 0.0,
        "5% Burst Dropout": 0.05,
        "10% Burst Dropout": 0.10,
    }

    outage_mask = np.zeros(len(clean_df), dtype=bool)
    for ev in events:
        outage_mask[ev.start_idx : ev.end_idx + 1] = True

    results: Dict[str, Dict[str, Any]] = {}

    for drop_name, rate in dropout_rates.items():
        logger.info("Evaluating robustness under %s...", drop_name)
        degraded_df = inject_controlled_degradation(clean_df, events, seed=seed)
        if rate > 0.0:
            dropped_df = inject_sensor_dropout(degraded_df, dropout_rate=rate, burst_length_epochs=5, target_sensor="gnss", seed=seed)
        else:
            dropped_df = degraded_df

        drop_res: Dict[str, Any] = {}
        for b_name in ["fixed_hybrid", "reactive"]:
            b_out = run_baseline_trajectory(dropped_df, baseline_type=b_name, outage_mask=outage_mask)
            drop_res[b_name] = {
                "ate_m": b_out["ate_summary"].mean_ate_m,
                "rmse_m": b_out["ate_summary"].rmse_m,
                "max_error_m": b_out["ate_summary"].max_error_m,
                "viol_5m_pct": b_out["ate_summary"].violation_rate_5m_pct,
                "handovers": b_out["handover_summary"].total_handovers,
            }

        vyra_out = policy_runner_fn(dropped_df, outage_mask=outage_mask)
        drop_res["vyra_adaptive"] = {
            "ate_m": vyra_out["ate_summary"].mean_ate_m,
            "rmse_m": vyra_out["ate_summary"].rmse_m,
            "max_error_m": vyra_out["ate_summary"].max_error_m,
            "viol_5m_pct": vyra_out["ate_summary"].violation_rate_5m_pct,
            "handovers": vyra_out["handover_summary"].total_handovers,
        }

        results[drop_name] = drop_res

    return results


def run_multi_segment_trajectory_evaluation(
    df: pd.DataFrame,
    events: List[DegradationEvent],
    policy_runner_fn: Any,
    num_segments: int = 5,
) -> Dict[str, Any]:
    """Partition held-out test trajectory into temporal sub-segments to assess variance."""
    n = len(df)
    seg_size = n // num_segments
    segment_results: List[Dict[str, Any]] = []

    outage_mask = np.zeros(n, dtype=bool)
    for ev in events:
        outage_mask[ev.start_idx : ev.end_idx + 1] = True

    for s in range(num_segments):
        start_i = s * seg_size
        end_i = n if s == num_segments - 1 else (s + 1) * seg_size
        seg_df = df.iloc[start_i:end_i].copy().reset_index(drop=True)
        seg_outage = outage_mask[start_i:end_i]

        t_start = float(seg_df["timestamp"].iloc[0])
        t_end = float(seg_df["timestamp"].iloc[-1])

        # Evaluate baselines and VYRA on segment
        b_hybrid = run_baseline_trajectory(seg_df, "fixed_hybrid", outage_mask=seg_outage)
        b_react = run_baseline_trajectory(seg_df, "reactive", outage_mask=seg_outage)
        vyra_out = policy_runner_fn(seg_df, outage_mask=seg_outage)

        segment_results.append({
            "segment_id": f"V-S3a_seg_{s+1}",
            "start_time_s": t_start,
            "end_time_s": t_end,
            "duration_s": round(t_end - t_start, 1),
            "outage_epochs": int(np.sum(seg_outage)),
            "fixed_hybrid_ate": b_hybrid["ate_summary"].mean_ate_m,
            "reactive_ate": b_react["ate_summary"].mean_ate_m,
            "vyra_adaptive_ate": vyra_out["ate_summary"].mean_ate_m,
            "fixed_hybrid_viol_5m": b_hybrid["ate_summary"].violation_rate_5m_pct,
            "reactive_viol_5m": b_react["ate_summary"].violation_rate_5m_pct,
            "vyra_adaptive_viol_5m": vyra_out["ate_summary"].violation_rate_5m_pct,
            "vyra_handovers": vyra_out["handover_summary"].total_handovers,
            "reactive_handovers": b_react["handover_summary"].total_handovers,
        })

    # Summary statistics across segments
    vyra_ates = [r["vyra_adaptive_ate"] for r in segment_results]
    react_ates = [r["reactive_ate"] for r in segment_results]
    hybrid_ates = [r["fixed_hybrid_ate"] for r in segment_results]

    summary = {
        "num_segments": num_segments,
        "segments": segment_results,
        "vyra_ate": {
            "mean": round(float(np.mean(vyra_ates)), 3),
            "median": round(float(np.median(vyra_ates)), 3),
            "std": round(float(np.std(vyra_ates)), 3),
            "best": round(float(np.min(vyra_ates)), 3),
            "worst": round(float(np.max(vyra_ates)), 3),
        },
        "reactive_ate": {
            "mean": round(float(np.mean(react_ates)), 3),
            "median": round(float(np.median(react_ates)), 3),
            "std": round(float(np.std(react_ates)), 3),
            "best": round(float(np.min(react_ates)), 3),
            "worst": round(float(np.max(react_ates)), 3),
        },
        "fixed_hybrid_ate": {
            "mean": round(float(np.mean(hybrid_ates)), 3),
            "median": round(float(np.median(hybrid_ates)), 3),
            "std": round(float(np.std(hybrid_ates)), 3),
            "best": round(float(np.min(hybrid_ates)), 3),
            "worst": round(float(np.max(hybrid_ates)), 3),
        },
    }

    return summary
