"""VYRA Adaptive Forecast-Driven Policy Module.

Proposed forecast-driven adaptive navigation-mode selection policy:
1. Evaluates short-horizon action-conditioned predictions for candidate actions:
   A in {GNSS, HYBRID, DR} over horizon H.
2. Incorporates DR survivability bounds and probability of threshold violation.
3. Optimizes multi-objective decision cost:
   J(A) = e_hat(A, H) + beta * E_thresh * P_hat(A, H) + lambda_switch * I(A != M_prev) + Pi_DR(A)
4. Enforces anti-chattering hysteresis and dwell-time constraints, with emergency
   override when active mode forecast breaches critical bounds.

ANTI-LEAKAGE SPECIFICATION:
All decision costs J(A) are computed strictly from decision-time features s_t and
causal model forecasts. No future ground truth or post-decision measurements are accessed.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple, Union

import numpy as np

from forecasting.action_conditioning import ACTION_NAMES, NavigationAction
from policy.switching_logic import SwitchingManager
from policy.thresholds import PolicyThresholds

logger = logging.getLogger(__name__)


class VYRAAdaptivePolicy:
    """Forecast-driven adaptive navigation policy optimizing multi-objective risk."""

    def __init__(
        self,
        thresholds: Optional[PolicyThresholds] = None,
        initial_mode: str = "HYBRID",
        enforce_dwell: bool = True,
    ) -> None:
        self.thresholds = thresholds or PolicyThresholds()
        self.enforce_dwell = enforce_dwell
        self.name: str = "vyra_forecast_adaptive"

        dwell_steps = self.thresholds.dwell_steps if enforce_dwell else 1
        self.switching_manager = SwitchingManager(
            initial_mode=initial_mode,
            dwell_steps=dwell_steps,
            sampling_rate_hz=self.thresholds.sampling_rate_hz,
        )

    def evaluate_action_costs(
        self,
        forecasts: Dict[str, float],
        violation_probs: Optional[Dict[str, float]] = None,
        dr_surv_duration_s: float = 10.0,
        active_mode: Optional[str] = None,
        is_sensor_outage: bool = False,
        quality_score: Optional[float] = None,
    ) -> Tuple[Dict[str, float], str]:
        """Compute multi-objective decision cost J(A) for all candidate actions.

        Args:
            forecasts: Mapping action -> predicted future max error e_hat (meters).
            violation_probs: Optional mapping action -> P(error > E_thresh).
            dr_surv_duration_s: Remaining survivable duration in DR (seconds).
            active_mode: Current operating mode (default: current mode from manager).
            is_sensor_outage: True if GNSS signal is completely missing/in outage.
            quality_score: Optional composite GNSS quality score in [0.0, 1.0].

        Returns:
            Tuple of (costs dictionary, argmin candidate action).
        """
        curr_mode = active_mode if active_mode is not None else self.switching_manager.current_mode
        costs: Dict[str, float] = {}

        for act in ACTION_NAMES:
            # Physical unavailability gating (ISSUE-01):
            # When GNSS is genuinely unavailable (active sensor outage or quality_score == 0.0),
            # standalone GNSS cannot be selected as a candidate navigation action.
            if act == "GNSS" and (is_sensor_outage or (quality_score is not None and quality_score == 0.0)):
                costs[act] = float("inf")
                continue

            e_hat = float(forecasts.get(act, 999.0))

            # 1. Base predicted continuous error
            cost = e_hat

            # 2. Risk penalty for threshold violation
            if violation_probs is not None and act in violation_probs:
                p_viol = float(violation_probs[act])
                cost += self.thresholds.risk_weight_beta * self.thresholds.error_threshold_m * p_viol
            elif e_hat > self.thresholds.error_threshold_m:
                # Approximate violation penalty if explicit probability not provided
                excess = e_hat - self.thresholds.error_threshold_m
                cost += self.thresholds.risk_weight_beta * excess

            # 3. Switching handover penalty
            if act != curr_mode:
                cost += self.thresholds.switching_penalty_m

            # 4. DR Survivability Safety Penalty
            # If DR cannot safely survive the required forecast horizon, penalize DR heavily
            if act == "DR" and dr_surv_duration_s < self.thresholds.forecast_horizon_seconds:
                dr_deficit = self.thresholds.forecast_horizon_seconds - dr_surv_duration_s
                cost += 10.0 * (1.0 + dr_deficit)

            costs[act] = cost

        # Find best candidate mode
        best_act = min(costs.keys(), key=lambda a: costs[a])
        return costs, best_act

    def select_mode(
        self,
        forecasts: Dict[str, float],
        violation_probs: Optional[Dict[str, float]] = None,
        dr_surv_duration_s: float = 10.0,
        timestamp: float = 0.0,
        is_sensor_outage: bool = False,
        quality_score: Optional[float] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """Select optimal navigation mode based on forecast evaluation.

        Args:
            forecasts: Dict mapping candidate action name to predicted max error.
            violation_probs: Dict mapping action name to violation probability.
            dr_surv_duration_s: Current estimated DR survivable duration.
            timestamp: Current timestamp (seconds).
            is_sensor_outage: True if GNSS signal is completely missing.
            quality_score: Optional composite GNSS quality score in [0.0, 1.0].

        Returns:
            Tuple of (effective_mode, telemetry_dict).
        """
        curr_mode = self.switching_manager.current_mode

        # Compute costs
        costs, best_candidate = self.evaluate_action_costs(
            forecasts=forecasts,
            violation_probs=violation_probs,
            dr_surv_duration_s=dr_surv_duration_s,
            active_mode=curr_mode,
            is_sensor_outage=is_sensor_outage,
            quality_score=quality_score,
        )

        curr_cost = costs.get(curr_mode, 999.0)
        best_cost = costs[best_candidate]

        # Hysteresis check: only switch if candidate is significantly superior
        target_mode = best_candidate
        if best_candidate != curr_mode:
            cost_advantage = curr_cost - best_cost
            if cost_advantage < self.thresholds.hysteresis_margin_m:
                target_mode = curr_mode  # Cost advantage too small, remain in current mode

        # Check emergency override
        # If current mode forecast exceeds emergency threshold or sensor is in outage, force immediate transition
        curr_e_hat = float(forecasts.get(curr_mode, 0.0))
        is_emergency = is_sensor_outage or (curr_e_hat > self.thresholds.emergency_threshold_m)

        reason = (
            "emergency_override"
            if is_emergency
            else (
                f"forecast_cost_optimization_{target_mode}"
                if target_mode != curr_mode
                else "maintain_optimal_mode"
            )
        )

        effective_mode, switched = self.switching_manager.request_transition(
            candidate_mode=target_mode,
            reason=reason,
            timestamp=timestamp,
            emergency=is_emergency,
        )

        telemetry = {
            "selected_mode": effective_mode,
            "candidate_mode": target_mode,
            "previous_mode": curr_mode,
            "switched": switched,
            "is_emergency": is_emergency,
            "forecasts": {k: round(v, 4) if np.isfinite(v) else 1e9 for k, v in forecasts.items()},
            "decision_costs": {k: round(v, 4) if np.isfinite(v) else 1e9 for k, v in costs.items()},
            "dr_surv_duration_s": round(dr_surv_duration_s, 2),
            "reason": reason,
        }

        return effective_mode, telemetry

    def get_metrics(self) -> Dict[str, Any]:
        """Retrieve policy switching metrics."""
        return self.switching_manager.get_metrics()
