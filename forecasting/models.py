"""Forecasting Models Module.

Defines the predictive models estimating future localization error or bound
violation risk conditioned on candidate actions and current navigation state.

Models include: Linear Ridge/Lasso, Random Forest Regressor, Gradient Boosted Trees (XGBoost).
Inputs: Action-conditioned feature vectors (s_t, A).
Outputs: Predicted future error scalar and violation probability for each action A.
"""
