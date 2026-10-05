"""Forecasting Features Module.

Constructs feature vectors available strictly at decision time t to feed candidate
error forecasting models. Combines GNSS quality signals, IMU dynamics, DR uncertainty,
and recent trajectory innovation residuals without lookahead bias.

Inputs: Multimodal sensor and state history up to current epoch t.
Outputs: Decision-time state feature vector s_t.
"""
