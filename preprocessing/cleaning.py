"""Data Cleaning Module for VYRA.

Performs conservative cleaning of vehicular navigation trajectories:
removes exact duplicates, enforces monotonic chronological ordering,
flags impossible geodetic coordinates, and records an auditable transformation log.

CRITICAL PRINCIPLE:
INVALID DATA != DEGRADED GNSS.
Degraded GNSS measurements (e.g., elevated DOP, low satellite count, noisy positions)
are essential scientific phenomena for VYRA and must NOT be deleted.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from preprocessing.dataset_loader import TrajectoryData

logger = logging.getLogger(__name__)


@dataclass
class CleaningReport:
    """Audit log recording all operations performed during trajectory cleaning."""

    trajectory_id: str
    initial_rows: int
    final_rows: int
    exact_duplicates_removed: int = 0
    non_numeric_timestamps_removed: int = 0
    timestamp_reordered: bool = False
    impossible_geodetic_flagged: int = 0
    notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "trajectory_id": self.trajectory_id,
            "initial_rows": self.initial_rows,
            "final_rows": self.final_rows,
            "exact_duplicates_removed": self.exact_duplicates_removed,
            "non_numeric_timestamps_removed": self.non_numeric_timestamps_removed,
            "timestamp_reordered": self.timestamp_reordered,
            "impossible_geodetic_flagged": self.impossible_geodetic_flagged,
            "notes": self.notes,
        }


def clean_trajectory(
    traj: TrajectoryData,
    remove_exact_duplicates: bool = True,
    sort_by_timestamp: bool = True,
    filter_impossible_geodetic: bool = True,
) -> Tuple[TrajectoryData, CleaningReport]:
    """Conservatively clean a single trajectory while strictly preserving degradation.

    Args:
        traj: Input TrajectoryData object.
        remove_exact_duplicates: Whether to drop identical adjacent/duplicate rows.
        sort_by_timestamp: Whether to sort chronologically by timestamp.
        filter_impossible_geodetic: Flag or drop physically impossible lat/lon coordinates.

    Returns:
        Tuple of (Cleaned TrajectoryData, CleaningReport).
    """
    df = traj.df.copy()
    initial_rows = len(df)
    report = CleaningReport(
        trajectory_id=traj.trajectory_id,
        initial_rows=initial_rows,
        final_rows=initial_rows,
    )

    # 1. Clean non-numeric or NaN timestamps
    timestamp_col = "timestamp"
    if timestamp_col in df.columns:
        valid_ts = pd.to_numeric(df[timestamp_col], errors="coerce").notna()
        invalid_ts_count = int((~valid_ts).sum())
        if invalid_ts_count > 0:
            df = df[valid_ts].copy()
            report.non_numeric_timestamps_removed = invalid_ts_count
            report.notes.append(
                f"Removed {invalid_ts_count} rows with invalid/NaN timestamps."
            )

    # 2. Remove exact duplicates
    if remove_exact_duplicates:
        before_dup = len(df)
        df.drop_duplicates(inplace=True)
        dups_removed = before_dup - len(df)
        report.exact_duplicates_removed = dups_removed
        if dups_removed > 0:
            report.notes.append(
                f"Removed {dups_removed} exact duplicate records."
            )

    # 3. Sort chronologically by timestamp
    if sort_by_timestamp and timestamp_col in df.columns:
        ts_values = df[timestamp_col].values
        if not np.all(ts_values[:-1] <= ts_values[1:]):
            df.sort_values(by=timestamp_col, inplace=True, kind="mergesort")
            report.timestamp_reordered = True
            report.notes.append(
                "Reordered records chronologically by timestamp."
            )

    # 4. Handle impossible geodetic values (latitude not in [-90, 90], longitude not in [-180, 180])
    # Notice: We do NOT delete degraded fixes with high HDOP or 0 satellites.
    # We only flag or drop physically impossible coordinates (e.g. lat=9999 or NaN where mandatory).
    if (
        filter_impossible_geodetic
        and "latitude" in df.columns
        and "longitude" in df.columns
    ):
        impossible_mask = (
            (df["latitude"].abs() > 90.0) | (df["longitude"].abs() > 180.0)
        ) & df["latitude"].notna() & df["longitude"].notna()
        impossible_count = int(impossible_mask.sum())
        if impossible_count > 0:
            # Set impossible values to NaN rather than deleting rows to preserve IMU continuity
            df.loc[impossible_mask, ["latitude", "longitude"]] = np.nan
            report.impossible_geodetic_flagged = impossible_count
            report.notes.append(
                f"Flagged {impossible_count} impossible lat/lon values as NaN (preserving IMU records)."
            )

    df.reset_index(drop=True, inplace=True)
    report.final_rows = len(df)

    cleaned_meta = dict(traj.metadata)
    cleaned_meta["cleaning_report"] = report.to_dict()

    cleaned_traj = TrajectoryData(
        trajectory_id=traj.trajectory_id,
        df=df,
        file_path=traj.file_path,
        metadata=cleaned_meta,
    )

    logger.debug(
        "Cleaned trajectory '%s': %d -> %d rows",
        traj.trajectory_id,
        initial_rows,
        len(df),
    )
    return cleaned_traj, report


def clean_all_trajectories(
    trajectories: Dict[str, TrajectoryData],
) -> Tuple[Dict[str, TrajectoryData], Dict[str, Dict[str, Any]]]:
    """Clean all loaded trajectories and return dictionary of reports."""
    cleaned: Dict[str, TrajectoryData] = {}
    reports: Dict[str, Dict[str, Any]] = {}
    for tid, traj in trajectories.items():
        c_traj, rep = clean_trajectory(traj)
        cleaned[tid] = c_traj
        reports[tid] = rep.to_dict()
    return cleaned, reports
