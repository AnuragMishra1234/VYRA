"""Comprehensive Unit Tests for VYRA Evaluation Modules."""

import numpy as np
import pytest

from evaluation.ate import compute_ate_summary, compute_pointwise_position_error
from evaluation.drift import compute_average_outage_drift_rate, compute_drift_rate
from evaluation.forecast_metrics import (
    compute_action_ranking_metrics,
    compute_forecast_regression_metrics,
)
from evaluation.handover_metrics import compute_handover_metrics
from evaluation.rmse import compute_horizontal_rmse, compute_rmse
from evaluation.rte import compute_relative_trajectory_error
from evaluation.statistical_tests import (
    compute_bootstrap_ci,
    evaluate_paired_policy_comparison,
)
from experiments.registry import ExperimentRegistry


def test_ate_summary_metrics():
    """Verify ATE summary calculations, percentiles, and threshold violations."""
    est_e = np.array([0.0, 3.0, 6.0, 10.0])
    est_n = np.array([0.0, 4.0, 8.0, 0.0])
    gt_e = np.zeros(4)
    gt_n = np.zeros(4)

    errors = compute_pointwise_position_error(est_e, est_n, gt_e, gt_n)
    # Expected errors: [0, 5, 10, 10]
    np.testing.assert_allclose(errors, [0.0, 5.0, 10.0, 10.0])

    summary = compute_ate_summary(errors, sample_rate_hz=10.0, threshold_5m=5.0)
    assert summary.mean_ate_m == 6.25
    assert summary.median_ate_m == 7.5
    assert summary.max_error_m == 10.0
    # Two values strictly > 5.0 out of 4 (50%)
    assert summary.violation_rate_5m_pct == 50.0


def test_relative_trajectory_error():
    """Verify Relative Trajectory Error (RTE) computation."""
    est_e = np.linspace(0, 100, 100)
    est_n = np.linspace(0, 50, 100)
    gt_e = est_e.copy()
    gt_n = est_n.copy()

    # When estimate perfectly matches GT, RTE should be exactly 0
    rte_res = compute_relative_trajectory_error(est_e, est_n, gt_e, gt_n, delta_epochs=10)
    assert rte_res["mean_rte_m"] == 0.0
    assert rte_res["max_rte_m"] == 0.0


def test_forecast_and_action_ranking_metrics():
    """Verify forecast regression and action ranking accuracy metrics."""
    y_true = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y_pred = np.array([1.1, 2.1, 2.9, 4.2, 4.9])

    reg_metrics = compute_forecast_regression_metrics(y_true, y_pred)
    assert reg_metrics.mae < 0.2
    assert reg_metrics.spearman_rho > 0.95

    # Action ranking: 3 actions across 4 epochs
    true_acts = {
        "GNSS": np.array([1.0, 5.0, 1.0, 8.0]),
        "HYBRID": np.array([0.5, 0.6, 0.8, 0.7]),
        "DR": np.array([2.0, 2.0, 2.0, 2.0]),
    }
    # In all 4 epochs, HYBRID has lowest true error
    pred_acts = {
        "GNSS": np.array([1.2, 4.8, 1.1, 7.5]),
        "HYBRID": np.array([0.6, 0.7, 0.9, 0.8]),
        "DR": np.array([2.1, 1.9, 2.2, 2.1]),
    }
    rank_res = compute_action_ranking_metrics(true_acts, pred_acts)
    assert rank_res.top1_match_accuracy_pct == 100.0
    assert rank_res.mean_regret_m == 0.0


def test_handover_metrics_formal_definitions():
    """Verify handover count, chattering rate, and unnecessary switches."""
    # Pattern: HYBRID -> DR -> HYBRID -> DR -> HYBRID (rapid oscillation)
    modes = ["HYBRID"] * 10 + ["DR"] * 5 + ["HYBRID"] * 15 + ["DR"] * 30
    timestamps = np.linspace(0, 5.9, 60)  # 0.1s steps

    ho_summary = compute_handover_metrics(modes, timestamps, min_dwell_threshold_s=2.0)
    assert ho_summary.total_handovers == 3
    # First DR run lasted 5 epochs = 0.5s (< 2.0s), so chattering occurred
    assert ho_summary.chattering_handovers >= 1
    assert ho_summary.chattering_rate_pct > 0.0


def test_statistical_hypothesis_testing():
    """Verify paired statistical tests, bootstrap CIs, and effect sizes."""
    # Simulated 15 outage events where baseline error is consistently larger than VYRA
    rng = np.random.RandomState(42)
    vyra_ates = np.array([0.3, 0.4, 0.35, 0.28, 0.45, 0.32, 0.38, 0.41, 0.36, 0.30, 0.42, 0.37, 0.39, 0.33, 0.35])
    baseline_ates = vyra_ates + rng.uniform(0.15, 0.45, size=15)

    report = evaluate_paired_policy_comparison(baseline_ates, vyra_ates, alpha=0.05, n_bootstraps=500, seed=42)

    assert report.sample_size_n == 15
    assert report.mean_difference > 0.15
    assert report.is_statistically_significant is True
    assert report.p_value_wilcoxon < 0.05
    assert report.cohens_d > 1.0  # Large effect size
    assert report.ci_95_lower > 0.0


def test_experiment_registry_persistence(tmp_path):
    """Verify structured experiment registry records and persists data."""
    reg_file = tmp_path / "test_registry.json"
    registry = ExperimentRegistry(file_path=reg_file)

    rec = registry.register(
        experiment_id="TEST-EXP-01",
        phase="Phase 5 Test",
        scenario_name="Unit Test Scenario",
        degradation_type="synthetic",
        trajectory_ids=["TEST-01"],
        metrics_summary={"ATE": 0.25},
    )

    assert rec.experiment_id == "TEST-EXP-01"
    assert len(registry.list_all()) == 1

    # Reload from disk
    reg2 = ExperimentRegistry(file_path=reg_file)
    assert len(reg2.list_all()) == 1
    loaded_rec = reg2.get("TEST-EXP-01")
    assert loaded_rec is not None
    assert loaded_rec["metrics_summary"]["ATE"] == 0.25
