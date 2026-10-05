"""Action Conditioning Module for VYRA.

Formalizes the candidate navigation action set:
- A_0: GNSS (raw satellite positioning fixes)
- A_1: HYBRID (loosely-coupled EKF sensor fusion)
- A_2: DR (pure strapdown inertial dead reckoning)

Provides one-hot action encoding, interaction feature assembly, and
counterfactual candidate representations to support the question:
"What would likely happen over horizon H if GNSS, HYBRID, or DR were selected now?"

ANTI-LEAKAGE SPECIFICATION:
Action conditioning vectors are constructed strictly from decision-time state
representations s_t and candidate action identifiers. No future information is accessed.
"""

from __future__ import annotations

import logging
from enum import IntEnum
from typing import Dict, List, Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)


class NavigationAction(IntEnum):
    """Discrete candidate navigation modes evaluated by VYRA."""

    GNSS = 0
    HYBRID = 1
    DR = 2


ACTION_NAMES: List[str] = ["GNSS", "HYBRID", "DR"]
NUM_ACTIONS: int = len(ACTION_NAMES)


def encode_action_one_hot(action: Union[NavigationAction, int, str]) -> np.ndarray:
    """Encode discrete candidate action into a 3-element one-hot vector."""
    if isinstance(action, str):
        name = action.upper()
        if name not in ACTION_NAMES:
            raise ValueError(f"Unknown action name '{action}'. Choose from {ACTION_NAMES}.")
        action_idx = ACTION_NAMES.index(name)
    else:
        action_idx = int(action)
        if action_idx < 0 or action_idx >= NUM_ACTIONS:
            raise ValueError(f"Action index {action_idx} out of range [0, {NUM_ACTIONS - 1}].")

    vec = np.zeros(NUM_ACTIONS, dtype=float)
    vec[action_idx] = 1.0
    return vec


def assemble_action_conditioned_feature_vector(
    base_state_features: np.ndarray,
    action: Union[NavigationAction, int, str],
    horizon_seconds: float,
    include_interactions: bool = True,
) -> np.ndarray:
    """Assemble single action-conditioned feature vector [s_t, a_one_hot, H, interactions].

    Args:
        base_state_features: 1D array of decision-time state features s_t.
        action: Candidate navigation action (GNSS, HYBRID, or DR).
        horizon_seconds: Target forward forecast horizon in seconds.
        include_interactions: Whether to append physical action-state interaction terms.

    Returns:
        1D action-conditioned feature vector.
    """
    s = np.asarray(base_state_features, dtype=float).flatten()
    a_one_hot = encode_action_one_hot(action)
    h_scalar = np.array([float(horizon_seconds)], dtype=float)

    if not include_interactions:
        return np.concatenate([s, a_one_hot, h_scalar])

    # Physical interactions:
    # Action interacted with horizon: a_one_hot * H
    action_horizon = a_one_hot * float(horizon_seconds)

    # If s has at least 3 features, interact action with first 3 core signals:
    # (typically: gnss_quality, speed, dr_uncertainty)
    if len(s) >= 3:
        core_interactions = np.outer(a_one_hot, s[:3]).flatten()
    else:
        core_interactions = np.array([], dtype=float)

    return np.concatenate([s, a_one_hot, h_scalar, action_horizon, core_interactions])


def assemble_action_conditioned_matrix(
    base_features_matrix: np.ndarray,
    action: Union[NavigationAction, int, str],
    horizon_seconds: float,
    include_interactions: bool = True,
) -> np.ndarray:
    """Broadcast candidate action across an entire feature matrix (N x D)."""
    X_base = np.asarray(base_features_matrix, dtype=float)
    n = len(X_base)
    if n == 0:
        return np.empty((0, 0))

    # Construct single sample to determine feature dimensionality
    sample_feat = assemble_action_conditioned_feature_vector(
        X_base[0], action, horizon_seconds, include_interactions=include_interactions
    )
    dim = len(sample_feat)

    X_conditioned = np.zeros((n, dim), dtype=float)
    for i in range(n):
        X_conditioned[i] = assemble_action_conditioned_feature_vector(
            X_base[i], action, horizon_seconds, include_interactions=include_interactions
        )

    return X_conditioned
