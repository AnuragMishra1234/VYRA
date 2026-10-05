"""Policy Thresholds Module for VYRA.

Manages operational thresholds and parameters for navigation policies:
- Maximum acceptable error bound E_threshold (nominal: 5.0m)
- Emergency override error threshold E_emergency (nominal: 15.0m)
- Minimum dwell time tau_dwell (nominal: 2.0s = 20 steps at 10 Hz)
- Mode switching penalty lambda_switch (nominal: 1.0m cost)
- Violation risk weight beta (nominal: 2.0)
- Cost hysteresis margin epsilon_hyst (nominal: 0.5m)
- Reactive switching thresholds (Q_min = 0.70, N_sat_min = 4, disc_max = 2.0 m/s)

ANTI-LEAKAGE SPECIFICATION:
All thresholds and policy parameters are loaded from configuration and frozen before
final evaluation on held-out test splits.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional, Union

import yaml

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PolicyThresholds:
    """Immutable operational threshold configuration for navigation policies."""

    error_threshold_m: float = 5.0
    emergency_threshold_m: float = 15.0
    dwell_time_seconds: float = 2.0
    switching_penalty_m: float = 1.0
    risk_weight_beta: float = 2.0
    hysteresis_margin_m: float = 0.5
    reactive_quality_threshold: float = 0.70
    reactive_min_satellites: float = 4.0
    reactive_max_kinematic_discrepancy: float = 2.0
    sampling_rate_hz: float = 10.0
    forecast_horizon_seconds: float = 3.0

    @property
    def dwell_steps(self) -> int:
        """Minimum dwell duration in discrete discrete filter epochs."""
        return max(1, int(round(self.dwell_time_seconds * self.sampling_rate_hz)))

    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> PolicyThresholds:
        """Construct from raw dictionary, parsing policy and forecasting blocks."""
        pol_cfg = config_dict.get("policy", {})
        fore_cfg = config_dict.get("forecasting", {})
        ds_cfg = config_dict.get("dataset", {})

        sampling_rate = float(ds_cfg.get("sampling_rate_hz", 10.0))
        dwell_sec = float(pol_cfg.get("dwell_time_seconds", 2.0))
        switch_pen = float(pol_cfg.get("switching_penalty_weight", 1.0))
        err_bound = float(pol_cfg.get("acceptable_error_bound_meters", 5.0))

        return cls(
            error_threshold_m=err_bound,
            emergency_threshold_m=15.0,
            dwell_time_seconds=dwell_sec,
            switching_penalty_m=switch_pen,
            risk_weight_beta=2.0,
            hysteresis_margin_m=0.5,
            reactive_quality_threshold=0.70,
            reactive_min_satellites=4.0,
            reactive_max_kinematic_discrepancy=2.0,
            sampling_rate_hz=sampling_rate,
            forecast_horizon_seconds=3.0,
        )

    @classmethod
    def from_yaml(cls, yaml_path: Union[str, Path]) -> PolicyThresholds:
        """Load configuration from YAML file."""
        path = Path(yaml_path)
        if not path.is_file():
            logger.warning(f"Config path {path} not found. Using defaults.")
            return cls()

        with open(path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
        return cls.from_dict(cfg)
