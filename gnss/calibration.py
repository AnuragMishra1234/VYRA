"""GNSS Degradation Calibration Module.

Evaluates and calibrates predicted degradation probabilities to ensure
predicted risks align with empirical degradation frequencies (e.g., Platt scaling,
isotonic regression, Expected Calibration Error).

Inputs: Predicted probabilities and true binary degradation labels on validation set.
Outputs: Calibration curves, ECE score, calibrated probability mapping.
"""
