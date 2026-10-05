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


# Standard canonical column name mapping from known IO-VNBD headers to canonical names
CANONICAL_COLUMN_MAPPINGS: Dict[str, str] = {
    # IO-VNBD Vehicle Dataset known column headings
    "time since start of day": "timestamp",
    "time": "timestamp",
    "timestamp": "timestamp",
    "t": "timestamp",
    "no of gps satellites available": "satellites_available",
    "satellites": "satellites_available",
    "satellites_available": "satellites_available",
    "gps latitude": "latitude",
    "latitude": "latitude",
    "lat": "latitude",
    "gps longitude": "longitude",
    "longitude": "longitude",
    "lon": "longitude",
    "gps height": "altitude",
    "altitude": "altitude",
    "height": "altitude",
    "gps velocity": "speed_mps",  # will convert km/h if needed
    "speed": "speed_mps",
    "speed_mps": "speed_mps",
    "gps heading": "heading_deg",
    "heading": "heading_deg",
    "heading_deg": "heading_deg",
    "sample period": "sample_period",
    "hdop": "hdop",
    "vdop": "vdop",
    "c_n0": "c_n0",
    # Inertial channels
    "longitudinal acceleration": "acc_y",
    "lateral acceleration": "acc_x",
    "vertical acceleration": "acc_z",
    "acc_x": "acc_x",
    "acc_y": "acc_y",
    "acc_z": "acc_z",
    "yaw rate": "gyro_z",
    "gyro_x": "gyro_x",
    "gyro_y": "gyro_y",
    "gyro_z": "gyro_z",
    # Reference / Ground Truth if present
    "gt_latitude": "gt_latitude",
    "gt_longitude": "gt_longitude",
    "gt_altitude": "gt_altitude",
}


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map known raw column variations into canonical lower-case identifiers.

    Args:
        df: Raw pandas DataFrame.

    Returns:
        DataFrame with standardized column names where matches exist.
    """
    df = df.copy()
    rename_dict: Dict[str, str] = {}
    for col in df.columns:
        norm_key = str(col).strip().lower()
        if norm_key in CANONICAL_COLUMN_MAPPINGS:
            rename_dict[col] = CANONICAL_COLUMN_MAPPINGS[norm_key]
        else:
            # Clean string name
            clean_name = norm_key.replace(" ", "_").replace("-", "_")
            rename_dict[col] = clean_name

    df.rename(columns=rename_dict, inplace=True)
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
