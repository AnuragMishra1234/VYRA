"""Action Conditioning Module.

Formalizes the candidate navigation action set:
- A_1: GNSS (raw satellite positioning)
- A_2: HYBRID (inertial/GNSS EKF fusion)
- A_3: DR (pure inertial dead reckoning)

Provides action encoding, feature concatenation, and counterfactual sample
assembly to support the question:
"What would likely happen if GNSS, HYBRID, or DR were selected now?"

Inputs: State feature vector s_t, candidate action identifier A.
Outputs: Action-conditioned feature representation (s_t, A).
"""
