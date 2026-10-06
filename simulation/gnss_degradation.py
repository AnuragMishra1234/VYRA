"""Controlled GNSS Degradation and Scenario Simulation Module for VYRA.

CRITICAL ANTI-LEAKAGE AND SCIENTIFIC RIGOR SPECIFICATION:
1. Terminology: These are SOFTWARE-SIMULATED GNSS CONDITIONS (not field jamming).
2. Anti-Leakage: During degradation and outage intervals, operational GNSS measurements
   are degraded or masked. Pristine positions are strictly sequestered in ground-truth
   columns ('gt_latitude', 'gt_longitude', etc.) and are NEVER accessible to online filters.
3. Scenarios Supported:
   - Normal GNSS (pristine authentic CAN/GNSS)
   - Gradual Degradation Profile (Normal -> Quality Decline -> Degraded -> Outage -> Recovery)
   - Sudden Outage (Instantaneous signal loss with zero lead-time warning)
   - Multi-duration Outages (T in {2s, 5s, 10s, 20s, 30s})
   - Controlled GNSS Recovery (Reacquisition transient)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

STANDARD_OUTAGE_DURATIONS: List[float] = [2.0, 5.0, 10.0, 20.0, 30.0]


@dataclass(frozen=True)
class DegradationEvent:
    """Specification of an injected GNSS degradation or outage event."""

    event_id: int
    event_type: str  # 'gradual', 'sudden_outage', 'recovery'
    start_time: float
    end_time: float
    duration_s: float
    start_idx: int
    end_idx: int
    degradation_onset_time: float  # Epoch when gradual decline begins
    outage_onset_time: float  # Epoch when full signal loss begins
    recovery_end_time: float  # Epoch when pristine tracking resumes


def generate_gradual_degradation_schedule(
    df: pd.DataFrame,
    durations_s: Optional[List[float]] = None,
    decline_duration_s: float = 4.0,
    recovery_duration_s: float = 3.0,
    inter_event_spacing_s: float = 60.0,
    warmup_s: float = 30.0,
    cooldown_s: float = 30.0,
) -> List[DegradationEvent]:
    """Generate deterministic, non-overlapping gradual degradation events.

    Profile per event:
    1. Normal tracking (t < t_decline)
    2. Quality Decline: t_decline <= t < t_outage (decline_duration_s)
    3. Outage: t_outage <= t < t_recovery (duration_s)
    4. Recovery: t_recovery <= t < t_clean (recovery_duration_s)

    Args:
        df: Trajectory DataFrame with 'timestamp' column.
        durations_s: List of outage core durations (default: [2, 5, 10, 20, 30]).
        decline_duration_s: Lead-in deterioration phase duration.
        recovery_duration_s: Post-outage reacquisition duration.
        inter_event_spacing_s: Clean tracking between consecutive events.
        warmup_s: Initial clean tracking period.
        cooldown_s: Trailing clean tracking period before trajectory end.

    Returns:
        List of DegradationEvent specifications.
    """
    if durations_s is None:
        durations_s = STANDARD_OUTAGE_DURATIONS

    ts = df["timestamp"].to_numpy(dtype=float)
    t_min = ts[0] + warmup_s
    t_max = ts[-1] - cooldown_s

    events: List[DegradationEvent] = []
    current_time = t_min
    event_idx = 0

    duration_cycle = list(durations_s)
    cycle_idx = 0

    while current_time < t_max and cycle_idx < len(duration_cycle) * 4:
        outage_d = duration_cycle[cycle_idx % len(duration_cycle)]
        cycle_idx += 1

        t_decline = current_time
        t_outage = t_decline + decline_duration_s
        t_recovery = t_outage + outage_d
        t_clean = t_recovery + recovery_duration_s

        if t_clean > t_max:
            break

        idx_start = int(np.searchsorted(ts, t_decline))
        idx_end = int(np.searchsorted(ts, t_clean))

        if idx_end > idx_start:
            events.append(
                DegradationEvent(
                    event_id=event_idx,
                    event_type="gradual",
                    start_time=float(ts[idx_start]),
                    end_time=float(ts[idx_end]),
                    duration_s=round(float(outage_d), 2),
                    start_idx=idx_start,
                    end_idx=idx_end,
                    degradation_onset_time=float(t_decline),
                    outage_onset_time=float(t_outage),
                    recovery_end_time=float(t_clean),
                )
            )
            event_idx += 1

        current_time = t_clean + inter_event_spacing_s

    logger.info("Generated %d gradual degradation events.", len(events))
    return events


def generate_sudden_outage_schedule(
    df: pd.DataFrame,
    durations_s: Optional[List[float]] = None,
    inter_event_spacing_s: float = 60.0,
    warmup_s: float = 30.0,
    cooldown_s: float = 30.0,
) -> List[DegradationEvent]:
    """Generate sudden outage events with zero lead-in warning."""
    if durations_s is None:
        durations_s = STANDARD_OUTAGE_DURATIONS

    ts = df["timestamp"].to_numpy(dtype=float)
    t_min = ts[0] + warmup_s
    t_max = ts[-1] - cooldown_s

    events: List[DegradationEvent] = []
    current_time = t_min
    event_idx = 0

    duration_cycle = list(durations_s)
    cycle_idx = 0

    while current_time < t_max and cycle_idx < len(duration_cycle) * 4:
        outage_d = duration_cycle[cycle_idx % len(duration_cycle)]
        cycle_idx += 1

        t_start = current_time
        t_end = t_start + outage_d

        if t_end > t_max:
            break

        idx_start = int(np.searchsorted(ts, t_start))
        idx_end = int(np.searchsorted(ts, t_end))

        if idx_end > idx_start:
            events.append(
                DegradationEvent(
                    event_id=event_idx,
                    event_type="sudden_outage",
                    start_time=float(ts[idx_start]),
                    end_time=float(ts[idx_end]),
                    duration_s=round(float(outage_d), 2),
                    start_idx=idx_start,
                    end_idx=idx_end,
                    degradation_onset_time=float(t_start),
                    outage_onset_time=float(t_start),
                    recovery_end_time=float(t_end),
                )
            )
            event_idx += 1

        current_time = t_end + inter_event_spacing_s

    logger.info("Generated %d sudden outage events.", len(events))
    return events


def inject_controlled_degradation(
    df: pd.DataFrame,
    events: List[DegradationEvent],
    seed: int = 42,
) -> pd.DataFrame:
    """Inject controlled GNSS degradation and outages while preserving pristine ground truth.

    Modifications:
    - Adds 'gt_latitude', 'gt_longitude', 'gt_altitude' preserving pristine reference.
    - Adds 'is_simulated_degraded', 'is_simulated_outage', 'scenario_phase'.
    - In gradual decline phase:
        * Satellites attenuate gradually
        * Composite quality score drops linearly
        * Position observations incur escalating noise
    - In outage phase:
        * Satellites = 0
        * Quality = 0.0
        * Outage mask = True
    - In recovery phase:
        * Satellites and quality ramp smoothly back to normal over recovery interval
    """
    rng = np.random.RandomState(seed)
    df_out = df.copy()
    n = len(df_out)
    ts = df_out["timestamp"].to_numpy(dtype=float)

    # 1. Preserve Ground Truth Coordinates
    if "latitude" in df_out.columns and "gt_latitude" not in df_out.columns:
        df_out["gt_latitude"] = df_out["latitude"].copy()
    if "longitude" in df_out.columns and "gt_longitude" not in df_out.columns:
        df_out["gt_longitude"] = df_out["longitude"].copy()
    if "altitude" in df_out.columns and "gt_altitude" not in df_out.columns:
        df_out["gt_altitude"] = df_out["altitude"].copy()
    if "speed_mps" in df_out.columns and "gt_speed_mps" not in df_out.columns:
        df_out["gt_speed_mps"] = df_out["speed_mps"].copy()

    # Tracking arrays
    is_outage = np.zeros(n, dtype=bool)
    is_degraded = np.zeros(n, dtype=bool)
    scenario_phase = np.array(["nominal"] * n, dtype=object)

    # Base arrays to perturb
    lats = df_out["gt_latitude"].to_numpy(dtype=float).copy()
    lons = df_out["gt_longitude"].to_numpy(dtype=float).copy()

    # Pre-extract or initialize quality arrays
    if "satellites_available" in df_out.columns:
        orig_sats = df_out["satellites_available"].to_numpy(dtype=float).copy()
    else:
        orig_sats = np.full(n, 10.0)

    if "composite_quality_score" in df_out.columns:
        orig_q = df_out["composite_quality_score"].to_numpy(dtype=float).copy()
    else:
        orig_q = np.full(n, 0.95)

    pert_sats = orig_sats.copy()
    pert_q = orig_q.copy()

    # Apply degradation events
    for ev in events:
        s_idx, e_idx = ev.start_idx, ev.end_idx
        for i in range(s_idx, min(e_idx + 1, n)):
            t = ts[i]

            if ev.event_type == "gradual":
                if t < ev.outage_onset_time:
                    # Phase 1: Quality Decline
                    prog = (t - ev.degradation_onset_time) / max(0.1, (ev.outage_onset_time - ev.degradation_onset_time))
                    prog = np.clip(prog, 0.0, 1.0)
                    scenario_phase[i] = "quality_decline"
                    is_degraded[i] = True
                    # Smooth attenuation
                    pert_sats[i] = max(1.0, orig_sats[i] * (1.0 - 0.7 * prog))
                    pert_q[i] = max(0.05, orig_q[i] * (1.0 - 0.75 * prog))
                    # Add small position noise (scaled up to 4 meters)
                    noise_m = rng.normal(0.0, 1.0 + 3.0 * prog, size=2)
                    d_lat = noise_m[1] / 111139.0
                    d_lon = noise_m[0] / (111139.0 * max(1e-3, np.cos(np.radians(lats[i]))))
                    lats[i] += d_lat
                    lons[i] += d_lon

                elif t < ev.recovery_end_time - (ev.recovery_end_time - ev.outage_onset_time - ev.duration_s):
                    # Phase 2: Full Outage
                    scenario_phase[i] = "outage"
                    is_outage[i] = True
                    is_degraded[i] = True
                    pert_sats[i] = 0.0
                    pert_q[i] = 0.0

                else:
                    # Phase 3: Recovery
                    t_rec_start = ev.outage_onset_time + ev.duration_s
                    rec_dur = max(0.1, ev.recovery_end_time - t_rec_start)
                    prog = (t - t_rec_start) / rec_dur
                    prog = np.clip(prog, 0.0, 1.0)
                    scenario_phase[i] = "recovery"
                    is_degraded[i] = (prog < 0.8)
                    pert_sats[i] = orig_sats[i] * prog
                    pert_q[i] = orig_q[i] * prog
                    # Small settling noise
                    noise_m = rng.normal(0.0, 2.0 * (1.0 - prog), size=2)
                    d_lat = noise_m[1] / 111139.0
                    d_lon = noise_m[0] / (111139.0 * max(1e-3, np.cos(np.radians(lats[i]))))
                    lats[i] += d_lat
                    lons[i] += d_lon

            elif ev.event_type == "sudden_outage":
                scenario_phase[i] = "outage"
                is_outage[i] = True
                is_degraded[i] = True
                pert_sats[i] = 0.0
                pert_q[i] = 0.0

    df_out["latitude"] = lats
    df_out["longitude"] = lons
    df_out["satellites_available"] = pert_sats
    df_out["effective_satellites"] = pert_sats
    df_out["composite_quality_score"] = pert_q
    df_out["is_simulated_outage"] = is_outage
    df_out["is_simulated_degraded"] = is_degraded
    df_out["scenario_phase"] = scenario_phase

    return df_out
