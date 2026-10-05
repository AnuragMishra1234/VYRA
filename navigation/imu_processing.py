"""IMU Processing Module.

Handles calibration, bias removal, low-pass filtering, gravity compensation,
and specific force extraction from raw tri-axial accelerometer and gyroscope streams.

Inputs: Raw IMU specific force and angular velocity measurements.
Outputs: Calibrated and compensated body-frame acceleration and angular rates.
"""
