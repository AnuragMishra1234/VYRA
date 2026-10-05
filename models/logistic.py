"""Logistic Regression Baseline Model Module for VYRA.

Provides regularized Logistic Regression wrapper and Persistence baseline
for GNSS degradation probability prediction.

ANTI-LEAKAGE SPECIFICATION:
- Feature scaling is fitted strictly on training data and applied to validation/test sets.
- No future observations or targets are accessed.
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


class PersistenceDegradationBaseline:
    """Persistence heuristic baseline for GNSS degradation.

    Predicts that future degradation is certain (P=1.0) if currently degraded at epoch t,
    and equals the empirical background base rate if currently healthy.
    """

    def __init__(self, current_quality_column: str = "is_currently_degraded") -> None:
        self.current_quality_column = current_quality_column
        self.base_rate: float = 0.01
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> PersistenceDegradationBaseline:
        """Estimate background base rate from training data."""
        y_arr = np.asarray(y, dtype=float)
        self.base_rate = float(np.mean(y_arr)) if len(y_arr) > 0 else 0.01
        self.is_fitted = True
        return self

    def predict_proba(
        self, X: np.ndarray, current_degraded_indicator: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """Predict degradation probability.

        Args:
            X: Feature matrix. If current_degraded_indicator is not provided,
               the first column of X is assumed to be the degradation indicator.
            current_degraded_indicator: Optional boolean array indicating current degradation.

        Returns:
            1D array of predicted probabilities P(y = 1 | x_t).
        """
        if current_degraded_indicator is not None:
            indicator = np.asarray(current_degraded_indicator, dtype=bool)
        else:
            # Fallback: check first column of X
            indicator = np.asarray(X[:, 0], dtype=bool)

        proba = np.where(indicator, 1.0, self.base_rate)
        return proba

    def predict(
        self,
        X: np.ndarray,
        threshold: float = 0.5,
        current_degraded_indicator: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Predict binary degradation status."""
        proba = self.predict_proba(X, current_degraded_indicator)
        return (proba >= threshold).astype(int)


class LogisticDegradationClassifier:
    """Regularized Logistic Regression classifier for GNSS degradation."""

    def __init__(
        self,
        c_regularization: float = 1.0,
        penalty: str = "l2",
        class_weight: Optional[str] = "balanced",
        max_iter: int = 1000,
        random_state: int = 42,
    ) -> None:
        self.c_regularization = c_regularization
        self.penalty = penalty
        self.class_weight = class_weight
        self.max_iter = max_iter
        self.random_state = random_state

        self.scaler: StandardScaler = StandardScaler()
        self.model: LogisticRegression = LogisticRegression(
            C=self.c_regularization,
            penalty=self.penalty,
            class_weight=self.class_weight,
            max_iter=self.max_iter,
            random_state=self.random_state,
            solver="lbfgs",
        )
        self.feature_names: List[str] = []
        self.is_fitted: bool = False

    def fit(
        self,
        X: Union[np.ndarray, List[List[float]]],
        y: Union[np.ndarray, List[int]],
        feature_names: Optional[List[str]] = None,
    ) -> LogisticDegradationClassifier:
        """Fit scaler and logistic regression strictly on training set."""
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=int)

        if feature_names is not None:
            self.feature_names = list(feature_names)
        else:
            self.feature_names = [f"feat_{i}" for i in range(X_arr.shape[1])]

        # Fit scaler on X_train only to prevent data leakage
        X_scaled = self.scaler.fit_transform(X_arr)
        self.model.fit(X_scaled, y_arr)
        self.is_fitted = True
        return self

    def predict_proba(self, X: Union[np.ndarray, List[List[float]]]) -> np.ndarray:
        """Predict probability P(y = 1 | X)."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict_proba.")
        X_arr = np.asarray(X, dtype=float)
        X_scaled = self.scaler.transform(X_arr)
        proba = self.model.predict_proba(X_scaled)
        # Return probability of positive class (y=1)
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
        """Return standardized coefficient weights for feature importance analysis."""
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before extracting feature importances.")
        coefs = self.model.coef_[0]
        return {
            feat: float(abs_coef)
            for feat, abs_coef in zip(self.feature_names, np.abs(coefs))
        }

    def save(self, filepath: Union[str, Path]) -> None:
        """Serialize trained model and scaler to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        logger.info("Saved Logistic model to %s", path.resolve())

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> LogisticDegradationClassifier:
        """Load trained model from disk."""
        path = Path(filepath)
        if not path.is_file():
            raise FileNotFoundError(f"Model file not found: {path.resolve()}")
        with open(path, "rb") as f:
            instance = pickle.load(f)
        if not isinstance(instance, cls):
            raise TypeError(f"Loaded object is not a {cls.__name__}")
        return instance
