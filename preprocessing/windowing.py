"""Temporal Windowing Module.

Generates strictly causal rolling history feature windows for time-series forecasting.
Enforces non-overlapping window constraints and zero lookahead bias.

Inputs: Synchronized trajectory time series, window length L, step size s.
Outputs: Feature tensors of shape (N_windows, L_samples, N_features).
"""
