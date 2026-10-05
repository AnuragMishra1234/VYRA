"""GNSS Degradation Multi-Horizon Predictor for VYRA.

Orchestrates multi-horizon degradation probability prediction across
short-term forward horizons H in {1s, 3s, 5s, 10s}.

Supports:
- Model families: Persistence baseline, Logistic Regression, Random Forest, XGBoost.
- Per-horizon model training and feature attribution.
- Validation-driven decision threshold selection (optimizing F1 score).
- Out-of-sample probability calibration (Platt scaling / Isotonic).
- Model bundle serialization and inference serving.
"""

from __future__ import annotations

import json
import logging
import pickle
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, precision_recall_curve

from gnss.calibration import IsotonicCalibrator, PlattCalibrator, compute_calibration_metrics
from models.logistic import LogisticDegradationClassifier, PersistenceDegradationBaseline
from models.random_forest import RandomForestDegradationClassifier
from models.xgboost_model import XGBoostDegradationClassifier

logger = logging.getLogger(__name__)

STANDARD_HORIZONS: List[str] = ["1s", "3s", "5s", "10s"]
HORIZON_TO_SECONDS: Dict[str, float] = {"1s": 1.0, "3s": 3.0, "5s": 5.0, "10s": 10.0}


@dataclass
class HorizonModelBundle:
    """Trained model and calibration parameters for a single forward horizon."""

    horizon_name: str
    horizon_seconds: float
    model_type: str
    model: Any
    optimal_threshold: float = 0.50
    calibrator: Optional[Any] = None
    calibration_method: str = "none"
    feature_names: List[str] = field(default_factory=list)
    val_f1_at_optimal_threshold: float = 0.0


