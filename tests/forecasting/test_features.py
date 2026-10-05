"""Unit tests for Forecasting Features Module."""

import numpy as np
import pandas as pd
import pytest

from forecasting.features import (
    FORECAST_BASE_FEATURE_NAMES,
    ForecastingFeatureExtractor,
)
from gnss.quality import compute_gnss_quality


def _create_mock_trajectory_df(n: int = 50) -> pd.DataFrame:
    timestamps = np.linspace(0, 5.0, n)
    df = pd.DataFrame({
        "timestamp": timestamps,
        "satellites_available": np.full(n, 8),
        "latitude": np.full(n, 52.4),
        "longitude": np.full(n, -1.5),
        "altitude": np.full(n, 100.0),
        "speed_mps": np.full(n, 12.0),
        "wheel_speed_front_left_rad_sec": np.full(n, 38.0),
        "wheel_speed_front_right_rad_sec": np.full(n, 38.0),
        "wheel_speed_rear_left_rad_sec": np.full(n, 38.0),
        "wheel_speed_rear_right_rad_sec": np.full(n, 38.0),
        "acc_x": np.zeros(n),
        "acc_y": np.zeros(n),
        "gyro_z": np.zeros(n),
    })
    return compute_gnss_quality(df)


def test_feature_extractor_dimensions_and_names():
    df = _create_mock_trajectory_df(30)
    extractor = ForecastingFeatureExtractor()
    X, cols = extractor.extract_features(df)

    assert X.shape == (30, len(FORECAST_BASE_FEATURE_NAMES))
    assert cols == FORECAST_BASE_FEATURE_NAMES
    assert np.all(np.isfinite(X))


def test_feature_extractor_with_cov_traces():
    df = _create_mock_trajectory_df(20)
    cov_traces = np.linspace(1.0, 10.0, 20)
    r95_bounds = np.linspace(2.0, 8.0, 20)

    extractor = ForecastingFeatureExtractor()
    X, cols = extractor.extract_features(df, cov_traces=cov_traces, radius_95_bounds=r95_bounds)

    cov_idx = cols.index("ekf_cov_trace")
    r95_idx = cols.index("ekf_radius_95")

    assert np.allclose(X[:, cov_idx], cov_traces)
    assert np.allclose(X[:, r95_idx], r95_bounds)
