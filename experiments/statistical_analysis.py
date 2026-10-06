"""Statistical Analysis and Hypothesis Testing Module for VYRA Phase 5.

Performs paired statistical testing across outage events and trajectory segments:
- Compares VYRA Adaptive against GNSS-Only, Pure DR, Fixed HYBRID, and Reactive Switching.
- Calculates paired t-test, Wilcoxon signed-rank test, bootstrap 95% CIs, Cohen's d_z, Hedges' g.
- Produces Table 7 (Statistical Significance & Effect Sizes).
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

from evaluation.statistical_tests import PairedStatisticalReport, evaluate_paired_policy_comparison

logger = logging.getLogger(__name__)


def run_statistical_evaluation(
    event_metrics: Dict[str, List[float]],  # maps policy_name -> list of ATEs per event
    alpha: float = 0.05,
    seed: int = 42,
) -> Dict[str, Dict[str, Any]]:
    """Execute paired statistical hypothesis tests comparing VYRA against all baselines.

    Args:
        event_metrics: Dict mapping policy name to array/list of metric values across paired events.
            Must contain 'vyra_adaptive' and baseline keys.
        alpha: Significance level (default: 0.05).
        seed: Random seed for bootstrap reproducibility.

    Returns:
        Dict mapping baseline_name -> paired statistical test report dict.
    """
    if "vyra_adaptive" not in event_metrics:
        raise KeyError("Key 'vyra_adaptive' not found in event_metrics.")

    vyra_vals = np.asarray(event_metrics["vyra_adaptive"], dtype=float)
    results: Dict[str, Dict[str, Any]] = {}

    for b_name, b_vals in event_metrics.items():
        if b_name == "vyra_adaptive":
            continue

        b_arr = np.asarray(b_vals, dtype=float)
        report = evaluate_paired_policy_comparison(
            baseline_metrics=b_arr,
            vyra_metrics=vyra_vals,
            metric_name="ATE",
            alpha=alpha,
            n_bootstraps=2000,
            seed=seed,
        )

        results[b_name] = {
            "baseline": b_name,
            "sample_size_n": report.sample_size_n,
            "mean_baseline_m": report.mean_baseline,
            "mean_vyra_m": report.mean_vyra,
            "mean_difference_m": report.mean_difference,
            "median_difference_m": report.median_difference,
            "std_difference_m": report.std_difference,
            "ci_95": [report.ci_95_lower, report.ci_95_upper],
            "t_statistic": report.t_statistic,
            "p_val_ttest": report.p_value_ttest,
            "wilcoxon_stat": report.wilcoxon_statistic,
            "p_val_wilcoxon": report.p_value_wilcoxon,
            "cohens_d": report.cohens_d,
            "hedges_g": report.hedges_g,
            "relative_improvement_pct": report.relative_improvement_pct,
            "is_significant": report.is_statistically_significant,
        }

    return results
