"""Navigation Experiments Module.

Evaluates standalone navigation performance: strapdown dead reckoning drift
rates, EKF sensor fusion consistency, and covariance scale validation.

Inputs: Synchronized IMU and pristine GNSS trajectories.
Outputs: Inertial error growth curves, covariance consistency metrics.
"""
