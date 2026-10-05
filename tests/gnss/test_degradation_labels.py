"""Unit Tests for Multi-Horizon Degradation Label Generation."""

import numpy as np
import pandas as pd
import pytest

from gnss.degradation_labels import generate_degradation_labels_for_trajectory


def test_forward_horizon_label_causality() -> None:
    # 20 samples at 10 Hz (2 seconds total)
    n = 20
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "satellites_available": np.full(n, 12.0),
        "speed_mps": np.full(n, 10.0),
        "indicated_speed_kmh": np.full(n, 36.0),
        "latitude": np.full(n, 52.0),
        "longitude": np.full(n, -1.0),
    })

    # Introduce a single isolated degradation at epoch index 15 (time = 1.5s)
    df.loc[15, "satellites_available"] = 0.0

    # 1.0s horizon at 10 Hz corresponds to 10 forward steps
    df_labeled, target_cols = generate_degradation_labels_for_trajectory(
        df, horizons_seconds=[1.0], sampling_rate_hz=10.0, quality_threshold=0.70
    )

    t_1s = df_labeled["target_degraded_1s"].values

    # Epoch 15 itself should NOT be target=1 if there is no subsequent degradation in (15, 25]
    assert t_1s[15] == 0

    # Epochs in [5, 14] are within 10 steps of epoch 15 -> must be 1
    for i in range(5, 15):
        assert t_1s[i] == 1, f"Epoch {i} should be labeled 1 (anticipating degradation at 15)"

    # Epochs before index 5 are > 10 steps away from epoch 15 -> must be 0
    for i in range(0, 5):
        assert t_1s[i] == 0, f"Epoch {i} should be 0 (beyond 1.0s horizon)"

    # Epochs after index 15 have no further degradation -> must be 0
    for i in range(16, n):
        assert t_1s[i] == 0
