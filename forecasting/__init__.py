"""VYRA Forecasting Package.

Critical module implementing action-conditioned / counterfactual short-horizon
future localization-error and risk forecasting across candidate navigation modes
(GNSS, HYBRID, DR).
"""

from forecasting.action_conditioning import (
    ACTION_NAMES,
    NUM_ACTIONS,
    NavigationAction,
    assemble_action_conditioned_feature_vector,
    assemble_action_conditioned_matrix,
    encode_action_one_hot,
)
from forecasting.calibration import (
    ConformalResidualCalibrator,
    ProbabilityCalibrator,
    compute_expected_calibration_error,
)
from forecasting.evaluation import (
    evaluate_action_ranking,
    evaluate_regression_metrics,
    evaluate_violation_classification,
)
from forecasting.features import (
    FORECAST_BASE_FEATURE_NAMES,
    ForecastingFeatureExtractor,
)
from forecasting.models import (
    ActionConditionedForecastEngine,
    PersistenceForecastBaseline,
    RandomForestForecastModel,
    RidgeForecastModel,
    XGBoostForecastModel,
)
from forecasting.targets import (
    STANDARD_FORECAST_HORIZONS,
    compute_future_horizon_targets,
    generate_action_conditioned_dataset,
)

__all__ = [
    "ACTION_NAMES",
    "NUM_ACTIONS",
    "NavigationAction",
    "encode_action_one_hot",
    "assemble_action_conditioned_feature_vector",
    "assemble_action_conditioned_matrix",
    "FORECAST_BASE_FEATURE_NAMES",
    "ForecastingFeatureExtractor",
    "STANDARD_FORECAST_HORIZONS",
    "compute_future_horizon_targets",
    "generate_action_conditioned_dataset",
    "PersistenceForecastBaseline",
    "RidgeForecastModel",
    "RandomForestForecastModel",
    "XGBoostForecastModel",
    "ActionConditionedForecastEngine",
    "evaluate_regression_metrics",
    "evaluate_action_ranking",
    "evaluate_violation_classification",
    "compute_expected_calibration_error",
    "ConformalResidualCalibrator",
    "ProbabilityCalibrator",
]
