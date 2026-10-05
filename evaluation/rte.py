"""Relative Trajectory Error (RTE) Module.

Measures relative pose drift and odometry accuracy over fixed distance or
temporal intervals delta_t.

Inputs: Estimated trajectory positions, reference ground truth, interval length delta_t.
Outputs: Relative translation and orientation error distributions.
"""
