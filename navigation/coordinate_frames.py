"""Coordinate Frames and Geodetic Transformation Module for VYRA.

Defines rigorous spatial frame conventions and transformation mathematics:
- Body Frame (b):
    +Y_b: Longitudinal forward vehicle heading
    +X_b: Lateral right axis
    +Z_b: Vertical up axis (right-handed convention)
- Navigation Local Tangent Frame (n / ENU):
    +X_n: East (meters)
    +Y_n: North (meters)
    +Z_n: Up (meters)
- Attitude & Heading:
    Compass Azimuth psi: [0, 360) degrees, 0 = North, 90 = East, clockwise
    ENU Yaw theta: [-pi, pi) radians, 0 = East, pi/2 = North, counter-clockwise
    Conversion: theta = pi/2 - radians(psi), psi = wrap_360(degrees(pi/2 - theta))
- Geodetic Coordinates:
    WGS84 Ellipsoid (a = 6378137.0 m, 1/f = 298.257223563)
    Latitude phi, Longitude lambda, Altitude h (meters)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# WGS-84 Ellipsoid Constants
WGS84_A: float = 6378137.0  # Semi-major axis in meters
WGS84_F: float = 1.0 / 298.257223563  # Flattening
WGS84_B: float = WGS84_A * (1.0 - WGS84_F)  # Semi-minor axis in meters
WGS84_E2: float = 2.0 * WGS84_F - WGS84_F**2  # First eccentricity squared


@dataclass(frozen=True)
class ENUAnchor:
    """Geodetic origin point for local East-North-Up tangent plane."""

    lat0_deg: float
    lon0_deg: float
    alt0_m: float

    @property
    def lat0_rad(self) -> float:
        return np.radians(self.lat0_deg)

    @property
    def lon0_rad(self) -> float:
        return np.radians(self.lon0_deg)


def wrap_angle_pi(angle_rad: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
    """Wrap angle to [-pi, pi) radians."""
    return (angle_rad + np.pi) % (2.0 * np.pi) - np.pi


def wrap_heading_360(heading_deg: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
    """Wrap compass azimuth to [0, 360) degrees."""
    return heading_deg % 360.0


def compass_heading_to_enu_yaw(
    heading_deg: Union[float, np.ndarray],
) -> Union[float, np.ndarray]:
    """Convert compass azimuth (0=North, clockwise) to ENU yaw (0=East, CCW).

    theta = wrap_pi(pi/2 - radians(heading_deg))
    """
    heading_rad = np.radians(heading_deg)
    enu_yaw = np.pi / 2.0 - heading_rad
    return wrap_angle_pi(enu_yaw)


def enu_yaw_to_compass_heading(
    yaw_rad: Union[float, np.ndarray],
) -> Union[float, np.ndarray]:
    """Convert ENU yaw (0=East, CCW) to compass azimuth (0=North, clockwise).

    heading_deg = wrap_360(degrees(pi/2 - yaw_rad))
    """
    deg = np.degrees(np.pi / 2.0 - yaw_rad)
    return wrap_heading_360(deg)


def rotation_matrix_2d_enu(yaw_rad: float) -> np.ndarray:
    """Compute 2D rotation matrix R_b^n transforming body vector to ENU vector.

    v_enu = R_b^n @ [v_lat, v_long]^T where body frame has +Y forward, +X right.
    In vehicle body frame (+Y forward, +X right):
      v_E = v_long * cos(theta) - v_lat * sin(theta)
      v_N = v_long * sin(theta) + v_lat * cos(theta)
    """
    c = np.cos(yaw_rad)
    s = np.sin(yaw_rad)
    return np.array([[-s, c], [c, s]], dtype=float)


def geodetic_to_ecef(
    lat_deg: Union[float, np.ndarray],
    lon_deg: Union[float, np.ndarray],
    alt_m: Union[float, np.ndarray],
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert WGS-84 geodetic coordinates to Earth-Centered Earth-Fixed (ECEF)."""
    phi = np.radians(lat_deg)
    lam = np.radians(lon_deg)
    h = np.asarray(alt_m, dtype=float)

    sin_phi = np.sin(phi)
    cos_phi = np.cos(phi)
    sin_lam = np.sin(lam)
    cos_lam = np.cos(lam)

    # Prime vertical radius of curvature N(phi)
    N = WGS84_A / np.sqrt(1.0 - WGS84_E2 * sin_phi**2)

    X = (N + h) * cos_phi * cos_lam
    Y = (N + h) * cos_phi * sin_lam
    Z = (N * (1.0 - WGS84_E2) + h) * sin_phi

    return X, Y, Z


