"""Unit tests for preprocessing/cleaning.py."""

import pytest
import pandas as pd
import numpy as np

from preprocessing.dataset_loader import TrajectoryData
from preprocessing.cleaning import clean_trajectory, clean_all_trajectories


def test_clean_trajectory_removes_exact_duplicates():
    df = pd.DataFrame(
        {
            "timestamp": [1.0, 1.0, 2.0, 3.0],
            "latitude": [50.0, 50.0, 50.1, 50.2],
            "longitude": [0.0, 0.0, 0.1, 0.2],
        }
    )
    traj = TrajectoryData(trajectory_id="dup_test", df=df)
    cleaned, report = clean_trajectory(traj)

    assert len(cleaned.df) == 3
    assert report.exact_duplicates_removed == 1


def test_clean_trajectory_sorts_timestamps():
    df = pd.DataFrame(
        {
            "timestamp": [3.0, 1.0, 2.0],
            "latitude": [50.2, 50.0, 50.1],
            "longitude": [0.2, 0.0, 0.1],
        }
    )
    traj = TrajectoryData(trajectory_id="sort_test", df=df)
    cleaned, report = clean_trajectory(traj)

    assert report.timestamp_reordered is True
    assert list(cleaned.df["timestamp"]) == [1.0, 2.0, 3.0]


def test_clean_trajectory_preserves_degraded_gnss():
    """Ensure degraded GNSS (e.g. 0 satellites, high HDOP) is NOT deleted."""
    df = pd.DataFrame(
        {
            "timestamp": [1.0, 2.0, 3.0, 4.0],
            "latitude": [50.0, 50.1, np.nan, 50.3],  # Outage at t=3
            "longitude": [0.0, 0.1, np.nan, 0.3],
            "satellites_available": [8, 4, 0, 7],
            "hdop": [1.0, 2.5, 99.0, 1.2],
            "acc_x": [0.1, 0.2, 0.1, 0.2],  # IMU remains valid
        }
    )
    traj = TrajectoryData(trajectory_id="degraded_test", df=df)
    cleaned, report = clean_trajectory(traj)

    # Must preserve all 4 records so IMU dead reckoning can continue through outage
    assert len(cleaned.df) == 4
    assert cleaned.df.loc[2, "satellites_available"] == 0


def test_clean_trajectory_flags_impossible_coordinates():
    df = pd.DataFrame(
        {
            "timestamp": [1.0, 2.0],
            "latitude": [50.0, 999.0],  # Physically impossible latitude > 90
            "longitude": [0.0, 10.0],
        }
    )
    traj = TrajectoryData(trajectory_id="impossible_coord_test", df=df)
    cleaned, report = clean_trajectory(traj)

    assert report.impossible_geodetic_flagged == 1
    assert np.isnan(cleaned.df.loc[1, "latitude"])
