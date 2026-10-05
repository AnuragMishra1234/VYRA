"""Temporal Trajectory Splitting Module for VYRA.

Enforces strict trajectory-level partitioning into Train, Validation, and Test
splits without cross-trajectory contamination or window leakage.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)


@dataclass
class DatasetSplits:
    """Container holding strictly partitioned trajectory IDs."""

    train_ids: List[str]
    val_ids: List[str]
    test_ids: List[str]
    strategy: str = "trajectory_level"
    random_seed: Optional[int] = 42

    def __post_init__(self) -> None:
        # Assert absolute disjointness across splits
        s_train = set(self.train_ids)
        s_val = set(self.val_ids)
        s_test = set(self.test_ids)

        overlap_tv = s_train.intersection(s_val)
        overlap_tt = s_train.intersection(s_test)
        overlap_vt = s_val.intersection(s_test)

        if overlap_tv or overlap_tt or overlap_vt:
            raise ValueError(
                f"Data leakage detected! Trajectory split overlap: "
                f"Train/Val={overlap_tv}, Train/Test={overlap_tt}, Val/Test={overlap_vt}"
            )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def split_trajectories_chronologically(
    trajectory_ids: List[str],
    train_ratio: float = 0.60,
    val_ratio: float = 0.20,
    test_ratio: float = 0.20,
) -> DatasetSplits:
    """Split a list of trajectory identifiers deterministically by trajectory ID order.

    Args:
        trajectory_ids: Complete sorted list of available trajectory identifiers.
        train_ratio: Fraction reserved for training (e.g. 0.60).
        val_ratio: Fraction reserved for validation (e.g. 0.20).
        test_ratio: Fraction reserved for held-out testing (e.g. 0.20).

    Returns:
        DatasetSplits object with disjoint partitions.
    """
    total = len(trajectory_ids)
    if total < 3:
        raise ValueError(
            f"At least 3 trajectories required to partition into Train, Validation, and Test; found {total}."
        )

    # Calculate partition counts ensuring every split has at least 1 trajectory
    n_train = max(1, int(round(total * train_ratio)))
    n_val = max(1, int(round(total * val_ratio)))
    # Remainder goes to test
    if n_train + n_val >= total:
        n_train = total - 2
        n_val = 1
    n_test = total - (n_train + n_val)

    train_ids = trajectory_ids[:n_train]
    val_ids = trajectory_ids[n_train : n_train + n_val]
    test_ids = trajectory_ids[n_train + n_val :]

    splits = DatasetSplits(
        train_ids=train_ids,
        val_ids=val_ids,
        test_ids=test_ids,
        strategy="trajectory_chronological",
    )

    logger.info(
        "Trajectory split completed: Train=%d (%s), Val=%d (%s), Test=%d (%s)",
        len(train_ids),
        train_ids,
        len(val_ids),
        val_ids,
        len(test_ids),
        test_ids,
    )
    return splits


def save_splits(
    splits: DatasetSplits,
    splits_dir: Union[str, Path] = "data/splits",
) -> Dict[str, Path]:
    """Save split metadata to disk into train.json, validation.json, test.json, and splits.json.

    Args:
        splits: DatasetSplits instance.
        splits_dir: Destination folder path.

    Returns:
        Dictionary of saved file paths.
    """
    out_dir = Path(splits_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    paths: Dict[str, Path] = {
        "train": out_dir / "train.json",
        "validation": out_dir / "validation.json",
        "test": out_dir / "test.json",
        "all": out_dir / "splits.json",
    }

    with open(paths["train"], "w", encoding="utf-8") as f:
        json.dump({"trajectory_ids": splits.train_ids, "split": "train"}, f, indent=2)

    with open(paths["validation"], "w", encoding="utf-8") as f:
        json.dump({"trajectory_ids": splits.val_ids, "split": "validation"}, f, indent=2)

    with open(paths["test"], "w", encoding="utf-8") as f:
        json.dump({"trajectory_ids": splits.test_ids, "split": "test"}, f, indent=2)

    with open(paths["all"], "w", encoding="utf-8") as f:
        json.dump(splits.to_dict(), f, indent=2)

    logger.info("Saved trajectory partition files to %s", out_dir.resolve())
    return paths


def load_splits(splits_dir: Union[str, Path] = "data/splits") -> DatasetSplits:
    """Load split metadata from splits.json."""
    all_path = Path(splits_dir) / "splits.json"
    if not all_path.exists():
        raise FileNotFoundError(f"Splits metadata not found at '{all_path.resolve()}'")

    with open(all_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return DatasetSplits(
        train_ids=data["train_ids"],
        val_ids=data["val_ids"],
        test_ids=data["test_ids"],
        strategy=data.get("strategy", "trajectory_level"),
        random_seed=data.get("random_seed"),
    )
