"""Unit Tests for GNSS Quality Engine."""

import numpy as np
import pandas as pd
import pytest

from gnss.quality import (
    compute_gnss_quality,
    compute_kinematic_consistency_score,
    compute_position_jump_residual,
    compute_satellite_quality_score,
    extract_effective_satellites,
)


def test_extract_effective_satellites() -> None:
    raw = np.array([0.0, 4.0, 8.0, 138.0, 112.0, -2.0])
    eff = extract_effective_satellites(raw)
    assert eff[0] == 0.0
    assert eff[1] == 4.0
    assert eff[2] == 8.0
    assert eff[3] == 24.0  # 38 clamped to 24
    assert eff[4] == 12.0  # 112 % 100 = 12
    assert eff[5] == 0.0   # clipped non-negative


def test_compute_satellite_quality_score() -> None:
    sats = np.array([0.0, 2.0, 4.0, 6.0, 8.0, 12.0])
    scores = compute_satellite_quality_score(sats)
    assert scores[0] == 0.0
    assert 0.0 < scores[1] < 0.1
    assert np.isclose(scores[2], 0.40)
    assert np.isclose(scores[3], 0.70)
    assert scores[4] == 1.0
    assert scores[5] == 1.0


def test_compute_kinematic_consistency_score() -> None:
    diffs = np.array([0.1, 0.5, 1.25, 2.0, 5.0])
    scores = compute_kinematic_consistency_score(diffs)
    assert scores[0] == 1.0
    assert scores[1] == 1.0
    assert np.isclose(scores[2], 0.50)
    assert scores[3] == 0.0
    assert scores[4] == 0.0


def test_compute_position_jump_residual() -> None:
    ts = np.array([0.0, 1.0, 2.0])
    lats = np.array([52.0, 52.0, 52.0])
    lons = np.array([0.0, 0.0, 0.0])
    speeds = np.array([0.0, 0.0, 0.0])
    res = compute_position_jump_residual(ts, lats, lons, speeds)
    assert len(res) == 3
    assert np.allclose(res, 0.0)


def test_compute_gnss_quality_pipeline() -> None:
    n = 20
    df = pd.DataFrame({
        "timestamp": np.arange(n, dtype=float) * 0.1,
        "satellites_available": np.full(n, 10.0),
        "speed_mps": np.full(n, 10.0),
        "indicated_speed_kmh": np.full(n, 36.0),  # 36 km/h = 10 m/s -> diff = 0
        "latitude": np.full(n, 52.48),
        "longitude": np.full(n, -1.89),
    })

    # Introduce synthetic degradation at index 10: 0 satellites
    df.loc[10, "satellites_available"] = 0.0

    res = compute_gnss_quality(df, quality_threshold=0.70)
    assert "composite_quality_score" in res.columns
    assert "is_currently_degraded" in res.columns

    # Nominal rows should be healthy
    assert res.loc[0, "is_currently_degraded"] == False
    assert res.loc[0, "composite_quality_score"] > 0.90

    # Index 10 must be flagged degraded
    assert res.loc[10, "is_currently_degraded"] == True
    assert res.loc[10, "composite_quality_score"] == 0.0