def ecef_to_enu(
    X: Union[float, np.ndarray],
    Y: Union[float, np.ndarray],
    Z: Union[float, np.ndarray],
    anchor: ENUAnchor,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Transform ECEF Cartesian coordinates to local ENU tangent plane."""
    X_arr = np.asarray(X, dtype=float)
    Y_arr = np.asarray(Y, dtype=float)
    Z_arr = np.asarray(Z, dtype=float)

    X0, Y0, Z0 = geodetic_to_ecef(anchor.lat0_deg, anchor.lon0_deg, anchor.alt0_m)

    dX = X_arr - X0
    dY = Y_arr - Y0
    dZ = Z_arr - Z0

    sin_phi = np.sin(anchor.lat0_rad)
    cos_phi = np.cos(anchor.lat0_rad)
    sin_lam = np.sin(anchor.lon0_rad)
    cos_lam = np.cos(anchor.lon0_rad)

    e = -sin_lam * dX + cos_lam * dY
    n = -sin_phi * cos_lam * dX - sin_phi * sin_lam * dY + cos_phi * dZ
    u = cos_phi * cos_lam * dX + cos_phi * sin_lam * dY + sin_phi * dZ

    return e, n, u


def geodetic_to_enu(
    lat_deg: Union[float, np.ndarray],
    lon_deg: Union[float, np.ndarray],
    alt_m: Union[float, np.ndarray],
    anchor: ENUAnchor,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Direct conversion from WGS-84 geodetic to local ENU tangent plane."""
    X, Y, Z = geodetic_to_ecef(lat_deg, lon_deg, alt_m)
    return ecef_to_enu(X, Y, Z, anchor)


def enu_to_ecef(
    e: Union[float, np.ndarray],
    n: Union[float, np.ndarray],
    u: Union[float, np.ndarray],
    anchor: ENUAnchor,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Transform local ENU coordinates back to ECEF Cartesian."""
    e_arr = np.asarray(e, dtype=float)
    n_arr = np.asarray(n, dtype=float)
    u_arr = np.asarray(u, dtype=float)

    X0, Y0, Z0 = geodetic_to_ecef(anchor.lat0_deg, anchor.lon0_deg, anchor.alt0_m)

    sin_phi = np.sin(anchor.lat0_rad)
    cos_phi = np.cos(anchor.lat0_rad)
    sin_lam = np.sin(anchor.lon0_rad)
    cos_lam = np.cos(anchor.lon0_rad)

    dX = -sin_lam * e_arr - sin_phi * cos_lam * n_arr + cos_phi * cos_lam * u_arr
    dY = cos_lam * e_arr - sin_phi * sin_lam * n_arr + cos_phi * sin_lam * u_arr
    dZ = cos_phi * n_arr + sin_phi * u_arr

    return X0 + dX, Y0 + dY, Z0 + dZ


def ecef_to_geodetic(
    X: Union[float, np.ndarray],
    Y: Union[float, np.ndarray],
    Z: Union[float, np.ndarray],
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert ECEF Cartesian coordinates to WGS-84 geodetic (lat_deg, lon_deg, alt_m) using Bowring's method."""
    X_arr = np.asarray(X, dtype=float)
    Y_arr = np.asarray(Y, dtype=float)
    Z_arr = np.asarray(Z, dtype=float)

    e2_prime = (WGS84_A**2 - WGS84_B**2) / (WGS84_B**2)
    p = np.sqrt(X_arr**2 + Y_arr**2)

    # Bowring closed-form algorithm
    theta = np.arctan2(Z_arr * WGS84_A, p * WGS84_B)
    sin_t = np.sin(theta)
    cos_t = np.cos(theta)

    phi = np.arctan2(
        Z_arr + e2_prime * WGS84_B * sin_t**3,
        p - WGS84_E2 * WGS84_A * cos_t**3,
    )
    lam = np.arctan2(Y_arr, X_arr)

    sin_phi = np.sin(phi)
    N = WGS84_A / np.sqrt(1.0 - WGS84_E2 * sin_phi**2)
    h = p / np.cos(phi) - N

    return np.degrees(phi), np.degrees(lam), h


def enu_to_geodetic(
    e: Union[float, np.ndarray],
    n: Union[float, np.ndarray],
    u: Union[float, np.ndarray],
    anchor: ENUAnchor,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert local ENU Cartesian coordinates back to WGS-84 geodetic (lat_deg, lon_deg, alt_m)."""
    X, Y, Z = enu_to_ecef(e, n, u, anchor)
    return ecef_to_geodetic(X, Y, Z)

