"""Unit tests for Forecasting Models."""

import numpy as np
import pytest

from forecasting.action_conditioning import NUM_ACTIONS
from forecasting.models import (
    ActionConditionedForecastEngine,
    PersistenceForecastBaseline,
    RandomForestForecastModel,
    RidgeForecastModel,
    XGBoostForecastModel,
)


def _generate_synthetic_conditioned_data(n_samples: int = 50, d_feat: int = 5):
    from forecasting.action_conditioning import assemble_action_conditioned_matrix
    base_X = np.random.randn(n_samples, d_feat)
    X = assemble_action_conditioned_matrix(base_X, action="HYBRID", horizon_seconds=3.0)
    # Target: positive continuous error
    y = np.abs(base_X[:, 0] * 2.0 + 1.0)
    return X, y


def test_persistence_baseline():
    X, y = _generate_synthetic_conditioned_data()
    model = PersistenceForecastBaseline()
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds >= 0.0)


def test_ridge_forecast_model():
    X, y = _generate_synthetic_conditioned_data()
    model = RidgeForecastModel(alpha=1.0)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds >= 0.0)


def test_random_forest_forecast_model():
    X, y = _generate_synthetic_conditioned_data()
    model = RandomForestForecastModel(n_estimators=10, max_depth=3)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds >= 0.0)


def test_xgboost_forecast_model():
    X, y = _generate_synthetic_conditioned_data()
    model = XGBoostForecastModel(n_estimators=10, max_depth=3)
    model.fit(X, y)
    preds = model.predict(X)
    assert len(preds) == len(X)
    assert np.all(preds >= 0.0)


def test_action_conditioned_forecast_engine():
    X, y = _generate_synthetic_conditioned_data()
    engine = ActionConditionedForecastEngine(
        model_type="ridge",
        model_kwargs={"alpha": 1.0},
    )
    engine.fit(X, y)
    assert engine.is_fitted

    base_vec = np.random.randn(5)
    all_preds = engine.forecast_all_actions(base_vec, horizon_seconds=3.0)
    assert "GNSS" in all_preds
    assert "HYBRID" in all_preds
    assert "DR" in all_preds
    assert all_preds["GNSS"] >= 0.0
