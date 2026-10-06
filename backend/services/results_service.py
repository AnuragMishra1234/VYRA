"""Research Results and Publication Tables Service."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.schemas.results import MasterResultsBundle

logger = logging.getLogger(__name__)


class ResultsService:
    """Provides validated research tables, figures, and experiment summaries."""

    def __init__(self, repo_root: Optional[Path] = None) -> None:
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent
        self.tables_dir = self.repo_root / "results" / "tables"
        self.figures_dir = self.repo_root / "results" / "figures"
        self.master_results_file = self.repo_root / "results" / "processed" / "phase5_master_results.json"
        self._master_bundle: Optional[Dict[str, Any]] = None
        self._load_master_bundle()

    def _load_master_bundle(self) -> None:
        """Load precomputed master results bundle into memory."""
        if self.master_results_file.is_file():
            try:
                with open(self.master_results_file, "r", encoding="utf-8") as f:
                    self._master_bundle = json.load(f)
                logger.info("Loaded master results bundle from %s", self.master_results_file)
            except Exception as ex:
                logger.error("Failed to load master results JSON: %s", ex)
        else:
            logger.warning("Master results file not found at %s", self.master_results_file)

    def get_master_results(self) -> Dict[str, Any]:
        """Return the complete master results bundle."""
        if self._master_bundle is not None:
            return self._master_bundle

        # Fallback: re-assemble from individual table files
        bundle: Dict[str, Any] = {
            "metadata": {
                "dataset": "V-S3a Test Split",
                "source": "results/tables/*.json",
            }
        }
        table_map = {
            1: "table1_navigation_comparison",
            2: "table2_outage_duration_sweep",
            3: "table3_forecast_horizons",
            4: "table4_action_ranking",
            5: "table5_ablation_study",
            6: "table6_robustness_study",
            7: "table7_statistical_significance",
            8: "table8_failure_cases",
        }
        for num, key in table_map.items():
            bundle[key] = self.get_table(num)
        return bundle

    def get_table(self, table_number: int) -> List[Dict[str, Any]]:
        """Return rows for a specific research table (1 to 8)."""
        table_map = {
            1: "table1_navigation_comparison.json",
            2: "table2_outage_duration_sweep.json",
            3: "table3_forecast_horizons.json",
            4: "table4_action_ranking.json",
            5: "table5_ablation_study.json",
            6: "table6_robustness_study.json",
            7: "table7_statistical_significance.json",
            8: "table8_failure_cases.json",
        }
        fname = table_map.get(table_number)
        if not fname:
            return []

        path = self.tables_dir / fname
        if path.is_file():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as ex:
                logger.error("Failed to read %s: %s", path, ex)
        return []

    def get_figures_list(self) -> List[Dict[str, str]]:
        """Return metadata and URL endpoints for all generated publication figures."""
        if not self.figures_dir.is_dir():
            return []

        figures = []
        for p in sorted(self.figures_dir.glob("*.png")):
            name = p.stem.replace("_", " ").title()
            figures.append({
                "id": p.stem,
                "title": name,
                "filename": p.name,
                "url": f"/api/figures/{p.name}",
            })
        return figures
