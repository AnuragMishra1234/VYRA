"""Navigation State Estimation Module.

Encapsulates the multimodal navigation state representation (position, velocity,
attitude, sensor biases) across candidate modes and handles mode execution.

Inputs: Active mode selection, sensor inputs at time step k.
Outputs: Current operational trajectory pose estimate and confidence interval.
"""
