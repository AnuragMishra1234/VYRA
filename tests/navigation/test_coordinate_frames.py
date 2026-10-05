"""Unit Tests for Coordinate Frames and Geodetic Transformations."""

import numpy as np
import pytest

from navigation.coordinate_frames import (
    ENUAnchor,
    compass_heading_to_enu_yaw,
    enu_to_ecef,
    enu_yaw_to_compass_heading,
    geodetic_to_ecef,
    geodetic_to_enu,
    rotation_matrix_2d_enu,
    wrap_angle_pi,
    wrap_heading_360,
)


def test_angle_wrapping() -> None:
    assert np.isclose(wrap_angle_pi(np.pi), -np.pi)
    assert np.isclose(wrap_angle_pi(3.0 * np.pi), -np.pi)
    assert np.isclose(wrap_angle_pi(-3.0 * np.pi), -np.pi)
    assert np.isclose(wrap_angle_pi(0.5), 0.5)

    assert np.isclose(wrap_heading_360(370.0), 10.0)
    assert np.isclose(wrap_heading_360(-10.0), 350.0)
    assert np.isclose(wrap_heading_360(0.0), 0.0)


def test_heading_and_yaw_conversions() -> None:
    # 0 deg North -> pi/2 ENU yaw
    yaw_north = compass_heading_to_enu_yaw(0.0)
    assert np.isclose(yaw_north, np.pi / 2.0)
    assert np.isclose(enu_yaw_to_compass_heading(yaw_north), 0.0)

    # 90 deg East -> 0 ENU yaw
    yaw_east = compass_heading_to_enu_yaw(90.0)
    assert np.isclose(yaw_east, 0.0)
    assert np.isclose(enu_yaw_to_compass_heading(yaw_east), 90.0)

    # 180 deg South -> -pi/2 ENU yaw
    yaw_south = compass_heading_to_enu_yaw(180.0)
    assert np.isclose(yaw_south, -np.pi / 2.0)
    assert np.isclose(enu_yaw_to_compass_heading(yaw_south), 180.0)

    # 270 deg West -> pi (or -pi) ENU yaw
    yaw_west = compass_heading_to_enu_yaw(270.0)
    assert np.isclose(abs(yaw_west), np.pi)
    assert np.isclose(enu_yaw_to_compass_heading(yaw_west), 270.0)


def test_geodetic_to_enu_roundtrip() -> None:
    anchor = ENUAnchor(lat0_deg=52.40, lon0_deg=-1.50, alt0_m=100.0)

    # Origin itself should map to (0, 0, 0) in ENU
    e0, n0, u0 = geodetic_to_enu(anchor.lat0_deg, anchor.lon0_deg, anchor.alt0_m, anchor)
    assert np.isclose(e0, 0.0, atol=1e-4)
    assert np.isclose(n0, 0.0, atol=1e-4)
    assert np.isclose(u0, 0.0, atol=1e-4)

    # Point ~1 km North
    dlat = 1000.0 / 111132.95  # ~0.009 deg
    e1, n1, u1 = geodetic_to_enu(anchor.lat0_deg + dlat, anchor.lon0_deg, anchor.alt0_m, anchor)
    assert np.isclose(e1, 0.0, atol=1.0)
    assert np.isclose(n1, 1000.0, atol=5.0)

    # Test reverse transformation to ECEF
    X, Y, Z = enu_to_ecef(e1, n1, u1, anchor)
    X_ref, Y_ref, Z_ref = geodetic_to_ecef(anchor.lat0_deg + dlat, anchor.lon0_deg, anchor.alt0_m)
    assert np.isclose(X, X_ref, atol=1e-3)
    assert np.isclose(Y, Y_ref, atol=1e-3)
    assert np.isclose(Z, Z_ref, atol=1e-3)


def test_rotation_matrix_2d() -> None:
    R = rotation_matrix_2d_enu(0.0)  # yaw = 0 (pointing East)
    # Body +Y is forward -> should point East (first column of ENU)
    v_body_fwd = np.array([0.0, 1.0])  # [lat, long] = [0, 1]
    v_enu = R @ v_body_fwd
    assert np.isclose(v_enu[0], 1.0)  # East
    assert np.isclose(v_enu[1], 0.0)  # North
