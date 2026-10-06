"""Experiment Registry Module for VYRA.

Maintains a structured, reproducible audit log of all experimental executions,
model versions, dataset splits, scenarios, random seeds, and generated results
in `experiments/experiment_registry.json`.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

REGISTRY_PATH = Path(__file__).resolve().parent / "experiment_registry.json"


@dataclass
class ExperimentRecord:
    """Standardized schema for experimental audit registry."""

    experiment_id: str
    timestamp_utc: str
    phase: str
    scenario_name: str
    outage_duration_s: Optional[float]
    degradation_type: str
    dataset_version: str
    trajectory_ids: List[str]
    model_version: str
    policy_version: str
    random_seed: int
    configuration: Dict[str, Any]
    metrics_summary: Dict[str, Any]
    result_artifacts: List[str]


class ExperimentRegistry:
    """Manager for reading, appending, and querying the experiment registry."""

    def __init__(self, file_path: Path = REGISTRY_PATH) -> None:
        self.file_path = file_path
        self._records: List[Dict[str, Any]] = []
        self.load()

    def load(self) -> List[Dict[str, Any]]:
        """Load records from registry JSON file."""
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._records = data
                    elif isinstance(data, dict) and "experiments" in data:
                        self._records = data["experiments"]
            except Exception as e:
                logger.error("Failed to load experiment registry: %s", e)
                self._records = []
        else:
            self._records = []
        return self._records

    def save(self) -> None:
        """Persist current records to registry JSON file."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump({"experiments": self._records}, f, indent=2)

    def register(
        self,
        experiment_id: str,
        phase: str,
        scenario_name: str,
        degradation_type: str,
        trajectory_ids: List[str],
        metrics_summary: Dict[str, Any],
        outage_duration_s: Optional[float] = None,
        dataset_version: str = "IO-VNBD-v1.0",
        model_version: str = "xgb-v1.0",
        policy_version: str = "vyra-v1.0",
        random_seed: int = 42,
        configuration: Optional[Dict[str, Any]] = None,
        result_artifacts: Optional[List[str]] = None,
    ) -> ExperimentRecord:
        """Create and append a new experimental execution record."""
        now_utc = datetime.now(timezone.utc).isoformat()
        rec = ExperimentRecord(
            experiment_id=experiment_id,
            timestamp_utc=now_utc,
            phase=phase,
            scenario_name=scenario_name,
            outage_duration_s=outage_duration_s,
            degradation_type=degradation_type,
            dataset_version=dataset_version,
            trajectory_ids=trajectory_ids,
            model_version=model_version,
            policy_version=policy_version,
            random_seed=random_seed,
            configuration=configuration or {},
            metrics_summary=metrics_summary,
            result_artifacts=result_artifacts or [],
        )

        rec_dict = asdict(rec)
        # Update or append
        existing_idx = next((i for i, r in enumerate(self._records) if r.get("experiment_id") == experiment_id), None)
        if existing_idx is not None:
            self._records[existing_idx] = rec_dict
        else:
            self._records.append(rec_dict)

        self.save()
        logger.info("Registered experiment %s in %s", experiment_id, self.file_path.name)
        return rec

    def get(self, experiment_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific experiment record by ID."""
        for r in self._records:
            if r.get("experiment_id") == experiment_id:
                return r
        return None

    def list_all(self) -> List[Dict[str, Any]]:
        """Return all registered experiment records."""
        return list(self._records)
