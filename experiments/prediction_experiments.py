"""Prediction Experiments Module.

Evaluates GNSS degradation prediction models across multiple forward horizons
(1s, 3s, 5s, 10s). Measures accuracy, ROC-AUC, PR-AUC, warning lead time, and calibration.

Inputs: Preprocessed train/val/test feature matrices.
Outputs: Classification performance metrics, calibration curves, lead-time distributions.
"""
