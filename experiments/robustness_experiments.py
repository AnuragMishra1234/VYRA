"""Robustness Experiments Module.

Tests policy and estimator sensitivity against variations in IMU noise, sensor
dropouts, varying outage durations (2s to 30s), and unseen test trajectories.

Inputs: Unseen test trajectories, disturbance parameter sweeps.
Outputs: Sensitivity curves, breakdown points, and robustness matrices.
"""
