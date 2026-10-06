"""Rigorous Statistical Testing and Effect Size Module for VYRA.

Evaluates paired differences between VYRA and baseline navigation policies
at the appropriate statistical unit of analysis (per-event or per-trajectory):
- Paired Student's t-test
- Wilcoxon signed-rank test (non-parametric)
- Bootstrap 95% Confidence Intervals (BCa / percentile)
- Effect sizes: Cohen's d_z, Hedges' g
- Absolute and relative percentage improvements
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PairedStatisticalReport:
    """Rigorous report of paired comparative statistical analysis."""

    sample_size_n: int
    mean_baseline: float
    mean_vyra: float
    mean_difference: float  # baseline - vyra (positive means VYRA improved)
    median_difference: float
    std_difference: float
    ci_95_lower: float
    ci_95_upper: float
    t_statistic: float
    p_value_ttest: float
    wilcoxon_statistic: float
    p_value_wilcoxon: float
    cohens_d: float
    hedges_g: float
    relative_improvement_pct: float
    is_statistically_significant: bool  # p_wilcoxon < 0.05


def compute_bootstrap_ci(
    differences: np.ndarray,
    n_bootstraps: int = 2000,
    confidence_level: float = 0.95,
    seed: int = 42,
) -> Tuple[float, float]:
    """Compute non-parametric bootstrap confidence interval for mean difference."""
    rng = np.random.RandomState(seed)
    n = len(differences)
    if n == 0:
        return 0.0, 0.0
    if n == 1:
        return float(differences[0]), float(differences[0])

    boot_means = np.empty(n_bootstraps, dtype=float)
    for b in range(n_bootstraps):
        sample = rng.choice(differences, size=n, replace=True)
        boot_means[b] = np.mean(sample)

    alpha = 1.0 - confidence_level
    lower_pct = (alpha / 2.0) * 100.0
    upper_pct = (1.0 - alpha / 2.0) * 100.0

    lower = float(np.percentile(boot_means, lower_pct))
    upper = float(np.percentile(boot_means, upper_pct))
    return lower, upper


def evaluate_paired_policy_comparison(
    baseline_metrics: Union[List[float], np.ndarray],
    vyra_metrics: Union[List[float], np.ndarray],
    metric_name: str = "ATE",
    alpha: float = 0.05,
    n_bootstraps: int = 2000,
    seed: int = 42,
) -> PairedStatisticalReport:
    """Conduct paired statistical hypothesis test between baseline and VYRA.

    Definition:
    difference = baseline - vyra
    A positive difference indicates that baseline error is larger (VYRA performs better).
    """
    base_arr = np.asarray(baseline_metrics, dtype=float)
    vyra_arr = np.asarray(vyra_metrics, dtype=float)

    if len(base_arr) != len(vyra_arr):
        raise ValueError(f"Mismatched paired array lengths: {len(base_arr)} vs {len(vyra_arr)}")

    n = len(base_arr)
    if n < 3:
        raise ValueError(f"Insufficient paired sample size for statistical tests: n={n} (min 3 required)")

    diffs = base_arr - vyra_arr
    mean_base = float(np.mean(base_arr))
    mean_vyra = float(np.mean(vyra_arr))
    mean_diff = float(np.mean(diffs))
    median_diff = float(np.median(diffs))
    std_diff = float(np.std(diffs, ddof=1)) if n > 1 else 0.0

    # Paired t-test
    if std_diff > 1e-12:
        t_stat, p_ttest = stats.ttest_rel(base_arr, vyra_arr)
        t_stat, p_ttest = float(t_stat), float(p_ttest)
    else:
        t_stat, p_ttest = 0.0, 1.0

    # Wilcoxon signed-rank test
    # If all differences are zero, handle edge case gracefully
    if np.all(np.isclose(diffs, 0.0)):
        w_stat, p_wilcoxon = 0.0, 1.0
    else:
        try:
            w_res = stats.wilcoxon(base_arr, vyra_arr, zero_method="wilcox", alternative="two-sided")
            w_stat, p_wilcoxon = float(w_res.statistic), float(w_res.pvalue)
        except Exception as e:
            logger.warning("Wilcoxon calculation fallback: %s", e)
            w_stat, p_wilcoxon = 0.0, 1.0

    # Bootstrap 95% Confidence Interval for mean difference
    ci_lower, ci_upper = compute_bootstrap_ci(diffs, n_bootstraps=n_bootstraps, confidence_level=1.0 - alpha, seed=seed)

    # Effect Size: Cohen's d_z for paired samples = mean(diff) / std(diff)
    cohens_d = float(mean_diff / std_diff) if std_diff > 1e-12 else 0.0

    # Hedges' g correction for small sample bias
    correction = 1.0 - (3.0 / (4.0 * n - 5.0)) if n > 2 else 1.0
    hedges_g = float(cohens_d * correction)

    # Relative improvement: (base - vyra) / base * 100%
    rel_improv = float((mean_diff / max(1e-6, abs(mean_base))) * 100.0) if mean_base != 0 else 0.0

    is_sig = bool(p_wilcoxon < alpha)

    return PairedStatisticalReport(
        sample_size_n=n,
        mean_baseline=round(mean_base, 4),
        mean_vyra=round(mean_vyra, 4),
        mean_difference=round(mean_diff, 4),
        median_difference=round(median_diff, 4),
        std_difference=round(std_diff, 4),
        ci_95_lower=round(ci_lower, 4),
        ci_95_upper=round(ci_upper, 4),
        t_statistic=round(t_stat, 4),
        p_value_ttest=round(p_ttest, 6),
        wilcoxon_statistic=round(w_stat, 4),
        p_value_wilcoxon=round(p_wilcoxon, 6),
        cohens_d=round(cohens_d, 4),
        hedges_g=round(hedges_g, 4),
        relative_improvement_pct=round(rel_improv, 2),
        is_statistically_significant=is_sig,
    )
