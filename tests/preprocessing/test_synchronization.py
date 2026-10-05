"""Unit tests for preprocessing/synchronization.py."""

import pytest
import pandas as pd
import numpy as np

from preprocessing.synchronization import synchronize_causally


def test_synchronize_causal_forward_fill_only():
    """Verify that IMU sample at t=0.5 does NOT receive GNSS fix recorded at future t=1.0."""
    df = pd.DataFrame(
        {
            "timestamp": [0.0, 0.5, 1.0],
            "latitude": [52.0, np.nan, 52.1],  # GNSS fix at t=0.0 and t=1.0
            "acc_x": [0.1, 0.2, 0.3],          # IMU at all steps
        }
    )

    synced = synchronize_causally(df, target_dt=None, fill_method="forward")

    # At t=0.5, latitude should be forward-filled from t=0.0 (52.0), NOT from future t=1.0 (52.1)
    assert synced.loc[1, "latitude"] == 52.0
    assert synced.loc[2, "latitude"] == 52.1


def test_synchronize_rejects_non_causal_method():
    df = pd.DataFrame({"timestamp": [1.0, 2.0], "latitude": [50.0, 50.1]})
    with pytest.raises(ValueError, match="only strictly causal 'forward' filling is permitted"):
        synchronize_causally(df, fill_method="backward")


def test_synchronize_tracks_gnss_age():
    df = pd.DataFrame(
        {
            "timestamp": [0.0, 0.1, 0.2, 0.3],
            "latitude": [52.0, np.nan, np.nan, 52.1],
        }
    )
    synced = synchronize_causally(df, target_dt=None)
    assert "gnss_age_seconds" in synced.columns
    # Age increases while waiting for next GNSS update
    assert np.isclose(synced.loc[0, "gnss_age_seconds"], 0.0)
    assert np.isclose(synced.loc[1, "gnss_age_seconds"], 0.1)
    assert np.isclose(synced.loc[2, "gnss_age_seconds"], 0.2)
    assert np.isclose(synced.loc[3, "gnss_age_seconds"], 0.0)
