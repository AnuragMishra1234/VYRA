"""Forecasting Features Module for VYRA.

Extracts decision-time state feature vectors s_t combining:
- Instantaneous GNSS quality indicators and Phase 2 degradation probabilities
- Vehicle kinematics (speed, horizontal acceleration, yaw rate)
- Navigation filter covariance trace and 95% confidence ellipse radius
- Phase 3 Dead Reckoning uncertainty projections and survivability metrics

ANTI-LEAKAGE SPECIFICATION:
All feature components are strictly causal, derived exclusively from observations
at or before decision epoch t. Under NO circumstances are future epochs (t + delta) accessed.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from gnss.features import PREDICTION_FEATURE_COLUMNS, extract_gnss_temporal_features
from gnss.quality import compute_gnss_quality
from policy.survivability import DRSurvivabilityEstimator

logger = logging.getLogger(__name__)

FORECAST_BASE_FEATURE_NAMES: List[str] = [
    # Signal Quality (Phase 2)
    "composite_quality_score",
    "effective_satellites",
    "kinematic_discrepancy_mps",
    "quality_mean_1s",
    "quality_std_1s",
    "quality_mean_3s",
    "quality_std_3s",
    "quality_delta_1s",
    "satellites_min_3s",
    # Kinematics
    "speed_mps",
    "acc_norm",
    "yaw_rate_abs",
    # Filter Uncertainty (Phase 3)
    "ekf_cov_trace",
    "ekf_radius_95",
    # DR Uncertainty & Survivability Projections (Phase 3)
    "dr_std_1s",
    "dr_std_3s",
    "dr_std_5s",
    "dr_std_10s",
    "dr_surv_prob_5m_3s",
    "dr_surv_prob_5m_5s",
    "dr_surv_duration_5m",
]


class ForecastingFeatureExtractor:
    """Constructs causal state feature matrices s_t for forecasting engines."""

    def __init__(self) -> None:
        self.surv_estimator = DRSurvivabilityEstimator()

    def extract_features(
        self,
        df: pd.DataFrame,
        cov_traces: Optional[np.ndarray] = None,
        radius_95_bounds: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, List[str]]:
        """Extract multi-modal decision-time feature matrix X_base (N x D).

        Args:
            df: Trajectory DataFrame (already processed through compute_gnss_quality).
            cov_traces: Optional array of EKF covariance trace values Tr(P_t).
            radius_95_bounds: Optional array of EKF 95% confidence radii r_95,t.

        Returns:
            Tuple of (NumPy feature matrix, list of feature column names).
        """
        n = len(df)
        df_feat, _ = extract_gnss_temporal_features(df)

        # 1. Filter Uncertainty
        if cov_traces is not None and len(cov_traces) == n:
            tr_P = np.asarray(cov_traces, dtype=float)
        else:
            tr_P = np.full(n, 4.5, dtype=float)

        if radius_95_bounds is not None and len(radius_95_bounds) == n:
            r95 = np.asarray(radius_95_bounds, dtype=float)
        else:
            r95 = np.full(n, 3.67, dtype=float)

        # 2. DR Projections over horizons (Vectorized)
        speeds = df_feat["speed_mps"].to_numpy(dtype=float)
        initial_pos_var = np.clip(tr_P / 2.0, 0.1, 50.0)
        initial_yaw_var = np.full(n, 0.05, dtype=float)

        sigma_v = self.surv_estimator.sigma_v
        sigma_omega = self.surv_estimator.sigma_omega

        def _vec_var(T_sec: float) -> np.ndarray:
            return (
                initial_pos_var
                + (sigma_v**2) * (T_sec**2)
                + (1.0 / 3.0) * (speeds**2) * initial_yaw_var * (T_sec**2)
                + (1.0 / 12.0) * (speeds**2) * (sigma_omega**2) * (T_sec**4)
            )

        var_1s = _vec_var(1.0)
        var_3s = _vec_var(3.0)
        var_5s = _vec_var(5.0)
        var_10s = _vec_var(10.0)

        dr_std_1s = np.sqrt(np.maximum(0.0, var_1s))
        dr_std_3s = np.sqrt(np.maximum(0.0, var_3s))
        dr_std_5s = np.sqrt(np.maximum(0.0, var_5s))
        dr_std_10s = np.sqrt(np.maximum(0.0, var_10s))

        # Rayleigh survivability probability: 1 - exp(- (E^2) / (2 * var))
        surv_3s = 1.0 - np.exp(np.clip(-25.0 / (2.0 * np.maximum(1e-6, var_3s)), -50.0, 0.0))
        surv_5s = 1.0 - np.exp(np.clip(-25.0 / (2.0 * np.maximum(1e-6, var_5s)), -50.0, 0.0))

        # Analytical bi-quadratic solution for survivable duration (cutoff=0.5 -> var_target = 25 / (2*ln2))
        var_target = 25.0 / (2.0 * np.log(2.0))  # ~18.0337 m^2
        a_quad = (1.0 / 12.0) * (speeds**2) * (sigma_omega**2)
        b_quad = (sigma_v**2) + (1.0 / 3.0) * (speeds**2) * initial_yaw_var
        c_quad = initial_pos_var - var_target

        discrim = np.maximum(0.0, b_quad**2 - 4.0 * a_quad * c_quad)
        # For non-zero a_quad:
        u_quad = np.where(
            a_quad > 1e-12,
            (-b_quad + np.sqrt(discrim)) / (2.0 * np.maximum(1e-12, a_quad)),
            -c_quad / np.maximum(1e-6, b_quad),
        )
        surv_dur = np.where(c_quad >= 0.0, 0.0, np.sqrt(np.maximum(0.0, u_quad)))
        surv_dur = np.clip(surv_dur, 0.0, 60.0)

        # Assemble feature columns into matrix
        feat_dict = {
            "composite_quality_score": df_feat["composite_quality_score"].to_numpy(dtype=float),
            "effective_satellites": df_feat["effective_satellites"].to_numpy(dtype=float),
            "kinematic_discrepancy_mps": df_feat["kinematic_discrepancy_mps"].to_numpy(dtype=float),
            "quality_mean_1s": df_feat["quality_mean_1s"].to_numpy(dtype=float),
            "quality_std_1s": df_feat["quality_std_1s"].to_numpy(dtype=float),
            "quality_mean_3s": df_feat["quality_mean_3s"].to_numpy(dtype=float),
            "quality_std_3s": df_feat["quality_std_3s"].to_numpy(dtype=float),
            "quality_delta_1s": df_feat["quality_delta_1s"].to_numpy(dtype=float),
            "satellites_min_3s": df_feat["satellites_min_3s"].to_numpy(dtype=float),
            "speed_mps": speeds,
            "acc_norm": df_feat["acc_norm"].to_numpy(dtype=float),
            "yaw_rate_abs": df_feat["yaw_rate_abs"].to_numpy(dtype=float),
            "ekf_cov_trace": tr_P,
            "ekf_radius_95": r95,
            "dr_std_1s": dr_std_1s,
            "dr_std_3s": dr_std_3s,
            "dr_std_5s": dr_std_5s,
            "dr_std_10s": dr_std_10s,
            "dr_surv_prob_5m_3s": surv_3s,
            "dr_surv_prob_5m_5s": surv_5s,
            "dr_surv_duration_5m": surv_dur,
        }

        columns = list(feat_dict.keys())
        X = np.column_stack([feat_dict[c] for c in columns])
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        return X, columns
