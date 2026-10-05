"""Statistical Tests Module.

Performs statistical hypothesis testing (e.g., Wilcoxon signed-rank test, paired
t-test, bootstrapping) across trajectory runs to establish whether performance
differences between VYRA and baselines are statistically significant.

Inputs: Paired metric vectors across multiple trajectories (e.g., ATE_vyra vs. ATE_reactive).
Outputs: Test statistic, p-value, 95% confidence intervals, hypothesis rejection decision.
"""
