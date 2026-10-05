"""Unit tests for preprocessing/coordinate_utils.py."""

import pytest
import numpy as np
import pandas as pd

from preprocessing.coordinate_utils import (
    GeodeticAnchor,
    geodetic_to_ecef,
    ecef_to_enu,
    geodetic_to_enu,
    add_enu_coordinates_to_df,
)


def test_geodetic_to_ecef_equator_prime_meridian():
    """At (0, 0, 0), ECEF X should equal semi-major axis WGS84_A (~6378137m), Y=0, Z=0."""
    x, y, z = geodetic_to_ecef(0.0, 0.0, 0.0)
    assert np.isclose(x, 6378137.0, atol=1e-3)
    assert np.isclose(y, 0.0, atol=1e-3)
    assert np.isclose(z, 0.0, atol=1e-3)


def test_geodetic_to_ecef_north_pole():
    """At (90, 0, 0), ECEF X=0, Y=0, Z should equal semi-minor axis WGS84_B (~6356752.314m)."""
    x, y, z = geodetic_to_ecef(90.0, 0.0, 0.0)
    assert np.isclose(x, 0.0, atol=1e-3)
    assert np.isclose(y, 0.0, atol=1e-3)
    assert np.isclose(z, 6356752.314245, atol=1e-2)


def test_enu_anchor_identity():
    """Evaluating anchor at its own coordinates must yield (0, 0, 0) ENU."""
    anchor = GeodeticAnchor.from_lat_lon_alt(lat0_deg=52.4068, lon0_deg=-1.5197, alt0_m=100.0)
    e, n, u = geodetic_to_enu(lat_deg=52.4068, lon_deg=-1.5197, alt_m=100.0, anchor=anchor)

    assert np.isclose(e, 0.0, atol=1e-6)
    assert np.isclose(n, 0.0, atol=1e-6)
    assert np.isclose(u, 0.0, atol=1e-6)


def test_enu_displacement_direction():
    """Moving strictly north increases North coordinate; moving strictly east increases East coordinate."""
    anchor = GeodeticAnchor.from_lat_lon_alt(lat0_deg=52.0, lon0_deg=0.0, alt0_m=0.0)

    # 0.01 deg north
    e_n, n_n, u_n = geodetic_to_enu(52.01, 0.0, 0.0, anchor)
    assert np.isclose(e_n, 0.0, atol=1.0)
    assert n_n > 1000.0  # Approx 1.1 km north

    # 0.01 deg east
    e_e, n_e, u_e = geodetic_to_enu(52.0, 0.01, 0.0, anchor)
    assert e_e > 500.0  # Approx 680 m east at lat 52
    assert np.isclose(n_e, 0.0, atol=1.0)


def test_add_enu_coordinates_to_df():
    df = pd.DataFrame(
        {
            "latitude": [52.0, 52.001],
            "longitude": [0.0, 0.001],
            "altitude": [10.0, 10.0],
        }
    )
    df_enu, anchor = add_enu_coordinates_to_df(df)

    assert "pos_east_m" in df_enu.columns
    assert "pos_north_m" in df_enu.columns
    assert "pos_up_m" in df_enu.columns
    # First row is origin
    assert np.isclose(df_enu.loc[0, "pos_east_m"], 0.0)
    assert np.isclose(df_enu.loc[0, "pos_north_m"], 0.0)
    assert np.isclose(df_enu.loc[0, "pos_up_m"], 0.0)
