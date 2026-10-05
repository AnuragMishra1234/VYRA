"""GNSS Features Extraction Module.

Extracts temporal, statistical, and derivative features from GNSS quality
indicators over a causal historical rolling window [t - W, t].

Inputs: Quality time-series window up to current time t.
Outputs: Causal feature vector for degradation prediction models.
"""
