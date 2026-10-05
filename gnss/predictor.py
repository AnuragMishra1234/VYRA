"""GNSS Degradation Predictor Module.

Interface and model wrappers for predicting the probability of imminent GNSS
signal degradation over horizons H in {1s, 3s, 5s, 10s}.

Models evaluated: Persistence baseline, Logistic Regression, Random Forest, XGBoost.
Inputs: Historical GNSS quality features at time t.
Outputs: Estimated degradation probability P(Degradation in H | history_t).
"""
