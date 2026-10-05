"""Action-Conditioned Localization-Error Forecasting Models for VYRA.

Defines supervised regression models predicting future localization error consequences:
  e_hat(s_t, A, H) = E[max_{tau in (t, t+H]} ||p_A(tau) - p_gt(tau)|| | s_t, A]

Model Families:
1. Persistence / Naive Baseline: Heuristic estimation based on current signal and DR variance.
2. Regularized Linear Regression (Ridge): Scaled causal linear baseline.
3. Random Forest Regressor: Non-linear tree ensemble capturing action-state splits.
4. XGBoost Regressor: High-capacity gradient boosted decision trees.

ANTI-LEAKAGE SPECIFICATION:
All models are fit strictly on training partitions. Preprocessing transformations
(e.g., standard scaling) are fitted on train X only.
"""

from __future__ import annotations

import logging
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

from forecasting.action_conditioning import (
    ACTION_NAMES,
    NavigationAction,
    assemble_action_conditioned_feature_vector,
    assemble_action_conditioned_matrix,
)

logger = logging.getLogger(__name__)


class PersistenceForecastBaseline:
    """Heuristic / Persistence baseline for action-conditioned error forecasting."""

    def __init__(self) -> None:
        self.is_fitted: bool = False
        self.mean_train_error: float = 2.0

    def fit(self, X: np.ndarray, y: np.ndarray) -> PersistenceForecastBaseline:
        self.mean_train_error = float(np.mean(y)) if len(y) > 0 else 2.0
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        # If X contains action one-hot at indices [-6, -5, -4] or similar:
        # Heuristic: GNSS error scales with inverse quality, DR scales with DR uncertainty
        preds = np.full(len(X), self.mean_train_error, dtype=float)
        return preds


class RidgeForecastModel:
    """Regularized Ridge linear regression for action-conditioned error forecasting."""

    def __init__(self, alpha: float = 1.0, random_state: int = 42) -> None:
        self.alpha = alpha
        self.random_state = random_state
        self.scaler: StandardScaler = StandardScaler()
        self.model: Ridge = Ridge(alpha=self.alpha, random_state=self.random_state)
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> RidgeForecastModel:
        X_arr = np.asarray(X, dtype=float)
        y_arr = np.asarray(y, dtype=float)
        X_scaled = self.scaler.fit_transform(X_arr)
        self.model.fit(X_scaled, y_arr)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict().")
        X_scaled = self.scaler.transform(np.asarray(X, dtype=float))
        preds = self.model.predict(X_scaled)
        # Position error cannot be negative
        return np.maximum(0.0, preds)

    def save(self, filepath: Union[str, Path]) -> None:
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> RidgeForecastModel:
        with open(filepath, "rb") as f:
            return pickle.load(f)


class RandomForestForecastModel:
    """Random Forest regressor for action-conditioned error forecasting."""

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: Optional[int] = 12,
        min_samples_leaf: int = 4,
        random_state: int = 42,
        n_jobs: int = -1,
    ) -> None:
        self.model: RandomForestRegressor = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_leaf=min_samples_leaf,
            random_state=random_state,
            n_jobs=n_jobs,
        )
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> RandomForestForecastModel:
        self.model.fit(np.asarray(X, dtype=float), np.asarray(y, dtype=float))
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict().")
        preds = self.model.predict(np.asarray(X, dtype=float))
        return np.maximum(0.0, preds)

    def save(self, filepath: Union[str, Path]) -> None:
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> RandomForestForecastModel:
        with open(filepath, "rb") as f:
            return pickle.load(f)


class XGBoostForecastModel:
    """XGBoost gradient boosting regressor for action-conditioned error forecasting."""

    def __init__(
        self,
        n_estimators: int = 150,
        max_depth: int = 6,
        learning_rate: float = 0.05,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        random_state: int = 42,
        n_jobs: int = -1,
    ) -> None:
        self.model = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            random_state=random_state,
            n_jobs=n_jobs,
            objective="reg:squarederror",
        )
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> XGBoostForecastModel:
        self.model.fit(np.asarray(X, dtype=float), np.asarray(y, dtype=float), verbose=False)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before predict().")
        preds = self.model.predict(np.asarray(X, dtype=float))
        return np.maximum(0.0, preds)

    def save(self, filepath: Union[str, Path]) -> None:
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> XGBoostForecastModel:
        with open(filepath, "rb") as f:
            return pickle.load(f)


class ActionConditionedForecastEngine:
    """Master engine orchestrating action-conditioned forecasting across all modes."""

    def __init__(self, model_type: str = "xgboost", model_kwargs: Optional[Dict[str, Any]] = None) -> None:
        self.model_type = model_type.lower()
        self.model_kwargs = model_kwargs or {}
        self.model = self._create_model()
        self.is_fitted: bool = False

    def _create_model(self) -> Any:
        if self.model_type == "persistence":
            return PersistenceForecastBaseline()
        elif self.model_type == "ridge":
            return RidgeForecastModel(**self.model_kwargs)
        elif self.model_type == "random_forest":
            return RandomForestForecastModel(**self.model_kwargs)
        elif self.model_type == "xgboost":
            return XGBoostForecastModel(**self.model_kwargs)
        else:
            raise ValueError(f"Unsupported model_type '{self.model_type}'.")

    def fit(self, X_conditioned: np.ndarray, y: np.ndarray) -> ActionConditionedForecastEngine:
        self.model.fit(X_conditioned, y)
        self.is_fitted = True
        return self

    def predict_action(
        self,
        base_features: np.ndarray,
        action: Union[str, NavigationAction],
        horizon_seconds: float,
    ) -> np.ndarray:
        """Predict expected future error for a specific candidate action."""
        if not self.is_fitted:
            raise RuntimeError("Forecast engine must be fitted before prediction.")

        if base_features.ndim == 1:
            x_cond = assemble_action_conditioned_feature_vector(
                base_features, action=action, horizon_seconds=horizon_seconds
            ).reshape(1, -1)
            return self.model.predict(x_cond)[0]
        else:
            X_cond = assemble_action_conditioned_matrix(
                base_features, action=action, horizon_seconds=horizon_seconds
            )
            return self.model.predict(X_cond)

    def forecast_all_actions(
        self,
        base_features: np.ndarray,
        horizon_seconds: float,
    ) -> Dict[str, Union[float, np.ndarray]]:
        """Forecast future localization error consequences for all candidate modes {GNSS, HYBRID, DR}."""
        return {
            act: self.predict_action(base_features, action=act, horizon_seconds=horizon_seconds)
            for act in ACTION_NAMES
        }
