"""Navigation Covariance and Uncertainty Quantification Module for VYRA.

Extracts and validates mathematically grounded uncertainty metrics from state covariance P:
- 1-sigma East/North position standard deviations: sigma_e, sigma_n
- Horizontal radial uncertainty: sigma_horiz = sqrt(sigma_e^2 + sigma_n^2)
- 95% Confidence Ellipse Radius: r_95 = sqrt(5.991 * lambda_max) (chi-square 2-DOF)
- Covariance Trace and Eigenvalues
- Empirical Coverage Rate: Evaluates whether predicted confidence intervals
  actually bound true localization error.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Dict, List, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# Chi-square critical values for 2 degrees of freedom (horizontal position plane)
CHI2_2DOF_95: float = 5.99146  # 95% confidence bound
CHI2_2DOF_99: float = 9.21034  # 99% confidence bound
CHI2_2DOF_68: float = 2.29575  # 1-sigma equivalent (68.3%)


@dataclass(frozen=True)
class NavigationUncertainty:
    """Rigorous uncertainty indicators extracted from navigation covariance."""

    sigma_e: float
    sigma_n: float
    sigma_horiz: float
    radius_95: float
    covariance_trace: float
    max_eigenvalue: float
    sigma_v_e: float
    sigma_v_n: float
    sigma_yaw_rad: float

    def to_dict(self) -> Dict[str, float]:
        return {
            "sigma_e": round(float(self.sigma_e), 4),
            "sigma_n": round(float(self.sigma_n), 4),
            "sigma_horiz": round(float(self.sigma_horiz), 4),
            "radius_95": round(float(self.radius_95), 4),
            "covariance_trace": round(float(self.covariance_trace), 4),
            "max_eigenvalue": round(float(self.max_eigenvalue), 4),
            "sigma_v_e": round(float(self.sigma_v_e), 4),
            "sigma_v_n": round(float(self.sigma_v_n), 4),
            "sigma_yaw_rad": round(float(self.sigma_yaw_rad), 4),
        }


def extract_uncertainty(P: np.ndarray) -> NavigationUncertainty:
    """Extract standard deviations and 95% confidence radius from covariance P."""
    # Ensure positive semidefinite
    P_diag = np.maximum(0.0, np.diag(P))

    sigma_e = float(np.sqrt(P_diag[0]))
    sigma_n = float(np.sqrt(P_diag[1]))
    sigma_horiz = float(np.sqrt(P_diag[0] + P_diag[1]))

    # Horizontal position sub-matrix (2x2)
    P_pos = P[0:2, 0:2]
    eigvals = np.linalg.eigvalsh(P_pos)
    lambda_max = float(max(0.0, np.max(eigvals)))
    r_95 = float(np.sqrt(CHI2_2DOF_95 * lambda_max))

    sigma_v_e = float(np.sqrt(P_diag[2])) if P.shape[0] > 2 else 0.0
    sigma_v_n = float(np.sqrt(P_diag[3])) if P.shape[0] > 3 else 0.0
    sigma_yaw = float(np.sqrt(P_diag[4])) if P.shape[0] > 4 else 0.0

    return NavigationUncertainty(
        sigma_e=sigma_e,
        sigma_n=sigma_n,
        sigma_horiz=sigma_horiz,
        radius_95=r_95,
        covariance_trace=float(np.trace(P)),
        max_eigenvalue=lambda_max,
        sigma_v_e=sigma_v_e,
        sigma_v_n=sigma_v_n,
        sigma_yaw_rad=sigma_yaw,
    )


def evaluate_uncertainty_calibration(
    actual_errors: np.ndarray,
    predicted_bounds_95: np.ndarray,
) -> Dict[str, float]:
    """Empirically evaluate confidence bound calibration.

    Checks what proportion of epochs satisfy: actual_error <= predicted_bound_95.
    Perfect calibration achieves empirical coverage ~ 0.95 (95%).
    """
    err = np.asarray(actual_errors, dtype=float)
    bnd = np.asarray(predicted_bounds_95, dtype=float)
    n = len(err)
    if n == 0:
        return {"empirical_coverage": 0.0, "calibration_gap": 0.0, "mean_ratio": 0.0}

    covered = np.sum(err <= bnd)
    empirical_coverage = float(covered / n)
    calibration_gap = float(abs(empirical_coverage - 0.95))

    # Ratio of actual error to predicted bound
    valid_bnd = np.where(bnd <= 1e-4, 1e-4, bnd)
    mean_ratio = float(np.mean(err / valid_bnd))

    return {
        "empirical_coverage": round(empirical_coverage, 4),
        "target_coverage": 0.95,
        "calibration_gap": round(calibration_gap, 4),
        "mean_error_to_bound_ratio": round(mean_ratio, 4),
        "total_evaluated_samples": n,
    }
