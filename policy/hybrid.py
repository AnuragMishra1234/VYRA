"""Fixed Hybrid Baseline Policy Module for VYRA.

Maintains uninterrupted loosely-coupled GNSS/IMU sensor fusion (HYBRID mode)
regardless of signal degradation or outage indicators. Serves as the primary
contemporary automotive filter baseline.

ANTI-LEAKAGE SPECIFICATION:
Operates strictly causally epoch-by-epoch. No access to future sensor fixes or targets.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class FixedHybridPolicy:
    """Baseline policy that unconditionally selects HYBRID (EKF) sensor fusion."""

    def __init__(self) -> None:
        self.name: str = "fixed_hybrid"

    def select_mode(
        self,
        observation: Optional[Dict[str, Any]] = None,
        timestamp: float = 0.0,
    ) -> Tuple[str, Dict[str, Any]]:
        """Select active navigation mode for the current epoch.

        Returns:
            Tuple of ("HYBRID", metadata_dictionary).
        """
        metadata = {
            "selected_mode": "HYBRID",
            "candidate_mode": "HYBRID",
            "reason": "fixed_hybrid_unconditional",
            "is_emergency": False,
        }
        return "HYBRID", metadata
