"""Forecasting Supervised Target Generation Module for VYRA.

Constructs ground-truth future localization error consequence targets for candidate
navigation actions A in {GNSS, HYBRID, DR} across forward horizons H in {1s, 3s, 5s, 10s}:
- Continuous Target: Maximum future horizontal position error in the window (t, t + H]:
    e_max(t, A, H) = max_{tau in (t, t + H]} ||p_A(tau) - p_gt(tau)|| (meters)
- Binary Violation Target: Whether e_max exceeds operational error threshold (e.g. 5.0m):
    v(t, A, H) = I(e_max(t, A, H) > E_threshold) in {0, 1}

ANTI-LEAKAGE SPECIFICATION:
Future trajectory coordinates and errors are evaluated strictly as supervised targets.
Under NO circumstances are future target values exposed to decision-time input features.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd

from forecasting.action_conditioning import ACTION_NAMES, NavigationAction

logger = logging.getLogger(__name__)

STANDARD_FORECAST_HORIZONS: List[float] = [1.0, 3.0, 5.0, 10.0]


def compute_future_horizon_targets(
    error_series: np.ndarray,
    horizons_seconds: Optional[List[float]] = None,
    sampling_rate_hz: float = 10.0,
    error_threshold_m: float = 5.0,
) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
    """Compute maximum future error and threshold violation indicators over forward horizons.

    Args:
        error_series: 1D array of horizontal positioning errors for a candidate mode.
        horizons_seconds: Forward horizons in seconds (e.g. [1.0, 3.0, 5.0, 10.0]).
        sampling_rate_hz: Trajectory sample rate (10 Hz nominal).
        error_threshold_m: Operational threshold for binary violation label (e.g. 5.0m).

    Returns:
        Tuple of (Dict of continuous max error targets, Dict of binary violation targets).
    """
    if horizons_seconds is None:
        horizons_seconds = STANDARD_FORECAST_HORIZONS

    err_arr = np.asarray(error_series, dtype=float)
    n = len(err_arr)

    continuous_targets: Dict[str, np.ndarray] = {}
    binary_targets: Dict[str, np.ndarray] = {}

    for h_sec in horizons_seconds:
        h_steps = max(1, int(round(h_sec * sampling_rate_hz)))
        h_key = f"{int(h_sec)}s" if h_sec.is_integer() else f"{h_sec}s"

        # Look strictly forward: window (i + 1, min(i + h_steps, n - 1)]
        # Accomplished causally by rolling reversed series
        shifted = pd.Series(err_arr).shift(-1)
        fwd_max = (
            shifted.iloc[::-1]
            .rolling(window=h_steps, min_periods=1)
            .max()
            .iloc[::-1]
            .fillna(err_arr[-1])
            .to_numpy(dtype=float)
        )

        continuous_targets[h_key] = fwd_max
        binary_targets[h_key] = (fwd_max > error_threshold_m).astype(int)

    return continuous_targets, binary_targets


def generate_action_conditioned_dataset(
    X_base: np.ndarray,
    action_error_dict: Dict[str, np.ndarray],
    horizon_seconds: float = 3.0,
    error_threshold_m: float = 5.0,
    sampling_rate_hz: float = 10.0,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Assemble complete (X, y_cont, y_binary) dataset stacked across all 3 candidate actions.

    For each epoch t and each action A in {GNSS, HYBRID, DR}:
      x_i = assemble_action_conditioned_feature_vector(s_t, A, H)
      y_cont_i = e_max(t, A, H)
      y_bin_i = I(e_max(t, A, H) > E_thresh)

    Returns:
        Tuple of (X_conditioned [3N x D], y_continuous [3N], y_binary [3N]).
    """
    from forecasting.action_conditioning import (
        assemble_action_conditioned_matrix,
    )

    h_key = f"{int(horizon_seconds)}s" if horizon_seconds.is_integer() else f"{horizon_seconds}s"
    n = len(X_base)

    X_list: List[np.ndarray] = []
    y_cont_list: List[np.ndarray] = []
    y_bin_list: List[np.ndarray] = []

    for action_name in ACTION_NAMES:
        if action_name not in action_error_dict:
            raise KeyError(f"Candidate mode errors missing for '{action_name}'.")

        errs = action_error_dict[action_name]
        cont_targets, bin_targets = compute_future_horizon_targets(
            errs, horizons_seconds=[horizon_seconds], sampling_rate_hz=sampling_rate_hz, error_threshold_m=error_threshold_m
        )

        X_act = assemble_action_conditioned_matrix(
            X_base, action=action_name, horizon_seconds=horizon_seconds
        )

        X_list.append(X_act)
        y_cont_list.append(cont_targets[h_key])
        y_bin_list.append(bin_targets[h_key])

    X_all = np.vstack(X_list)
    y_cont_all = np.concatenate(y_cont_list)
    y_bin_all = np.concatenate(y_bin_list)

    return X_all, y_cont_all, y_bin_all
