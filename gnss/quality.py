"""GNSS Quality Module.

Constructs interpretable GNSS quality representation from observable receiver signals
including satellite counts, dilution of precision (HDOP, VDOP, PDOP), reported
accuracies, carrier-to-noise density (C/N0), and position jump residuals.

Inputs: Raw GNSS measurement stream up to timestamp t.
Outputs: Normalized quality vector q_t and quality indicators.
"""
