"""GNSS Outage Simulation Module.

Simulates total loss of GNSS positioning updates for configurable duration
intervals (2s, 5s, 10s, 20s, 30s) followed by controlled reacquisition/recovery phases.

Inputs: Trajectory GNSS stream, start timestamp, outage duration T_{outage}.
Outputs: GNSS stream with zero fix / missing observations during outage interval.
"""
