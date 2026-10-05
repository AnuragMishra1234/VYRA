"""XGBoost Gradient Boosted Classifier Module for VYRA.

Provides gradient-boosted decision tree classification for GNSS degradation
prediction with class-imbalance weighting and feature attribution.
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import xgboost as xgb

logger = logging.getLogger(__name__)


class XGBoostDegradationClassifier:
    """XGBoost gradient boosting classifier for GNSS degradation."""

    def __init__(
        self,
        n_estimators: int = 150,
        max_depth: int = 6,
        learning_rate: float = 0.05,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        scale_pos_weight: Optional[float] = None,
        random_state: int = 42,
        n_jobs: int = -1,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.subsample = subsample
        self.colsample_bytree = colsample_bytree
        self.scale_pos_weight = scale_pos_weight
        self.random_state = random_state
        self.n_jobs = n_jobs

        self.model: Optional[xgb.XGBClassifier] = None
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def _init_model(self, computed_scale_pos_weight: float = 1.0) -> xgb.XGBClassifier:
        weight = self.scale_pos_weight if self.scale_pos_weight is not None else computed_scale_pos_weight
        return xgb.XGBClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            scale_pos_weight=weight,
            random_state=self.random_state,
            n_jobs=self.n_jobs,
            eval_metric="logloss",
        )

    def fit(
        self,
        X: Union[np.ndarray, List[List[float]]],
        y: Union[np.ndarray, List[int]],
        feature_names: Optional[List[str]] = None,
        eval_set: Optional[List[Tuple[np.ndarray, np.ndarray]]] = None,
    ) -> XGBoostDegradationClassifier:
        """Fit gradient boosting model on training data."""
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=int)

        if feature_names is not None:
            self.feature_names = list(feature_names)
        else:
            self.feature_names = [f"feat_{i}" for i in range(X_arr.shape[1])]

        # Compute empirical class imbalance weight: N_negative / N_positive
        pos_count = np.sum(y_arr == 1)
        neg_count = np.sum(y_arr == 0)
        auto_weight = float(neg_count / max(1, pos_count))

        self.model = self._init_model(computed_scale_pos_weight=auto_weight)

        if eval_set is not None:
            self.model.fit(X_arr, y_arr, eval_set=eval_set, verbose=False)
        else:
            self.model.fit(X_arr, y_arr, verbose=False)

        self.is_fitted = True
        return self

    def predict_proba(self, X: Union[np.ndarray, List[List[float]]]) -> np.ndarray:
        """Predict probability P(y = 1 | X)."""
        if not self.is_fitted or self.model is None:
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
        """Return gain-based feature importances."""
        if not self.is_fitted or self.model is None:
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
        logger.info("Saved XGBoost model to %s", path.resolve())

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> XGBoostDegradationClassifier:
        """Load trained model from disk."""
        path = Path(filepath)
        if not path.is_file():
            raise FileNotFoundError(f"Model file not found: {path.resolve()}")
        with open(path, "rb") as f:
            instance = pickle.load(f)
        if not isinstance(instance, cls):
            raise TypeError(f"Loaded object is not a {cls.__name__}")
        return instance
