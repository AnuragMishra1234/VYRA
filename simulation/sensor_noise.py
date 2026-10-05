"""Sensor Noise Simulation Module.

Injects Gaussian noise, random walk bias, or scale factor errors into accelerometer
and gyroscope channels for robustness sensitivity analysis.

Inputs: IMU sensor streams, noise power spectral density / bias parameters.
Outputs: Perturbed IMU stream for sensitivity benchmarking.
"""
