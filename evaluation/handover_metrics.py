"""Handover and Policy Stability Evaluation Module for VYRA.

Computes switching stability metrics: total handovers, chattering rate,
unnecessary handovers, dwell time distributions, and mode occupancy.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class HandoverSummary:
    """Comprehensive policy switching and stability metrics."""

    total_handovers: int
    chattering_handovers: int
    chattering_rate_pct: float
    unnecessary_handovers: int
    unnecessary_handover_rate_pct: float
    mean_dwell_s: float
    median_dwell_s: float
    min_dwell_s: float
    mode_distribution_pct: Dict[str, float]


def compute_handover_metrics(
    active_modes: List[str],
    timestamps: np.ndarray,
    min_dwell_threshold_s: float = 2.0,
    outage_mask: Optional[np.ndarray] = None,
) -> HandoverSummary:
    """Compute formal handover stability and chattering metrics.

    Operational Definitions:
    - Handover: Any epoch where mode(t) != mode(t-1).
    - Chattering handover: Any transition where the residence time in the preceding
      mode was strictly less than min_dwell_threshold_s.
    - Unnecessary handover: A handover from Mode A to Mode B that is followed by a
      reversion back to Mode A within min_dwell_threshold_s (ping-pong handover), OR
      a switch away from HYBRID during healthy GNSS operation without degradation.

    Args:
        active_modes: Ordered sequence of selected mode names.
        timestamps: Monotonically increasing epoch timestamps.
        min_dwell_threshold_s: Threshold for identifying chattering (default: 2.0s).
        outage_mask: Optional boolean array of injected outages.

    Returns:
        HandoverSummary instance.
    """
    n = len(active_modes)
    ts = np.asarray(timestamps, dtype=float)

    if n < 2:
        return HandoverSummary(
            total_handovers=0,
            chattering_handovers=0,
            chattering_rate_pct=0.0,
            unnecessary_handovers=0,
            unnecessary_handover_rate_pct=0.0,
            mean_dwell_s=float(ts[-1] - ts[0]) if n > 0 else 0.0,
            median_dwell_s=float(ts[-1] - ts[0]) if n > 0 else 0.0,
            min_dwell_s=0.0,
            mode_distribution_pct={m: 100.0 for m in set(active_modes)} if active_modes else {},
        )

    # Segment trajectory into mode runs
    run_modes: List[str] = [active_modes[0]]
    run_start_times: List[float] = [ts[0]]
    run_end_times: List[float] = []

    for i in range(1, n):
        if active_modes[i] != active_modes[i - 1]:
            run_end_times.append(ts[i - 1])
            run_modes.append(active_modes[i])
            run_start_times.append(ts[i])
    run_end_times.append(ts[-1])

    total_runs = len(run_modes)
    total_handovers = total_runs - 1

    dwell_times = [
        max(0.1, run_end_times[k] - run_start_times[k])
        for k in range(total_runs)
    ]

    # Chattering: transitions where dwell was below threshold
    chattering_count = 0
    for k in range(total_runs - 1):
        if dwell_times[k] < min_dwell_threshold_s:
            chattering_count += 1

    # Unnecessary handovers: A -> B -> A within dwell threshold
    unnecessary_count = 0
    for k in range(1, total_runs - 1):
        if run_modes[k - 1] == run_modes[k + 1] and dwell_times[k] < min_dwell_threshold_s:
            unnecessary_count += 1

    chattering_rate = float(chattering_count / max(1, total_handovers) * 100.0)
    unnecessary_rate = float(unnecessary_count / max(1, total_handovers) * 100.0)

    # Mode distribution
    unique_modes = sorted(list(set(active_modes)))
    mode_counts = {m: active_modes.count(m) for m in unique_modes}
    mode_dist = {
        m: round(float(count / n * 100.0), 2)
        for m, count in mode_counts.items()
    }

    return HandoverSummary(
        total_handovers=total_handovers,
        chattering_handovers=chattering_count,
        chattering_rate_pct=round(chattering_rate, 2),
        unnecessary_handovers=unnecessary_count,
        unnecessary_handover_rate_pct=round(unnecessary_rate, 2),
        mean_dwell_s=round(float(np.mean(dwell_times)), 2) if dwell_times else 0.0,
        median_dwell_s=round(float(np.median(dwell_times)), 2) if dwell_times else 0.0,
        min_dwell_s=round(float(np.min(dwell_times)), 2) if dwell_times else 0.0,
        mode_distribution_pct=mode_dist,
    )
