"""Switching Logic and Anti-Chattering Module for VYRA.

Provides execution safety and mode stabilization mechanisms:
- Minimum dwell time constraint (tau_dwell)
- Emergency override capability when active mode error exceeds critical bounds
- Handover event logging and transition telemetry
- Switching metrics: total handovers, chattering rate, dwell time distributions.

ANTI-LEAKAGE SPECIFICATION:
Switching decisions operate strictly on current epoch state and historical transition
memory. Future epochs are not queried.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class HandoverEvent:
    """Record of an executed navigation-mode transition."""

    step: int
    timestamp: float
    from_mode: str
    to_mode: str
    reason: str
    steps_spent_in_prev_mode: int
    is_chattering: bool = False
    is_unnecessary: bool = False


class SwitchingManager:
    """Stateful supervisor enforcing anti-chattering stability constraints."""

    def __init__(
        self,
        initial_mode: str = "HYBRID",
        dwell_steps: int = 20,
        sampling_rate_hz: float = 10.0,
    ) -> None:
        self.current_mode: str = initial_mode
        self.dwell_steps: int = dwell_steps
        self.sampling_rate_hz: float = sampling_rate_hz
        self.steps_in_current_mode: int = 0
        self.total_steps: int = 0
        self.handover_history: List[HandoverEvent] = []
        self.mode_step_counts: Dict[str, int] = {
            "GNSS": 0,
            "HYBRID": 0,
            "DR": 0,
        }
        if initial_mode in self.mode_step_counts:
            self.mode_step_counts[initial_mode] = 1

    def can_switch(self, emergency: bool = False) -> bool:
        """Evaluate whether mode transition is permissible under dwell constraint."""
        if emergency:
            return True
        return self.steps_in_current_mode >= self.dwell_steps

    def request_transition(
        self,
        candidate_mode: str,
        reason: str,
        timestamp: float = 0.0,
        emergency: bool = False,
        is_unnecessary: bool = False,
    ) -> Tuple[str, bool]:
        """Request a mode transition to candidate_mode.

        Returns:
            Tuple of (effective_mode, switched_flag).
        """
        self.total_steps += 1
        self.steps_in_current_mode += 1

        if candidate_mode == self.current_mode:
            # Maintain active mode
            if self.current_mode in self.mode_step_counts:
                self.mode_step_counts[self.current_mode] += 1
            return self.current_mode, False

        # Attempting mode switch
        switch_allowed = self.can_switch(emergency=emergency)
        if not switch_allowed:
            # Dwell constraint blocked transition; maintain current mode
            if self.current_mode in self.mode_step_counts:
                self.mode_step_counts[self.current_mode] += 1
            return self.current_mode, False

        # Transition executed
        prev_mode = self.current_mode
        prev_dwell = self.steps_in_current_mode
        is_chattering = (prev_dwell < self.dwell_steps) and emergency

        event = HandoverEvent(
            step=self.total_steps,
            timestamp=timestamp,
            from_mode=prev_mode,
            to_mode=candidate_mode,
            reason=reason,
            steps_spent_in_prev_mode=prev_dwell,
            is_chattering=is_chattering,
            is_unnecessary=is_unnecessary,
        )
        self.handover_history.append(event)

        self.current_mode = candidate_mode
        self.steps_in_current_mode = 1
        if candidate_mode in self.mode_step_counts:
            self.mode_step_counts[candidate_mode] += 1

        return self.current_mode, True

    def get_metrics(self) -> Dict[str, Any]:
        """Compute summary switching metrics over the trajectory."""
        total_handovers = len(self.handover_history)
        chattering_count = sum(1 for h in self.handover_history if h.is_chattering)
        unnecessary_count = sum(1 for h in self.handover_history if h.is_unnecessary)

        dwell_durations_sec = [
            h.steps_spent_in_prev_mode / self.sampling_rate_hz for h in self.handover_history
        ]
        mean_dwell_sec = float(np.mean(dwell_durations_sec)) if dwell_durations_sec else 0.0

        total_steps = max(1, self.total_steps)
        mode_percentages = {
            m: round((cnt / total_steps) * 100.0, 2)
            for m, cnt in self.mode_step_counts.items()
        }

        reasons: Dict[str, int] = {}
        for h in self.handover_history:
            reasons[h.reason] = reasons.get(h.reason, 0) + 1

        return {
            "total_handovers": total_handovers,
            "chattering_handovers": chattering_count,
            "chattering_rate": round(chattering_count / max(1, total_handovers), 4),
            "unnecessary_handovers": unnecessary_count,
            "mean_dwell_seconds": round(mean_dwell_sec, 2),
            "mode_step_counts": dict(self.mode_step_counts),
            "mode_percentages": mode_percentages,
            "handover_reasons": reasons,
        }
