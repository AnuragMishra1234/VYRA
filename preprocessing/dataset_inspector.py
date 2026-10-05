"""Dataset Inspector Module for VYRA.

Computes comprehensive statistical, sensor-availability, and continuity audits
for vehicular navigation benchmark recordings and writes machine-readable reports.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

from preprocessing.dataset_loader import (
    DatasetNotFoundError,
    TrajectoryData,
    discover_and_load_trajectories,
)

logger = logging.getLogger(__name__)


def inspect_single_trajectory(traj: TrajectoryData) -> Dict[str, Any]:
    """Calculate structural and sensor availability statistics for a single trajectory.

    Args:
        traj: TrajectoryData instance.

    Returns:
        Dictionary containing trajectory-level audit statistics.
    """
    df = traj.df
    total_samples = len(df)
    timestamps = pd.to_numeric(df["timestamp"], errors="coerce").dropna().values

    # Sampling delta analysis
    if len(timestamps) > 1:
        diffs = np.diff(timestamps)
        # Filter negative or zero diffs for interval statistics
        positive_diffs = diffs[diffs > 0]
        dt_mean = float(np.mean(positive_diffs)) if len(positive_diffs) > 0 else None
        dt_std = float(np.std(positive_diffs)) if len(positive_diffs) > 0 else None
        dt_min = float(np.min(positive_diffs)) if len(positive_diffs) > 0 else None
        dt_max = float(np.max(positive_diffs)) if len(positive_diffs) > 0 else None
        duplicate_timestamps = int(np.sum(diffs == 0))
        non_monotonic_count = int(np.sum(diffs < 0))
        duration_seconds = float(timestamps[-1] - timestamps[0])
    else:
        dt_mean = dt_std = dt_min = dt_max = None
        duplicate_timestamps = 0
        non_monotonic_count = 0
        duration_seconds = 0.0

    # Sensor presence detection
    gnss_cols = [
        c
        for c in ["latitude", "longitude", "satellites_available", "hdop", "vdop"]
        if c in df.columns
    ]
    imu_cols = [
        c
        for c in ["acc_x", "acc_y", "acc_z", "gyro_x", "gyro_y", "gyro_z"]
        if c in df.columns
    ]
    gt_cols = [
        c
        for c in [
            "gt_latitude",
            "gt_longitude",
            "gt_altitude",
            "gt_x",
            "gt_y",
            "gt_z",
        ]
        if c in df.columns
    ]

    has_gnss = len(gnss_cols) > 0 and (
        df[gnss_cols].notna().any().any() if gnss_cols else False
    )
    has_imu = len(imu_cols) > 0 and (
        df[imu_cols].notna().any().any() if imu_cols else False
    )
    has_gt = len(gt_cols) > 0 and (
        df[gt_cols].notna().any().any() if gt_cols else False
    )

    # Missing values
    missing_by_col = {str(k): int(v) for k, v in df.isna().sum().to_dict().items()}

    # Coordinate ranges
    coord_ranges: Dict[str, Any] = {}
    if "latitude" in df.columns and "longitude" in df.columns:
        valid_lat = df["latitude"].dropna()
        valid_lon = df["longitude"].dropna()
        if len(valid_lat) > 0:
            coord_ranges["lat_min"] = float(valid_lat.min())
            coord_ranges["lat_max"] = float(valid_lat.max())
        if len(valid_lon) > 0:
            coord_ranges["lon_min"] = float(valid_lon.min())
            coord_ranges["lon_max"] = float(valid_lon.max())

    return {
        "trajectory_id": traj.trajectory_id,
        "sample_count": total_samples,
        "duration_seconds": duration_seconds,
        "sampling_interval_stats": {
            "mean_dt_seconds": dt_mean,
            "std_dt_seconds": dt_std,
            "min_dt_seconds": dt_min,
            "max_dt_seconds": dt_max,
        },
        "duplicate_timestamps": duplicate_timestamps,
        "non_monotonic_timestamps": non_monotonic_count,
        "sensor_availability": {
            "has_gnss": bool(has_gnss),
            "gnss_columns": gnss_cols,
            "has_imu": bool(has_imu),
            "imu_columns": imu_cols,
            "has_ground_truth": bool(has_gt),
            "ground_truth_columns": gt_cols,
        },
        "coordinate_ranges": coord_ranges,
        "missing_values": missing_by_col,
    }


def inspect_dataset(
    trajectories: Optional[Dict[str, TrajectoryData]] = None,
    raw_dir: Union[str, Path] = "data/raw",
    output_path: Union[str, Path] = "results/processed/dataset_inspection.json",
) -> Dict[str, Any]:
    """Perform dataset inspection across all trajectories and save machine-readable report.

    Args:
        trajectories: Optional preloaded trajectories mapping.
        raw_dir: Path to raw dataset directory if trajectories not provided.
        output_path: Path to output JSON inspection file.

    Returns:
        Structured audit report dictionary.
    """
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    if trajectories is None:
        try:
            trajectories = discover_and_load_trajectories(raw_dir=raw_dir)
        except DatasetNotFoundError as exc:
            report = {
                "status": "DATASET_NOT_FOUND",
                "message": str(exc),
                "raw_dir": str(Path(raw_dir).resolve()),
                "acquisition_instructions": (
                    "Please download the IO-VNBD dataset from https://github.com/onyekpeu/IO-VNBD "
                    "and place the trajectory CSV files in data/raw/."
                ),
                "trajectory_count": 0,
                "total_samples": 0,
            }
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            logger.warning(
                "Dataset not found at '%s'. Wrote missing status to '%s'.",
                raw_dir,
                out_file,
            )
            return report

    trajectory_reports: List[Dict[str, Any]] = []
    total_samples = 0
    total_duration = 0.0

    for tid, traj in sorted(trajectories.items()):
        treport = inspect_single_trajectory(traj)
        trajectory_reports.append(treport)
        total_samples += treport["sample_count"]
        total_duration += treport["duration_seconds"]

    report = {
        "status": "DATASET_INSPECTED",
        "dataset_name": "IO-VNBD",
        "raw_dir": str(Path(raw_dir).resolve()),
        "trajectory_count": len(trajectories),
        "total_samples": total_samples,
        "total_duration_hours": round(total_duration / 3600.0, 4),
        "trajectories": trajectory_reports,
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info(
        "Saved dataset inspection report (%d trajectories) to %s",
        len(trajectories),
        out_file,
    )
    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    inspect_dataset()