class GNSSDegradationPredictor:
    """Unified multi-horizon GNSS degradation prediction engine."""

    def __init__(
        self,
        model_type: str = "xgboost",
        horizons: Optional[List[str]] = None,
        model_kwargs: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.model_type = model_type.lower()
        self.horizons = horizons or STANDARD_HORIZONS
        self.model_kwargs = model_kwargs or {}
        self.bundles: Dict[str, HorizonModelBundle] = {}
        self.is_fitted: bool = False

    def _create_base_model(self) -> Any:
        if self.model_type == "persistence":
            return PersistenceDegradationBaseline()
        elif self.model_type == "logistic":
            return LogisticDegradationClassifier(**self.model_kwargs)
        elif self.model_type == "random_forest":
            return RandomForestDegradationClassifier(**self.model_kwargs)
        elif self.model_type == "xgboost":
            return XGBoostDegradationClassifier(**self.model_kwargs)
        else:
            raise ValueError(
                f"Unsupported model_type '{self.model_type}'. Choose from: "
                "persistence, logistic, random_forest, xgboost."
            )

    def fit(
        self,
        X_train: np.ndarray,
        y_train_dict: Dict[str, np.ndarray],
        feature_names: List[str],
        current_degraded_train: Optional[np.ndarray] = None,
    ) -> GNSSDegradationPredictor:
        """Fit individual models for each prediction horizon on training split."""
        self.bundles = {}
        for h_name in self.horizons:
            if h_name not in y_train_dict:
                raise KeyError(f"Training targets missing for horizon '{h_name}'.")

            y_h = np.asarray(y_train_dict[h_name], dtype=int)
            model = self._create_base_model()

            if self.model_type == "persistence":
                model.fit(X_train, y_h)
            else:
                model.fit(X_train, y_h, feature_names=feature_names)

            bundle = HorizonModelBundle(
                horizon_name=h_name,
                horizon_seconds=HORIZON_TO_SECONDS.get(h_name, 1.0),
                model_type=self.model_type,
                model=model,
                feature_names=list(feature_names),
            )
            self.bundles[h_name] = bundle

        self.is_fitted = True
        return self

    def tune_thresholds_and_calibrate(
        self,
        X_val: np.ndarray,
        y_val_dict: Dict[str, np.ndarray],
        calibration_method: str = "platt",
        current_degraded_val: Optional[np.ndarray] = None,
    ) -> Dict[str, Dict[str, float]]:
        """Optimize decision threshold on Validation set and fit probability calibrator.

        Threshold selection rule:
        Grid-search candidate thresholds theta in [0.05, 0.95] to maximize F1-score
        on validation data, avoiding test-set overfitting.
        """
        if not self.is_fitted:
            raise RuntimeError("Predictor must be fitted before threshold tuning.")

        tuning_results: Dict[str, Dict[str, float]] = {}

        for h_name, bundle in self.bundles.items():
            y_val = np.asarray(y_val_dict[h_name], dtype=int)

            # Predict raw probabilities on validation set
            if bundle.model_type == "persistence":
                val_probs = bundle.model.predict_proba(
                    X_val, current_degraded_indicator=current_degraded_val
                )
            else:
                val_probs = bundle.model.predict_proba(X_val)

            # Calibrate on validation set
            calibrator = None
            if calibration_method == "platt":
                calibrator = PlattCalibrator().fit(val_probs, y_val)
                cal_probs = calibrator.calibrate(val_probs)
            elif calibration_method == "isotonic":
                calibrator = IsotonicCalibrator().fit(val_probs, y_val)
                cal_probs = calibrator.calibrate(val_probs)
            else:
                cal_probs = val_probs

            bundle.calibrator = calibrator
            bundle.calibration_method = calibration_method

            # Threshold search on validation calibrated probabilities
            candidate_thresholds = np.linspace(0.05, 0.95, 91)
            best_thresh = 0.50
            best_f1 = -1.0

            for thresh in candidate_thresholds:
                preds = (cal_probs >= thresh).astype(int)
                score = float(f1_score(y_val, preds, zero_division=0))
                if score > best_f1:
                    best_f1 = score
                    best_thresh = float(thresh)

            # Fallback if no positive predictions or score=0
            if best_f1 <= 0.0:
                best_thresh = 0.50

            bundle.optimal_threshold = round(best_thresh, 3)
            bundle.val_f1_at_optimal_threshold = round(best_f1, 4)

            tuning_results[h_name] = {
                "optimal_threshold": bundle.optimal_threshold,
                "val_f1": bundle.val_f1_at_optimal_threshold,
            }

        return tuning_results

    def predict_proba(
        self,
        X: np.ndarray,
        horizon: str,
        calibrated: bool = True,
        current_degraded: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Predict probability for a single horizon."""
        if horizon not in self.bundles:
            raise KeyError(f"Horizon '{horizon}' not configured in predictor.")

        bundle = self.bundles[horizon]
        if bundle.model_type == "persistence":
            probs = bundle.model.predict_proba(
                X, current_degraded_indicator=current_degraded
            )
        else:
            probs = bundle.model.predict_proba(X)

        if calibrated and bundle.calibrator is not None:
            probs = bundle.calibrator.calibrate(probs)

        return probs

    def predict_all_horizons(
        self,
        X: np.ndarray,
        calibrated: bool = True,
        current_degraded: Optional[np.ndarray] = None,
    ) -> Dict[str, np.ndarray]:
        """Predict probabilities across all configured horizons."""
        return {
            h: self.predict_proba(
                X, h, calibrated=calibrated, current_degraded=current_degraded
            )
            for h in self.horizons
        }

    def predict_warnings(
        self,
        X: np.ndarray,
        horizon: str,
        threshold: Optional[float] = None,
        calibrated: bool = True,
        current_degraded: Optional[np.ndarray] = None,
    ) -> np.ndarray:
        """Predict binary degradation warning for a given horizon."""
        bundle = self.bundles[horizon]
        probs = self.predict_proba(
            X, horizon, calibrated=calibrated, current_degraded=current_degraded
        )
        cut = threshold if threshold is not None else bundle.optimal_threshold
        return (probs >= cut).astype(int)

    def get_feature_importances(self) -> Dict[str, Dict[str, float]]:
        """Return feature importances across all horizons."""
        importances: Dict[str, Dict[str, float]] = {}
        for h_name, bundle in self.bundles.items():
            if hasattr(bundle.model, "get_feature_importances"):
                importances[h_name] = bundle.model.get_feature_importances()
            else:
                importances[h_name] = {}
        return importances

    def save(self, filepath: Union[str, Path]) -> None:
        """Serialize complete predictor bundle to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        logger.info("Saved GNSS Degradation Predictor bundle to %s", path.resolve())

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> GNSSDegradationPredictor:
        """Load trained predictor bundle from disk."""
        path = Path(filepath)
        if not path.is_file():
            raise FileNotFoundError(f"Predictor bundle not found at {path.resolve()}")
        with open(path, "rb") as f:
            instance = pickle.load(f)
        if not isinstance(instance, cls):
            raise TypeError(f"Loaded object is not a {cls.__name__}")
        return instance
