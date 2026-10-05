"""Unit tests for Forecasting Action Conditioning Module."""

import numpy as np
import pytest

from forecasting.action_conditioning import (
    ACTION_NAMES,
    NUM_ACTIONS,
    NavigationAction,
    assemble_action_conditioned_feature_vector,
    assemble_action_conditioned_matrix,
    encode_action_one_hot,
)


def test_encode_action_one_hot():
    gnss_vec = encode_action_one_hot("GNSS")
    assert np.array_equal(gnss_vec, [1.0, 0.0, 0.0])

    hybrid_vec = encode_action_one_hot(NavigationAction.HYBRID)
    assert np.array_equal(hybrid_vec, [0.0, 1.0, 0.0])

    dr_vec = encode_action_one_hot(2)
    assert np.array_equal(dr_vec, [0.0, 0.0, 1.0])

    with pytest.raises(ValueError):
        encode_action_one_hot("UNKNOWN_MODE")

    with pytest.raises(ValueError):
        encode_action_one_hot(5)


def test_assemble_action_conditioned_vector():
    base = np.array([0.9, 8.0, 0.1, 15.0])
    vec_gnss = assemble_action_conditioned_feature_vector(base, "GNSS", horizon_seconds=3.0, include_interactions=False)
    vec_hybrid = assemble_action_conditioned_feature_vector(base, "HYBRID", horizon_seconds=3.0, include_interactions=False)
    vec_dr = assemble_action_conditioned_feature_vector(base, "DR", horizon_seconds=3.0, include_interactions=False)

    # Base features preserved at prefix
    assert np.array_equal(vec_gnss[:4], base)
    assert np.array_equal(vec_hybrid[:4], base)
    assert np.array_equal(vec_dr[:4], base)

    # One-hot actions distinct
    assert not np.array_equal(vec_gnss, vec_hybrid)
    assert not np.array_equal(vec_gnss, vec_dr)

    # Horizon recorded at terminal position
    assert vec_gnss[-1] == 3.0


def test_assemble_action_conditioned_matrix():
    n_samples = 20
    d_feat = 5
    X_base = np.random.randn(n_samples, d_feat)

    # Without interactions
    X_cond = assemble_action_conditioned_matrix(X_base, action="HYBRID", horizon_seconds=5.0, include_interactions=False)
    assert X_cond.shape == (n_samples, d_feat + NUM_ACTIONS + 1)
    assert np.all(X_cond[:, -1] == 5.0)
    assert np.all(X_cond[:, d_feat + 1] == 1.0)
    assert np.all(X_cond[:, d_feat + 0] == 0.0)

    # With interactions
    X_inter = assemble_action_conditioned_matrix(X_base, action="HYBRID", horizon_seconds=5.0, include_interactions=True)
    assert X_inter.shape == (n_samples, d_feat + 16)
