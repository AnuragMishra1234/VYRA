"""Coordinate Utilities Module for VYRA.

Provides mathematically verified and deterministic geodetic coordinate transformations:
- Geodetic WGS84 (Latitude, Longitude, Altitude) <-> Earth-Centered Earth-Fixed (ECEF)
- ECEF <-> Local Cartesian East-North-Up (ENU) tangent plane
- Direct Geodetic WGS84 -> ENU with explicit origin anchor

WGS84 Ellipsoidal Constants:
- Semi-major axis (a): 6378137.0 meters
- Flattening (f): 1.0 / 298.257223563
- Semi-minor axis (b): a * (1.0 - f) = 6356752.314245 meters
- First eccentricity squared (e^2): 2f - f^2
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple, Union

import numpy as np
import pandas as pd

# WGS84 Standard Constants
WGS84_A: float = 6378137.0  # meters
WGS84_F: float = 1.0 / 298.257223563
WGS84_B: float = WGS84_A * (1.0 - WGS84_F)
WGS84_E2: float = 2.0 * WGS84_F - (WGS84_F**2)  # 6.69437999014e-3
WGS84_E_PRIME2: float = (WGS84_A**2 - WGS84_B**2) / (WGS84_B**2)


@dataclass(frozen=True)
class GeodeticAnchor:
    """Reference geodetic anchor point for local tangent East-North-Up (ENU) frame."""

    lat0_deg: float
    lon0_deg: float
    alt0_m: float
    x0_ecef: float
    y0_ecef: float
    z0_ecef: float

    @classmethod
    def from_lat_lon_alt(
        cls, lat0_deg: float, lon0_deg: float, alt0_m: float = 0.0
    ) -> GeodeticAnchor:
        x0, y0, z0 = geodetic_to_ecef(lat0_deg, lon0_deg, alt0_m)
        return cls(
            lat0_deg=float(lat0_deg),
            lon0_deg=float(lon0_deg),
            alt0_m=float(alt0_m),
            x0_ecef=float(x0),
            y0_ecef=float(y0),
            z0_ecef=float(z0),
        )


def geodetic_to_ecef(
    lat_deg: Union[float, np.ndarray],
    lon_deg: Union[float, np.ndarray],
    alt_m: Union[float, np.ndarray] = 0.0,
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray], Union[float, np.ndarray]]:
    """Convert geodetic coordinates (WGS84) to Earth-Centered Earth-Fixed (ECEF) coordinates.

    Args:
        lat_deg: Geodetic latitude in degrees.
        lon_deg: Geodetic longitude in degrees.
        alt_m: Height above WGS84 ellipsoid in meters (defaults to 0.0).

    Returns:
        Tuple of (X, Y, Z) in ECEF meters.
    """
    lat_rad = np.radians(lat_deg)
    lon_rad = np.radians(lon_deg)

    sin_lat = np.sin(lat_rad)
    cos_lat = np.cos(lat_rad)
    sin_lon = np.sin(lon_rad)
    cos_lon = np.cos(lon_rad)

    # Prime vertical radius of curvature
    n = WGS84_A / np.sqrt(1.0 - WGS84_E2 * (sin_lat**2))

    x = (n + alt_m) * cos_lat * cos_lon
    y = (n + alt_m) * cos_lat * sin_lon
    z = (n * (1.0 - WGS84_E2) + alt_m) * sin_lat

    return x, y, z


def ecef_to_enu(
    x: Union[float, np.ndarray],
    y: Union[float, np.ndarray],
    z: Union[float, np.ndarray],
    anchor: GeodeticAnchor,
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray], Union[float, np.ndarray]]:
    """Convert ECEF Cartesian coordinates to local East-North-Up (ENU) coordinates.

    Args:
        x, y, z: ECEF Cartesian coordinates in meters.
        anchor: Reference GeodeticAnchor defining the local tangent origin.

    Returns:
        Tuple of (East, North, Up) coordinates in meters.
    """
    dx = x - anchor.x0_ecef
    dy = y - anchor.y0_ecef
    dz = z - anchor.z0_ecef

    lat0_rad = np.radians(anchor.lat0_deg)
    lon0_rad = np.radians(anchor.lon0_deg)

    sin_lat = np.sin(lat0_rad)
    cos_lat = np.cos(lat0_rad)
    sin_lon = np.sin(lon0_rad)
    cos_lon = np.cos(lon0_rad)

    # Standard WGS84 ENU rotation matrix
    east = -sin_lon * dx + cos_lon * dy
    north = -sin_lat * cos_lon * dx - sin_lat * sin_lon * dy + cos_lat * dz
    up = cos_lat * cos_lon * dx + cos_lat * sin_lon * dy + sin_lat * dz

    return east, north, up


def geodetic_to_enu(
    lat_deg: Union[float, np.ndarray],
    lon_deg: Union[float, np.ndarray],
    alt_m: Union[float, np.ndarray],
    anchor: GeodeticAnchor,
) -> Tuple[Union[float, np.ndarray], Union[float, np.ndarray], Union[float, np.ndarray]]:
    """Direct conversion from Geodetic WGS84 to local ENU tangent frame.

    Args:
        lat_deg, lon_deg, alt_m: Geodetic positions in degrees and meters.
        anchor: GeodeticAnchor reference origin.

    Returns:
        Tuple of (East, North, Up) coordinates in meters.
    """
    x, y, z = geodetic_to_ecef(lat_deg, lon_deg, alt_m)
    return ecef_to_enu(x, y, z, anchor)


def add_enu_coordinates_to_df(
    df: pd.DataFrame,
    lat_col: str = "latitude",
    lon_col: str = "longitude",
    alt_col: str = "altitude",
    anchor: Optional[GeodeticAnchor] = None,
    prefix: str = "pos_",
) -> Tuple[pd.DataFrame, GeodeticAnchor]:
    """Calculate and append local ENU coordinate columns to a DataFrame.

    If anchor is not provided, the first valid (non-NaN) geodetic fix is used as origin.

    Args:
        df: Input DataFrame containing latitude and longitude columns.
        lat_col: Name of latitude column.
        lon_col: Name of longitude column.
        alt_col: Name of altitude column.
        anchor: Optional predefined GeodeticAnchor.
        prefix: Prefix for output columns (e.g., 'pos_east_m').

    Returns:
        Tuple of (Updated DataFrame with ENU columns, GeodeticAnchor used).
    """
    df = df.copy()
    if lat_col not in df.columns or lon_col not in df.columns:
        raise ValueError(
            f"Required geodetic columns '{lat_col}' and '{lon_col}' not found in DataFrame."
        )

    valid_mask = df[lat_col].notna() & df[lon_col].notna()
    if not valid_mask.any():
        raise ValueError("DataFrame contains no valid geodetic coordinates to anchor ENU origin.")

    if alt_col not in df.columns:
        altitudes = np.zeros(len(df), dtype=float)
    else:
        altitudes = df[alt_col].fillna(0.0).values

    if anchor is None:
        first_valid_idx = df[valid_mask].index[0]
        anchor = GeodeticAnchor.from_lat_lon_alt(
            lat0_deg=float(df.loc[first_valid_idx, lat_col]),
            lon0_deg=float(df.loc[first_valid_idx, lon_col]),
            alt0_m=float(altitudes[first_valid_idx]),
        )

    e, n, u = geodetic_to_enu(
        lat_deg=df[lat_col].values,
        lon_deg=df[lon_col].values,
        alt_m=altitudes,
        anchor=anchor,
    )

    df[f"{prefix}east_m"] = e
    df[f"{prefix}north_m"] = n
    df[f"{prefix}up_m"] = u

    return df, anchor
