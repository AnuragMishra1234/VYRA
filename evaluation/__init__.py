"""VYRA Evaluation Package.

Modules for computing formal research metrics: Absolute Trajectory Error (ATE),
Relative Trajectory Error (RTE), Root Mean Square Error (RMSE), drift rates,
action-conditioned forecast metrics, handover/policy stability, and statistical tests.
"""

from evaluation.ate import ATESummary, compute_ate_summary, compute_pointwise_position_error
from evaluation.drift import compute_average_outage_drift_rate, compute_drift_rate
from evaluation.forecast_metrics import (
    ActionRankingMetrics,
    ForecastRegressionMetrics,
    compute_action_ranking_metrics,
    compute_forecast_regression_metrics,
)
from evaluation.handover_metrics import HandoverSummary, compute_handover_metrics
from evaluation.rmse import compute_horizontal_rmse, compute_rmse
from evaluation.rte import compute_relative_trajectory_error
from evaluation.statistical_tests import (
    PairedStatisticalReport,
    compute_bootstrap_ci,
    evaluate_paired_policy_comparison,
)

__all__ = [
    "ATESummary",
    "compute_pointwise_position_error",
    "compute_ate_summary",
    "compute_relative_trajectory_error",
    "compute_rmse",
    "compute_horizontal_rmse",
    "compute_drift_rate",
    "compute_average_outage_drift_rate",
    "ForecastRegressionMetrics",
    "ActionRankingMetrics",
    "compute_forecast_regression_metrics",
    "compute_action_ranking_metrics",
    "HandoverSummary",
    "compute_handover_metrics",
    "PairedStatisticalReport",
    "compute_bootstrap_ci",
    "evaluate_paired_policy_comparison",
]
