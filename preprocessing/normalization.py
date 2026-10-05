"""Feature Normalization Module for VYRA.

Enforces strict anti-data-leakage scaling:
Normalization parameters (mean, standard deviation, min, max) must be fitted
EXCLUSIVELY on training trajectories and subsequently applied as immutable
transforms to validation and unseen test trajectories.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class ColumnStatistics:
    """Fitted normalization statistics for a single feature column."""

    mean: float
    std: float
    min_val: float
    max_val: float
    eps: float = 1e-8

    def standardize(self, values: np.ndarray) -> np.ndarray:
        """Apply z-score standardization: (x - mu) / max(sigma, eps)."""
        denom = self.std if self.std > self.eps else 1.0
        return (values - self.mean) / denom

    def min_max_scale(self, values: np.ndarray) -> np.ndarray:
        """Apply min-max scaling to [0, 1]."""
        spread = self.max_val - self.min_val
        denom = spread if spread > self.eps else 1.0
        return (values - self.min_val) / denom


@dataclass
class TrajectoryNormalizer:
    """Manages fitted feature statistics and serialization for leak-free scaling."""

    feature_columns: List[str]
    method: str = "standard"  # 'standard' (z-score) or 'minmax'
    stats: Dict[str, ColumnStatistics] = field(default_factory=dict)
    fitted: bool = False
    fit_trajectory_ids: List[str] = field(default_factory=list)

    def fit(
        self,
        train_dfs: List[pd.DataFrame],
        trajectory_ids: Optional[List[str]] = None,
    ) -> TrajectoryNormalizer:
        """Fit normalization parameters strictly on training trajectory DataFrames.

        Args:
            train_dfs: List of training split trajectory DataFrames.
            trajectory_ids: Optional list of trajectory IDs used for fitting audit log.

        Returns:
            Fitted TrajectoryNormalizer instance.
        """
        if not train_dfs:
            raise ValueError("Cannot fit normalizer on empty list of DataFrames.")

        combined = pd.concat(
            [df[self.feature_columns] for df in train_dfs], ignore_index=True
        )

        self.stats = {}
        for col in self.feature_columns:
            series = pd.to_numeric(combined[col], errors="coerce").dropna()
            if len(series) == 0:
                mean_val = std_val = min_val = max_val = 0.0
            else:
                mean_val = float(series.mean())
                std_val = float(series.std(ddof=1)) if len(series) > 1 else 1.0
                min_val = float(series.min())
                max_val = float(series.max())

            self.stats[col] = ColumnStatistics(
                mean=mean_val,
                std=std_val if not np.isnan(std_val) else 1.0,
                min_val=min_val,
                max_val=max_val,
            )

        self.fitted = True
        self.fit_trajectory_ids = list(trajectory_ids or [])
        logger.info(
            "Fitted normalizer on %d columns across %d training trajectories.",
            len(self.feature_columns),
            len(train_dfs),
        )
        return self

    def transform(
        self, df: pd.DataFrame, inplace: bool = False, prefix: str = "norm_"
    ) -> pd.DataFrame:
        """Apply fitted normalization parameters to input DataFrame.

        Args:
            df: Input DataFrame (train, validation, or test).
            inplace: Whether to overwrite existing columns or prepend prefix.
            prefix: Prefix for transformed column names if not inplace.

        Returns:
            DataFrame with normalized features.

        Raises:
            RuntimeError: If normalizer is not fitted.
        """
        if not self.fitted:
            raise RuntimeError(
                "Normalizer must be fitted on training split before calling transform()."
            )

        out_df = df if inplace else df.copy()

        for col in self.feature_columns:
            if col not in df.columns:
                continue

            vals = pd.to_numeric(df[col], errors="coerce").values
            stat = self.stats[col]

            if self.method == "standard":
                norm_vals = stat.standardize(vals)
            elif self.method == "minmax":
                norm_vals = stat.min_max_scale(vals)
            else:
                raise ValueError(f"Unsupported normalization method: '{self.method}'")

            out_col = col if inplace else f"{prefix}{col}"
            out_df[out_col] = norm_vals

        return out_df

    def to_dict(self) -> Dict[str, Any]:
        """Serialize fitted statistics to a JSON-compatible dictionary."""
        return {
            "method": self.method,
            "feature_columns": self.feature_columns,
            "fitted": self.fitted,
            "fit_trajectory_ids": self.fit_trajectory_ids,
            "stats": {k: asdict(v) for k, v in self.stats.items()},
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> TrajectoryNormalizer:
        """Instantiate normalizer from serialized dictionary."""
        stats = {k: ColumnStatistics(**v) for k, v in data.get("stats", {}).items()}
        return cls(
            feature_columns=data["feature_columns"],
            method=data.get("method", "standard"),
            stats=stats,
            fitted=data.get("fitted", False),
            fit_trajectory_ids=data.get("fit_trajectory_ids", []),
        )

    def save_json(self, path: Union[str, Path]) -> None:
        """Save fitted normalizer parameters to JSON file."""
        file_path = Path(path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load_json(cls, path: Union[str, Path]) -> TrajectoryNormalizer:
        """Load normalizer parameters from JSON file."""
        with open(Path(path), "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)
