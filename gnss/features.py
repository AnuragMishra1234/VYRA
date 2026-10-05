"""GNSS Temporal Features Extraction Module for VYRA.

Extracts strictly causal temporal indicators characterizing GNSS signal quality dynamics
and vehicle kinematic trends over historical rolling observation windows.

CRITICAL ANTI-LEAKAGE SPECIFICATION:
All features at decision time t are calculated exclusively using observations
from [t - L_history, t]. Under NO circumstances are future epochs (t + delta) accessed.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from gnss.quality import compute_gnss_quality

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FeatureMetadata:
    """Documented specification for a single GNSS predictive feature."""

    name: str
    source_field: str
    unit: str
    physical_meaning: str
    is_causal: bool = True
    available_at_inference: bool = True


# Canonical Feature Inventory
FEATURE_INVENTORY: Dict[str, FeatureMetadata] = {
    "composite_quality_score": FeatureMetadata(
        name="composite_quality_score",
        source_field="composite_quality_score",
        unit="normalized [0, 1]",
        physical_meaning="Instantaneous composite GNSS quality score at epoch t.",
    ),
    "effective_satellites": FeatureMetadata(
        name="effective_satellites",
        source_field="satellites_available",
        unit="count",
        physical_meaning="Effective satellite constellation count in view.",
    ),
    "kinematic_discrepancy_mps": FeatureMetadata(
        name="kinematic_discrepancy_mps",
        source_field="speed_mps - indicated_speed_kmh/3.6",
        unit="m/s",
        physical_meaning="Discrepancy between GNSS velocity and vehicle CAN wheel speed.",
    ),
    "quality_mean_1s": FeatureMetadata(
        name="quality_mean_1s",
        source_field="composite_quality_score",
        unit="normalized [0, 1]",
        physical_meaning="Causal rolling mean of quality score over past 1 second (10 epochs).",
    ),
    "quality_std_1s": FeatureMetadata(
        name="quality_std_1s",
        source_field="composite_quality_score",
        unit="normalized [0, 1]",
        physical_meaning="Causal rolling standard deviation of quality score over past 1 second.",
    ),
    "quality_mean_3s": FeatureMetadata(
        name="quality_mean_3s",
        source_field="composite_quality_score",
        unit="normalized [0, 1]",
        physical_meaning="Causal rolling mean of quality score over past 3 seconds (30 epochs).",
    ),
    "quality_std_3s": FeatureMetadata(
        name="quality_std_3s",
        source_field="composite_quality_score",
        unit="normalized [0, 1]",
        physical_meaning="Causal rolling standard deviation of quality score over past 3 seconds.",
    ),
    "quality_delta_1s": FeatureMetadata(
        name="quality_delta_1s",
        source_field="composite_quality_score",
        unit="delta / second",
        physical_meaning="First difference in quality score relative to 1 second ago.",
    ),
    "satellites_delta_1s": FeatureMetadata(
        name="satellites_delta_1s",
        source_field="effective_satellites",
        unit="count / second",
        physical_meaning="Change in satellite count relative to 1 second ago.",
    ),
    "satellites_min_3s": FeatureMetadata(
        name="satellites_min_3s",
        source_field="effective_satellites",
        unit="count",
        physical_meaning="Minimum satellite count observed across the past 3 seconds.",
    ),
    "kinematic_discrepancy_max_3s": FeatureMetadata(
        name="kinematic_discrepancy_max_3s",
        source_field="kinematic_discrepancy_mps",
        unit="m/s",
        physical_meaning="Maximum velocity discrepancy observed across the past 3 seconds.",
    ),
    "speed_mps": FeatureMetadata(
        name="speed_mps",
        source_field="speed_mps",
        unit="m/s",
        physical_meaning="Vehicle ground speed at epoch t.",
    ),
    "acc_norm": FeatureMetadata(
        name="acc_norm",
        source_field="acc_x, acc_y",
        unit="m/s^2",
        physical_meaning="Total horizontal acceleration norm sqrt(acc_x^2 + acc_y^2).",
    ),
    "yaw_rate_abs": FeatureMetadata(
        name="yaw_rate_abs",
        source_field="gyro_z",
        unit="rad/s",
        physical_meaning="Absolute vehicle angular yaw rate |gyro_z|.",
    ),
}

PREDICTION_FEATURE_COLUMNS: List[str] = list(FEATURE_INVENTORY.keys())


def extract_gnss_temporal_features(
    df: pd.DataFrame,
    sampling_rate_hz: float = 10.0,
) -> Tuple[pd.DataFrame, List[str]]:
    """Extract causal GNSS and kinematic features from a trajectory DataFrame.

    Args:
        df: Input trajectory DataFrame (already processed through compute_gnss_quality).
        sampling_rate_hz: Nominal sampling frequency in Hertz (10 Hz = 0.1s step).

    Returns:
        Tuple of (DataFrame with appended feature columns, List of feature column names).
    """
    df = df.copy()

    # Ensure base quality scores are computed
    if "composite_quality_score" not in df.columns:
        df = compute_gnss_quality(df)

    # Epoch window lengths
    w_1s = max(1, int(round(1.0 * sampling_rate_hz)))   # 10 epochs
    w_3s = max(1, int(round(3.0 * sampling_rate_hz)))   # 30 epochs

    q = df["composite_quality_score"]
    sats = df["effective_satellites"]
    k_diff = df["kinematic_discrepancy_mps"]

    # 1. Causal Rolling Statistics (closed='left' or min_periods=1 causal rolling)
    df["quality_mean_1s"] = q.rolling(window=w_1s, min_periods=1).mean()
    df["quality_std_1s"] = q.rolling(window=w_1s, min_periods=1).std().fillna(0.0)
    df["quality_mean_3s"] = q.rolling(window=w_3s, min_periods=1).mean()
    df["quality_std_3s"] = q.rolling(window=w_3s, min_periods=1).std().fillna(0.0)

    # 2. Causal Trend Differences
    df["quality_delta_1s"] = q.diff(periods=w_1s).fillna(0.0)
    df["satellites_delta_1s"] = sats.diff(periods=w_1s).fillna(0.0)

    # 3. Extremes over Past Window
    df["satellites_min_3s"] = sats.rolling(window=w_3s, min_periods=1).min()
    df["kinematic_discrepancy_max_3s"] = k_diff.rolling(window=w_3s, min_periods=1).max()

    # 4. Kinematics (Acceleration & Yaw)
    acc_x = df["acc_x"].fillna(0.0) if "acc_x" in df.columns else pd.Series(0.0, index=df.index)
    acc_y = df["acc_y"].fillna(0.0) if "acc_y" in df.columns else pd.Series(0.0, index=df.index)
    gyro_z = df["gyro_z"].fillna(0.0) if "gyro_z" in df.columns else pd.Series(0.0, index=df.index)

    df["acc_norm"] = np.sqrt(acc_x**2 + acc_y**2)
    df["yaw_rate_abs"] = np.abs(gyro_z)

    if "speed_mps" not in df.columns:
        df["speed_mps"] = 0.0

    # Ensure all feature columns are populated and float-typed
    for col in PREDICTION_FEATURE_COLUMNS:
        if col not in df.columns:
            logger.warning("Feature column '%s' missing; populating with 0.0", col)
            df[col] = 0.0
        else:
            df[col] = df[col].astype(float).fillna(0.0)

    return df, PREDICTION_FEATURE_COLUMNS
