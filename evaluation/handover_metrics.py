"""Handover Metrics Module.

Quantifies navigation policy switching performance:
- Total handover count
- False handovers (switches away when GNSS error was tolerable)
- Missed handovers (remaining in GNSS when error exceeded threshold)
- Warning lead time (s)
- Mode chatter frequency (rapid oscillations within dwell-time window)

Inputs: Sequence of policy mode decisions, true GNSS error sequence, timestamps.
Outputs: Dictionary of handover stability and timeliness metrics.
"""
