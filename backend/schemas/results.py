"""Pydantic schemas for Research Experiment Results and Publication Tables."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NavigationComparisonRow(BaseModel):
    """Table 1: Primary Navigation Comparison row."""

    policy: str = Field(..., alias="Policy")
    ate_m: float = Field(..., alias="ATE (m)")
    rte_m: float = Field(..., alias="RTE (m)")
    rmse_m: float = Field(..., alias="RMSE (m)")
    max_error_m: float = Field(..., alias="Max Error (m)")
    final_error_m: float = Field(..., alias="Final Error (m)")
    time_above_5m_s: float = Field(..., alias="Time > 5m (s)")
    violations_pct: float = Field(..., alias="Violations > 5m (%)")
    handovers: int = Field(..., alias="Handovers")
    chattering_rate_pct: float = Field(..., alias="Chattering Rate (%)")
    unnecessary_handovers: int = Field(..., alias="Unnecessary Handovers")
    mean_dwell_s: float = Field(..., alias="Mean Dwell (s)")

    model_config = ConfigDict(populate_by_name=True)


class OutageDurationRow(BaseModel):
    """Table 2: Performance by Outage Duration row."""

    outage_duration_s: float = Field(..., alias="Outage Duration (s)")
    policy: str = Field(..., alias="Policy")
    outage_ate_m: float = Field(..., alias="Outage ATE (m)")
    outage_rmse_m: float = Field(..., alias="Outage RMSE (m)")
    peak_error_m: float = Field(..., alias="Peak Error (m)")
    violation_rate_pct: float = Field(..., alias="Violation Rate (%)")

    model_config = ConfigDict(populate_by_name=True)


class ForecastHorizonRow(BaseModel):
    """Table 3: Multi-Horizon Forecast Scaling row."""

    horizon_s: float = Field(..., alias="Horizon (s)")
    mae_m: float = Field(..., alias="MAE (m)")
    rmse_m: float = Field(..., alias="RMSE (m)")
    r2_score: float = Field(..., alias="R2 Score")
    critical_breach_f1: float = Field(..., alias="Critical Breach F1")

    model_config = ConfigDict(populate_by_name=True)


class ActionRankingRow(BaseModel):
    """Table 4: Action Ranking & Regret vs Oracle row."""

    model_type: str = Field(..., alias="Model Architecture")
    top1_accuracy_pct: float = Field(..., alias="Top-1 Accuracy (%)")
    spearman_rho: float = Field(..., alias="Spearman Rho")
    mean_regret_m: float = Field(..., alias="Mean Regret (m)")
    excess_error_m: float = Field(..., alias="Excess Error vs Oracle (m)")

    model_config = ConfigDict(populate_by_name=True)


class AblationRow(BaseModel):
    """Table 5: Component Ablation Study row."""

    ablation_config: str = Field(..., alias="Ablation Configuration")
    ate_m: float = Field(..., alias="ATE (m)")
    rmse_m: float = Field(..., alias="RMSE (m)")
    max_error_m: float = Field(..., alias="Max Error (m)")
    violations_pct: float = Field(..., alias="Violations > 5m (%)")
    handovers: int = Field(..., alias="Handovers")
    chattering_rate_pct: float = Field(..., alias="Chattering Rate (%)")
    unnecessary_handovers: int = Field(..., alias="Unnecessary Handovers")

    model_config = ConfigDict(populate_by_name=True)


class RobustnessRow(BaseModel):
    """Table 6: Robustness & Stress Testing row."""

    stress_condition: str = Field(..., alias="Stress Condition")
    policy: str = Field(..., alias="Policy")
    ate_m: float = Field(..., alias="ATE (m)")
    rmse_m: float = Field(..., alias="RMSE (m)")
    max_error_m: float = Field(..., alias="Max Error (m)")
    violations_pct: float = Field(..., alias="Violations > 5m (%)")
    handovers: int = Field(..., alias="Handovers")

    model_config = ConfigDict(populate_by_name=True)


class StatisticalSignificanceRow(BaseModel):
    """Table 7: Statistical Significance & Effect Sizes row."""

    baseline_comparison: str = Field(..., alias="Baseline Comparison")
    sample_size_n: int = Field(..., alias="Sample Size N")
    mean_baseline_ate_m: float = Field(..., alias="Mean Baseline ATE (m)")
    mean_vyra_ate_m: float = Field(..., alias="Mean VYRA ATE (m)")
    mean_difference_m: float = Field(..., alias="Mean Difference (m)")
    ci_95_str: str = Field(..., alias="95% CI (m)")
    wilcoxon_w: float = Field(..., alias="Wilcoxon W")
    p_value: float = Field(..., alias="p-value (Wilcoxon)")
    cohens_d: float = Field(..., alias="Cohen's d_z")
    hedges_g: float = Field(..., alias="Hedges' g")
    relative_improvement_pct: float = Field(..., alias="Relative Improvement (%)")
    is_significant: str = Field(..., alias="Significant (p < 0.05)")

    model_config = ConfigDict(populate_by_name=True)


class FailureCaseRow(BaseModel):
    """Table 8: Documented Failure Case row."""

    failure_case_id: str = Field(..., alias="Failure Case ID")
    timestamp_s: float = Field(..., alias="Timestamp (s)")
    scenario_phase: str = Field(..., alias="Scenario Phase")
    selected_mode: str = Field(..., alias="Selected Mode")
    vyra_error_m: float = Field(..., alias="VYRA Error (m)")
    hybrid_error_m: float = Field(..., alias="Hybrid Error (m)")
    forecasted_dr_m: float = Field(..., alias="Forecasted DR Error (m)")
    forecasted_hybrid_m: float = Field(..., alias="Forecasted HYBRID Error (m)")
    root_cause_analysis: str = Field(..., alias="Root Cause Analysis")

    model_config = ConfigDict(populate_by_name=True)


class MasterResultsBundle(BaseModel):
    """Complete collection of precomputed publication tables and experiment metadata."""

    metadata: Dict[str, Any]
    table1_navigation_comparison: List[Dict[str, Any]]
    table2_outage_duration_sweep: List[Dict[str, Any]]
    table3_forecast_horizons: List[Dict[str, Any]]
    table4_action_ranking: List[Dict[str, Any]]
    table5_ablation_study: List[Dict[str, Any]]
    table6_robustness_study: List[Dict[str, Any]]
    table7_statistical_significance: List[Dict[str, Any]]
    table8_failure_cases: List[Dict[str, Any]]
