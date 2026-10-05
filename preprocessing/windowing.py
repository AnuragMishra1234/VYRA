"""Sliding-Window Pipeline Module for VYRA.

Generates strictly causal rolling observation windows and isolated future forecast targets.

CRITICAL LEAKAGE RULE:
Input window at step k: [k - L_history, k]
Future target window at step k: [k + 1, k + horizon]
Input features must NEVER contain records or targets from [k + 1, k + horizon].
Windows must NEVER bridge across trajectory boundaries.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from preprocessing.dataset_loader import TrajectoryData

logger = logging.getLogger(__name__)


@dataclass
class WindowSampleMetadata:
    """Audit metadata for an extracted sliding-window sample."""

    sample_index: int
    trajectory_id: str
    feature_start_timestamp: float
    feature_end_timestamp: float  # Current decision time t
    target_start_timestamp: float  # t + 1 epoch
    target_end_timestamp: float  # t + horizon
    history_steps: int
    horizon_steps: int
    split: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sample_index": self.sample_index,
            "trajectory_id": self.trajectory_id,
            "feature_start_timestamp": self.feature_start_timestamp,
            "feature_end_timestamp": self.feature_end_timestamp,
            "target_start_timestamp": self.target_start_timestamp,
            "target_end_timestamp": self.target_end_timestamp,
            "history_steps": self.history_steps,
            "horizon_steps": self.horizon_steps,
            "split": self.split,
        }


@dataclass
class WindowedDataset:
    """Container for aligned causal feature windows and isolated targets."""

    # Features tensor: shape (N_samples, L_history, N_features)
    X: np.ndarray
    # Target tensor: shape (N_samples, horizon_steps, N_targets) or (N_samples, N_targets)
    Y: np.ndarray
    feature_names: List[str]
    target_names: List[str]
    sample_metadata: List[WindowSampleMetadata]

    def __len__(self) -> int:
        return len(self.X)


def create_sliding_windows_for_trajectory(
    df: pd.DataFrame,
    feature_columns: List[str],
    target_columns: List[str],
    history_steps: int = 50,
    horizon_steps: int = 10,
    stride: int = 1,
    trajectory_id: str = "traj_0",
    split: Optional[str] = None,
    timestamp_col: str = "timestamp",
) -> Tuple[np.ndarray, np.ndarray, List[WindowSampleMetadata]]:
    """Extract causal historical windows and isolated future targets from a single trajectory.

    Args:
        df: Input synchronized DataFrame.
        feature_columns: Feature column names to extract into X.
        target_columns: Target column names to extract into Y.
        history_steps: Number of past steps L in input window [k - L + 1, k].
        horizon_steps: Number of future steps H in target window [k + 1, k + H].
        stride: Step stride between consecutive decision points.
        trajectory_id: Identifier of source trajectory.
        split: Split label ('train', 'validation', 'test').
        timestamp_col: Column containing epoch timestamps.

    Returns:
        Tuple of (X_windows, Y_targets, metadata_records).
    """
    total_len = len(df)
    min_required = history_steps + horizon_steps
    if total_len < min_required:
        logger.warning(
            "Trajectory '%s' length (%d) is shorter than history + horizon (%d). Skipping.",
            trajectory_id,
            total_len,
            min_required,
        )
        return (
            np.empty((0, history_steps, len(feature_columns))),
            np.empty((0, horizon_steps, len(target_columns))),
            [],
        )

    # Validate column presence
    missing_features = [c for c in feature_columns if c not in df.columns]
    if missing_features:
        raise KeyError(
            f"Missing required feature columns in trajectory '{trajectory_id}': {missing_features}"
        )

    missing_targets = [c for c in target_columns if c not in df.columns]
    if missing_targets:
        raise KeyError(
            f"Missing required target columns in trajectory '{trajectory_id}': {missing_targets}"
        )

    feature_matrix = df[feature_columns].to_numpy(dtype=float)
    target_matrix = df[target_columns].to_numpy(dtype=float)
    timestamps = df[timestamp_col].to_numpy(dtype=float)

    # Pre-allocate sample list
    # Decision index k runs from history_steps - 1 to total_len - horizon_steps - 1
    k_indices = range(history_steps - 1, total_len - horizon_steps, stride)
    n_samples = len(k_indices)

    X_windows = np.zeros(
        (n_samples, history_steps, len(feature_columns)), dtype=float
    )
    Y_targets = np.zeros(
        (n_samples, horizon_steps, len(target_columns)), dtype=float
    )
    metadata_list: List[WindowSampleMetadata] = []

    for sample_idx, k in enumerate(k_indices):
        # Input history window: [k - history_steps + 1, ..., k] inclusive
        # Slice indexing: [start : end] where end is non-inclusive
        hist_start = k - history_steps + 1
        hist_end = k + 1  # includes step k

        # Future target window: [k + 1, ..., k + horizon_steps]
        targ_start = k + 1
        targ_end = k + 1 + horizon_steps

        # Populate tensors
        X_windows[sample_idx] = feature_matrix[hist_start:hist_end]
        Y_targets[sample_idx] = target_matrix[targ_start:targ_end]

        meta = WindowSampleMetadata(
            sample_index=sample_idx,
            trajectory_id=trajectory_id,
            feature_start_timestamp=float(timestamps[hist_start]),
            feature_end_timestamp=float(timestamps[k]),  # Decision time t_k
            target_start_timestamp=float(timestamps[targ_start]),
            target_end_timestamp=float(timestamps[targ_end - 1]),
            history_steps=history_steps,
            horizon_steps=horizon_steps,
            split=split,
        )
        metadata_list.append(meta)

    return X_windows, Y_targets, metadata_list


def create_windowed_dataset_from_dict(
    trajectories: Dict[str, TrajectoryData],
    feature_columns: List[str],
    target_columns: List[str],
    history_steps: int = 50,
    horizon_steps: int = 10,
    stride: int = 1,
    split_name: Optional[str] = None,
) -> WindowedDataset:
    """Create aggregated windowed dataset across multiple trajectories without boundary bridging."""
    all_x: List[np.ndarray] = []
    all_y: List[np.ndarray] = []
    all_meta: List[WindowSampleMetadata] = []

    global_sample_counter = 0

    for tid, traj in trajectories.items():
        x_sub, y_sub, meta_sub = create_sliding_windows_for_trajectory(
            df=traj.df,
            feature_columns=feature_columns,
            target_columns=target_columns,
            history_steps=history_steps,
            horizon_steps=horizon_steps,
            stride=stride,
            trajectory_id=tid,
            split=split_name,
        )
        if len(x_sub) > 0:
            for m in meta_sub:
                m.sample_index = global_sample_counter
                global_sample_counter += 1
                all_meta.append(m)

            all_x.append(x_sub)
            all_y.append(y_sub)

    if not all_x:
        empty_x = np.empty((0, history_steps, len(feature_columns)))
        empty_y = np.empty((0, horizon_steps, len(target_columns)))
        return WindowedDataset(
            X=empty_x,
            Y=empty_y,
            feature_names=feature_columns,
            target_names=target_columns,
            sample_metadata=[],
        )

    X_agg = np.concatenate(all_x, axis=0)
    Y_agg = np.concatenate(all_y, axis=0)

    logger.info(
        "Extracted %d sliding-window samples across %d trajectories (Split: %s).",
        len(X_agg),
        len(trajectories),
        split_name,
    )

    return WindowedDataset(
        X=X_agg,
        Y=Y_agg,
        feature_names=feature_columns,
        target_names=target_columns,
        sample_metadata=all_meta,
    )
