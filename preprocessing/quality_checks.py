"""Data Quality Checks Module.

Validates preprocessed trajectories against strict integrity criteria:
monotonic timestamps, bounded accelerations, valid geodetic ranges, and zero
data leakage across split boundaries.

Inputs: Preprocessed trajectory DataFrames.
Outputs: Quality report dictionary and validation boolean flags.
"""
