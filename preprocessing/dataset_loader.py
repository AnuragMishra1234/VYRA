"""Dataset Loader Module for VYRA.

Responsible for discovering, loading, and validating raw trajectory benchmark
recordings (e.g., IO-VNBD CSV files) without future lookahead or fabrication.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DatasetNotFoundError(FileNotFoundError):
    """Raised when the specified raw dataset directory or files are missing."""


class DatasetValidationError(ValueError):
    """Raised when raw dataset records fail structural or schema validation."""


@dataclass
class TrajectoryData:
    """Standardized in-memory container for a single vehicular trajectory."""

    trajectory_id: str
    df: pd.DataFrame
    file_path: Optional[Path] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.df.empty:
            raise DatasetValidationError(
                f"Trajectory '{self.trajectory_id}' contains an empty DataFrame."
            )
        if "timestamp" not in self.df.columns:
            raise DatasetValidationError(
                f"Trajectory '{self.trajectory_id}' is missing required 'timestamp' column."
            )


import re

# Standard canonical column name mapping from known IO-VNBD headers to canonical names
CANONICAL_COLUMN_MAPPINGS: Dict[str, str] = {
    # Time / Epoch
    "time since start of day seconds": "timestamp",
    "time since start of day": "timestamp",
    "time": "timestamp",
    "timestamp": "timestamp",
    "t": "timestamp",
    # Satellites
    "no of gps satellites available": "satellites_available",
    "satellites available": "satellites_available",
    "satellites": "satellites_available",
    # Coordinates
    "latitude degrees": "latitude",
    "gps latitude": "latitude",
    "latitude": "latitude",
    "lat": "latitude",
    "longitude degrees": "longitude",
    "gps longitude": "longitude",
    "longitude": "longitude",
    "lon": "longitude",
    # Height / Altitude
    "height km": "height_km",
    "gps height": "height_km",
    "height": "height_km",
    "altitude": "altitude",
    # Velocity
    "velocity km hr": "velocity_kmh",
    "gps velocity": "velocity_kmh",
    "indicated vehicle speed km hr": "indicated_speed_kmh",
    "speed": "speed_mps",
    "speed mps": "speed_mps",
    # Heading
    "heading degrees": "heading_deg",
    "gps heading": "heading_deg",
    "heading": "heading_deg",
    # IMU / Kinematics
    "indicated longitudinal acceleration g": "acc_y_g",
    "longitudinal acceleration": "acc_y_g",
    "indicated lateral acceleration g": "acc_x_g",
    "lateral acceleration": "acc_x_g",
    "vertical acceleration": "acc_z",
    "acc x": "acc_x",
    "acc y": "acc_y",
    "acc z": "acc_z",
    "yaw rate deg sec": "yaw_rate_deg_s",
    "yaw rate": "yaw_rate_deg_s",
    "gyro x": "gyro_x",
    "gyro y": "gyro_y",
    "gyro z": "gyro_z",
    "steering angle degrees": "steering_angle_deg",
    # Quality / Other
    "sample period seconds": "sample_period",
    "sample period": "sample_period",
    "hdop": "hdop",
    "vdop": "vdop",
    "c n0": "c_n0",
    # Reference / Ground Truth if present
    "gt latitude": "gt_latitude",
    "gt longitude": "gt_longitude",
    "gt altitude": "gt_altitude",
}


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map known raw column variations into canonical lower-case identifiers and compute SI units.

    Args:
        df: Raw pandas DataFrame.

    Returns:
        DataFrame with standardized column names and SI unit conversions.
    """
    df = df.copy()
    rename_dict: Dict[str, str] = {}
    for col in df.columns:
        # Normalize: lower-case, remove punctuation/parentheses to single spaces
        norm_key = re.sub(r"[^a-z0-9]+", " ", str(col).lower()).strip()
        if norm_key in CANONICAL_COLUMN_MAPPINGS:
            rename_dict[col] = CANONICAL_COLUMN_MAPPINGS[norm_key]
        else:
            clean_name = norm_key.replace(" ", "_")
            rename_dict[col] = clean_name

    df.rename(columns=rename_dict, inplace=True)

    # Compute standard SI units if converted forms are missing
    if "height_km" in df.columns and "altitude" not in df.columns:
        df["altitude"] = pd.to_numeric(df["height_km"], errors="coerce") * 1000.0
    if "velocity_kmh" in df.columns and "speed_mps" not in df.columns:
        df["speed_mps"] = pd.to_numeric(df["velocity_kmh"], errors="coerce") / 3.6
    if "acc_y_g" in df.columns and "acc_y" not in df.columns:
        df["acc_y"] = pd.to_numeric(df["acc_y_g"], errors="coerce") * 9.80665
    if "acc_x_g" in df.columns and "acc_x" not in df.columns:
        df["acc_x"] = pd.to_numeric(df["acc_x_g"], errors="coerce") * 9.80665
    if "yaw_rate_deg_s" in df.columns and "gyro_z" not in df.columns:
        df["gyro_z"] = np.radians(pd.to_numeric(df["yaw_rate_deg_s"], errors="coerce"))

    return df


