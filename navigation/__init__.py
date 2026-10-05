"""VYRA Navigation Package.

Modules for IMU processing, inertial dead reckoning, Extended Kalman Filtering (EKF),
navigation state estimation, uncertainty propagation, and coordinate frame management.
"""

from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    enu_to_ecef,
    enu_yaw_to_compass_heading,
    geodetic_to_enu,
    wrap_angle_pi,
    wrap_heading_360,
)
from navigation.dead_reckoning import DeadReckoningEngine, DeadReckoningState
from navigation.ekf import EKFState, ExtendedKalmanFilter
from navigation.imu_processing import IMUObservation, IMUProcessor
from navigation.uncertainty import (
    NavigationUncertainty,
    evaluate_uncertainty_calibration,
    extract_uncertainty,
)

__all__ = [
    "ENUAnchor",
    "geodetic_to_enu",
    "enu_to_ecef",
    "compass_heading_to_enu_yaw",
    "enu_yaw_to_compass_heading",
    "wrap_angle_pi",
    "wrap_heading_360",
    "IMUObservation",
    "IMUProcessor",
    "DeadReckoningEngine",
    "DeadReckoningState",
    "ExtendedKalmanFilter",
    "EKFState",
    "NavigationUncertainty",
    "extract_uncertainty",
    "evaluate_uncertainty_calibration",
]
