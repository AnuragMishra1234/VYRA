"""Sensor Dropout Simulation Module.

Simulates intermittent hardware communication dropouts or packet loss in IMU
or GNSS data streams.

Inputs: Synchronized sensor stream, dropout probability / gap duration.
Outputs: Sensor stream with intermittent missing records.
"""
