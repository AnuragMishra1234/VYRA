"""Coordinate Utilities Module.

Provides geodetic transformations between WGS84 (Latitude, Longitude, Altitude),
Earth-Centered Earth-Fixed (ECEF), and local East-North-Up (ENU) tangent frames.

Inputs: Geodetic coordinates (lat, lon, alt) and reference origin anchor.
Outputs: Local tangent Cartesian coordinates (East, North, Up) in meters.
"""
