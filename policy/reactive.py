"""Reactive Baseline Policy Module.

Implements conventional reactive threshold-based switching:
- GNSS quality acceptable -> Use GNSS.
- GNSS quality breached (or fix lost) -> Switch to DR.
- GNSS quality restored -> Revert to GNSS.

Inputs: Current GNSS quality metrics at time t.
Outputs: Selected mode in {GNSS, DR} based on instantaneous threshold crossing.
"""
