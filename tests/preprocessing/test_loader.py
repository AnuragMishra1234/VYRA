"""Unit tests for preprocessing/dataset_loader.py."""

from pathlib import Path
import pytest
import pandas as pd
import numpy as np

from preprocessing.dataset_loader import (
    DatasetNotFoundError,
    DatasetValidationError,
    TrajectoryData,
    discover_and_load_trajectories,
    load_single_trajectory,
    standardize_columns,
)


@pytest.fixture
def sample_csv_path(tmp_path: Path) -> Path:
    """Deterministic synthetic fixture mimicking raw IO-VNBD CSV schema."""
    csv_file = tmp_path / "test_traj_01.csv"
    data = {
        "Time since start of day": [100.0, 100.1, 100.2, 100.3, 100.4],
        "GPS Latitude": [52.4068, 52.4069, 52.4070, 52.4071, 52.4072],
        "GPS Longitude": [-1.5197, -1.5196, -1.5195, -1.5194, -1.5193],
        "GPS Height": [0.100, 0.101, 0.101, 0.102, 0.102],
        "GPS Velocity": [36.0, 36.5, 37.0, 36.8, 36.2],
        "GPS Heading": [90.0, 90.1, 90.2, 90.1, 90.0],
        "No of GPS satellites available": [8, 8, 8, 7, 7],
        "Longitudinal acceleration": [0.1, 0.2, 0.0, -0.1, 0.0],
        "Lateral acceleration": [0.0, 0.0, 0.1, 0.0, -0.1],
        "Yaw rate": [0.01, 0.02, 0.01, 0.00, -0.01],
    }
    pd.DataFrame(data).to_csv(csv_file, index=False)
    return csv_file


def test_standardize_columns_mapping():
    raw_df = pd.DataFrame(
        {
            "Time since start of day": [1.0],
            "No of GPS satellites available": [9],
            "GPS Latitude": [52.0],
            "Longitudinal acceleration": [0.5],
        }
    )
    std_df = standardize_columns(raw_df)
    assert "timestamp" in std_df.columns
    assert "satellites_available" in std_df.columns
    assert "latitude" in std_df.columns
    assert "acc_y" in std_df.columns


def test_load_single_trajectory(sample_csv_path: Path):
    traj = load_single_trajectory(sample_csv_path)
    assert isinstance(traj, TrajectoryData)
    assert traj.trajectory_id == "test_traj_01"
    assert len(traj.df) == 5
    assert "timestamp" in traj.df.columns
    assert "latitude" in traj.df.columns
    assert "satellites_available" in traj.df.columns


def test_load_nonexistent_file_raises_not_found():
    with pytest.raises(DatasetNotFoundError):
        load_single_trajectory("nonexistent_path/trajectory.csv")


def test_load_empty_csv_raises_validation_error(tmp_path: Path):
    empty_file = tmp_path / "empty.csv"
    empty_file.write_text("")
    with pytest.raises(DatasetValidationError):
        load_single_trajectory(empty_file)


def test_discover_missing_raw_dir_raises_not_found(tmp_path: Path):
    with pytest.raises(DatasetNotFoundError):
        discover_and_load_trajectories(raw_dir=tmp_path / "missing_dir")


def test_discover_and_load_trajectories(tmp_path: Path):
    for i in range(3):
        csv_path = tmp_path / f"traj_{i}.csv"
        pd.DataFrame(
            {
                "timestamp": [1.0, 2.0, 3.0],
                "latitude": [50.0, 50.1, 50.2],
                "longitude": [0.0, 0.1, 0.2],
            }
        ).to_csv(csv_path, index=False)

    trajectories = discover_and_load_trajectories(raw_dir=tmp_path)
    assert len(trajectories) == 3
    assert "traj_0" in trajectories
    assert "traj_1" in trajectories
    assert "traj_2" in trajectories
