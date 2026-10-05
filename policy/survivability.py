"""Dead Reckoning (DR) Survivability Modeling Module for VYRA.

Models inertial dead-reckoning error accumulation over forward outage horizons
to quantify whether DR will remain within an acceptable localization error bound:
  P(||e_{DR}(t + T_{outage})|| <= E_{threshold} | P_t, v_t, sensor noise)

MATHEMATICAL FORMULATION:
Under inertial propagation, position error variance over outage duration T grows as:
  sigma_pos^2(T) = sigma_pos,0^2 + sigma_v^2 * T^2 + (1/3) * v^2 * sigma_theta^2 * T^2 + (1/12) * v^2 * sigma_omega^2 * T^4
where:
  sigma_pos,0: Current position uncertainty from navigation filter
  v: Current vehicle ground velocity
  sigma_theta: Current heading uncertainty
  sigma_omega: Gyroscope angular random walk / drift rate

Assuming a 2D radial Rayleigh/bivariate normal error distribution:
  S(T, E_thresh) = 1 - exp(- E_thresh^2 / (2 * sigma_pos^2(T))) ∈ [0.0, 1.0]

Predicted Survivable Duration T_surv is the duration until S(T) drops below 0.50.

ANTI-LEAKAGE SPECIFICATION:
Survivability predictions at epoch t strictly use current filter state and covariance.
Future measurements and future ground truth are NEVER used in online prediction.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# Empirical noise spectral densities for automotive grade sensors
DEFAULT_SIGMA_V: float = 0.20          # m/s velocity drift std
DEFAULT_SIGMA_OMEGA: float = 0.015     # rad/s gyro noise density


@dataclass(frozen=True)
class SurvivabilityEstimate:
    """Estimated survivability metrics at decision epoch t."""

    survivability_probability: float
    predicted_survivable_duration_s: float
    predicted_position_std_m: float
    error_threshold_m: float
    outage_duration_s: float


class DRSurvivabilityEstimator:
    """Analytical DR error-growth propagator and survivability calculator."""

    def __init__(
        self,
        sigma_v: float = DEFAULT_SIGMA_V,
        sigma_omega: float = DEFAULT_SIGMA_OMEGA,
    ) -> None:
        self.sigma_v = sigma_v
        self.sigma_omega = sigma_omega

    def predict_position_variance(
        self,
        initial_pos_var: float,
        speed_mps: float,
        initial_yaw_var: float,
        duration_s: float,
    ) -> float:
        """Compute expected DR position error variance after duration T."""
        T = max(0.0, float(duration_s))
        v = max(0.0, float(speed_mps))

        # Variance components
        var_pos0 = max(0.0, float(initial_pos_var))
        var_vel = (self.sigma_v**2) * (T**2)
        var_heading = (1.0 / 3.0) * (v**2) * max(0.0, float(initial_yaw_var)) * (T**2)
        var_gyro_drift = (1.0 / 12.0) * (v**2) * (self.sigma_omega**2) * (T**4)

        total_var = var_pos0 + var_vel + var_heading + var_gyro_drift
        return float(total_var)

    def compute_survivability_probability(
        self,
        initial_pos_var: float,
        speed_mps: float,
        initial_yaw_var: float,
        outage_duration_s: float,
        error_threshold_m: float = 5.0,
    ) -> float:
        """Calculate probability P(||e_DR(T)|| <= E_threshold)."""
        var_T = self.predict_position_variance(
            initial_pos_var, speed_mps, initial_yaw_var, outage_duration_s
        )
        if var_T <= 1e-6:
            return 1.0

        # Rayleigh CDF: 1 - exp(- r^2 / (2 * sigma^2))
        exponent = - (error_threshold_m**2) / (2.0 * var_T)
        prob = 1.0 - float(np.exp(np.clip(exponent, -50.0, 0.0)))
        return float(np.clip(prob, 0.0, 1.0))

    def estimate_survivable_duration(
        self,
        initial_pos_var: float,
        speed_mps: float,
        initial_yaw_var: float,
        error_threshold_m: float = 5.0,
        confidence_cutoff: float = 0.50,
        max_search_duration_s: float = 60.0,
    ) -> float:
        """Find the maximum outage duration T such that S(T) >= confidence_cutoff."""
        # Analytical bi-quadratic root for S(T) = confidence_cutoff:
        # P = 1 - exp(- E^2 / (2 * var_T)) >= cutoff
        # -> var_T <= - E^2 / (2 * ln(1 - cutoff))
        var_target = - (error_threshold_m**2) / (2.0 * np.log(max(1e-6, 1.0 - confidence_cutoff)))
        if initial_pos_var >= var_target:
            return 0.0

        v = max(0.0, float(speed_mps))
        a_quad = (1.0 / 12.0) * (v**2) * (self.sigma_omega**2)
        b_quad = (self.sigma_v**2) + (1.0 / 3.0) * (v**2) * max(0.0, float(initial_yaw_var))
        c_quad = float(initial_pos_var) - var_target

        discrim = max(0.0, b_quad**2 - 4.0 * a_quad * c_quad)
        if a_quad > 1e-12:
            u_quad = (-b_quad + np.sqrt(discrim)) / (2.0 * a_quad)
        else:
            u_quad = -c_quad / max(1e-6, b_quad)

        T_val = min(float(max_search_duration_s), np.sqrt(max(0.0, u_quad)))
        return round(float(T_val), 2)

    def estimate(
        self,
        P_covariance: np.ndarray,
        speed_mps: float,
        outage_duration_s: float,
        error_threshold_m: float = 5.0,
    ) -> SurvivabilityEstimate:
        """Convenience method accepting full covariance matrix P."""
        # Initial position variance: Tr(P_pos) / 2
        pos_var = float(0.5 * (P_covariance[0, 0] + P_covariance[1, 1]))
        yaw_var = float(P_covariance[4, 4]) if P_covariance.shape[0] > 4 else 0.01

        prob = self.compute_survivability_probability(
            pos_var, speed_mps, yaw_var, outage_duration_s, error_threshold_m
        )
        t_surv = self.estimate_survivable_duration(
            pos_var, speed_mps, yaw_var, error_threshold_m
        )
        pred_var = self.predict_position_variance(
            pos_var, speed_mps, yaw_var, outage_duration_s
        )

        return SurvivabilityEstimate(
            survivability_probability=round(prob, 4),
            predicted_survivable_duration_s=t_surv,
            predicted_position_std_m=round(float(np.sqrt(pred_var)), 3),
            error_threshold_m=float(error_threshold_m),
            outage_duration_s=float(outage_duration_s),
        )


def evaluate_survivability_performance(
    predicted_durations: List[float],
    actual_durations_within_bound: List[float],
) -> Dict[str, Any]:
    """Evaluate survivability predictions against actual observed DR error durations.

    Measures:
    - MAE: Mean Absolute Error between predicted and actual survival time
    - Over-confidence rate: Fraction of times actual < predicted (dangerously optimistic)
    - Over-conservatism rate: Fraction of times actual > predicted (conservatively pessimistic)
    """
    preds = np.asarray(predicted_durations, dtype=float)
    actuals = np.asarray(actual_durations_within_bound, dtype=float)
    n = len(preds)
    if n == 0:
        return {}

    errors = preds - actuals
    mae = float(np.mean(np.abs(errors)))
    over_confident_count = int(np.sum(actuals < preds - 0.5))  # actual failed significantly sooner
    over_conservative_count = int(np.sum(actuals > preds + 0.5))

    return {
        "mean_absolute_error_seconds": round(mae, 3),
        "mean_signed_error_seconds": round(float(np.mean(errors)), 3),
        "over_confidence_rate": round(over_confident_count / n, 4),
        "over_conservatism_rate": round(over_conservative_count / n, 4),
        "total_evaluated_events": n,
    }
