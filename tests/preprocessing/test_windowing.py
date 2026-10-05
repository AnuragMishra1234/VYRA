"""Unit tests for preprocessing/windowing.py."""

import pytest
import numpy as np
import pandas as pd

from preprocessing.windowing import create_sliding_windows_for_trajectory


def test_create_sliding_windows_shapes():
    # 100 samples
    n_samples = 100
    df = pd.DataFrame(
        {
            "timestamp": np.arange(n_samples) * 0.1,
            "f1": np.sin(np.arange(n_samples)),
            "f2": np.cos(np.arange(n_samples)),
            "target": np.arange(n_samples) * 0.5,
        }
    )

    history = 20
    horizon = 5
    stride = 1

    x, y, meta = create_sliding_windows_for_trajectory(
        df=df,
        feature_columns=["f1", "f2"],
        target_columns=["target"],
        history_steps=history,
        horizon_steps=horizon,
        stride=stride,
        trajectory_id="traj_test",
    )

    # Total samples should be total_len - history - horizon + 1 = 100 - 20 - 5 + 1 = 76
    expected_samples = n_samples - history - horizon + 1
    assert len(x) == expected_samples
    assert x.shape == (expected_samples, history, 2)
    assert y.shape == (expected_samples, horizon, 1)
    assert len(meta) == expected_samples


def test_sliding_window_causality_timestamps():
    df = pd.DataFrame(
        {
            "timestamp": [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
            "f1": [1, 2, 3, 4, 5, 6, 7],
            "target": [10, 20, 30, 40, 50, 60, 70],
        }
    )

    # history=3, horizon=2
    # At first decision point k=2 (timestamps: [0, 1, 2]):
    # features: timestamps 0, 1, 2
    # target: timestamps 3, 4
    x, y, meta = create_sliding_windows_for_trajectory(
        df=df,
        feature_columns=["f1"],
        target_columns=["target"],
        history_steps=3,
        horizon_steps=2,
        stride=1,
    )

    first_sample = meta[0]
    assert first_sample.feature_start_timestamp == 0.0
    assert first_sample.feature_end_timestamp == 2.0
    assert first_sample.target_start_timestamp == 3.0
    assert first_sample.target_end_timestamp == 4.0
    assert first_sample.feature_end_timestamp < first_sample.target_start_timestamp
