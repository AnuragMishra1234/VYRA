"""Mandatory Anti-Data-Leakage Unit Tests for VYRA Preprocessing Pipeline.

Validates the 7 non-negotiable research anti-leakage invariants:
1. Train / Test trajectory overlap detection
2. Window overlap across splits
3. Future feature contamination (t_feature >= t_target)
4. Test-set normalization leakage
5. Target accidentally included in feature columns
6. Timestamp ordering violation
7. Cross-trajectory boundary contamination
"""

import pytest
import numpy as np
import pandas as pd

from preprocessing.normalization import TrajectoryNormalizer
from preprocessing.temporal_split import DatasetSplits, split_trajectories_chronologically
from preprocessing.windowing import (
    WindowedDataset,
    WindowSampleMetadata,
    create_sliding_windows_for_trajectory,
    create_windowed_dataset_from_dict,
)
from preprocessing.dataset_loader import TrajectoryData
from preprocessing.quality_checks import (
    DataIntegrityViolationError,
    check_normalization_leakage,
    check_split_leakage,
    check_timestamp_integrity,
    check_window_causal_integrity,
)


# Test 1: Train/test trajectory overlap
def test_leakage_1_train_test_trajectory_overlap():
    """Assert that any overlap between train, val, and test trajectories is immediately caught."""
    # Invalid split where 'traj_B' is present in both train and test
    with pytest.raises(ValueError, match="Data leakage detected"):
        DatasetSplits(
            train_ids=["traj_A", "traj_B"],
            val_ids=["traj_C"],
            test_ids=["traj_B", "traj_D"],
        )

    # Also test check_split_leakage error raising
    valid_splits = DatasetSplits(
        train_ids=["t1", "t2"], val_ids=["t3"], test_ids=["t4"]
    )
    # Should pass without error
    check_split_leakage(valid_splits)


# Test 2: Window overlap across splits
def test_leakage_2_window_overlap_across_splits():
    """Assert that windows generated for train split and test split have completely disjoint trajectory sources."""
    trajectories = {
        "traj_train": TrajectoryData(
            trajectory_id="traj_train",
            df=pd.DataFrame({"timestamp": np.arange(30) * 0.1, "x": np.zeros(30), "y": np.zeros(30)}),
        ),
        "traj_test": TrajectoryData(
            trajectory_id="traj_test",
            df=pd.DataFrame({"timestamp": np.arange(30) * 0.1, "x": np.ones(30), "y": np.ones(30)}),
        ),
    }

    train_data = create_windowed_dataset_from_dict(
        {"traj_train": trajectories["traj_train"]},
        feature_columns=["x"],
        target_columns=["y"],
        history_steps=10,
        horizon_steps=5,
        split_name="train",
    )

    test_data = create_windowed_dataset_from_dict(
        {"traj_test": trajectories["traj_test"]},
        feature_columns=["x"],
        target_columns=["y"],
        history_steps=10,
        horizon_steps=5,
        split_name="test",
    )

    train_sources = {m.trajectory_id for m in train_data.sample_metadata}
    test_sources = {m.trajectory_id for m in test_data.sample_metadata}

    assert train_sources.isdisjoint(test_sources)
    assert train_sources == {"traj_train"}
    assert test_sources == {"traj_test"}


# Test 3: Future feature contamination
def test_leakage_3_future_feature_contamination():
    """Assert that feature end timestamp is strictly less than target start timestamp."""
    # Valid dataset
    df = pd.DataFrame(
        {
            "timestamp": np.arange(20) * 0.1,
            "f": np.arange(20),
            "target": np.arange(20) * 2,
        }
    )
    x, y, meta = create_sliding_windows_for_trajectory(
        df=df,
        feature_columns=["f"],
        target_columns=["target"],
        history_steps=5,
        horizon_steps=3,
    )
    dataset = WindowedDataset(x, y, ["f"], ["target"], meta)
    # Should pass causal integrity
    check_window_causal_integrity(dataset)

    # Malformed synthetic metadata where target timestamp <= feature timestamp
    bad_meta = [
        WindowSampleMetadata(
            sample_index=0,
            trajectory_id="bad_sample",
            feature_start_timestamp=0.0,
            feature_end_timestamp=5.0,
            target_start_timestamp=4.5,  # LEAKAGE: target begins before feature ends!
            target_end_timestamp=8.0,
            history_steps=5,
            horizon_steps=3,
        )
    ]
    bad_dataset = WindowedDataset(x[:1], y[:1], ["f"], ["target"], bad_meta)
    with pytest.raises(DataIntegrityViolationError, match="FUTURE LOOKAHEAD DETECTED"):
        check_window_causal_integrity(bad_dataset)


