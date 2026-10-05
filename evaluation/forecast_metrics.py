"""Forecast Metrics Module.

Measures the accuracy, rank correlation, and reliability of action-conditioned
short-horizon error forecasts compared against actual observed consequences.

Inputs: Array of predicted errors for chosen and candidate actions, array of actual errors.
Outputs: Forecast RMSE, Mean Absolute Percentage Error (MAPE), Spearman rank correlation.
"""
