"""Fixed Hybrid Baseline Policy Module.

Maintains continuous GNSS/IMU sensor fusion (e.g., standard EKF) without
adaptive outlier rejection or predictive mode switching.

Inputs: Current multimodal state.
Outputs: Fixed HYBRID mode selection.
"""
