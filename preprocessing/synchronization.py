"""Sensor Synchronization Module for VYRA.

Performs causal temporal alignment between multimodal sensor streams (GNSS, IMU, odometry).

CRITICAL ANTI-LEAKAGE SPECIFICATION:
At decision time t, features must strictly use observations recorded at or before t (tau <= t).
Under NO circumstances may future GNSS observations (t + delta) be backward-interpolated
or backward-filled into feature representations for time t.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from preprocessing.dataset_loader import TrajectoryData

logger = logging.getLogger(__name__)


def synchronize_causally(
    df: pd.DataFrame,
    timestamp_col: str = "timestamp",
    target_dt: Optional[float] = 0.1,  # 10 Hz nominal
    fill_method: str = "forward",  # Strictly causal: previous observation only
) -> pd.DataFrame:
    """Perform strictly causal temporal synchronization and alignment.

    In a multi-sensor setup where IMU operates at a high frequency and GNSS operates
    at a lower frequency, this function ensures that at any sample epoch t, the state
    reflects the most recent valid GNSS fix recorded up to t, with ZERO lookahead.

    Args:
        df: Input DataFrame containing sensor records and timestamps.
        timestamp_col: Column name containing timestamps (seconds).
        target_dt: Optional target uniform sampling step (seconds). If None, keeps raw epochs.
        fill_method: Alignment fill method. Must be 'forward' (strictly causal).

    Returns:
        Synchronized DataFrame with strictly causal alignment.

    Raises:
        ValueError: If an anti-causal fill method (such as backward fill) is requested.
    """
    if fill_method != "forward":
        raise ValueError(
            f"Invalid fill_method '{fill_method}'. To prevent future information leakage, "
            f"only strictly causal 'forward' filling is permitted in VYRA."
        )

    df = df.copy()
    if df[timestamp_col].isna().any():
        df = df.dropna(subset=[timestamp_col])

    # Ensure chronological order
    df.sort_values(by=timestamp_col, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Detect negative timestamp deltas
    diffs = np.diff(df[timestamp_col].values)
    if np.any(diffs < 0):
        raise ValueError(
            "Non-monotonic timestamps detected in trajectory before synchronization."
        )

    # Track valid GNSS presence before forward-filling to compute age of fix accurately
    has_lat = "latitude" in df.columns
    if has_lat:
        raw_gnss_valid = df["latitude"].notna().values
        raw_timestamps = df[timestamp_col].values
        gnss_ages = np.zeros(len(df), dtype=float)
        last_t = raw_timestamps[0]
        for i in range(len(df)):
            if raw_gnss_valid[i]:
                last_t = raw_timestamps[i]
            gnss_ages[i] = raw_timestamps[i] - last_t
        df["gnss_age_seconds"] = gnss_ages

    # If uniform resampling is requested
    if target_dt is not None and target_dt > 0.0:
        t_start = df[timestamp_col].iloc[0]
        t_end = df[timestamp_col].iloc[-1]
        grid_timestamps = np.arange(t_start, t_end + (target_dt / 2.0), target_dt)

        # Merge onto grid using merge_asof backward (matches grid point t with latest record <= t)
        grid_df = pd.DataFrame({timestamp_col: grid_timestamps})
        synced_df = pd.merge_asof(
            grid_df,
            df,
            on=timestamp_col,
            direction="backward",  # Strictly causal: only samples where sample_t <= grid_t
        )
    else:
        # Causal forward fill only across existing epochs
        synced_df = df.ffill()

    synced_df.reset_index(drop=True, inplace=True)
    return synced_df


def synchronize_trajectory(
    traj: TrajectoryData, target_dt: Optional[float] = 0.1
) -> TrajectoryData:
    """Synchronize a TrajectoryData object causally."""
    synced_df = synchronize_causally(traj.df, target_dt=target_dt)
    meta = dict(traj.metadata)
    meta["synchronized"] = True
    meta["target_dt"] = target_dt
    meta["causal_direction"] = "backward_asof"

    return TrajectoryData(
        trajectory_id=traj.trajectory_id,
        df=synced_df,
        file_path=traj.file_path,
        metadata=meta,
    )
