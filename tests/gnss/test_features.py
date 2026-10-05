"""Unit Tests for GNSS Temporal Features Extraction."""

import numpy as np
import pandas as pd
import pytest

from gnss.features import (
    PREDICTION_FEATURE_COLUMNS,
    extract_gnss_temporal_features,
)
from gnss.quality import compute_gnss_quality


def test_feature_columns_completeness() -> None:
    assert len(PREDICTION_FEATURE_COLUMNS) == 14
    assert "composite_quality_score" in PREDICTION_FEATURE_COLUMNS
    assert "effective_satellites" in PREDICTION_FEATURE_COLUMNS
    assert "quality_mean_1s" in PREDICTION_FEATURE_COLUMNS
    assert "quality_delta_1s" in PREDICTION_FEATURE_COLUMNS


def test_causal_features_extraction() -> None:
    n = 50
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "satellites_available": np.full(n, 12.0),
        "speed_mps": np.full(n, 15.0),
        "indicated_speed_kmh": np.full(n, 54.0),
        "latitude": np.full(n, 52.0),
        "longitude": np.full(n, -1.0),
        "acc_x": np.zeros(n),
        "acc_y": np.zeros(n),
        "gyro_z": np.zeros(n),
    })

    df_feat, feat_cols = extract_gnss_temporal_features(df, sampling_rate_hz=10.0)

    for col in PREDICTION_FEATURE_COLUMNS:
        assert col in df_feat.columns
        assert not df_feat[col].isna().any(), f"Column {col} contains NaN values"

    # Verify causality: quality_mean_1s at index 0 equals quality at index 0 (1 sample)
    assert np.isclose(df_feat.loc[0, "quality_mean_1s"], df_feat.loc[0, "composite_quality_score"])