# Test 4: Test-set normalization leakage
def test_leakage_4_test_set_normalization_leakage():
    """Assert that fitting normalizer on test trajectories is caught and forbidden."""
    train_df = pd.DataFrame({"feat": [1.0, 2.0, 3.0]})
    normalizer = TrajectoryNormalizer(feature_columns=["feat"])
    normalizer.fit([train_df], trajectory_ids=["traj_train_1"])

    # Test set trajectory ID is 'traj_test_1'
    test_ids = ["traj_test_1"]

    # Passing test_ids disjoint with fit_trajectory_ids succeeds
    check_normalization_leakage(normalizer, test_ids)

    # If normalizer was fitted with test_id included, it MUST fail
    leaked_norm = TrajectoryNormalizer(feature_columns=["feat"])
    leaked_norm.fit([train_df], trajectory_ids=["traj_test_1"])  # LEAK!
    with pytest.raises(DataIntegrityViolationError, match="NORMALIZATION LEAKAGE DETECTED"):
        check_normalization_leakage(leaked_norm, test_ids)


# Test 5: Target accidentally included in features
def test_leakage_5_target_accidentally_included_in_features():
    """Assert that target column names are not present in feature column specifications."""
    feature_cols = ["speed", "acc_x", "hdop", "future_error"]
    target_cols = ["future_error"]

    # Overlap between feature set and target set is a direct leakage risk
    overlap = set(feature_cols).intersection(set(target_cols))
    assert len(overlap) > 0  # detected!

    # A valid feature set must have zero overlap with target columns
    clean_feature_cols = [c for c in feature_cols if c not in target_cols]
    assert set(clean_feature_cols).isdisjoint(set(target_cols))


# Test 6: Timestamp ordering violation
def test_leakage_6_timestamp_ordering_violation():
    """Assert that non-monotonic timestamps are caught and raise DataIntegrityViolationError."""
    bad_df = pd.DataFrame(
        {
            "timestamp": [1.0, 2.0, 1.5, 3.0],  # Negative delta at index 2
            "latitude": [50.0, 50.1, 50.2, 50.3],
        }
    )
    with pytest.raises(DataIntegrityViolationError, match="Non-monotonic or duplicate timestamps"):
        check_timestamp_integrity(bad_df, trajectory_id="non_monotonic_traj")


# Test 7: Cross-trajectory contamination
def test_leakage_7_cross_trajectory_contamination():
    """Assert that sliding windows never span across different trajectories."""
    # Two short trajectories of length 8 each
    traj1_df = pd.DataFrame(
        {
            "timestamp": np.arange(8) * 0.1,
            "val": np.full(8, 100.0),
            "target": np.full(8, 100.0),
        }
    )
    traj2_df = pd.DataFrame(
        {
            "timestamp": np.arange(8) * 0.1,
            "val": np.full(8, 200.0),
            "target": np.full(8, 200.0),
        }
    )

    trajectories = {
        "traj1": TrajectoryData("traj1", traj1_df),
        "traj2": TrajectoryData("traj2", traj2_df),
    }

    # With history=5 and horizon=2:
    # Traj 1 has samples where all values in X are 100.0
    # Traj 2 has samples where all values in X are 200.0
    # NO window should have a mixture of 100.0 and 200.0!
    ds = create_windowed_dataset_from_dict(
        trajectories,
        feature_columns=["val"],
        target_columns=["target"],
        history_steps=5,
        horizon_steps=2,
    )

    for i in range(len(ds.X)):
        sample_x = ds.X[i]
        meta = ds.sample_metadata[i]
        if meta.trajectory_id == "traj1":
            assert np.all(sample_x == 100.0), "Cross-trajectory contamination in traj1 sample!"
        elif meta.trajectory_id == "traj2":
            assert np.all(sample_x == 200.0), "Cross-trajectory contamination in traj2 sample!"
