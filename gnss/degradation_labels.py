"""GNSS Degradation Labels Module.

Generates ground-truth binary and continuous degradation targets across
forward horizons H in {1s, 3s, 5s, 10s} for training degradation predictors.

Inputs: Synchronized full trajectory GNSS measurements and reference truth.
Outputs: Binary target y_{deg}(t + H) indicating degradation onset in horizon H.
"""
