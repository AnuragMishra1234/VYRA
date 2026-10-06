"""Drift Rate Evaluation Module for VYRA.

Computes positioning drift rates (meters per second, meters per minute)
specifically during GNSS denial / outage episodes or overall trajectory runs.
"""

from __future__ import annotations

import numpy as np


def compute_drift_rate(
    errors: np.ndarray,
    duration_s: float,
) -> float:
    """Compute empirical drift rate over an evaluation interval: (e_final - e_initial) / duration_s."""
    if duration_s <= 0 or len(errors) < 2:
        return 0.0
    err_delta = float(errors[-1] - errors[0])
    return max(0.0, float(err_delta / duration_s))


def compute_average_outage_drift_rate(
    pointwise_errors: np.ndarray,
    outage_mask: np.ndarray,
    sample_rate_hz: float = 10.0,
) -> float:
    """Compute mean drift rate across all contiguous outage episodes."""
    n = len(pointwise_errors)
    if n == 0 or not np.any(outage_mask):
        return 0.0

    in_outage = False
    start_idx = 0
    drift_rates = []

    for i in range(n):
        if outage_mask[i] and not in_outage:
            in_outage = True
            start_idx = i
        elif not outage_mask[i] and in_outage:
            in_outage = False
            dur_s = (i - start_idx) / sample_rate_hz
            if dur_s > 0:
                dr = (pointwise_errors[i - 1] - pointwise_errors[start_idx]) / dur_s
                drift_rates.append(max(0.0, dr))

    if in_outage:
        dur_s = (n - start_idx) / sample_rate_hz
        if dur_s > 0:
            dr = (pointwise_errors[-1] - pointwise_errors[start_idx]) / dur_s
            drift_rates.append(max(0.0, dr))

    return float(np.mean(drift_rates)) if drift_rates else 0.0
