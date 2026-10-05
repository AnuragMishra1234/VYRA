"""Data Cleaning Module.

Handles missing sensor values, invalid GNSS fix statuses, timestamp discontinuities,
and corrupt sensor records.

Inputs: Unaligned raw sensor streams.
Outputs: Filtered and validated sensor streams with continuity flags.
"""
