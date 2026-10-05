"""Random Forest Classifier Module for VYRA.

Provides non-linear ensemble Decision Tree classification for GNSS degradation
prediction and feature importance quantification.
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger(__name__)


class RandomForestDegradationClassifier:
    """Random Forest ensemble classifier for GNSS degradation prediction."""

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: Optional[int] = 12,
        min_samples_split: int = 10,
        min_samples_leaf: int = 5,
        class_weight: Optional[str] = "balanced_subsample",
        n_jobs: int = -1,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.class_weight = class_weight
        self.n_jobs = n_jobs
        self.random_state = random_state

        self.model: RandomForestClassifier = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            class_weight=self.class_weight,
            n_jobs=self.n_jobs,
            random_state=self.random_state,
        )
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def fit(
        self,
        X: Union[np.ndarray, List[List[float]]],
        y: Union[np.ndarray, List[int]],
        feature_names: Optional[List[str]] = None,
    ) -> RandomForestDegradationClassifier:
        """Fit ensemble classifier strictly on training data."""
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=int)

        if feature_names is not None:
            self.feature_names = list(feature_names)
        else:
            self.feature_names = [f"feat_{i}" for i in range(X_arr.shape[1])]

        self.model.fit(X_arr, y_arr)
        self.is_fitted = True
        return self

    def predict_proba(self, X: Union[np.ndarray, List[List[float]]]) -> np.ndarray:
        """Predict degradation probability P(y = 1 | X)."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict_proba.")
        X_arr = np.asarray(X, dtype=float)
        proba = self.model.predict_proba(X_arr)
        if proba.shape[1] == 2:
            return proba[:, 1]
        return proba[:, 0]

    def predict(
        self, X: Union[np.ndarray, List[List[float]]], threshold: float = 0.5
    ) -> np.ndarray:
        """Predict binary degradation indicator using decision threshold."""
        proba = self.predict_proba(X)
        return (proba >= threshold).astype(int)

    def get_feature_importances(self) -> Dict[str, float]:
        """Return Gini impurity-based feature importances."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before extracting feature importances.")
        importances = self.model.feature_importances_
        return {
            feat: float(imp)
            for feat, imp in zip(self.feature_names, importances)
        }

    def save(self, filepath: Union[str, Path]) -> None:
        """Serialize trained model to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        logger.info("Saved RandomForest model to %s", path.resolve())

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> RandomForestDegradationClassifier:
        """Load trained model from disk."""
        path = Path(filepath)
        if not path.is_file():
            raise FileNotFoundError(f"Model file not found: {path.resolve()}")
        with open(path, "rb") as f:
            instance = pickle.load(f)
        if not isinstance(instance, cls):
            raise TypeError(f"Loaded object is not a {cls.__name__}")
        return instance
