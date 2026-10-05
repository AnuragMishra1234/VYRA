"""GNSS Degradation Label Generation Module for VYRA.

Generates ground-truth future degradation targets across forward horizons H in {1s, 3s, 5s, 10s}.

CRITICAL RESEARCH FORMULATION:
The target label Y(t, H) answers:
"Will GNSS become unreliable at any point within the upcoming window (t, t + H]?"

Definition of "Unreliable GNSS":
1. Effective satellite count drops below 4 (loss of 3D fix geometry).
2. Composite quality score Q drops below threshold (0.50).
3. Kinematic discrepancy |v_gps - v_wheel| exceeds 2.0 m/s (severe velocity corruption).
4. Outage occurs (0 satellites or missing fix).

ANTI-LEAKAGE RULE:
Targets are constructed strictly for evaluation and supervised loss calculation.
They must NEVER be fed as input features at decision time t.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from gnss.quality import compute_gnss_quality

logger = logging.getLogger(__name__)

STANDARD_HORIZONS_SECONDS: List[float] = [1.0, 3.0, 5.0, 10.0]


def generate_degradation_labels_for_trajectory(
    df: pd.DataFrame,
    horizons_seconds: Optional[List[float]] = None,
    sampling_rate_hz: float = 10.0,
    quality_threshold: float = 0.70,
    min_satellites: int = 4,
    critical_vel_diff_mps: float = 2.0,
) -> Tuple[pd.DataFrame, List[str]]:
    """Compute multi-horizon future degradation binary labels for a single trajectory.

    Args:
        df: Input trajectory DataFrame.
        horizons_seconds: List of forward horizons in seconds (defaults to [1.0, 3.0, 5.0, 10.0]).
        sampling_rate_hz: Trajectory sampling frequency in Hz (10 Hz = 0.1s step).
        quality_threshold: Composite quality threshold below which GNSS is degraded.
        min_satellites: Minimum satellite count required for healthy 3D fix.
        critical_vel_diff_mps: Velocity discrepancy threshold indicating corruption.

    Returns:
        Tuple of (DataFrame with appended target columns, list of target column names).
    """
    df = df.copy()
    if horizons_seconds is None:
        horizons_seconds = STANDARD_HORIZONS_SECONDS

    # Ensure instantaneous quality indicators exist
    if "is_currently_degraded" not in df.columns:
        df = compute_gnss_quality(df, quality_threshold=quality_threshold)

    is_degraded = df["is_currently_degraded"].to_numpy(dtype=bool)
    n = len(df)
    target_columns: List[str] = []

    for h_sec in horizons_seconds:
        h_steps = max(1, int(round(h_sec * sampling_rate_hz)))
        col_name = f"target_degraded_{int(h_sec)}s" if h_sec.is_integer() else f"target_degraded_{h_sec}s"
        target_columns.append(col_name)

        # Vectorized forward window search:
        # Y[i] = 1 if ANY epoch in [i + 1, min(i + h_steps, n - 1)] has is_degraded == True
        # Using reversed rolling maximum to look strictly ahead into the future
        # Shift by -1 so the window starts at i + 1 (strictly future, excluding current epoch i)
        shifted_series = pd.Series(is_degraded, dtype=float).shift(-1)
        # Rolling forward over h_steps
        # We achieve future rolling by rolling backwards: reverse -> roll -> reverse
        forward_any = (
            shifted_series.iloc[::-1]
            .rolling(window=h_steps, min_periods=1)
            .max()
            .iloc[::-1]
            .fillna(0.0)
            .to_numpy(dtype=int)
        )

        df[col_name] = forward_any

    return df, target_columns


def compute_label_distribution_statistics(
    trajectory_dfs: Dict[str, pd.DataFrame],
    target_columns: List[str],
    splits_dict: Optional[Dict[str, List[str]]] = None,
    output_path: Union[str, Path] = "results/processed/gnss_label_statistics.json",
) -> Dict[str, Any]:
    """Calculate empirical class balance statistics across trajectories and splits.

    Args:
        trajectory_dfs: Dictionary mapping trajectory_id to DataFrame with target columns.
        target_columns: Names of target label columns.
        splits_dict: Optional mapping of split names to trajectory ID lists.
        output_path: Path to output JSON statistics file.

    Returns:
        Dictionary of label distribution statistics.
    """
    stats: Dict[str, Any] = {
        "target_columns": target_columns,
        "total_trajectories": len(trajectory_dfs),
        "by_horizon": {},
        "by_trajectory": {},
        "by_split": {},
    }

    # Aggregate across all trajectories
    for col in target_columns:
        total_pos = 0
        total_neg = 0
        for tid, df in trajectory_dfs.items():
            if col in df.columns:
                pos = int((df[col] == 1).sum())
                neg = int((df[col] == 0).sum())
                total_pos += pos
                total_neg += neg

        total_samples = total_pos + total_neg
        pos_ratio = float(total_pos / total_samples) if total_samples > 0 else 0.0

        stats["by_horizon"][col] = {
            "positive_count": total_pos,
            "negative_count": total_neg,
            "total_samples": total_samples,
            "positive_percentage": round(pos_ratio * 100.0, 3),
            "negative_percentage": round((1.0 - pos_ratio) * 100.0, 3),
            "class_ratio": round(total_pos / max(1, total_neg), 5),
        }

    # By trajectory
    for tid, df in trajectory_dfs.items():
        stats["by_trajectory"][tid] = {}
        for col in target_columns:
            if col in df.columns:
                pos = int((df[col] == 1).sum())
                total = len(df)
                stats["by_trajectory"][tid][col] = {
                    "positive_count": pos,
                    "total": total,
                    "positive_percentage": round((pos / max(1, total)) * 100.0, 3),
                }

    # By split
    if splits_dict:
        for split_name, tids in splits_dict.items():
            stats["by_split"][split_name] = {}
            for col in target_columns:
                split_pos = 0
                split_total = 0
                for tid in tids:
                    if tid in trajectory_dfs and col in trajectory_dfs[tid].columns:
                        split_pos += int((trajectory_dfs[tid][col] == 1).sum())
                        split_total += len(trajectory_dfs[tid])
                ratio = float(split_pos / max(1, split_total))
                stats["by_split"][split_name][col] = {
                    "positive_count": split_pos,
                    "total_samples": split_total,
                    "positive_percentage": round(ratio * 100.0, 3),
                }

    # Save to disk
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    logger.info("Saved GNSS label distribution statistics to %s", out_file.resolve())
    return stats
