"""Unit Tests for Degradation Classifiers and Multi-Horizon Predictor."""

from pathlib import Path
import numpy as np
import pytest

from gnss.predictor import GNSSDegradationPredictor
from models.logistic import LogisticDegradationClassifier, PersistenceDegradationBaseline
from models.random_forest import RandomForestDegradationClassifier
from models.xgboost_model import XGBoostDegradationClassifier


@pytest.fixture
def synthetic_data():
    np.random.seed(42)
    n = 100
    n_features = 5
    X = np.random.randn(n, n_features)
    # Generate imbalanced target (10% positive)
    y = (X[:, 0] + X[:, 1] > 1.5).astype(int)
    feat_names = [f"feat_{i}" for i in range(n_features)]
    return X, y, feat_names


def test_persistence_baseline(synthetic_data):
    X, y, _ = synthetic_data
    baseline = PersistenceDegradationBaseline()
    baseline.fit(X, y)
    assert baseline.is_fitted

    curr_deg = np.array([True, False, True, False])
    probs = baseline.predict_proba(X[:4], current_degraded_indicator=curr_deg)
    assert probs[0] == 1.0
    assert probs[1] == baseline.base_rate
    assert probs[2] == 1.0
    assert probs[3] == baseline.base_rate


def test_logistic_classifier(synthetic_data, tmp_path):
    X, y, feat_names = synthetic_data
    clf = LogisticDegradationClassifier(c_regularization=1.0)
    clf.fit(X, y, feature_names=feat_names)
    assert clf.is_fitted

    probs = clf.predict_proba(X)
    assert len(probs) == len(X)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    preds = clf.predict(X, threshold=0.5)
    assert len(preds) == len(X)
    assert set(preds).issubset({0, 1})

    imps = clf.get_feature_importances()
    assert len(imps) == len(feat_names)

    # Test serialization
    model_file = tmp_path / "logistic_test.pkl"
    clf.save(model_file)
    loaded = LogisticDegradationClassifier.load(model_file)
    assert loaded.is_fitted
    assert np.allclose(loaded.predict_proba(X), probs)


def test_random_forest_classifier(synthetic_data, tmp_path):
    X, y, feat_names = synthetic_data
    clf = RandomForestDegradationClassifier(n_estimators=10, max_depth=4)
    clf.fit(X, y, feature_names=feat_names)
    assert clf.is_fitted

    probs = clf.predict_proba(X)
    assert len(probs) == len(X)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    imps = clf.get_feature_importances()
    assert len(imps) == len(feat_names)

    model_file = tmp_path / "rf_test.pkl"
    clf.save(model_file)
    loaded = RandomForestDegradationClassifier.load(model_file)
    assert loaded.is_fitted


def test_xgboost_classifier(synthetic_data, tmp_path):
    X, y, feat_names = synthetic_data
    clf = XGBoostDegradationClassifier(n_estimators=10, max_depth=3)
    clf.fit(X, y, feature_names=feat_names)
    assert clf.is_fitted

    probs = clf.predict_proba(X)
    assert len(probs) == len(X)
    assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    imps = clf.get_feature_importances()
    assert len(imps) == len(feat_names)

    model_file = tmp_path / "xgb_test.pkl"
    clf.save(model_file)
    loaded = XGBoostDegradationClassifier.load(model_file)
    assert loaded.is_fitted


def test_gnss_degradation_predictor_pipeline(synthetic_data, tmp_path):
    X, y, feat_names = synthetic_data
    y_dict = {
        "1s": y,
        "3s": y,
        "5s": y,
        "10s": y,
    }

    predictor = GNSSDegradationPredictor(model_type="logistic", horizons=["1s", "3s"])
    predictor.fit(X, y_dict, feature_names=feat_names)
    assert predictor.is_fitted
    assert "1s" in predictor.bundles
    assert "3s" in predictor.bundles

    tuning = predictor.tune_thresholds_and_calibrate(X, y_dict, calibration_method="platt")
    assert "1s" in tuning
    assert "optimal_threshold" in tuning["1s"]

    all_probs = predictor.predict_all_horizons(X)
    assert "1s" in all_probs
    assert "3s" in all_probs
    assert len(all_probs["1s"]) == len(X)

    warnings = predictor.predict_warnings(X, horizon="1s")
    assert len(warnings) == len(X)
    assert set(warnings).issubset({0, 1})

    bundle_file = tmp_path / "predictor_bundle.pkl"
    predictor.save(bundle_file)
    loaded_bundle = GNSSDegradationPredictor.load(bundle_file)
    assert loaded_bundle.is_fitted
