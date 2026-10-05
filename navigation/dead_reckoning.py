"""Dead Reckoning (DR) Module.

Implements strapdown inertial navigation mechanization to propagate position,
velocity, and attitude estimates solely from inertial sensor measurements.

Inputs: Compensated specific force, angular rates, prior pose, and time delta dt.
Outputs: Propagated DR position, velocity, attitude state vector x_{DR, k}.
"""
