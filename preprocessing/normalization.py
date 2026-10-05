"""Feature Normalization Module.

Applies feature scaling and normalization fitted strictly on training trajectories
to prevent data leakage into validation or unseen test splits.

Inputs: Unscaled synchronized feature matrices, split definitions.
Outputs: Standardized feature matrices and serializable scaler parameters.
"""