def load_single_trajectory(
    file_path: Union[str, Path], trajectory_id: Optional[str] = None
) -> TrajectoryData:
    """Load a single trajectory file (CSV format).

    Args:
        file_path: Path to CSV file.
        trajectory_id: Optional custom identifier; defaults to file stem.

    Returns:
        TrajectoryData object with standardized columns.

    Raises:
        DatasetNotFoundError: If file does not exist.
        DatasetValidationError: If file is empty or missing essential fields.
    """
    path = Path(file_path)
    if not path.is_file():
        raise DatasetNotFoundError(f"Trajectory file not found: {path.resolve()}")

    tid = trajectory_id or path.stem

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise DatasetValidationError(
            f"Failed to parse CSV file '{path.name}': {exc}"
        ) from exc

    if df.empty:
        raise DatasetValidationError(f"File '{path.name}' is empty.")

    df = standardize_columns(df)

    # Validate essential timestamp
    if "timestamp" not in df.columns:
        raise DatasetValidationError(
            f"Trajectory '{tid}' in '{path.name}' does not contain an identifiable timestamp column. "
            f"Available columns: {list(df.columns)}"
        )

    # Ensure numeric timestamp
    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")
    if df["timestamp"].isna().all():
        raise DatasetValidationError(
            f"Trajectory '{tid}' has all non-numeric timestamps."
        )

    # Check for unit conversions (e.g. if GPS Velocity was explicitly km/h)
    # If speed values are typically km/h from ECU, note in metadata
    meta = {
        "raw_file": str(path.resolve()),
        "raw_rows": len(df),
        "raw_columns": list(df.columns),
        "trajectory_id": tid,
    }

    return TrajectoryData(trajectory_id=tid, df=df, file_path=path, metadata=meta)


def discover_and_load_trajectories(
    raw_dir: Union[str, Path] = "data/raw", file_pattern: str = "*.csv"
) -> Dict[str, TrajectoryData]:
    """Discover and load all trajectory files in raw directory.

    Args:
        raw_dir: Path to directory containing raw trajectory files.
        file_pattern: File glob pattern (defaults to '*.csv').

    Returns:
        Dictionary mapping trajectory_id to TrajectoryData.

    Raises:
        DatasetNotFoundError: If directory does not exist or contains no matching files.
    """
    raw_path = Path(raw_dir)
    if not raw_path.exists():
        raise DatasetNotFoundError(
            f"Raw dataset directory '{raw_path.resolve()}' does not exist. "
            f"Please acquire the IO-VNBD dataset as specified in DATASET.md."
        )

    files = sorted(list(raw_path.glob(file_pattern)))
    if not files:
        raise DatasetNotFoundError(
            f"No trajectory files matching pattern '{file_pattern}' found in '{raw_path.resolve()}'. "
            f"Please download the dataset following instructions in DATASET.md."
        )

    trajectories: Dict[str, TrajectoryData] = {}
    for f in files:
        traj = load_single_trajectory(f)
        trajectories[traj.trajectory_id] = traj

    logger.info(
        "Successfully loaded %d trajectories from %s",
        len(trajectories),
        raw_path.resolve(),
    )
    return trajectories
