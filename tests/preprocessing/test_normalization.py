"""Unit tests for preprocessing/normalization.py."""

from pathlib import Path
import pytest
import numpy as np
import pandas as pd

from preprocessing.normalization import TrajectoryNormalizer


def test_normalizer_fits_on_train_only():
    train_df = pd.DataFrame({"speed": [10.0, 20.0, 30.0], "acc": [-1.0, 0.0, 1.0]})
    normalizer = TrajectoryNormalizer(feature_columns=["speed", "acc"])
    normalizer.fit([train_df], trajectory_ids=["train_1"])

    assert normalizer.fitted is True
    assert normalizer.stats["speed"].mean == 20.0
    assert normalizer.stats["acc"].mean == 0.0


def test_normalizer_transforms_deterministically():
    train_df = pd.DataFrame({"val": [0.0, 10.0]})
    normalizer = TrajectoryNormalizer(feature_columns=["val"], method="minmax")
    normalizer.fit([train_df])

    test_df = pd.DataFrame({"val": [5.0, 10.0, 15.0]})
    transformed = normalizer.transform(test_df, prefix="scaled_")

    assert "scaled_val" in transformed.columns
    # 5.0 -> 0.5, 10.0 -> 1.0, 15.0 -> 1.5
    assert np.isclose(transformed.loc[0, "scaled_val"], 0.5)
    assert np.isclose(transformed.loc[1, "scaled_val"], 1.0)
    assert np.isclose(transformed.loc[2, "scaled_val"], 1.5)


def test_normalizer_serialization_roundtrip(tmp_path: Path):
    train_df = pd.DataFrame({"f1": [1.0, 2.0, 3.0]})
    norm = TrajectoryNormalizer(feature_columns=["f1"])
    norm.fit([train_df], trajectory_ids=["t1"])

    save_file = tmp_path / "normalizer.json"
    norm.save_json(save_file)

    loaded_norm = TrajectoryNormalizer.load_json(save_file)
    assert loaded_norm.fitted is True
    assert loaded_norm.feature_columns == ["f1"]
    assert np.isclose(loaded_norm.stats["f1"].mean, 2.0)
