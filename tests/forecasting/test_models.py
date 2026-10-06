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


def test_action_conditioning_pathway_and_sensitivity():
    """Verify ISSUE-06: Action-conditioning modulates input features and model forecasts."""
    from forecasting.action_conditioning import (
        ACTION_NAMES,
        assemble_action_conditioned_matrix,
    )

    # 1. Test feature pathway: identical state + horizon -> distinct action-dependent representations
    np.random.seed(42)
    base_state = np.array([[1.0, 2.0, 0.5, 0.1, 15.0]])  # Shape (1, 5)
    horizon = 3.0

    X_gnss = assemble_action_conditioned_matrix(base_state, action="GNSS", horizon_seconds=horizon)
    X_hybrid = assemble_action_conditioned_matrix(base_state, action="HYBRID", horizon_seconds=horizon)
    X_dr = assemble_action_conditioned_matrix(base_state, action="DR", horizon_seconds=horizon)

    # Verify input representations are distinct across actions
    assert not np.array_equal(X_gnss, X_hybrid)
    assert not np.array_equal(X_hybrid, X_dr)
    assert not np.array_equal(X_gnss, X_dr)

    # Action one-hot bits are at indices 5, 6, 7 (after 5 base features)
    assert np.all(X_gnss[0, 5:8] == [1.0, 0.0, 0.0])
    assert np.all(X_hybrid[0, 5:8] == [0.0, 1.0, 0.0])
    assert np.all(X_dr[0, 5:8] == [0.0, 0.0, 1.0])

    # 2. Test output sensitivity: train model on action-differentiated data
    # Create dataset where action choice directly impacts expected error
    n_per_act = 40
    X_all_list = []
    y_all_list = []

    action_error_offsets = {"GNSS": 12.0, "HYBRID": 1.5, "DR": 6.0}

    for act_name, offset in action_error_offsets.items():
        base_samples = np.random.randn(n_per_act, 5) * 0.1
        X_act = assemble_action_conditioned_matrix(base_samples, action=act_name, horizon_seconds=horizon)
        # Target error is baseline + offset + tiny noise
        y_act = offset + np.abs(base_samples[:, 0]) + np.random.randn(n_per_act) * 0.05
        X_all_list.append(X_act)
        y_all_list.append(y_act)

    X_train = np.vstack(X_all_list)
    y_train = np.concatenate(y_all_list)

    engine = ActionConditionedForecastEngine(model_type="ridge", model_kwargs={"alpha": 0.1})
    engine.fit(X_train, y_train)

    # Query same state across all candidate actions
    test_probe = np.zeros(5)
    preds = engine.forecast_all_actions(test_probe, horizon_seconds=horizon)

    # Verify model produces action-dependent forecasts matching conditioned data
    assert preds["GNSS"] > preds["DR"] > preds["HYBRID"]
    assert abs(preds["GNSS"] - 12.0) < 1.0
    assert abs(preds["DR"] - 6.0) < 1.0
    assert abs(preds["HYBRID"] - 1.5) < 1.0

