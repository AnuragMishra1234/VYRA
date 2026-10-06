"""Sensor Dropout and Packet Loss Simulation Module for VYRA.

Simulates intermittent communication packet loss, missing IMU samples,
and intermittent GNSS telemetry dropouts to evaluate filter resilience.
"""

from __future__ import annotations

import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def inject_sensor_dropout(
    df: pd.DataFrame,
    dropout_rate: float = 0.05,
    burst_length_epochs: int = 5,
    target_sensor: str = "gnss",  # 'gnss', 'imu', 'both'
    seed: int = 42,
) -> pd.DataFrame:
    """Inject intermittent sensor packet loss into trajectory data.

    Args:
        df: Trajectory DataFrame.
        dropout_rate: Fraction of epochs experiencing dropout (0.0 to 1.0).
        burst_length_epochs: Length of consecutive missing epoch bursts.
        target_sensor: Target sensor modality ('gnss', 'imu', or 'both').
        seed: Random seed for deterministic reproducibility.

    Returns:
        DataFrame with simulated sensor dropouts.
    """
    df_out = df.copy()
    n = len(df_out)
    rng = np.random.RandomState(seed)

    # Determine burst start indices
    num_bursts = int((n * dropout_rate) / max(1, burst_length_epochs))
    if num_bursts <= 0:
        return df_out

    burst_starts = rng.choice(np.arange(10, n - burst_length_epochs - 10), size=num_bursts, replace=False)
    dropout_mask = np.zeros(n, dtype=bool)
    for b_start in burst_starts:
        dropout_mask[b_start : b_start + burst_length_epochs] = True

    df_out["is_sensor_dropout"] = dropout_mask

    if target_sensor in ("gnss", "both"):
        # Set quality to 0 and satellites to 0 during GNSS dropout
        if "composite_quality_score" in df_out.columns:
            df_out.loc[dropout_mask, "composite_quality_score"] = 0.0
        if "satellites_available" in df_out.columns:
            df_out.loc[dropout_mask, "satellites_available"] = 0.0

    if target_sensor in ("imu", "both"):
        # Zero-order hold on IMU accelerations / yaw rates during dropout
        for col in ["longitudinal_acceleration_mps2", "lateral_acceleration_mps2", "yaw_rate_deg_s", "yaw_rate_rad_s"]:
            if col in df_out.columns:
                vals = df_out[col].to_numpy().copy()
                for i in range(1, n):
                    if dropout_mask[i]:
                        vals[i] = vals[i - 1]
                df_out[col] = vals

    return df_out
