"""Navigation Uncertainty Module.

Manages error covariance matrices, computes position uncertainty radii (e.g., 95%
confidence ellipses, horizontal uncertainty radius), and tracks drift variance.

Inputs: State covariance matrix P_k.
Outputs: Scalar uncertainty radius r_k, eigenvalues, standard deviations.
"""
