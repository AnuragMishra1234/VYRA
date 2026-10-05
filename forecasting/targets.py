"""Forecasting Targets Module.

Generates supervised future localization consequences over short horizons H
in {1s, 3s, 5s, 10s} for training action-conditioned forecasting models.

Target formulations:
- Future position error magnitude: ||p^{est}(t + H) - p^{gt}(t + H)||
- Maximum future error over horizon: max_{h in [0, H]} ||p^{est}(t + h) - p^{gt}(t + h)||
- Binary error-bound violation indicator: I(||p^{est}(t + H) - p^{gt}(t + H)|| > E_{threshold})

Inputs: Full ground-truth reference trajectory and candidate mode execution logs.
Outputs: Supervised future consequence target vectors.
"""
