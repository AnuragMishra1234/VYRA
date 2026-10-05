"""Reactive Baseline Policy Module for VYRA.

Implements conventional reactive threshold-triggered navigation mode switching:
- Monitors instantaneous GNSS quality score Q_t, satellite count, and kinematic discrepancy.
- If Q_t < Q_thresh or satellites < N_min or discrepancy > disc_max (or explicit outage):
    Triggers reactive switch to DR.
- Once GNSS conditions recover above thresholds:
    Reverts back to HYBRID.
- Stabilized via SwitchingManager to enforce minimum dwell time and record handovers.

ANTI-LEAKAGE SPECIFICATION:
Decisions are evaluated exclusively against current epoch indicators s_t. Future
degradation or restoration states are never accessed.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

from policy.switching_logic import SwitchingManager
from policy.thresholds import PolicyThresholds

logger = logging.getLogger(__name__)


class ReactiveBaselinePolicy:
    """Conventional instantaneous threshold-based reactive switching policy."""

    def __init__(
        self,
        thresholds: Optional[PolicyThresholds] = None,
        initial_mode: str = "HYBRID",
        enforce_dwell: bool = True,
    ) -> None:
        self.thresholds = thresholds or PolicyThresholds()
        self.enforce_dwell = enforce_dwell
        self.name: str = "reactive_threshold"
        dwell_steps = self.thresholds.dwell_steps if enforce_dwell else 1
        self.switching_manager = SwitchingManager(
            initial_mode=initial_mode,
            dwell_steps=dwell_steps,
            sampling_rate_hz=self.thresholds.sampling_rate_hz,
        )

    def select_mode(
        self,
        observation: Dict[str, Any],
        timestamp: float = 0.0,
    ) -> Tuple[str, Dict[str, Any]]:
        """Evaluate current observation and select navigation mode.

        Args:
            observation: Dictionary containing decision-time metrics:
                - composite_quality_score (float)
                - effective_satellites (float)
                - kinematic_discrepancy_mps (float)
                - is_outage (bool)
            timestamp: Trajectory epoch timestamp (seconds).

        Returns:
            Tuple of (effective_mode, metadata_dict).
        """
        q_score = float(observation.get("composite_quality_score", 1.0))
        n_sats = float(observation.get("effective_satellites", 8.0))
        discrepancy = float(observation.get("kinematic_discrepancy_mps", 0.0))
        is_outage = bool(observation.get("is_outage", False))

        # Check breach conditions
        q_breached = q_score < self.thresholds.reactive_quality_threshold
        sat_breached = n_sats < self.thresholds.reactive_min_satellites
        disc_breached = discrepancy > self.thresholds.reactive_max_kinematic_discrepancy
        is_degraded = is_outage or q_breached or sat_breached or disc_breached

        is_emergency = is_outage or (q_score < 0.20)

        if is_degraded:
            candidate = "DR"
            reason = "reactive_degradation_detected"
        else:
            candidate = "HYBRID"
            reason = "reactive_healthy_conditions"

        effective_mode, switched = self.switching_manager.request_transition(
            candidate_mode=candidate,
            reason=reason,
            timestamp=timestamp,
            emergency=is_emergency,
        )

        metadata = {
            "selected_mode": effective_mode,
            "candidate_mode": candidate,
            "reason": reason,
            "switched": switched,
            "is_emergency": is_emergency,
            "quality_score": q_score,
            "is_degraded": is_degraded,
        }
        return effective_mode, metadata

    def get_metrics(self) -> Dict[str, Any]:
        """Retrieve policy switching metrics."""
        return self.switching_manager.get_metrics()
