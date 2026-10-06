"""Comprehensive Unit Tests for VYRA Simulation Modules."""

import numpy as np
import pandas as pd
import pytest

from simulation.gnss_degradation import (
    DegradationEvent,
    generate_gradual_degradation_schedule,
    generate_sudden_outage_schedule,
    inject_controlled_degradation,
)
from simulation.gnss_outage import generate_outage_schedule, inject_gnss_outages
from simulation.sensor_dropout import inject_sensor_dropout
from simulation.sensor_noise import NoiseParameters, inject_sensor_noise


@pytest.fixture
def sample_trajectory_df():
    """Create synthetic 10 Hz trajectory dataframe for deterministic testing."""
    n = 1000  # 100 seconds
    timestamps = np.linspace(0, 99.9, n)
    lat0, lon0 = 52.408, -1.505

    # Gentle curve trajectory
    lats = lat0 + 1e-4 * np.sin(timestamps * 0.05)
    lons = lon0 + 1e-4 * timestamps
    speeds = np.full(n, 12.0)
    headings = np.full(n, 45.0)

    df = pd.DataFrame({
        "timestamp": timestamps,
        "latitude": lats,
        "longitude": lons,
        "altitude": np.zeros(n),
        "speed_mps": speeds,
        "heading_deg": headings,
        "satellites_available": np.full(n, 10.0),
        "composite_quality_score": np.full(n, 0.95),
        "longitudinal_acceleration_mps2": np.zeros(n),
        "lateral_acceleration_mps2": np.zeros(n),
        "yaw_rate_rad_s": np.zeros(n),
    })
    return df


def test_gradual_degradation_schedule_generation(sample_trajectory_df):
    """Verify gradual degradation schedule generates non-overlapping valid events."""
    events = generate_gradual_degradation_schedule(
        sample_trajectory_df,
        durations_s=[2.0, 5.0, 10.0],
        decline_duration_s=2.0,
        recovery_duration_s=2.0,
        inter_event_spacing_s=15.0,
        warmup_s=5.0,
        cooldown_s=5.0,
    )
    assert len(events) >= 2
    for ev in events:
        assert ev.start_idx < ev.end_idx
        assert ev.degradation_onset_time < ev.outage_onset_time
        assert ev.outage_onset_time < ev.recovery_end_time
        assert ev.event_type == "gradual"


def test_controlled_degradation_injection_anti_leakage(sample_trajectory_df):
    """Verify ground truth is strictly preserved and operational indicators masked."""
    events = generate_gradual_degradation_schedule(
        sample_trajectory_df,
        durations_s=[5.0],
        decline_duration_s=2.0,
        recovery_duration_s=2.0,
        inter_event_spacing_s=20.0,
        warmup_s=10.0,
    )
    sim_df = inject_controlled_degradation(sample_trajectory_df, events, seed=42)

    # 1. Anti-leakage: pristine GT preserved
    assert "gt_latitude" in sim_df.columns
    assert "gt_longitude" in sim_df.columns
    np.testing.assert_array_equal(sim_df["gt_latitude"], sample_trajectory_df["latitude"])
    np.testing.assert_array_equal(sim_df["gt_longitude"], sample_trajectory_df["longitude"])

    # 2. Outage masking: during full outage, satellites=0 and quality=0.0
    outage_mask = sim_df["is_simulated_outage"].to_numpy()
    assert np.any(outage_mask)
    assert np.all(sim_df.loc[outage_mask, "satellites_available"] == 0.0)
    assert np.all(sim_df.loc[outage_mask, "composite_quality_score"] == 0.0)

    # 3. Quality decline: degraded flag is set
    degraded_mask = sim_df["is_simulated_degraded"].to_numpy()
    assert np.sum(degraded_mask) > np.sum(outage_mask)


def test_sensor_noise_injection(sample_trajectory_df):
    """Verify noise injection adds perturbation deterministically."""
    params = NoiseParameters(
        accel_noise_std_mps2=0.2,
        gyro_noise_std_rads=0.02,
        gnss_pos_noise_std_m=2.0,
        seed=123,
    )
    noisy_df = inject_sensor_noise(sample_trajectory_df, params)

    # Accelerometer should be perturbed
    assert not np.allclose(noisy_df["longitudinal_acceleration_mps2"], sample_trajectory_df["longitudinal_acceleration_mps2"])
    # Gyroscope should be perturbed
    assert not np.allclose(noisy_df["yaw_rate_rad_s"], sample_trajectory_df["yaw_rate_rad_s"])
    # Latitudes should be perturbed (difference greater than 1e-6 degrees ~ 0.1m)
    assert np.max(np.abs(noisy_df["latitude"].to_numpy() - sample_trajectory_df["latitude"].to_numpy())) > 1e-6

    # Reproducibility test: same seed produces identical results
    noisy_df2 = inject_sensor_noise(sample_trajectory_df, params)
    np.testing.assert_array_equal(noisy_df["latitude"], noisy_df2["latitude"])


def test_sensor_dropout_injection(sample_trajectory_df):
    """Verify intermittent packet dropout zeros out operational indicators."""
    dropped_df = inject_sensor_dropout(
        sample_trajectory_df,
        dropout_rate=0.08,
        burst_length_epochs=5,
        target_sensor="gnss",
        seed=42,
    )
    assert "is_sensor_dropout" in dropped_df.columns
    dropout_mask = dropped_df["is_sensor_dropout"].to_numpy()
    assert np.any(dropout_mask)
    assert np.all(dropped_df.loc[dropout_mask, "composite_quality_score"] == 0.0)
    assert np.all(dropped_df.loc[dropout_mask, "satellites_available"] == 0.0)
