"""Unit tests for preprocessing/quality_checks.py."""

import pytest
import numpy as np
import pandas as pd

from preprocessing.quality_checks import (
    DataIntegrityViolationError,
    check_coordinate_bounds,
    check_no_nan_or_inf_in_tensors,
    check_split_leakage,
    check_timestamp_integrity,
)
from preprocessing.temporal_split import DatasetSplits
from preprocessing.windowing import WindowedDataset


def test_check_timestamp_integrity_passes():
    df = pd.DataFrame({"timestamp": [1.0, 2.0, 3.0, 4.0]})
    res = check_timestamp_integrity(df, trajectory_id="good_traj")
    assert res["sample_count"] == 4
    assert res["min_timestamp"] == 1.0
    assert res["max_timestamp"] == 4.0


def test_check_timestamp_integrity_missing_col():
    df = pd.DataFrame({"other": [1, 2, 3]})
    with pytest.raises(DataIntegrityViolationError, match="missing"):
        check_timestamp_integrity(df, trajectory_id="bad_col_traj")


def test_check_coordinate_bounds():
    good_df = pd.DataFrame({"latitude": [52.0, -20.0], "longitude": [10.0, -100.0]})
    check_coordinate_bounds(good_df)

    bad_lat = pd.DataFrame({"latitude": [95.0], "longitude": [0.0]})
    with pytest.raises(DataIntegrityViolationError, match="Latitude values out of physical bounds"):
        check_coordinate_bounds(bad_lat)

    bad_lon = pd.DataFrame({"latitude": [0.0], "longitude": [190.0]})
    with pytest.raises(DataIntegrityViolationError, match="Longitude values out of physical bounds"):
        check_coordinate_bounds(bad_lon)


def test_check_no_nan_or_inf_in_tensors():
    # Valid
    valid_x = np.ones((5, 10, 2))
    valid_y = np.ones((5, 2, 1))
    valid_ds = WindowedDataset(valid_x, valid_y, ["a", "b"], ["t"], [])
    check_no_nan_or_inf_in_tensors(valid_ds)

    # NaN in X
    nan_x = valid_x.copy()
    nan_x[0, 0, 0] = np.nan
    nan_ds = WindowedDataset(nan_x, valid_y, ["a", "b"], ["t"], [])
    with pytest.raises(DataIntegrityViolationError, match="Feature tensor X contains NaN"):
        check_no_nan_or_inf_in_tensors(nan_ds)

    # Inf in Y
    inf_y = valid_y.copy()
    inf_y[0, 0, 0] = np.inf
    inf_ds = WindowedDataset(valid_x, inf_y, ["a", "b"], ["t"], [])
    with pytest.raises(DataIntegrityViolationError, match="Target tensor Y contains Inf"):
        check_no_nan_or_inf_in_tensors(inf_ds)
