"""Extended Kalman Filter (EKF) Fusion Module.

Implements loosely-coupled EKF / error-state EKF (ES-EKF) fusing inertial dead
reckoning propagation with GNSS position and velocity innovation updates.

Inputs: Prior state estimate, covariance P_{k-1}, IMU measurements, GNSS observations.
Outputs: Fused hybrid state vector x_{hybrid, k} and updated covariance P_k.
"""
