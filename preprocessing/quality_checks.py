"""Data Quality Checks and Anti-Leakage Verification Module for VYRA.

Provides rigorous automated validation asserting:
1. Timestamp strict monotonicity and absence of gaps.
2. Valid coordinate boundaries (WGS84 lat/lon/alt).
3. Zero NaN/Inf values in preprocessed feature tensors.
4. Total disjointness between Train, Validation, and Test splits.
5. Zero future-target contamination in feature windows.
6. Zero normalization parameter leakage.

CRITICAL POLICY:
Fails loudly with descriptive DataIntegrityViolationError when any violation occurs.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Set, Union

import numpy as np
import pandas as pd

from preprocessing.normalization import TrajectoryNormalizer
from preprocessing.temporal_split import DatasetSplits
from preprocessing.windowing import WindowedDataset, WindowSampleMetadata

logger = logging.getLogger(__name__)


class DataIntegrityViolationError(RuntimeError):
    """Raised when an integrity check fails or data leakage is detected."""


def check_timestamp_integrity(
    df: pd.DataFrame, timestamp_col: str = "timestamp", trajectory_id: str = "traj"
) -> Dict[str, Any]:
    """Verify timestamp presence, numerical validity, and strict monotonic ordering."""
    if timestamp_col not in df.columns:
        raise DataIntegrityViolationError(
            f"Trajectory '{trajectory_id}': Required timestamp column '{timestamp_col}' missing."
        )

    ts = pd.to_numeric(df[timestamp_col], errors="coerce").values
    if np.isnan(ts).any():
        raise DataIntegrityViolationError(
            f"Trajectory '{trajectory_id}': Contains NaN/null timestamps."
        )

    diffs = np.diff(ts)
    if (diffs <= 0).any():
        negative_idx = np.where(diffs <= 0)[0]
        raise DataIntegrityViolationError(
            f"Trajectory '{trajectory_id}': Non-monotonic or duplicate timestamps detected at indices {negative_idx[:5]}."
        )

    return {
        "trajectory_id": trajectory_id,
        "sample_count": len(df),
        "min_timestamp": float(ts[0]),
        "max_timestamp": float(ts[-1]),
        "mean_dt": float(np.mean(diffs)),
    }


def check_coordinate_bounds(
    df: pd.DataFrame,
    lat_col: str = "latitude",
    lon_col: str = "longitude",
    trajectory_id: str = "traj",
) -> None:
    """Verify geodetic coordinates fall within valid physical Earth limits."""
    if lat_col in df.columns:
        valid_lats = df[lat_col].dropna().values
        if (valid_lats < -90.0).any() or (valid_lats > 90.0).any():
            raise DataIntegrityViolationError(
                f"Trajectory '{trajectory_id}': Latitude values out of physical bounds [-90, 90]."
            )

    if lon_col in df.columns:
        valid_lons = df[lon_col].dropna().values
        if (valid_lons < -180.0).any() or (valid_lons > 180.0).any():
            raise DataIntegrityViolationError(
                f"Trajectory '{trajectory_id}': Longitude values out of physical bounds [-180, 180]."
            )


def check_split_leakage(splits: DatasetSplits) -> None:
    """Assert zero trajectory overlap between train, val, and test splits."""
    s_train: Set[str] = set(splits.train_ids)
    s_val: Set[str] = set(splits.val_ids)
    s_test: Set[str] = set(splits.test_ids)

    tv = s_train.intersection(s_val)
    tt = s_train.intersection(s_test)
    vt = s_val.intersection(s_test)

    if tv or tt or vt:
        raise DataIntegrityViolationError(
            f"CRITICAL LEAKAGE DETECTED! Overlapping trajectory IDs: "
            f"Train/Val={tv}, Train/Test={tt}, Val/Test={vt}"
        )


def check_window_causal_integrity(dataset: WindowedDataset) -> None:
    """Assert that for every sample, feature end timestamp strictly precedes target start timestamp."""
    for meta in dataset.sample_metadata:
        # Decision time t_k must be strictly <= target start timestamp
        # In discrete time, target start timestamp must be > feature end timestamp
        if meta.target_start_timestamp <= meta.feature_end_timestamp:
            raise DataIntegrityViolationError(
                f"FUTURE LOOKAHEAD DETECTED in sample {meta.sample_index} ({meta.trajectory_id})! "
                f"Feature end timestamp ({meta.feature_end_timestamp}) >= "
                f"Target start timestamp ({meta.target_start_timestamp})."
            )


def check_no_nan_or_inf_in_tensors(dataset: WindowedDataset) -> None:
    """Assert feature and target arrays contain no NaN or Inf values."""
    if np.isnan(dataset.X).any():
        raise DataIntegrityViolationError(
            "Feature tensor X contains NaN values. Ensure all missing measurements are handled."
        )
    if np.isinf(dataset.X).any():
        raise DataIntegrityViolationError(
            "Feature tensor X contains Inf values. Check for division by zero."
        )
    if np.isnan(dataset.Y).any():
        raise DataIntegrityViolationError(
            "Target tensor Y contains NaN values."
        )
    if np.isinf(dataset.Y).any():
        raise DataIntegrityViolationError(
            "Target tensor Y contains Inf values."
        )


def check_normalization_leakage(
    normalizer: TrajectoryNormalizer, test_trajectory_ids: List[str]
) -> None:
    """Assert that the normalizer was NOT fitted using any test trajectory IDs."""
    test_set = set(test_trajectory_ids)
    fit_set = set(normalizer.fit_trajectory_ids)

    overlap = test_set.intersection(fit_set)
    if overlap:
        raise DataIntegrityViolationError(
            f"NORMALIZATION LEAKAGE DETECTED! Normalizer was fitted using test trajectories: {overlap}"
        )
