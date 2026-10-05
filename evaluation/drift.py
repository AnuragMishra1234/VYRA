"""Drift Rate Module.

Computes terminal position drift and drift growth rate (meters/second or
percentage of distance traveled) during dead-reckoning outage intervals.

Inputs: Trajectory positions during outage periods, outage durations.
Outputs: Scalar terminal drift, drift rate (m/s).
"""
