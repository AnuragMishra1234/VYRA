"""GNSS Outage Simulation and Scenario Generation Module for VYRA.

Provides deterministic, reproducible GNSS outage injection across standard
evaluation durations T in {1s, 2s, 5s, 10s, 20s, 30s}.

CRITICAL ANTI-LEAKAGE SPECIFICATION:
During outage intervals, GNSS measurements are masked (satellites = 0, quality = 0.0).
Pristine positions are preserved exclusively as ground truth for offline validation.
They are NEVER accessible to online estimation algorithms.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

STANDARD_OUTAGE_DURATIONS: List[float] = [1.0, 2.0, 5.0, 10.0, 20.0, 30.0]


@dataclass(frozen=True)
class GNSSOutageScenario:
    """Specification of an injected GNSS outage event."""

    outage_id: int
    start_time: float
    end_time: float
    duration_s: float
    start_idx: int
    end_idx: int


def generate_outage_schedule(
    df: pd.DataFrame,
    durations_s: Optional[List[float]] = None,
    inter_outage_spacing_s: float = 60.0,
    warmup_s: float = 30.0,
    cooldown_s: float = 30.0,
) -> List[GNSSOutageScenario]:
    """Generate deterministic, non-overlapping outage intervals across a trajectory.

    Args:
        df: Trajectory DataFrame with 'timestamp' column.
        durations_s: List of outage durations to insert (e.g. [1.0, 2.0, 5.0, 10.0, 20.0, 30.0]).
        inter_outage_spacing_s: Minimum clean tracking time between consecutive outages.
        warmup_s: Initial pristine tracking duration before first outage.
        cooldown_s: Trailing duration before trajectory end.

    Returns:
        List of GNSSOutageScenario objects.
    """
    if durations_s is None:
        durations_s = STANDARD_OUTAGE_DURATIONS

    ts = df["timestamp"].to_numpy(dtype=float)
    t_min = ts[0] + warmup_s
    t_max = ts[-1] - cooldown_s

    scenarios: List[GNSSOutageScenario] = []
    current_time = t_min
    outage_idx = 0

    # Cycle through requested durations
    duration_cycle = list(durations_s)
    cycle_idx = 0

    while current_time < t_max and cycle_idx < len(duration_cycle) * 3:
        d_sec = duration_cycle[cycle_idx % len(duration_cycle)]
        cycle_idx += 1

        t_start = current_time
        t_end = t_start + d_sec

        if t_end > t_max:
            break

        # Locate sample indices
        idx_start = int(np.searchsorted(ts, t_start))
        idx_end = int(np.searchsorted(ts, t_end))

        if idx_end > idx_start:
            scenarios.append(
                GNSSOutageScenario(
                    outage_id=outage_idx,
                    start_time=float(ts[idx_start]),
                    end_time=float(ts[idx_end]),
                    duration_s=round(float(ts[idx_end] - ts[idx_start]), 2),
                    start_idx=idx_start,
                    end_idx=idx_end,
                )
            )
            outage_idx += 1

        # Advance time by outage duration plus recovery spacing
        current_time = t_end + inter_outage_spacing_s

    logger.info("Generated %d deterministic outage scenarios.", len(scenarios))
    return scenarios


def inject_gnss_outages(
    df: pd.DataFrame,
    scenarios: List[GNSSOutageScenario],
) -> pd.DataFrame:
    """Mask GNSS channels during scheduled outages while preserving ground truth.

    Appends:
    - 'is_simulated_outage': boolean flag
    - Preserves unperturbed ground truth coordinates in 'gt_latitude', 'gt_longitude'.
    """
    df_out = df.copy()
    n = len(df_out)

    is_outage = np.zeros(n, dtype=bool)
    for sc in scenarios:
        is_outage[sc.start_idx : sc.end_idx + 1] = True

    df_out["is_simulated_outage"] = is_outage

    # Preserve pristine reference GNSS
    if "latitude" in df_out.columns and "gt_latitude" not in df_out.columns:
        df_out["gt_latitude"] = df_out["latitude"].copy()
    if "longitude" in df_out.columns and "gt_longitude" not in df_out.columns:
        df_out["gt_longitude"] = df_out["longitude"].copy()
    if "altitude" in df_out.columns and "gt_altitude" not in df_out.columns:
        df_out["gt_altitude"] = df_out["altitude"].copy()

    # Mask operational GNSS indicators during outages
    if "satellites_available" in df_out.columns:
        df_out.loc[is_outage, "satellites_available"] = 0.0
    if "composite_quality_score" in df_out.columns:
        df_out.loc[is_outage, "composite_quality_score"] = 0.0
    if "is_currently_degraded" in df_out.columns:
        df_out.loc[is_outage, "is_currently_degraded"] = True

    return df_out
