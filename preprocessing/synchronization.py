"""Sensor Synchronization Module.

Performs causal temporal alignment and interpolation between high-rate IMU
readings and lower-rate GNSS epochs without future lookahead.

Inputs: High-rate IMU stream, low-rate GNSS stream, Ground Truth stream.
Outputs: Synchronized multimodal timeline DataFrame.
"""
