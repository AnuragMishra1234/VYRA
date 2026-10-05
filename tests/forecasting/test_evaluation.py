"""Unit tests for Forecasting Evaluation Module."""

import numpy as np
import pytest

from forecasting.evaluation import (
    evaluate_action_ranking,
    evaluate_regression_metrics,
    evaluate_violation_classification,
)


def test_evaluate_regression_metrics():
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y_pred = np.array([1.2, 1.8, 3.1, 3.9, 5.2])

    metrics = evaluate_regression_metrics(y_true, y_pred)

    assert "rmse" in metrics
    assert "mae" in metrics
    assert "r2" in metrics
    assert "spearman_rho" in metrics
    assert metrics["rmse"] > 0.0
    assert metrics["r2"] > 0.90
    assert metrics["spearman_rho"] > 0.90
    assert metrics["count"] == 5


def test_evaluate_action_ranking():
    # 3 candidate actions: GNSS, HYBRID, DR across 4 epochs
    # True best action: [HYBRID, HYBRID, DR, GNSS]
    action_trues = {
        "GNSS": np.array([5.0, 6.0, 8.0, 1.0]),
        "HYBRID": np.array([1.0, 2.0, 4.0, 3.0]),
        "DR": np.array([3.0, 4.0, 1.5, 5.0]),
    }

    # Predicted errors: match on 3 out of 4 epochs
    action_preds = {
        "GNSS": np.array([4.8, 5.9, 7.5, 1.2]),
        "HYBRID": np.array([1.2, 2.1, 4.2, 2.8]),
        "DR": np.array([3.1, 3.9, 1.8, 4.9]),
    }

    ranking = evaluate_action_ranking(action_preds, action_trues)

    assert ranking["top1_ranking_accuracy"] == 1.0
    assert ranking["mean_regret_m"] == 0.0
    assert ranking["pairwise_ranking_accuracy"] > 0.80
    assert ranking["sample_count"] == 4


def test_evaluate_violation_classification():
    y_true = np.array([0, 0, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.8, 0.9, 0.7])

    res = evaluate_violation_classification(y_true, y_prob)

    assert res["auroc"] == 1.0
    assert res["accuracy"] == 1.0
    assert res["f1_score"] == 1.0
    assert res["brier_score"] < 0.1
