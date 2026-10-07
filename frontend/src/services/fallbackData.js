/**
 * Fallback dataset for VYRA Research Dashboard.
 * Ensures the dashboard is 100% functional, responsive, and interactive
 * even if the backend / API server is unreachable.
 */

export const FALLBACK_MASTER_RESULTS = {
  "metadata": {
    "execution_date_utc": "2026-10-06T10:18:47.302836+00:00",
    "test_split": [
      "V-S3a"
    ],
    "total_epochs": 24621,
    "total_duration_seconds": 2462.0,
    "outage_epochs": 2680,
    "outage_durations_evaluated": [
      2.0,
      5.0,
      10.0,
      20.0,
      30.0
    ]
  },
  "table1_navigation_comparison": [
    {
      "Policy": "GNSS-Only",
      "ATE (m)": 17.1361,
      "RTE (m)": 21.8378,
      "RMSE (m)": 67.3548,
      "Max Error (m)": 520.6113,
      "Final Error (m)": 0.0,
      "Time > 5m (s)": 278.8,
      "Violations > 5m (%)": 11.32,
      "Handovers": 0,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0,
      "Mean Dwell (s)": 2462.0
    },
    {
      "Policy": "Pure DR",
      "ATE (m)": 720.2023,
      "RTE (m)": 28.3467,
      "RMSE (m)": 864.2519,
      "Max Error (m)": 1610.9932,
      "Final Error (m)": 478.4513,
      "Time > 5m (s)": 2422.5,
      "Violations > 5m (%)": 98.39,
      "Handovers": 0,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0,
      "Mean Dwell (s)": 2462.0
    },
    {
      "Policy": "Fixed HYBRID",
      "ATE (m)": 0.426,
      "RTE (m)": 0.6028,
      "RMSE (m)": 1.4527,
      "Max Error (m)": 12.957,
      "Final Error (m)": 0.0476,
      "Time > 5m (s)": 57.8,
      "Violations > 5m (%)": 2.35,
      "Handovers": 0,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0,
      "Mean Dwell (s)": 2462.0
    },
    {
      "Policy": "Reactive Switching",
      "ATE (m)": 0.7123,
      "RTE (m)": 0.9235,
      "RMSE (m)": 2.4968,
      "Max Error (m)": 21.2593,
      "Final Error (m)": 0.0476,
      "Time > 5m (s)": 118.3,
      "Violations > 5m (%)": 4.8,
      "Handovers": 42,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0,
      "Mean Dwell (s)": 57.16
    },
    {
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 0.3986,
      "RTE (m)": 0.5939,
      "RMSE (m)": 1.3957,
      "Max Error (m)": 12.7446,
      "Final Error (m)": 0.0,
      "Time > 5m (s)": 57.4,
      "Violations > 5m (%)": 2.33,
      "Handovers": 67,
      "Chattering Rate (%)": 40.3,
      "Unnecessary Handovers": 16,
      "Mean Dwell (s)": 36.12
    }
  ],
  "table2_outage_duration_sweep": [
    {
      "Outage Duration (s)": 2.0,
      "Policy": "GNSS-Only",
      "Outage ATE (m)": 4.724,
      "Outage RMSE (m)": 7.771,
      "Peak Error (m)": 36.086,
      "Violation Rate (%)": 26.92
    },
    {
      "Outage Duration (s)": 2.0,
      "Policy": "Pure DR",
      "Outage ATE (m)": 346.189,
      "Outage RMSE (m)": 487.971,
      "Peak Error (m)": 898.298,
      "Violation Rate (%)": 75.0
    },
    {
      "Outage Duration (s)": 2.0,
      "Policy": "Fixed HYBRID",
      "Outage ATE (m)": 0.364,
      "Outage RMSE (m)": 0.47,
      "Peak Error (m)": 1.148,
      "Violation Rate (%)": 0.0
    },
    {
      "Outage Duration (s)": 2.0,
      "Policy": "Reactive Switching",
      "Outage ATE (m)": 0.632,
      "Outage RMSE (m)": 0.892,
      "Peak Error (m)": 2.633,
      "Violation Rate (%)": 0.0
    },
    {
      "Outage Duration (s)": 2.0,
      "Policy": "VYRA Adaptive (Proposed)",
      "Outage ATE (m)": 1.767,
      "Outage RMSE (m)": 2.517,
      "Peak Error (m)": 9.573,
      "Violation Rate (%)": 6.59
    },
    {
      "Outage Duration (s)": 5.0,
      "Policy": "GNSS-Only",
      "Outage ATE (m)": 11.075,
      "Outage RMSE (m)": 18.715,
      "Peak Error (m)": 71.975,
      "Violation Rate (%)": 45.45
    },
    {
      "Outage Duration (s)": 5.0,
      "Policy": "Pure DR",
      "Outage ATE (m)": 392.008,
      "Outage RMSE (m)": 535.148,
      "Peak Error (m)": 1002.472,
      "Violation Rate (%)": 100.0
    },
    {
      "Outage Duration (s)": 5.0,
      "Policy": "Fixed HYBRID",
      "Outage ATE (m)": 0.422,
      "Outage RMSE (m)": 0.48,
      "Peak Error (m)": 1.315,
      "Violation Rate (%)": 0.0
    },
    {
      "Outage Duration (s)": 5.0,
      "Policy": "Reactive Switching",
      "Outage ATE (m)": 0.575,
      "Outage RMSE (m)": 0.763,
      "Peak Error (m)": 2.237,
      "Violation Rate (%)": 0.0
    },
    {
      "Outage Duration (s)": 5.0,
      "Policy": "VYRA Adaptive (Proposed)",
      "Outage ATE (m)": 1.203,
      "Outage RMSE (m)": 1.781,
      "Peak Error (m)": 8.971,
      "Violation Rate (%)": 2.48
    },
    {
      "Outage Duration (s)": 10.0,
      "Policy": "GNSS-Only",
      "Outage ATE (m)": 35.636,
      "Outage RMSE (m)": 65.477,
      "Peak Error (m)": 253.79,
      "Violation Rate (%)": 62.13
    },
    {
      "Outage Duration (s)": 10.0,
      "Policy": "Pure DR",
      "Outage ATE (m)": 432.106,
      "Outage RMSE (m)": 535.079,
      "Peak Error (m)": 987.21,
      "Violation Rate (%)": 100.0
    },
    {
      "Outage Duration (s)": 10.0,
      "Policy": "Fixed HYBRID",
      "Outage ATE (m)": 0.861,
      "Outage RMSE (m)": 1.249,
      "Peak Error (m)": 3.943,
      "Violation Rate (%)": 0.0
    },
    {
      "Outage Duration (s)": 10.0,
      "Policy": "Reactive Switching",
      "Outage ATE (m)": 1.407,
      "Outage RMSE (m)": 2.174,
      "Peak Error (m)": 7.705,
      "Violation Rate (%)": 6.29
    },
    {
      "Outage Duration (s)": 10.0,
      "Policy": "VYRA Adaptive (Proposed)",
      "Outage ATE (m)": 1.667,
      "Outage RMSE (m)": 2.384,
      "Peak Error (m)": 8.28,
      "Violation Rate (%)": 6.87
    },
    {
      "Outage Duration (s)": 20.0,
      "Policy": "GNSS-Only",
      "Outage ATE (m)": 104.119,
      "Outage RMSE (m)": 144.663,
      "Peak Error (m)": 381.015,
      "Violation Rate (%)": 76.01
    },
    {
      "Outage Duration (s)": 20.0,
      "Policy": "Pure DR",
      "Outage ATE (m)": 473.994,
      "Outage RMSE (m)": 520.148,
      "Peak Error (m)": 836.817,
      "Violation Rate (%)": 100.0
    },
    {
      "Outage Duration (s)": 20.0,
      "Policy": "Fixed HYBRID",
      "Outage ATE (m)": 1.481,
      "Outage RMSE (m)": 2.105,
      "Peak Error (m)": 6.892,
      "Violation Rate (%)": 3.78
    },
    {
      "Outage Duration (s)": 20.0,
      "Policy": "Reactive Switching",
      "Outage ATE (m)": 2.553,
      "Outage RMSE (m)": 4.064,
      "Peak Error (m)": 13.964,
      "Violation Rate (%)": 17.44
    },
    {
      "Outage Duration (s)": 20.0,
      "Policy": "VYRA Adaptive (Proposed)",
      "Outage ATE (m)": 1.981,
      "Outage RMSE (m)": 2.579,
      "Peak Error (m)": 9.698,
      "Violation Rate (%)": 6.46
    },
    {
      "Outage Duration (s)": 30.0,
      "Policy": "GNSS-Only",
      "Outage ATE (m)": 187.053,
      "Outage RMSE (m)": 240.574,
      "Peak Error (m)": 520.611,
      "Violation Rate (%)": 82.28
    },
    {
      "Outage Duration (s)": 30.0,
      "Policy": "Pure DR",
      "Outage ATE (m)": 536.924,
      "Outage RMSE (m)": 586.826,
      "Peak Error (m)": 812.626,
      "Violation Rate (%)": 100.0
    },
    {
      "Outage Duration (s)": 30.0,
      "Policy": "Fixed HYBRID",
      "Outage ATE (m)": 3.231,
      "Outage RMSE (m)": 4.546,
      "Peak Error (m)": 12.745,
      "Violation Rate (%)": 26.62
    },
    {
      "Outage Duration (s)": 30.0,
      "Policy": "Reactive Switching",
      "Outage ATE (m)": 6.829,
      "Outage RMSE (m)": 8.862,
      "Peak Error (m)": 21.259,
      "Violation Rate (%)": 54.51
    },
    {
      "Outage Duration (s)": 30.0,
      "Policy": "VYRA Adaptive (Proposed)",
      "Outage ATE (m)": 3.573,
      "Outage RMSE (m)": 4.717,
      "Peak Error (m)": 12.745,
      "Violation Rate (%)": 28.37
    }
  ],
  "table3_forecast_horizons": [
    {
      "Forecast Horizon (s)": 1.0,
      "Horizon Steps (10Hz)": 10,
      "RMSE (m)": 0.52,
      "MAE (m)": 0.38,
      "Bias (m)": 0.04,
      "Spearman Rho": 0.91,
      "P95 Error (m)": 0.962
    },
    {
      "Forecast Horizon (s)": 3.0,
      "Horizon Steps (10Hz)": 30,
      "RMSE (m)": 0.88,
      "MAE (m)": 0.62,
      "Bias (m)": 0.08,
      "Spearman Rho": 0.86,
      "P95 Error (m)": 1.628
    },
    {
      "Forecast Horizon (s)": 5.0,
      "Horizon Steps (10Hz)": 50,
      "RMSE (m)": 1.24,
      "MAE (m)": 0.86,
      "Bias (m)": 0.12,
      "Spearman Rho": 0.81,
      "P95 Error (m)": 2.294
    },
    {
      "Forecast Horizon (s)": 10.0,
      "Horizon Steps (10Hz)": 100,
      "RMSE (m)": 2.14,
      "MAE (m)": 1.46,
      "Bias (m)": 0.22,
      "Spearman Rho": 0.685,
      "P95 Error (m)": 3.959
    }
  ],
  "table4_action_ranking": [
    {
      "Forecasting Model": "Persistence",
      "Top-1 Action Match (%)": 1.32,
      "Pairwise Accuracy (%)": 0.0,
      "Mean Regret (m)": 1.268,
      "Excess Error vs Oracle (m)": 1.268
    },
    {
      "Forecasting Model": "Ridge",
      "Top-1 Action Match (%)": 76.82,
      "Pairwise Accuracy (%)": 87.66,
      "Mean Regret (m)": 0.351,
      "Excess Error vs Oracle (m)": 0.351
    },
    {
      "Forecasting Model": "Random Forest",
      "Top-1 Action Match (%)": 98.17,
      "Pairwise Accuracy (%)": 96.84,
      "Mean Regret (m)": 0.022,
      "Excess Error vs Oracle (m)": 0.022
    },
    {
      "Forecasting Model": "Xgboost",
      "Top-1 Action Match (%)": 95.43,
      "Pairwise Accuracy (%)": 95.74,
      "Mean Regret (m)": 0.056,
      "Excess Error vs Oracle (m)": 0.056
    }
  ],
  "table5_ablation_study": [
    {
      "Ablation Configuration": "Ablation A: Full VYRA",
      "ATE (m)": 0.3986,
      "RMSE (m)": 1.3957,
      "Max Error (m)": 12.7446,
      "Violations > 5m (%)": 2.33,
      "Handovers": 67,
      "Chattering Rate (%)": 40.3,
      "Unnecessary Handovers": 16
    },
    {
      "Ablation Configuration": "Ablation B: No GNSS Degradation Prediction",
      "ATE (m)": 0.407,
      "RMSE (m)": 1.411,
      "Max Error (m)": 13.5247,
      "Violations > 5m (%)": 2.36,
      "Handovers": 44,
      "Chattering Rate (%)": 4.55,
      "Unnecessary Handovers": 0
    },
    {
      "Ablation Configuration": "Ablation C: No DR Uncertainty",
      "ATE (m)": 0.3984,
      "RMSE (m)": 1.3954,
      "Max Error (m)": 12.7446,
      "Violations > 5m (%)": 2.33,
      "Handovers": 108,
      "Chattering Rate (%)": 62.04,
      "Unnecessary Handovers": 53
    },
    {
      "Ablation Configuration": "Ablation D: No DR Survivability",
      "ATE (m)": 0.3954,
      "RMSE (m)": 1.3902,
      "Max Error (m)": 12.7446,
      "Violations > 5m (%)": 2.32,
      "Handovers": 242,
      "Chattering Rate (%)": 82.23,
      "Unnecessary Handovers": 178
    },
    {
      "Ablation Configuration": "Ablation E: No Action Conditioning",
      "ATE (m)": 0.426,
      "RMSE (m)": 1.4527,
      "Max Error (m)": 12.957,
      "Violations > 5m (%)": 2.35,
      "Handovers": 0,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0
    },
    {
      "Ablation Configuration": "Ablation F: No Forecast Engine (Reactive Only)",
      "ATE (m)": 0.7123,
      "RMSE (m)": 2.4968,
      "Max Error (m)": 21.2593,
      "Violations > 5m (%)": 4.8,
      "Handovers": 42,
      "Chattering Rate (%)": 0.0,
      "Unnecessary Handovers": 0
    },
    {
      "Ablation Configuration": "Ablation G: No Switching Penalty / Hysteresis",
      "ATE (m)": 0.3945,
      "RMSE (m)": 1.3818,
      "Max Error (m)": 13.5247,
      "Violations > 5m (%)": 2.21,
      "Handovers": 118,
      "Chattering Rate (%)": 66.95,
      "Unnecessary Handovers": 66
    }
  ],
  "table6_robustness_study": [
    {
      "Stress Condition": "Sensor Noise: Nominal (Clean)",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 0.6975,
      "RMSE (m)": 2.3848,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 4.45,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Noise: Nominal (Clean)",
      "Policy": "Reactive Switching",
      "ATE (m)": 0.6976,
      "RMSE (m)": 2.3848,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 4.45,
      "Handovers": 42
    },
    {
      "Stress Condition": "Sensor Noise: Nominal (Clean)",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 0.5693,
      "RMSE (m)": 2.2514,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 3.87,
      "Handovers": 79
    },
    {
      "Stress Condition": "Sensor Noise: Moderate Noise",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 1.0199,
      "RMSE (m)": 2.3888,
      "Max Error (m)": 20.5455,
      "Violations > 5m (%)": 4.25,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Noise: Moderate Noise",
      "Policy": "Reactive Switching",
      "ATE (m)": 1.0201,
      "RMSE (m)": 2.3888,
      "Max Error (m)": 20.5455,
      "Violations > 5m (%)": 4.25,
      "Handovers": 42
    },
    {
      "Stress Condition": "Sensor Noise: Moderate Noise",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 2.6817,
      "RMSE (m)": 3.4326,
      "Max Error (m)": 20.5455,
      "Violations > 5m (%)": 7.69,
      "Handovers": 79
    },
    {
      "Stress Condition": "Sensor Noise: Severe Noise",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 2.2771,
      "RMSE (m)": 3.3499,
      "Max Error (m)": 22.7152,
      "Violations > 5m (%)": 7.47,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Noise: Severe Noise",
      "Policy": "Reactive Switching",
      "ATE (m)": 2.2768,
      "RMSE (m)": 3.3499,
      "Max Error (m)": 22.7152,
      "Violations > 5m (%)": 7.47,
      "Handovers": 42
    },
    {
      "Stress Condition": "Sensor Noise: Severe Noise",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 6.0033,
      "RMSE (m)": 6.9921,
      "Max Error (m)": 22.9479,
      "Violations > 5m (%)": 55.62,
      "Handovers": 81
    },
    {
      "Stress Condition": "Sensor Dropout: 0% Dropout",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 0.6975,
      "RMSE (m)": 2.3848,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 4.45,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Dropout: 0% Dropout",
      "Policy": "Reactive Switching",
      "ATE (m)": 0.6976,
      "RMSE (m)": 2.3848,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 4.45,
      "Handovers": 42
    },
    {
      "Stress Condition": "Sensor Dropout: 0% Dropout",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 0.5693,
      "RMSE (m)": 2.2514,
      "Max Error (m)": 20.0746,
      "Violations > 5m (%)": 3.87,
      "Handovers": 79
    },
    {
      "Stress Condition": "Sensor Dropout: 5% Burst Dropout",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 0.6721,
      "RMSE (m)": 2.3287,
      "Max Error (m)": 20.0608,
      "Violations > 5m (%)": 3.76,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Dropout: 5% Burst Dropout",
      "Policy": "Reactive Switching",
      "ATE (m)": 0.7525,
      "RMSE (m)": 2.5616,
      "Max Error (m)": 23.1439,
      "Violations > 5m (%)": 3.98,
      "Handovers": 354
    },
    {
      "Stress Condition": "Sensor Dropout: 5% Burst Dropout",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 0.562,
      "RMSE (m)": 2.2094,
      "Max Error (m)": 20.053,
      "Violations > 5m (%)": 3.24,
      "Handovers": 408
    },
    {
      "Stress Condition": "Sensor Dropout: 10% Burst Dropout",
      "Policy": "Fixed HYBRID",
      "ATE (m)": 0.6719,
      "RMSE (m)": 2.3216,
      "Max Error (m)": 20.0601,
      "Violations > 5m (%)": 3.73,
      "Handovers": 0
    },
    {
      "Stress Condition": "Sensor Dropout: 10% Burst Dropout",
      "Policy": "Reactive Switching",
      "ATE (m)": 0.783,
      "RMSE (m)": 2.5971,
      "Max Error (m)": 23.25,
      "Violations > 5m (%)": 4.0,
      "Handovers": 526
    },
    {
      "Stress Condition": "Sensor Dropout: 10% Burst Dropout",
      "Policy": "VYRA Adaptive (Proposed)",
      "ATE (m)": 0.5641,
      "RMSE (m)": 2.1956,
      "Max Error (m)": 20.0297,
      "Violations > 5m (%)": 3.2,
      "Handovers": 572
    }
  ],
  "table7_statistical_significance": [
    {
      "Baseline Comparison": "VYRA vs GNSS-Only",
      "Sample Size N": 20,
      "Mean Baseline ATE (m)": 68.5217,
      "Mean VYRA ATE (m)": 2.0382,
      "Mean Difference (m)": 66.4835,
      "95% CI (m)": "[36.754, 99.544]",
      "Wilcoxon W": 0.0,
      "p-value (Wilcoxon)": "2.0000e-06",
      "Cohen's d_z": 0.9055,
      "Hedges' g": 0.8692,
      "Relative Improvement (%)": 97.03,
      "Significant (p < 0.05)": "Yes"
    },
    {
      "Baseline Comparison": "VYRA vs Pure DR",
      "Sample Size N": 20,
      "Mean Baseline ATE (m)": 436.2443,
      "Mean VYRA ATE (m)": 2.0382,
      "Mean Difference (m)": 434.2061,
      "95% CI (m)": "[306.301, 570.145]",
      "Wilcoxon W": 0.0,
      "p-value (Wilcoxon)": "2.0000e-06",
      "Cohen's d_z": 1.3774,
      "Hedges' g": 1.3223,
      "Relative Improvement (%)": 99.53,
      "Significant (p < 0.05)": "Yes"
    },
    {
      "Baseline Comparison": "VYRA vs Fixed HYBRID",
      "Sample Size N": 20,
      "Mean Baseline ATE (m)": 1.2716,
      "Mean VYRA ATE (m)": 2.0382,
      "Mean Difference (m)": -0.7666,
      "95% CI (m)": "[-0.977, -0.578]",
      "Wilcoxon W": 0.0,
      "p-value (Wilcoxon)": "2.0000e-06",
      "Cohen's d_z": -1.6277,
      "Hedges' g": -1.5626,
      "Relative Improvement (%)": -60.28,
      "Significant (p < 0.05)": "Yes"
    },
    {
      "Baseline Comparison": "VYRA vs Reactive Switching",
      "Sample Size N": 20,
      "Mean Baseline ATE (m)": 2.3992,
      "Mean VYRA ATE (m)": 2.0382,
      "Mean Difference (m)": 0.361,
      "95% CI (m)": "[-0.458, 1.423]",
      "Wilcoxon W": 92.0,
      "p-value (Wilcoxon)": "6.4765e-01",
      "Cohen's d_z": 0.165,
      "Hedges' g": 0.1584,
      "Relative Improvement (%)": 15.05,
      "Significant (p < 0.05)": "No"
    }
  ],
  "table8_failure_cases": [
    {
      "Failure Case ID": "FAIL-01",
      "Timestamp (s)": 66148.1,
      "Scenario Phase": "quality_decline",
      "Selected Mode": "GNSS",
      "VYRA Error (m)": 1.782,
      "Hybrid Error (m)": 0.229,
      "Forecasted DR Error (m)": 18.29,
      "Forecasted HYBRID Error (m)": 18.89,
      "Root Cause Analysis": "Rapid cornering maneuver during signal quality decline causing DR extrapolation divergence."
    },
    {
      "Failure Case ID": "FAIL-02",
      "Timestamp (s)": 66148.3,
      "Scenario Phase": "quality_decline",
      "Selected Mode": "GNSS",
      "VYRA Error (m)": 2.158,
      "Hybrid Error (m)": 0.229,
      "Forecasted DR Error (m)": 18.54,
      "Forecasted HYBRID Error (m)": 18.81,
      "Root Cause Analysis": "Rapid cornering maneuver during signal quality decline causing DR extrapolation divergence."
    },
    {
      "Failure Case ID": "FAIL-03",
      "Timestamp (s)": 66148.6,
      "Scenario Phase": "quality_decline",
      "Selected Mode": "GNSS",
      "VYRA Error (m)": 2.8,
      "Hybrid Error (m)": 0.184,
      "Forecasted DR Error (m)": 29.91,
      "Forecasted HYBRID Error (m)": 23.08,
      "Root Cause Analysis": "Rapid cornering maneuver during signal quality decline causing DR extrapolation divergence."
    },
    {
      "Failure Case ID": "FAIL-04",
      "Timestamp (s)": 66148.9,
      "Scenario Phase": "quality_decline",
      "Selected Mode": "GNSS",
      "VYRA Error (m)": 2.818,
      "Hybrid Error (m)": 0.402,
      "Forecasted DR Error (m)": 34.61,
      "Forecasted HYBRID Error (m)": 22.83,
      "Root Cause Analysis": "Rapid cornering maneuver during signal quality decline causing DR extrapolation divergence."
    },
    {
      "Failure Case ID": "FAIL-05",
      "Timestamp (s)": 66149.3,
      "Scenario Phase": "quality_decline",
      "Selected Mode": "GNSS",
      "VYRA Error (m)": 2.4,
      "Hybrid Error (m)": 0.407,
      "Forecasted DR Error (m)": 30.07,
      "Forecasted HYBRID Error (m)": 24.65,
      "Root Cause Analysis": "Rapid cornering maneuver during signal quality decline causing DR extrapolation divergence."
    }
  ]
};

export const FALLBACK_PATHS = {
  trajectory_id: 'V-S3a',
  stride: 250,
  sample_count: 99,
  paths: {
  "offline_reference_gt": [
    [
      52.404883,
      -1.500289
    ],
    [
      52.405881,
      -1.49675
    ],
    [
      52.406436,
      -1.493917
    ],
    [
      52.407419,
      -1.491442
    ],
    [
      52.407322,
      -1.489134
    ],
    [
      52.406546,
      -1.486269
    ],
    [
      52.406254,
      -1.481777
    ],
    [
      52.406221,
      -1.477345
    ],
    [
      52.407129,
      -1.473065
    ],
    [
      52.407287,
      -1.47205
    ],
    [
      52.406197,
      -1.466903
    ],
    [
      52.404994,
      -1.461543
    ],
    [
      52.404816,
      -1.460804
    ],
    [
      52.404778,
      -1.460699
    ],
    [
      52.403248,
      -1.456682
    ],
    [
      52.402841,
      -1.451591
    ],
    [
      52.402608,
      -1.447664
    ],
    [
      52.402348,
      -1.446349
    ],
    [
      52.400401,
      -1.443576
    ],
    [
      52.398671,
      -1.440842
    ],
    [
      52.397651,
      -1.437952
    ],
    [
      52.396288,
      -1.434257
    ],
    [
      52.396131,
      -1.432402
    ],
    [
      52.396242,
      -1.431453
    ],
    [
      52.395617,
      -1.430193
    ],
    [
      52.394942,
      -1.425083
    ],
    [
      52.394364,
      -1.420014
    ],
    [
      52.393558,
      -1.415103
    ],
    [
      52.392572,
      -1.409955
    ],
    [
      52.390894,
      -1.405035
    ],
    [
      52.387575,
      -1.40169
    ],
    [
      52.384757,
      -1.39896
    ],
    [
      52.385946,
      -1.395255
    ],
    [
      52.385135,
      -1.390248
    ],
    [
      52.387481,
      -1.38355
    ],
    [
      52.389234,
      -1.375991
    ],
    [
      52.391034,
      -1.370265
    ],
    [
      52.389147,
      -1.370085
    ],
    [
      52.386757,
      -1.368712
    ],
    [
      52.384766,
      -1.360612
    ],
    [
      52.383307,
      -1.351657
    ],
    [
      52.381873,
      -1.343472
    ],
    [
      52.380312,
      -1.33788
    ],
    [
      52.37866,
      -1.331479
    ],
    [
      52.378098,
      -1.323231
    ],
    [
      52.377334,
      -1.316478
    ],
    [
      52.376485,
      -1.310233
    ],
    [
      52.375896,
      -1.304068
    ],
    [
      52.375562,
      -1.29802
    ],
    [
      52.375897,
      -1.291543
    ],
    [
      52.375689,
      -1.286252
    ],
    [
      52.375307,
      -1.281802
    ],
    [
      52.374137,
      -1.278183
    ],
    [
      52.373335,
      -1.276482
    ],
    [
      52.373335,
      -1.276483
    ],
    [
      52.373328,
      -1.27648
    ],
    [
      52.372477,
      -1.274061
    ],
    [
      52.372022,
      -1.270946
    ],
    [
      52.371823,
      -1.269501
    ],
    [
      52.371172,
      -1.266688
    ],
    [
      52.371168,
      -1.266689
    ],
    [
      52.370764,
      -1.264831
    ],
    [
      52.37052,
      -1.261832
    ],
    [
      52.370022,
      -1.257353
    ],
    [
      52.36952,
      -1.253918
    ],
    [
      52.368558,
      -1.249816
    ],
    [
      52.367347,
      -1.246566
    ],
    [
      52.365838,
      -1.243284
    ],
    [
      52.3643,
      -1.240543
    ],
    [
      52.36281,
      -1.236916
    ],
    [
      52.364012,
      -1.234824
    ],
    [
      52.3655,
      -1.234881
    ],
    [
      52.365463,
      -1.236747
    ],
    [
      52.366104,
      -1.237071
    ],
    [
      52.366156,
      -1.233305
    ],
    [
      52.364646,
      -1.231223
    ],
    [
      52.364307,
      -1.22924
    ],
    [
      52.363231,
      -1.22892
    ],
    [
      52.364294,
      -1.229204
    ],
    [
      52.364645,
      -1.231223
    ],
    [
      52.366096,
      -1.23307
    ],
    [
      52.366119,
      -1.23694
    ],
    [
      52.366605,
      -1.240142
    ],
    [
      52.367717,
      -1.242112
    ],
    [
      52.368775,
      -1.240252
    ],
    [
      52.368648,
      -1.24044
    ],
    [
      52.369529,
      -1.241199
    ],
    [
      52.370129,
      -1.242278
    ],
    [
      52.370926,
      -1.24059
    ],
    [
      52.372183,
      -1.240217
    ],
    [
      52.372622,
      -1.242798
    ],
    [
      52.371656,
      -1.241497
    ],
    [
      52.371741,
      -1.241293
    ],
    [
      52.371603,
      -1.242088
    ],
    [
      52.372923,
      -1.243154
    ],
    [
      52.372715,
      -1.245849
    ],
    [
      52.372263,
      -1.250497
    ],
    [
      52.371464,
      -1.254077
    ],
    [
      52.37172,
      -1.254114
    ]
  ],
  "vyra": [
    [
      52.404883,
      -1.500289
    ],
    [
      52.405881,
      -1.49675
    ],
    [
      52.406436,
      -1.493917
    ],
    [
      52.407419,
      -1.491442
    ],
    [
      52.407309,
      -1.489105
    ],
    [
      52.406546,
      -1.486269
    ],
    [
      52.406254,
      -1.481777
    ],
    [
      52.406221,
      -1.477342
    ],
    [
      52.407129,
      -1.473065
    ],
    [
      52.407287,
      -1.47205
    ],
    [
      52.406213,
      -1.46688
    ],
    [
      52.404994,
      -1.461543
    ],
    [
      52.404816,
      -1.460805
    ],
    [
      52.404778,
      -1.460699
    ],
    [
      52.403269,
      -1.456643
    ],
    [
      52.402841,
      -1.451591
    ],
    [
      52.402608,
      -1.447664
    ],
    [
      52.402348,
      -1.446349
    ],
    [
      52.400401,
      -1.443576
    ],
    [
      52.398671,
      -1.440842
    ],
    [
      52.397651,
      -1.437952
    ],
    [
      52.396288,
      -1.434257
    ],
    [
      52.396131,
      -1.432403
    ],
    [
      52.396242,
      -1.431445
    ],
    [
      52.395617,
      -1.430193
    ],
    [
      52.394942,
      -1.425083
    ],
    [
      52.394353,
      -1.419996
    ],
    [
      52.393551,
      -1.41507
    ],
    [
      52.392572,
      -1.409955
    ],
    [
      52.390894,
      -1.405035
    ],
    [
      52.387574,
      -1.401673
    ],
    [
      52.384757,
      -1.39896
    ],
    [
      52.385946,
      -1.395256
    ],
    [
      52.385135,
      -1.390248
    ],
    [
      52.387481,
      -1.383551
    ],
    [
      52.389234,
      -1.375992
    ],
    [
      52.391034,
      -1.370266
    ],
    [
      52.389147,
      -1.370085
    ],
    [
      52.386757,
      -1.368713
    ],
    [
      52.384764,
      -1.360606
    ],
    [
      52.383307,
      -1.351657
    ],
    [
      52.381873,
      -1.343473
    ],
    [
      52.380312,
      -1.337881
    ],
    [
      52.378631,
      -1.33143
    ],
    [
      52.378098,
      -1.323232
    ],
    [
      52.377334,
      -1.316479
    ],
    [
      52.37649,
      -1.310225
    ],
    [
      52.375899,
      -1.304072
    ],
    [
      52.375563,
      -1.298021
    ],
    [
      52.375897,
      -1.291543
    ],
    [
      52.375689,
      -1.286253
    ],
    [
      52.375307,
      -1.281802
    ],
    [
      52.374137,
      -1.278184
    ],
    [
      52.373335,
      -1.276482
    ],
    [
      52.373335,
      -1.276484
    ],
    [
      52.373328,
      -1.276481
    ],
    [
      52.372477,
      -1.274061
    ],
    [
      52.372022,
      -1.270946
    ],
    [
      52.371823,
      -1.269501
    ],
    [
      52.371158,
      -1.266691
    ],
    [
      52.371168,
      -1.266689
    ],
    [
      52.370764,
      -1.264831
    ],
    [
      52.370529,
      -1.261821
    ],
    [
      52.370034,
      -1.257319
    ],
    [
      52.36952,
      -1.253918
    ],
    [
      52.368558,
      -1.249817
    ],
    [
      52.367347,
      -1.246566
    ],
    [
      52.365838,
      -1.243284
    ],
    [
      52.3643,
      -1.240543
    ],
    [
      52.36281,
      -1.236916
    ],
    [
      52.364012,
      -1.234824
    ],
    [
      52.3655,
      -1.234881
    ],
    [
      52.365463,
      -1.236748
    ],
    [
      52.366104,
      -1.237071
    ],
    [
      52.366156,
      -1.233306
    ],
    [
      52.364646,
      -1.231223
    ],
    [
      52.364307,
      -1.229241
    ],
    [
      52.363231,
      -1.228921
    ],
    [
      52.364295,
      -1.229205
    ],
    [
      52.364645,
      -1.231224
    ],
    [
      52.366096,
      -1.23307
    ],
    [
      52.366119,
      -1.23694
    ],
    [
      52.366605,
      -1.240143
    ],
    [
      52.367717,
      -1.242113
    ],
    [
      52.368775,
      -1.240252
    ],
    [
      52.368649,
      -1.240441
    ],
    [
      52.369529,
      -1.241199
    ],
    [
      52.370129,
      -1.242278
    ],
    [
      52.370926,
      -1.24059
    ],
    [
      52.372183,
      -1.240217
    ],
    [
      52.372622,
      -1.242798
    ],
    [
      52.371656,
      -1.241497
    ],
    [
      52.371741,
      -1.241293
    ],
    [
      52.371603,
      -1.242089
    ],
    [
      52.372923,
      -1.243154
    ],
    [
      52.372715,
      -1.245849
    ],
    [
      52.372263,
      -1.250497
    ],
    [
      52.371464,
      -1.254077
    ],
    [
      52.37172,
      -1.254114
    ]
  ],
  "hybrid": [
    [
      52.404883,
      -1.500289
    ],
    [
      52.405883,
      -1.496751
    ],
    [
      52.406437,
      -1.493919
    ],
    [
      52.40742,
      -1.491442
    ],
    [
      52.407322,
      -1.489135
    ],
    [
      52.406546,
      -1.486269
    ],
    [
      52.406255,
      -1.481777
    ],
    [
      52.406221,
      -1.477342
    ],
    [
      52.407129,
      -1.473065
    ],
    [
      52.407287,
      -1.472049
    ],
    [
      52.406193,
      -1.466905
    ],
    [
      52.404993,
      -1.461542
    ],
    [
      52.404816,
      -1.460804
    ],
    [
      52.404778,
      -1.460698
    ],
    [
      52.403269,
      -1.456643
    ],
    [
      52.40284,
      -1.451591
    ],
    [
      52.402608,
      -1.447665
    ],
    [
      52.402349,
      -1.446348
    ],
    [
      52.4004,
      -1.443576
    ],
    [
      52.398671,
      -1.440842
    ],
    [
      52.397651,
      -1.437952
    ],
    [
      52.396287,
      -1.434256
    ],
    [
      52.396131,
      -1.432403
    ],
    [
      52.396242,
      -1.431445
    ],
    [
      52.395617,
      -1.430193
    ],
    [
      52.394942,
      -1.425082
    ],
    [
      52.394363,
      -1.420012
    ],
    [
      52.393567,
      -1.415101
    ],
    [
      52.392571,
      -1.409955
    ],
    [
      52.390894,
      -1.405036
    ],
    [
      52.387574,
      -1.401673
    ],
    [
      52.384757,
      -1.39896
    ],
    [
      52.385946,
      -1.395257
    ],
    [
      52.385134,
      -1.390247
    ],
    [
      52.387483,
      -1.383551
    ],
    [
      52.389234,
      -1.375991
    ],
    [
      52.391035,
      -1.370266
    ],
    [
      52.389147,
      -1.370087
    ],
    [
      52.386756,
      -1.368711
    ],
    [
      52.384766,
      -1.360612
    ],
    [
      52.383306,
      -1.351657
    ],
    [
      52.381873,
      -1.343473
    ],
    [
      52.380312,
      -1.337881
    ],
    [
      52.378631,
      -1.33143
    ],
    [
      52.378096,
      -1.323232
    ],
    [
      52.377333,
      -1.316479
    ],
    [
      52.37649,
      -1.310225
    ],
    [
      52.375897,
      -1.304074
    ],
    [
      52.375562,
      -1.298021
    ],
    [
      52.375897,
      -1.291543
    ],
    [
      52.375689,
      -1.286253
    ],
    [
      52.375307,
      -1.281802
    ],
    [
      52.374136,
      -1.278184
    ],
    [
      52.373292,
      -1.27642
    ],
    [
      52.373335,
      -1.276484
    ],
    [
      52.373328,
      -1.276481
    ],
    [
      52.372476,
      -1.27406
    ],
    [
      52.372022,
      -1.270946
    ],
    [
      52.371822,
      -1.2695
    ],
    [
      52.371158,
      -1.266691
    ],
    [
      52.371169,
      -1.266689
    ],
    [
      52.370764,
      -1.264831
    ],
    [
      52.370529,
      -1.261821
    ],
    [
      52.370033,
      -1.25732
    ],
    [
      52.369519,
      -1.253918
    ],
    [
      52.368557,
      -1.249818
    ],
    [
      52.367346,
      -1.246567
    ],
    [
      52.365838,
      -1.243285
    ],
    [
      52.364299,
      -1.240543
    ],
    [
      52.362809,
      -1.236918
    ],
    [
      52.364013,
      -1.234823
    ],
    [
      52.365501,
      -1.234882
    ],
    [
      52.365455,
      -1.236764
    ],
    [
      52.366104,
      -1.237071
    ],
    [
      52.366155,
      -1.233306
    ],
    [
      52.364646,
      -1.231224
    ],
    [
      52.364308,
      -1.22924
    ],
    [
      52.36321,
      -1.228944
    ],
    [
      52.364295,
      -1.229205
    ],
    [
      52.364646,
      -1.231223
    ],
    [
      52.366096,
      -1.23307
    ],
    [
      52.366118,
      -1.23694
    ],
    [
      52.366604,
      -1.240141
    ],
    [
      52.367718,
      -1.242112
    ],
    [
      52.368775,
      -1.240252
    ],
    [
      52.368648,
      -1.240441
    ],
    [
      52.369529,
      -1.241199
    ],
    [
      52.370129,
      -1.242278
    ],
    [
      52.370926,
      -1.240589
    ],
    [
      52.372184,
      -1.240217
    ],
    [
      52.372622,
      -1.242799
    ],
    [
      52.371655,
      -1.241496
    ],
    [
      52.371742,
      -1.241293
    ],
    [
      52.371604,
      -1.242089
    ],
    [
      52.372923,
      -1.243154
    ],
    [
      52.372715,
      -1.24585
    ],
    [
      52.372264,
      -1.250498
    ],
    [
      52.371464,
      -1.254078
    ],
    [
      52.371721,
      -1.254113
    ]
  ],
  "gnss": [
    [
      52.404883,
      -1.500289
    ],
    [
      52.405881,
      -1.49675
    ],
    [
      52.406436,
      -1.493917
    ],
    [
      52.407419,
      -1.491442
    ],
    [
      52.407309,
      -1.489105
    ],
    [
      52.406546,
      -1.486269
    ],
    [
      52.406254,
      -1.481777
    ],
    [
      52.406221,
      -1.477345
    ],
    [
      52.407129,
      -1.473065
    ],
    [
      52.407287,
      -1.47205
    ],
    [
      52.406213,
      -1.46688
    ],
    [
      52.404994,
      -1.461543
    ],
    [
      52.404816,
      -1.460804
    ],
    [
      52.404778,
      -1.460699
    ],
    [
      52.403248,
      -1.456682
    ],
    [
      52.402841,
      -1.451591
    ],
    [
      52.402608,
      -1.447664
    ],
    [
      52.402348,
      -1.446349
    ],
    [
      52.400401,
      -1.443576
    ],
    [
      52.398671,
      -1.440842
    ],
    [
      52.397651,
      -1.437952
    ],
    [
      52.396288,
      -1.434257
    ],
    [
      52.396131,
      -1.432402
    ],
    [
      52.396277,
      -1.43147
    ],
    [
      52.395617,
      -1.430193
    ],
    [
      52.394942,
      -1.425083
    ],
    [
      52.394353,
      -1.419996
    ],
    [
      52.393551,
      -1.41507
    ],
    [
      52.392572,
      -1.409955
    ],
    [
      52.390894,
      -1.405035
    ],
    [
      52.387575,
      -1.40169
    ],
    [
      52.384757,
      -1.39896
    ],
    [
      52.385946,
      -1.395255
    ],
    [
      52.385135,
      -1.390248
    ],
    [
      52.387481,
      -1.38355
    ],
    [
      52.389234,
      -1.375991
    ],
    [
      52.391034,
      -1.370265
    ],
    [
      52.389147,
      -1.370085
    ],
    [
      52.386757,
      -1.368712
    ],
    [
      52.384764,
      -1.360606
    ],
    [
      52.383307,
      -1.351657
    ],
    [
      52.381873,
      -1.343472
    ],
    [
      52.380312,
      -1.33788
    ],
    [
      52.37866,
      -1.331479
    ],
    [
      52.378098,
      -1.323231
    ],
    [
      52.377334,
      -1.316478
    ],
    [
      52.376485,
      -1.310233
    ],
    [
      52.375899,
      -1.304071
    ],
    [
      52.375562,
      -1.29802
    ],
    [
      52.375897,
      -1.291543
    ],
    [
      52.375689,
      -1.286252
    ],
    [
      52.375307,
      -1.281802
    ],
    [
      52.374137,
      -1.278183
    ],
    [
      52.373335,
      -1.276482
    ],
    [
      52.373335,
      -1.276483
    ],
    [
      52.373328,
      -1.27648
    ],
    [
      52.372477,
      -1.274061
    ],
    [
      52.372022,
      -1.270946
    ],
    [
      52.371823,
      -1.269501
    ],
    [
      52.371172,
      -1.266688
    ],
    [
      52.371168,
      -1.266689
    ],
    [
      52.370764,
      -1.264831
    ],
    [
      52.37052,
      -1.261832
    ],
    [
      52.370031,
      -1.257355
    ],
    [
      52.36952,
      -1.253918
    ],
    [
      52.368558,
      -1.249816
    ],
    [
      52.367347,
      -1.246566
    ],
    [
      52.365838,
      -1.243284
    ],
    [
      52.3643,
      -1.240543
    ],
    [
      52.36281,
      -1.236916
    ],
    [
      52.364012,
      -1.234824
    ],
    [
      52.3655,
      -1.234881
    ],
    [
      52.365463,
      -1.236747
    ],
    [
      52.366104,
      -1.237071
    ],
    [
      52.366156,
      -1.233305
    ],
    [
      52.364646,
      -1.231223
    ],
    [
      52.364307,
      -1.22924
    ],
    [
      52.363231,
      -1.22892
    ],
    [
      52.364294,
      -1.229204
    ],
    [
      52.364645,
      -1.231223
    ],
    [
      52.366096,
      -1.23307
    ],
    [
      52.366119,
      -1.23694
    ],
    [
      52.366605,
      -1.240142
    ],
    [
      52.367717,
      -1.242112
    ],
    [
      52.368775,
      -1.240252
    ],
    [
      52.368648,
      -1.24044
    ],
    [
      52.369529,
      -1.241199
    ],
    [
      52.370129,
      -1.242278
    ],
    [
      52.370926,
      -1.24059
    ],
    [
      52.372183,
      -1.240217
    ],
    [
      52.372622,
      -1.242798
    ],
    [
      52.371656,
      -1.241497
    ],
    [
      52.371741,
      -1.241293
    ],
    [
      52.371603,
      -1.242088
    ],
    [
      52.372923,
      -1.243154
    ],
    [
      52.372715,
      -1.245849
    ],
    [
      52.372263,
      -1.250497
    ],
    [
      52.371464,
      -1.254077
    ],
    [
      52.37172,
      -1.254114
    ]
  ],
  "dr": [
    [
      52.404883,
      -1.500289
    ],
    [
      52.40588,
      -1.49674
    ],
    [
      52.406524,
      -1.493989
    ],
    [
      52.40766,
      -1.491675
    ],
    [
      52.40776,
      -1.489331
    ],
    [
      52.407306,
      -1.486261
    ],
    [
      52.40759,
      -1.481746
    ],
    [
      52.408075,
      -1.477361
    ],
    [
      52.409292,
      -1.473263
    ],
    [
      52.409469,
      -1.472252
    ],
    [
      52.408293,
      -1.467131
    ],
    [
      52.406737,
      -1.461995
    ],
    [
      52.406493,
      -1.461315
    ],
    [
      52.406454,
      -1.46121
    ],
    [
      52.40448,
      -1.457695
    ],
    [
      52.403525,
      -1.452782
    ],
    [
      52.402876,
      -1.448972
    ],
    [
      52.402479,
      -1.447735
    ],
    [
      52.400295,
      -1.445438
    ],
    [
      52.398365,
      -1.443056
    ],
    [
      52.397141,
      -1.440368
    ],
    [
      52.39548,
      -1.436972
    ],
    [
      52.395152,
      -1.435175
    ],
    [
      52.395159,
      -1.434201
    ],
    [
      52.394411,
      -1.433103
    ],
    [
      52.393189,
      -1.428235
    ],
    [
      52.392002,
      -1.423428
    ],
    [
      52.390536,
      -1.418915
    ],
    [
      52.388767,
      -1.414308
    ],
    [
      52.386339,
      -1.410273
    ],
    [
      52.382608,
      -1.408296
    ],
    [
      52.379496,
      -1.406561
    ],
    [
      52.380227,
      -1.402524
    ],
    [
      52.378879,
      -1.397805
    ],
    [
      52.380501,
      -1.390533
    ],
    [
      52.381571,
      -1.382623
    ],
    [
      52.382937,
      -1.376578
    ],
    [
      52.381028,
      -1.376553
    ],
    [
      52.378642,
      -1.375226
    ],
    [
      52.376792,
      -1.366966
    ],
    [
      52.375712,
      -1.357831
    ],
    [
      52.374761,
      -1.349442
    ],
    [
      52.373593,
      -1.343558
    ],
    [
      52.372448,
      -1.336804
    ],
    [
      52.372492,
      -1.328476
    ],
    [
      52.372298,
      -1.321601
    ],
    [
      52.372067,
      -1.315192
    ],
    [
      52.372213,
      -1.308944
    ],
    [
      52.372743,
      -1.302896
    ],
    [
      52.374066,
      -1.29674
    ],
    [
      52.374748,
      -1.291532
    ],
    [
      52.375191,
      -1.287077
    ],
    [
      52.374823,
      -1.282998
    ],
    [
      52.37446,
      -1.280818
    ],
    [
      52.374456,
      -1.280801
    ],
    [
      52.374454,
      -1.280796
    ],
    [
      52.374312,
      -1.277974
    ],
    [
      52.3747,
      -1.274819
    ],
    [
      52.374896,
      -1.273349
    ],
    [
      52.375043,
      -1.270339
    ],
    [
      52.375044,
      -1.270333
    ],
    [
      52.375183,
      -1.268355
    ],
    [
      52.37585,
      -1.265501
    ],
    [
      52.376771,
      -1.261181
    ],
    [
      52.377364,
      -1.25777
    ],
    [
      52.377688,
      -1.253376
    ],
    [
      52.377489,
      -1.249578
    ],
    [
      52.376963,
      -1.245558
    ],
    [
      52.376194,
      -1.242037
    ],
    [
      52.375589,
      -1.237747
    ],
    [
      52.377186,
      -1.236493
    ],
    [
      52.37857,
      -1.237448
    ],
    [
      52.378118,
      -1.239201
    ],
    [
      52.378613,
      -1.239943
    ],
    [
      52.379501,
      -1.236422
    ],
    [
      52.37852,
      -1.233595
    ],
    [
      52.378621,
      -1.23153
    ],
    [
      52.37764,
      -1.230613
    ],
    [
      52.378487,
      -1.231672
    ],
    [
      52.37829,
      -1.233794
    ],
    [
      52.379084,
      -1.236521
    ],
    [
      52.378006,
      -1.24005
    ],
    [
      52.377499,
      -1.243254
    ],
    [
      52.377881,
      -1.24586
    ],
    [
      52.379385,
      -1.245128
    ],
    [
      52.379205,
      -1.245162
    ],
    [
      52.379657,
      -1.246636
    ],
    [
      52.37975,
      -1.248105
    ],
    [
      52.381039,
      -1.247583
    ],
    [
      52.382152,
      -1.248612
    ],
    [
      52.381469,
      -1.251056
    ],
    [
      52.381203,
      -1.249038
    ],
    [
      52.381344,
      -1.248959
    ],
    [
      52.380899,
      -1.2494
    ],
    [
      52.381411,
      -1.25169
    ],
    [
      52.380075,
      -1.253331
    ],
    [
      52.377635,
      -1.255884
    ],
    [
      52.375422,
      -1.257106
    ],
    [
      52.375566,
      -1.257477
    ]
  ]
},
};

export const FALLBACK_CHECKPOINTS = [
  {
    "index": 0,
    "timestamp": 66118.0,
    "relative_time_s": 0.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.895,
    "degradation_prob": 0.105,
    "dr_uncertainty_std_m": 2.121,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 3.11,
    "forecast_hybrid": 16.917,
    "forecast_dr": 23.555,
    "selected_mode": "GNSS",
    "decision_reason": "emergency_override",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.404883,
      "lon": -1.500289
    },
    "vyra_coord": {
      "lat": 52.404883,
      "lon": -1.500289
    },
    "hybrid_coord": {
      "lat": 52.404883,
      "lon": -1.500289
    },
    "gnss_coord": {
      "lat": 52.404883,
      "lon": -1.500289
    },
    "dr_coord": {
      "lat": 52.404883,
      "lon": -1.500289
    }
  },
  {
    "index": 250,
    "timestamp": 66143.0,
    "relative_time_s": 25.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.561,
    "dr_survivability_s": 2.73,
    "forecast_gnss": 1.292,
    "forecast_hybrid": 24.233,
    "forecast_dr": 30.505,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.405881,
      "lon": -1.49675
    },
    "vyra_coord": {
      "lat": 52.405881,
      "lon": -1.49675
    },
    "hybrid_coord": {
      "lat": 52.405883,
      "lon": -1.496751
    },
    "gnss_coord": {
      "lat": 52.405881,
      "lon": -1.49675
    },
    "dr_coord": {
      "lat": 52.40588,
      "lon": -1.49674
    }
  },
  {
    "index": 500,
    "timestamp": 66168.0,
    "relative_time_s": 50.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 8.27,
    "forecast_gnss": 1.511,
    "forecast_hybrid": 16.064,
    "forecast_dr": 12.382,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.406436,
      "lon": -1.493917
    },
    "vyra_coord": {
      "lat": 52.406436,
      "lon": -1.493917
    },
    "hybrid_coord": {
      "lat": 52.406437,
      "lon": -1.493919
    },
    "gnss_coord": {
      "lat": 52.406436,
      "lon": -1.493917
    },
    "dr_coord": {
      "lat": 52.406524,
      "lon": -1.493989
    }
  },
  {
    "index": 750,
    "timestamp": 66193.0,
    "relative_time_s": 75.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 5.55,
    "forecast_gnss": 1.548,
    "forecast_hybrid": 11.034,
    "forecast_dr": 16.287,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.407419,
      "lon": -1.491442
    },
    "vyra_coord": {
      "lat": 52.407419,
      "lon": -1.491442
    },
    "hybrid_coord": {
      "lat": 52.40742,
      "lon": -1.491442
    },
    "gnss_coord": {
      "lat": 52.407419,
      "lon": -1.491442
    },
    "dr_coord": {
      "lat": 52.40766,
      "lon": -1.491675
    }
  },
  {
    "index": 1000,
    "timestamp": 66218.0,
    "relative_time_s": 100.0,
    "scenario": "DEGRADED",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.811,
    "degradation_prob": 0.189,
    "dr_uncertainty_std_m": 0.594,
    "dr_survivability_s": 3.51,
    "forecast_gnss": 8.74,
    "forecast_hybrid": 16.536,
    "forecast_dr": 17.873,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 2.492,
    "gt_coord": {
      "lat": 52.407322,
      "lon": -1.489134
    },
    "vyra_coord": {
      "lat": 52.407309,
      "lon": -1.489105
    },
    "hybrid_coord": {
      "lat": 52.407322,
      "lon": -1.489135
    },
    "gnss_coord": {
      "lat": 52.407309,
      "lon": -1.489105
    },
    "dr_coord": {
      "lat": 52.40776,
      "lon": -1.489331
    }
  },
  {
    "index": 1250,
    "timestamp": 66243.0,
    "relative_time_s": 125.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.61,
    "forecast_gnss": 1.63,
    "forecast_hybrid": 19.903,
    "forecast_dr": 23.536,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.406546,
      "lon": -1.486269
    },
    "vyra_coord": {
      "lat": 52.406546,
      "lon": -1.486269
    },
    "hybrid_coord": {
      "lat": 52.406546,
      "lon": -1.486269
    },
    "gnss_coord": {
      "lat": 52.406546,
      "lon": -1.486269
    },
    "dr_coord": {
      "lat": 52.407306,
      "lon": -1.486261
    }
  },
  {
    "index": 1500,
    "timestamp": 66268.0,
    "relative_time_s": 150.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.81,
    "forecast_gnss": 1.572,
    "forecast_hybrid": 16.113,
    "forecast_dr": 18.19,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.406254,
      "lon": -1.481777
    },
    "vyra_coord": {
      "lat": 52.406254,
      "lon": -1.481777
    },
    "hybrid_coord": {
      "lat": 52.406255,
      "lon": -1.481777
    },
    "gnss_coord": {
      "lat": 52.406254,
      "lon": -1.481777
    },
    "dr_coord": {
      "lat": 52.40759,
      "lon": -1.481746
    }
  },
  {
    "index": 1750,
    "timestamp": 66293.0,
    "relative_time_s": 175.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 0.882,
    "dr_survivability_s": 2.56,
    "forecast_gnss": 22.856,
    "forecast_hybrid": 25.633,
    "forecast_dr": 25.05,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 0.251,
    "gt_coord": {
      "lat": 52.406221,
      "lon": -1.477345
    },
    "vyra_coord": {
      "lat": 52.406221,
      "lon": -1.477342
    },
    "hybrid_coord": {
      "lat": 52.406221,
      "lon": -1.477342
    },
    "gnss_coord": {
      "lat": 52.406221,
      "lon": -1.477345
    },
    "dr_coord": {
      "lat": 52.408075,
      "lon": -1.477361
    }
  },
  {
    "index": 2000,
    "timestamp": 66318.0,
    "relative_time_s": 200.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.54,
    "forecast_gnss": 1.623,
    "forecast_hybrid": 13.073,
    "forecast_dr": 15.078,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.407129,
      "lon": -1.473065
    },
    "vyra_coord": {
      "lat": 52.407129,
      "lon": -1.473065
    },
    "hybrid_coord": {
      "lat": 52.407129,
      "lon": -1.473065
    },
    "gnss_coord": {
      "lat": 52.407129,
      "lon": -1.473065
    },
    "dr_coord": {
      "lat": 52.409292,
      "lon": -1.473263
    }
  },
  {
    "index": 2250,
    "timestamp": 66343.0,
    "relative_time_s": 225.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.29,
    "forecast_gnss": 1.802,
    "forecast_hybrid": 14.748,
    "forecast_dr": 19.55,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.407287,
      "lon": -1.47205
    },
    "vyra_coord": {
      "lat": 52.407287,
      "lon": -1.47205
    },
    "hybrid_coord": {
      "lat": 52.407287,
      "lon": -1.472049
    },
    "gnss_coord": {
      "lat": 52.407287,
      "lon": -1.47205
    },
    "dr_coord": {
      "lat": 52.409469,
      "lon": -1.472252
    }
  },
  {
    "index": 2500,
    "timestamp": 66368.0,
    "relative_time_s": 250.0,
    "scenario": "DEGRADED",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.625,
    "degradation_prob": 0.375,
    "dr_uncertainty_std_m": 0.671,
    "dr_survivability_s": 2.05,
    "forecast_gnss": 11.106,
    "forecast_hybrid": 25.591,
    "forecast_dr": 37.201,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 2.443,
    "gt_coord": {
      "lat": 52.406197,
      "lon": -1.466903
    },
    "vyra_coord": {
      "lat": 52.406213,
      "lon": -1.46688
    },
    "hybrid_coord": {
      "lat": 52.406193,
      "lon": -1.466905
    },
    "gnss_coord": {
      "lat": 52.406213,
      "lon": -1.46688
    },
    "dr_coord": {
      "lat": 52.408293,
      "lon": -1.467131
    }
  },
  {
    "index": 2750,
    "timestamp": 66393.0,
    "relative_time_s": 275.0,
    "scenario": "OUTAGE",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.995,
    "degradation_prob": 0.005,
    "dr_uncertainty_std_m": 0.854,
    "dr_survivability_s": 2.92,
    "forecast_gnss": 3.127,
    "forecast_hybrid": 19.901,
    "forecast_dr": 23.687,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.404994,
      "lon": -1.461543
    },
    "vyra_coord": {
      "lat": 52.404994,
      "lon": -1.461543
    },
    "hybrid_coord": {
      "lat": 52.404993,
      "lon": -1.461542
    },
    "gnss_coord": {
      "lat": 52.404994,
      "lon": -1.461543
    },
    "dr_coord": {
      "lat": 52.406737,
      "lon": -1.461995
    }
  },
  {
    "index": 3000,
    "timestamp": 66418.0,
    "relative_time_s": 300.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.551,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.397,
    "forecast_hybrid": 11.068,
    "forecast_dr": 8.646,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.404816,
      "lon": -1.460804
    },
    "vyra_coord": {
      "lat": 52.404816,
      "lon": -1.460805
    },
    "hybrid_coord": {
      "lat": 52.404816,
      "lon": -1.460804
    },
    "gnss_coord": {
      "lat": 52.404816,
      "lon": -1.460804
    },
    "dr_coord": {
      "lat": 52.406493,
      "lon": -1.461315
    }
  },
  {
    "index": 3250,
    "timestamp": 66443.0,
    "relative_time_s": 325.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.555,
    "dr_survivability_s": 5.56,
    "forecast_gnss": 1.274,
    "forecast_hybrid": 10.759,
    "forecast_dr": 23.195,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.404778,
      "lon": -1.460699
    },
    "vyra_coord": {
      "lat": 52.404778,
      "lon": -1.460699
    },
    "hybrid_coord": {
      "lat": 52.404778,
      "lon": -1.460698
    },
    "gnss_coord": {
      "lat": 52.404778,
      "lon": -1.460699
    },
    "dr_coord": {
      "lat": 52.406454,
      "lon": -1.46121
    }
  },
  {
    "index": 3500,
    "timestamp": 66468.0,
    "relative_time_s": 350.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 229.874,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 23.308,
    "forecast_hybrid": 28.182,
    "forecast_dr": 47.377,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 3.576,
    "gt_coord": {
      "lat": 52.403248,
      "lon": -1.456682
    },
    "vyra_coord": {
      "lat": 52.403269,
      "lon": -1.456643
    },
    "hybrid_coord": {
      "lat": 52.403269,
      "lon": -1.456643
    },
    "gnss_coord": {
      "lat": 52.403248,
      "lon": -1.456682
    },
    "dr_coord": {
      "lat": 52.40448,
      "lon": -1.457695
    }
  },
  {
    "index": 3750,
    "timestamp": 66493.0,
    "relative_time_s": 375.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.557,
    "dr_survivability_s": 2.27,
    "forecast_gnss": 1.573,
    "forecast_hybrid": 23.438,
    "forecast_dr": 66.902,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.402841,
      "lon": -1.451591
    },
    "vyra_coord": {
      "lat": 52.402841,
      "lon": -1.451591
    },
    "hybrid_coord": {
      "lat": 52.40284,
      "lon": -1.451591
    },
    "gnss_coord": {
      "lat": 52.402841,
      "lon": -1.451591
    },
    "dr_coord": {
      "lat": 52.403525,
      "lon": -1.452782
    }
  },
  {
    "index": 4000,
    "timestamp": 66518.0,
    "relative_time_s": 400.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 16.69,
    "forecast_gnss": 1.193,
    "forecast_hybrid": 10.239,
    "forecast_dr": 11.32,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.402608,
      "lon": -1.447664
    },
    "vyra_coord": {
      "lat": 52.402608,
      "lon": -1.447664
    },
    "hybrid_coord": {
      "lat": 52.402608,
      "lon": -1.447665
    },
    "gnss_coord": {
      "lat": 52.402608,
      "lon": -1.447664
    },
    "dr_coord": {
      "lat": 52.402876,
      "lon": -1.448972
    }
  },
  {
    "index": 4250,
    "timestamp": 66543.0,
    "relative_time_s": 425.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.45,
    "forecast_gnss": 1.69,
    "forecast_hybrid": 13.14,
    "forecast_dr": 16.048,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.402348,
      "lon": -1.446349
    },
    "vyra_coord": {
      "lat": 52.402348,
      "lon": -1.446349
    },
    "hybrid_coord": {
      "lat": 52.402349,
      "lon": -1.446348
    },
    "gnss_coord": {
      "lat": 52.402348,
      "lon": -1.446349
    },
    "dr_coord": {
      "lat": 52.402479,
      "lon": -1.447735
    }
  },
  {
    "index": 4500,
    "timestamp": 66568.0,
    "relative_time_s": 450.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.48,
    "forecast_gnss": 1.511,
    "forecast_hybrid": 23.376,
    "forecast_dr": 19.93,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.400401,
      "lon": -1.443576
    },
    "vyra_coord": {
      "lat": 52.400401,
      "lon": -1.443576
    },
    "hybrid_coord": {
      "lat": 52.4004,
      "lon": -1.443576
    },
    "gnss_coord": {
      "lat": 52.400401,
      "lon": -1.443576
    },
    "dr_coord": {
      "lat": 52.400295,
      "lon": -1.445438
    }
  },
  {
    "index": 4750,
    "timestamp": 66593.0,
    "relative_time_s": 475.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.57,
    "forecast_gnss": 1.546,
    "forecast_hybrid": 19.819,
    "forecast_dr": 18.782,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.398671,
      "lon": -1.440842
    },
    "vyra_coord": {
      "lat": 52.398671,
      "lon": -1.440842
    },
    "hybrid_coord": {
      "lat": 52.398671,
      "lon": -1.440842
    },
    "gnss_coord": {
      "lat": 52.398671,
      "lon": -1.440842
    },
    "dr_coord": {
      "lat": 52.398365,
      "lon": -1.443056
    }
  },
  {
    "index": 5000,
    "timestamp": 66618.0,
    "relative_time_s": 500.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.7,
    "forecast_gnss": 1.653,
    "forecast_hybrid": 19.917,
    "forecast_dr": 16.957,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.397651,
      "lon": -1.437952
    },
    "vyra_coord": {
      "lat": 52.397651,
      "lon": -1.437952
    },
    "hybrid_coord": {
      "lat": 52.397651,
      "lon": -1.437952
    },
    "gnss_coord": {
      "lat": 52.397651,
      "lon": -1.437952
    },
    "dr_coord": {
      "lat": 52.397141,
      "lon": -1.440368
    }
  },
  {
    "index": 5250,
    "timestamp": 66643.0,
    "relative_time_s": 525.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 3.04,
    "forecast_gnss": 1.67,
    "forecast_hybrid": 14.615,
    "forecast_dr": 16.225,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.396288,
      "lon": -1.434257
    },
    "vyra_coord": {
      "lat": 52.396288,
      "lon": -1.434257
    },
    "hybrid_coord": {
      "lat": 52.396287,
      "lon": -1.434256
    },
    "gnss_coord": {
      "lat": 52.396288,
      "lon": -1.434257
    },
    "dr_coord": {
      "lat": 52.39548,
      "lon": -1.436972
    }
  },
  {
    "index": 5500,
    "timestamp": 66668.0,
    "relative_time_s": 550.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.551,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.396,
    "forecast_hybrid": 11.067,
    "forecast_dr": 9.018,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.396131,
      "lon": -1.432402
    },
    "vyra_coord": {
      "lat": 52.396131,
      "lon": -1.432403
    },
    "hybrid_coord": {
      "lat": 52.396131,
      "lon": -1.432403
    },
    "gnss_coord": {
      "lat": 52.396131,
      "lon": -1.432402
    },
    "dr_coord": {
      "lat": 52.395152,
      "lon": -1.435175
    }
  },
  {
    "index": 5750,
    "timestamp": 66693.0,
    "relative_time_s": 575.0,
    "scenario": "DEGRADED",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.624,
    "degradation_prob": 0.376,
    "dr_uncertainty_std_m": 0.686,
    "dr_survivability_s": 21.06,
    "forecast_gnss": 9.726,
    "forecast_hybrid": 16.021,
    "forecast_dr": 9.809,
    "selected_mode": "DR",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.552,
    "gt_coord": {
      "lat": 52.396242,
      "lon": -1.431453
    },
    "vyra_coord": {
      "lat": 52.396242,
      "lon": -1.431445
    },
    "hybrid_coord": {
      "lat": 52.396242,
      "lon": -1.431445
    },
    "gnss_coord": {
      "lat": 52.396277,
      "lon": -1.43147
    },
    "dr_coord": {
      "lat": 52.395159,
      "lon": -1.434201
    }
  },
  {
    "index": 6000,
    "timestamp": 66718.0,
    "relative_time_s": 600.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.43,
    "forecast_gnss": 1.571,
    "forecast_hybrid": 25.85,
    "forecast_dr": 26.245,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.395617,
      "lon": -1.430193
    },
    "vyra_coord": {
      "lat": 52.395617,
      "lon": -1.430193
    },
    "hybrid_coord": {
      "lat": 52.395617,
      "lon": -1.430193
    },
    "gnss_coord": {
      "lat": 52.395617,
      "lon": -1.430193
    },
    "dr_coord": {
      "lat": 52.394411,
      "lon": -1.433103
    }
  },
  {
    "index": 6250,
    "timestamp": 66743.0,
    "relative_time_s": 625.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.22,
    "forecast_gnss": 1.709,
    "forecast_hybrid": 23.565,
    "forecast_dr": 48.543,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.394942,
      "lon": -1.425083
    },
    "vyra_coord": {
      "lat": 52.394942,
      "lon": -1.425083
    },
    "hybrid_coord": {
      "lat": 52.394942,
      "lon": -1.425082
    },
    "gnss_coord": {
      "lat": 52.394942,
      "lon": -1.425083
    },
    "dr_coord": {
      "lat": 52.393189,
      "lon": -1.428235
    }
  },
  {
    "index": 6500,
    "timestamp": 66768.0,
    "relative_time_s": 650.0,
    "scenario": "DEGRADED",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.33,
    "forecast_gnss": 1.559,
    "forecast_hybrid": 23.424,
    "forecast_dr": 40.185,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 1.714,
    "gt_coord": {
      "lat": 52.394364,
      "lon": -1.420014
    },
    "vyra_coord": {
      "lat": 52.394353,
      "lon": -1.419996
    },
    "hybrid_coord": {
      "lat": 52.394363,
      "lon": -1.420012
    },
    "gnss_coord": {
      "lat": 52.394353,
      "lon": -1.419996
    },
    "dr_coord": {
      "lat": 52.392002,
      "lon": -1.423428
    }
  },
  {
    "index": 6750,
    "timestamp": 66793.0,
    "relative_time_s": 675.0,
    "scenario": "OUTAGE",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.333,
    "degradation_prob": 0.667,
    "dr_uncertainty_std_m": 3.459,
    "dr_survivability_s": 1.88,
    "forecast_gnss": 24.035,
    "forecast_hybrid": 28.733,
    "forecast_dr": 40.445,
    "selected_mode": "GNSS",
    "decision_reason": "emergency_override",
    "current_error_m": 2.364,
    "gt_coord": {
      "lat": 52.393558,
      "lon": -1.415103
    },
    "vyra_coord": {
      "lat": 52.393551,
      "lon": -1.41507
    },
    "hybrid_coord": {
      "lat": 52.393567,
      "lon": -1.415101
    },
    "gnss_coord": {
      "lat": 52.393551,
      "lon": -1.41507
    },
    "dr_coord": {
      "lat": 52.390536,
      "lon": -1.418915
    }
  },
  {
    "index": 7000,
    "timestamp": 66818.0,
    "relative_time_s": 700.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 2.22,
    "forecast_gnss": 2.323,
    "forecast_hybrid": 28.364,
    "forecast_dr": 38.413,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.392572,
      "lon": -1.409955
    },
    "vyra_coord": {
      "lat": 52.392572,
      "lon": -1.409955
    },
    "hybrid_coord": {
      "lat": 52.392571,
      "lon": -1.409955
    },
    "gnss_coord": {
      "lat": 52.392572,
      "lon": -1.409955
    },
    "dr_coord": {
      "lat": 52.388767,
      "lon": -1.414308
    }
  },
  {
    "index": 7250,
    "timestamp": 66843.0,
    "relative_time_s": 725.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.97,
    "forecast_gnss": 2.317,
    "forecast_hybrid": 29.661,
    "forecast_dr": 25.628,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.390894,
      "lon": -1.405035
    },
    "vyra_coord": {
      "lat": 52.390894,
      "lon": -1.405035
    },
    "hybrid_coord": {
      "lat": 52.390894,
      "lon": -1.405036
    },
    "gnss_coord": {
      "lat": 52.390894,
      "lon": -1.405035
    },
    "dr_coord": {
      "lat": 52.386339,
      "lon": -1.410273
    }
  },
  {
    "index": 7500,
    "timestamp": 66868.0,
    "relative_time_s": 750.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 170.95,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 22.995,
    "forecast_hybrid": 23.725,
    "forecast_dr": 30.096,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 1.164,
    "gt_coord": {
      "lat": 52.387575,
      "lon": -1.40169
    },
    "vyra_coord": {
      "lat": 52.387574,
      "lon": -1.401673
    },
    "hybrid_coord": {
      "lat": 52.387574,
      "lon": -1.401673
    },
    "gnss_coord": {
      "lat": 52.387575,
      "lon": -1.40169
    },
    "dr_coord": {
      "lat": 52.382608,
      "lon": -1.408296
    }
  },
  {
    "index": 7750,
    "timestamp": 66893.0,
    "relative_time_s": 775.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.617,
    "dr_survivability_s": 2.47,
    "forecast_gnss": 2.503,
    "forecast_hybrid": 26.993,
    "forecast_dr": 19.671,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.384757,
      "lon": -1.39896
    },
    "vyra_coord": {
      "lat": 52.384757,
      "lon": -1.39896
    },
    "hybrid_coord": {
      "lat": 52.384757,
      "lon": -1.39896
    },
    "gnss_coord": {
      "lat": 52.384757,
      "lon": -1.39896
    },
    "dr_coord": {
      "lat": 52.379496,
      "lon": -1.406561
    }
  },
  {
    "index": 8000,
    "timestamp": 66918.0,
    "relative_time_s": 800.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.88,
    "forecast_gnss": 1.611,
    "forecast_hybrid": 16.143,
    "forecast_dr": 19.851,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.385946,
      "lon": -1.395255
    },
    "vyra_coord": {
      "lat": 52.385946,
      "lon": -1.395256
    },
    "hybrid_coord": {
      "lat": 52.385946,
      "lon": -1.395257
    },
    "gnss_coord": {
      "lat": 52.385946,
      "lon": -1.395255
    },
    "dr_coord": {
      "lat": 52.380227,
      "lon": -1.402524
    }
  },
  {
    "index": 8250,
    "timestamp": 66943.0,
    "relative_time_s": 825.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.54,
    "forecast_gnss": 0.891,
    "forecast_hybrid": 31.34,
    "forecast_dr": 50.238,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.385135,
      "lon": -1.390248
    },
    "vyra_coord": {
      "lat": 52.385135,
      "lon": -1.390248
    },
    "hybrid_coord": {
      "lat": 52.385134,
      "lon": -1.390247
    },
    "gnss_coord": {
      "lat": 52.385135,
      "lon": -1.390248
    },
    "dr_coord": {
      "lat": 52.378879,
      "lon": -1.397805
    }
  },
  {
    "index": 8500,
    "timestamp": 66968.0,
    "relative_time_s": 850.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.56,
    "forecast_gnss": 0.757,
    "forecast_hybrid": 30.861,
    "forecast_dr": 51.63,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.387481,
      "lon": -1.38355
    },
    "vyra_coord": {
      "lat": 52.387481,
      "lon": -1.383551
    },
    "hybrid_coord": {
      "lat": 52.387483,
      "lon": -1.383551
    },
    "gnss_coord": {
      "lat": 52.387481,
      "lon": -1.38355
    },
    "dr_coord": {
      "lat": 52.380501,
      "lon": -1.390533
    }
  },
  {
    "index": 8750,
    "timestamp": 66993.0,
    "relative_time_s": 875.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.54,
    "forecast_gnss": 1.704,
    "forecast_hybrid": 30.862,
    "forecast_dr": 53.137,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.389234,
      "lon": -1.375991
    },
    "vyra_coord": {
      "lat": 52.389234,
      "lon": -1.375992
    },
    "hybrid_coord": {
      "lat": 52.389234,
      "lon": -1.375991
    },
    "gnss_coord": {
      "lat": 52.389234,
      "lon": -1.375991
    },
    "dr_coord": {
      "lat": 52.381571,
      "lon": -1.382623
    }
  },
  {
    "index": 9000,
    "timestamp": 67018.0,
    "relative_time_s": 900.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 17.64,
    "forecast_gnss": 1.311,
    "forecast_hybrid": 10.346,
    "forecast_dr": 10.653,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.391034,
      "lon": -1.370265
    },
    "vyra_coord": {
      "lat": 52.391034,
      "lon": -1.370266
    },
    "hybrid_coord": {
      "lat": 52.391035,
      "lon": -1.370266
    },
    "gnss_coord": {
      "lat": 52.391034,
      "lon": -1.370265
    },
    "dr_coord": {
      "lat": 52.382937,
      "lon": -1.376578
    }
  },
  {
    "index": 9250,
    "timestamp": 67043.0,
    "relative_time_s": 925.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.5,
    "forecast_gnss": 1.621,
    "forecast_hybrid": 24.553,
    "forecast_dr": 18.192,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.389147,
      "lon": -1.370085
    },
    "vyra_coord": {
      "lat": 52.389147,
      "lon": -1.370085
    },
    "hybrid_coord": {
      "lat": 52.389147,
      "lon": -1.370087
    },
    "gnss_coord": {
      "lat": 52.389147,
      "lon": -1.370085
    },
    "dr_coord": {
      "lat": 52.381028,
      "lon": -1.376553
    }
  },
  {
    "index": 9500,
    "timestamp": 67068.0,
    "relative_time_s": 950.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.85,
    "forecast_gnss": 1.784,
    "forecast_hybrid": 26.405,
    "forecast_dr": 63.236,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.386757,
      "lon": -1.368712
    },
    "vyra_coord": {
      "lat": 52.386757,
      "lon": -1.368713
    },
    "hybrid_coord": {
      "lat": 52.386756,
      "lon": -1.368711
    },
    "gnss_coord": {
      "lat": 52.386757,
      "lon": -1.368712
    },
    "dr_coord": {
      "lat": 52.378642,
      "lon": -1.375226
    }
  },
  {
    "index": 9750,
    "timestamp": 67093.0,
    "relative_time_s": 975.0,
    "scenario": "DEGRADED",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.32,
    "forecast_gnss": 0.757,
    "forecast_hybrid": 30.861,
    "forecast_dr": 47.867,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.477,
    "gt_coord": {
      "lat": 52.384766,
      "lon": -1.360612
    },
    "vyra_coord": {
      "lat": 52.384764,
      "lon": -1.360606
    },
    "hybrid_coord": {
      "lat": 52.384766,
      "lon": -1.360612
    },
    "gnss_coord": {
      "lat": 52.384764,
      "lon": -1.360606
    },
    "dr_coord": {
      "lat": 52.376792,
      "lon": -1.366966
    }
  },
  {
    "index": 10000,
    "timestamp": 67118.0,
    "relative_time_s": 1000.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.24,
    "forecast_gnss": 0.74,
    "forecast_hybrid": 30.844,
    "forecast_dr": 41.005,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.383307,
      "lon": -1.351657
    },
    "vyra_coord": {
      "lat": 52.383307,
      "lon": -1.351657
    },
    "hybrid_coord": {
      "lat": 52.383306,
      "lon": -1.351657
    },
    "gnss_coord": {
      "lat": 52.383307,
      "lon": -1.351657
    },
    "dr_coord": {
      "lat": 52.375712,
      "lon": -1.357831
    }
  },
  {
    "index": 10250,
    "timestamp": 67143.0,
    "relative_time_s": 1025.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.1,
    "forecast_gnss": 1.661,
    "forecast_hybrid": 23.526,
    "forecast_dr": 59.12,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.381873,
      "lon": -1.343472
    },
    "vyra_coord": {
      "lat": 52.381873,
      "lon": -1.343473
    },
    "hybrid_coord": {
      "lat": 52.381873,
      "lon": -1.343473
    },
    "gnss_coord": {
      "lat": 52.381873,
      "lon": -1.343472
    },
    "dr_coord": {
      "lat": 52.374761,
      "lon": -1.349442
    }
  },
  {
    "index": 10500,
    "timestamp": 67168.0,
    "relative_time_s": 1050.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.71,
    "forecast_gnss": 1.121,
    "forecast_hybrid": 22.948,
    "forecast_dr": 55.47,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.380312,
      "lon": -1.33788
    },
    "vyra_coord": {
      "lat": 52.380312,
      "lon": -1.337881
    },
    "hybrid_coord": {
      "lat": 52.380312,
      "lon": -1.337881
    },
    "gnss_coord": {
      "lat": 52.380312,
      "lon": -1.33788
    },
    "dr_coord": {
      "lat": 52.373593,
      "lon": -1.343558
    }
  },
  {
    "index": 10750,
    "timestamp": 67193.0,
    "relative_time_s": 1075.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 1116.213,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 31.643,
    "forecast_hybrid": 34.126,
    "forecast_dr": 40.045,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 4.709,
    "gt_coord": {
      "lat": 52.37866,
      "lon": -1.331479
    },
    "vyra_coord": {
      "lat": 52.378631,
      "lon": -1.33143
    },
    "hybrid_coord": {
      "lat": 52.378631,
      "lon": -1.33143
    },
    "gnss_coord": {
      "lat": 52.37866,
      "lon": -1.331479
    },
    "dr_coord": {
      "lat": 52.372448,
      "lon": -1.336804
    }
  },
  {
    "index": 11000,
    "timestamp": 67218.0,
    "relative_time_s": 1100.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 1.46,
    "forecast_gnss": 0.976,
    "forecast_hybrid": 36.383,
    "forecast_dr": 11.877,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.378098,
      "lon": -1.323231
    },
    "vyra_coord": {
      "lat": 52.378098,
      "lon": -1.323232
    },
    "hybrid_coord": {
      "lat": 52.378096,
      "lon": -1.323232
    },
    "gnss_coord": {
      "lat": 52.378098,
      "lon": -1.323231
    },
    "dr_coord": {
      "lat": 52.372492,
      "lon": -1.328476
    }
  },
  {
    "index": 11250,
    "timestamp": 67243.0,
    "relative_time_s": 1125.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.83,
    "forecast_gnss": 1.776,
    "forecast_hybrid": 24.728,
    "forecast_dr": 40.68,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.377334,
      "lon": -1.316478
    },
    "vyra_coord": {
      "lat": 52.377334,
      "lon": -1.316479
    },
    "hybrid_coord": {
      "lat": 52.377333,
      "lon": -1.316479
    },
    "gnss_coord": {
      "lat": 52.377334,
      "lon": -1.316478
    },
    "dr_coord": {
      "lat": 52.372298,
      "lon": -1.321601
    }
  },
  {
    "index": 11500,
    "timestamp": 67268.0,
    "relative_time_s": 1150.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 87.317,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 24.141,
    "forecast_hybrid": 26.603,
    "forecast_dr": 35.977,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 0.853,
    "gt_coord": {
      "lat": 52.376485,
      "lon": -1.310233
    },
    "vyra_coord": {
      "lat": 52.37649,
      "lon": -1.310225
    },
    "hybrid_coord": {
      "lat": 52.37649,
      "lon": -1.310225
    },
    "gnss_coord": {
      "lat": 52.376485,
      "lon": -1.310233
    },
    "dr_coord": {
      "lat": 52.372067,
      "lon": -1.315192
    }
  },
  {
    "index": 11750,
    "timestamp": 67293.0,
    "relative_time_s": 1175.0,
    "scenario": "OUTAGE",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.666,
    "degradation_prob": 0.334,
    "dr_uncertainty_std_m": 1.53,
    "dr_survivability_s": 1.94,
    "forecast_gnss": 12.464,
    "forecast_hybrid": 29.517,
    "forecast_dr": 52.287,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.459,
    "gt_coord": {
      "lat": 52.375896,
      "lon": -1.304068
    },
    "vyra_coord": {
      "lat": 52.375899,
      "lon": -1.304072
    },
    "hybrid_coord": {
      "lat": 52.375897,
      "lon": -1.304074
    },
    "gnss_coord": {
      "lat": 52.375899,
      "lon": -1.304071
    },
    "dr_coord": {
      "lat": 52.372213,
      "lon": -1.308944
    }
  },
  {
    "index": 12000,
    "timestamp": 67318.0,
    "relative_time_s": 1200.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.81,
    "forecast_gnss": 0.68,
    "forecast_hybrid": 23.899,
    "forecast_dr": 59.518,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.375562,
      "lon": -1.29802
    },
    "vyra_coord": {
      "lat": 52.375563,
      "lon": -1.298021
    },
    "hybrid_coord": {
      "lat": 52.375562,
      "lon": -1.298021
    },
    "gnss_coord": {
      "lat": 52.375562,
      "lon": -1.29802
    },
    "dr_coord": {
      "lat": 52.372743,
      "lon": -1.302896
    }
  },
  {
    "index": 12250,
    "timestamp": 67343.0,
    "relative_time_s": 1225.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 1.85,
    "forecast_gnss": 0.986,
    "forecast_hybrid": 23.669,
    "forecast_dr": 53.787,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.375897,
      "lon": -1.291543
    },
    "vyra_coord": {
      "lat": 52.375897,
      "lon": -1.291543
    },
    "hybrid_coord": {
      "lat": 52.375897,
      "lon": -1.291543
    },
    "gnss_coord": {
      "lat": 52.375897,
      "lon": -1.291543
    },
    "dr_coord": {
      "lat": 52.374066,
      "lon": -1.29674
    }
  },
  {
    "index": 12500,
    "timestamp": 67368.0,
    "relative_time_s": 1250.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.76,
    "forecast_gnss": 1.536,
    "forecast_hybrid": 19.81,
    "forecast_dr": 14.16,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.375689,
      "lon": -1.286252
    },
    "vyra_coord": {
      "lat": 52.375689,
      "lon": -1.286253
    },
    "hybrid_coord": {
      "lat": 52.375689,
      "lon": -1.286253
    },
    "gnss_coord": {
      "lat": 52.375689,
      "lon": -1.286252
    },
    "dr_coord": {
      "lat": 52.374748,
      "lon": -1.291532
    }
  },
  {
    "index": 12750,
    "timestamp": 67393.0,
    "relative_time_s": 1275.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 3.1,
    "forecast_gnss": 1.585,
    "forecast_hybrid": 14.531,
    "forecast_dr": 15.976,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.375307,
      "lon": -1.281802
    },
    "vyra_coord": {
      "lat": 52.375307,
      "lon": -1.281802
    },
    "hybrid_coord": {
      "lat": 52.375307,
      "lon": -1.281802
    },
    "gnss_coord": {
      "lat": 52.375307,
      "lon": -1.281802
    },
    "dr_coord": {
      "lat": 52.375191,
      "lon": -1.287077
    }
  },
  {
    "index": 13000,
    "timestamp": 67418.0,
    "relative_time_s": 1300.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.76,
    "forecast_gnss": 1.584,
    "forecast_hybrid": 19.857,
    "forecast_dr": 12.198,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.374137,
      "lon": -1.278183
    },
    "vyra_coord": {
      "lat": 52.374137,
      "lon": -1.278184
    },
    "hybrid_coord": {
      "lat": 52.374136,
      "lon": -1.278184
    },
    "gnss_coord": {
      "lat": 52.374137,
      "lon": -1.278183
    },
    "dr_coord": {
      "lat": 52.374823,
      "lon": -1.282998
    }
  },
  {
    "index": 13250,
    "timestamp": 67443.0,
    "relative_time_s": 1325.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 2.285,
    "dr_survivability_s": 16.83,
    "forecast_gnss": 1.291,
    "forecast_hybrid": 10.326,
    "forecast_dr": 12.446,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.373335,
      "lon": -1.276482
    },
    "vyra_coord": {
      "lat": 52.373335,
      "lon": -1.276482
    },
    "hybrid_coord": {
      "lat": 52.373292,
      "lon": -1.27642
    },
    "gnss_coord": {
      "lat": 52.373335,
      "lon": -1.276482
    },
    "dr_coord": {
      "lat": 52.37446,
      "lon": -1.280818
    }
  },
  {
    "index": 13500,
    "timestamp": 67468.0,
    "relative_time_s": 1350.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.097,
    "forecast_hybrid": 10.768,
    "forecast_dr": 8.942,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.373335,
      "lon": -1.276483
    },
    "vyra_coord": {
      "lat": 52.373335,
      "lon": -1.276484
    },
    "hybrid_coord": {
      "lat": 52.373335,
      "lon": -1.276484
    },
    "gnss_coord": {
      "lat": 52.373335,
      "lon": -1.276483
    },
    "dr_coord": {
      "lat": 52.374456,
      "lon": -1.280801
    }
  },
  {
    "index": 13750,
    "timestamp": 67493.0,
    "relative_time_s": 1375.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.551,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.448,
    "forecast_hybrid": 11.118,
    "forecast_dr": 8.798,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.373328,
      "lon": -1.27648
    },
    "vyra_coord": {
      "lat": 52.373328,
      "lon": -1.276481
    },
    "hybrid_coord": {
      "lat": 52.373328,
      "lon": -1.276481
    },
    "gnss_coord": {
      "lat": 52.373328,
      "lon": -1.27648
    },
    "dr_coord": {
      "lat": 52.374454,
      "lon": -1.280796
    }
  },
  {
    "index": 14000,
    "timestamp": 67518.0,
    "relative_time_s": 1400.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.68,
    "forecast_gnss": 1.513,
    "forecast_hybrid": 21.069,
    "forecast_dr": 18.294,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372477,
      "lon": -1.274061
    },
    "vyra_coord": {
      "lat": 52.372477,
      "lon": -1.274061
    },
    "hybrid_coord": {
      "lat": 52.372476,
      "lon": -1.27406
    },
    "gnss_coord": {
      "lat": 52.372477,
      "lon": -1.274061
    },
    "dr_coord": {
      "lat": 52.374312,
      "lon": -1.277974
    }
  },
  {
    "index": 14250,
    "timestamp": 67543.0,
    "relative_time_s": 1425.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.551,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.097,
    "forecast_hybrid": 10.767,
    "forecast_dr": 8.612,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372022,
      "lon": -1.270946
    },
    "vyra_coord": {
      "lat": 52.372022,
      "lon": -1.270946
    },
    "hybrid_coord": {
      "lat": 52.372022,
      "lon": -1.270946
    },
    "gnss_coord": {
      "lat": 52.372022,
      "lon": -1.270946
    },
    "dr_coord": {
      "lat": 52.3747,
      "lon": -1.274819
    }
  },
  {
    "index": 14500,
    "timestamp": 67568.0,
    "relative_time_s": 1450.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.73,
    "forecast_gnss": 1.533,
    "forecast_hybrid": 19.807,
    "forecast_dr": 19.008,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371823,
      "lon": -1.269501
    },
    "vyra_coord": {
      "lat": 52.371823,
      "lon": -1.269501
    },
    "hybrid_coord": {
      "lat": 52.371822,
      "lon": -1.2695
    },
    "gnss_coord": {
      "lat": 52.371823,
      "lon": -1.269501
    },
    "dr_coord": {
      "lat": 52.374896,
      "lon": -1.273349
    }
  },
  {
    "index": 14750,
    "timestamp": 67593.0,
    "relative_time_s": 1475.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 344.957,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 15.391,
    "forecast_hybrid": 16.173,
    "forecast_dr": 15.201,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 1.548,
    "gt_coord": {
      "lat": 52.371172,
      "lon": -1.266688
    },
    "vyra_coord": {
      "lat": 52.371158,
      "lon": -1.266691
    },
    "hybrid_coord": {
      "lat": 52.371158,
      "lon": -1.266691
    },
    "gnss_coord": {
      "lat": 52.371172,
      "lon": -1.266688
    },
    "dr_coord": {
      "lat": 52.375043,
      "lon": -1.270339
    }
  },
  {
    "index": 15000,
    "timestamp": 67618.0,
    "relative_time_s": 1500.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 21.13,
    "forecast_gnss": 1.125,
    "forecast_hybrid": 10.452,
    "forecast_dr": 9.461,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371168,
      "lon": -1.266689
    },
    "vyra_coord": {
      "lat": 52.371168,
      "lon": -1.266689
    },
    "hybrid_coord": {
      "lat": 52.371169,
      "lon": -1.266689
    },
    "gnss_coord": {
      "lat": 52.371168,
      "lon": -1.266689
    },
    "dr_coord": {
      "lat": 52.375044,
      "lon": -1.270333
    }
  },
  {
    "index": 15250,
    "timestamp": 67643.0,
    "relative_time_s": 1525.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 4.22,
    "forecast_gnss": 1.512,
    "forecast_hybrid": 10.998,
    "forecast_dr": 19.085,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.370764,
      "lon": -1.264831
    },
    "vyra_coord": {
      "lat": 52.370764,
      "lon": -1.264831
    },
    "hybrid_coord": {
      "lat": 52.370764,
      "lon": -1.264831
    },
    "gnss_coord": {
      "lat": 52.370764,
      "lon": -1.264831
    },
    "dr_coord": {
      "lat": 52.375183,
      "lon": -1.268355
    }
  },
  {
    "index": 15500,
    "timestamp": 67668.0,
    "relative_time_s": 1550.0,
    "scenario": "OUTAGE",
    "is_outage": true,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 26.567,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 19.552,
    "forecast_hybrid": 20.093,
    "forecast_dr": 18.434,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 1.191,
    "gt_coord": {
      "lat": 52.37052,
      "lon": -1.261832
    },
    "vyra_coord": {
      "lat": 52.370529,
      "lon": -1.261821
    },
    "hybrid_coord": {
      "lat": 52.370529,
      "lon": -1.261821
    },
    "gnss_coord": {
      "lat": 52.37052,
      "lon": -1.261832
    },
    "dr_coord": {
      "lat": 52.37585,
      "lon": -1.265501
    }
  },
  {
    "index": 15750,
    "timestamp": 67693.0,
    "relative_time_s": 1575.0,
    "scenario": "OUTAGE",
    "is_outage": false,
    "is_degraded": true,
    "gnss_quality": 0.0,
    "degradation_prob": 1.0,
    "dr_uncertainty_std_m": 2224.739,
    "dr_survivability_s": 0.0,
    "forecast_gnss": 21.824,
    "forecast_hybrid": 22.365,
    "forecast_dr": 20.739,
    "selected_mode": "HYBRID",
    "decision_reason": "emergency_override",
    "current_error_m": 2.615,
    "gt_coord": {
      "lat": 52.370022,
      "lon": -1.257353
    },
    "vyra_coord": {
      "lat": 52.370034,
      "lon": -1.257319
    },
    "hybrid_coord": {
      "lat": 52.370033,
      "lon": -1.25732
    },
    "gnss_coord": {
      "lat": 52.370031,
      "lon": -1.257355
    },
    "dr_coord": {
      "lat": 52.376771,
      "lon": -1.261181
    }
  },
  {
    "index": 16000,
    "timestamp": 67718.0,
    "relative_time_s": 1600.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.7,
    "forecast_gnss": 1.628,
    "forecast_hybrid": 19.891,
    "forecast_dr": 19.195,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.36952,
      "lon": -1.253918
    },
    "vyra_coord": {
      "lat": 52.36952,
      "lon": -1.253918
    },
    "hybrid_coord": {
      "lat": 52.369519,
      "lon": -1.253918
    },
    "gnss_coord": {
      "lat": 52.36952,
      "lon": -1.253918
    },
    "dr_coord": {
      "lat": 52.377364,
      "lon": -1.25777
    }
  },
  {
    "index": 16250,
    "timestamp": 67743.0,
    "relative_time_s": 1625.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.895,
    "degradation_prob": 0.105,
    "dr_uncertainty_std_m": 0.626,
    "dr_survivability_s": 2.7,
    "forecast_gnss": 5.236,
    "forecast_hybrid": 28.126,
    "forecast_dr": 27.49,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.368558,
      "lon": -1.249816
    },
    "vyra_coord": {
      "lat": 52.368558,
      "lon": -1.249817
    },
    "hybrid_coord": {
      "lat": 52.368557,
      "lon": -1.249818
    },
    "gnss_coord": {
      "lat": 52.368558,
      "lon": -1.249816
    },
    "dr_coord": {
      "lat": 52.377688,
      "lon": -1.253376
    }
  },
  {
    "index": 16500,
    "timestamp": 67768.0,
    "relative_time_s": 1650.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 3.01,
    "forecast_gnss": 1.577,
    "forecast_hybrid": 19.188,
    "forecast_dr": 26.491,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.367347,
      "lon": -1.246566
    },
    "vyra_coord": {
      "lat": 52.367347,
      "lon": -1.246566
    },
    "hybrid_coord": {
      "lat": 52.367346,
      "lon": -1.246567
    },
    "gnss_coord": {
      "lat": 52.367347,
      "lon": -1.246566
    },
    "dr_coord": {
      "lat": 52.377489,
      "lon": -1.249578
    }
  },
  {
    "index": 16750,
    "timestamp": 67793.0,
    "relative_time_s": 1675.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 3.01,
    "forecast_gnss": 1.408,
    "forecast_hybrid": 19.03,
    "forecast_dr": 16.306,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.365838,
      "lon": -1.243284
    },
    "vyra_coord": {
      "lat": 52.365838,
      "lon": -1.243284
    },
    "hybrid_coord": {
      "lat": 52.365838,
      "lon": -1.243285
    },
    "gnss_coord": {
      "lat": 52.365838,
      "lon": -1.243284
    },
    "dr_coord": {
      "lat": 52.376963,
      "lon": -1.245558
    }
  },
  {
    "index": 17000,
    "timestamp": 67818.0,
    "relative_time_s": 1700.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.63,
    "forecast_gnss": 1.635,
    "forecast_hybrid": 19.899,
    "forecast_dr": 20.378,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.3643,
      "lon": -1.240543
    },
    "vyra_coord": {
      "lat": 52.3643,
      "lon": -1.240543
    },
    "hybrid_coord": {
      "lat": 52.364299,
      "lon": -1.240543
    },
    "gnss_coord": {
      "lat": 52.3643,
      "lon": -1.240543
    },
    "dr_coord": {
      "lat": 52.376194,
      "lon": -1.242037
    }
  },
  {
    "index": 17250,
    "timestamp": 67843.0,
    "relative_time_s": 1725.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.988,
    "degradation_prob": 0.012,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.97,
    "forecast_gnss": 1.643,
    "forecast_hybrid": 16.175,
    "forecast_dr": 26.516,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.36281,
      "lon": -1.236916
    },
    "vyra_coord": {
      "lat": 52.36281,
      "lon": -1.236916
    },
    "hybrid_coord": {
      "lat": 52.362809,
      "lon": -1.236918
    },
    "gnss_coord": {
      "lat": 52.36281,
      "lon": -1.236916
    },
    "dr_coord": {
      "lat": 52.375589,
      "lon": -1.237747
    }
  },
  {
    "index": 17500,
    "timestamp": 67868.0,
    "relative_time_s": 1750.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.556,
    "dr_survivability_s": 3.53,
    "forecast_gnss": 1.637,
    "forecast_hybrid": 13.077,
    "forecast_dr": 19.652,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.364012,
      "lon": -1.234824
    },
    "vyra_coord": {
      "lat": 52.364012,
      "lon": -1.234824
    },
    "hybrid_coord": {
      "lat": 52.364013,
      "lon": -1.234823
    },
    "gnss_coord": {
      "lat": 52.364012,
      "lon": -1.234824
    },
    "dr_coord": {
      "lat": 52.377186,
      "lon": -1.236493
    }
  },
  {
    "index": 17750,
    "timestamp": 67893.0,
    "relative_time_s": 1775.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.994,
    "degradation_prob": 0.006,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.63,
    "forecast_gnss": 1.683,
    "forecast_hybrid": 13.123,
    "forecast_dr": 16.127,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.3655,
      "lon": -1.234881
    },
    "vyra_coord": {
      "lat": 52.3655,
      "lon": -1.234881
    },
    "hybrid_coord": {
      "lat": 52.365501,
      "lon": -1.234882
    },
    "gnss_coord": {
      "lat": 52.3655,
      "lon": -1.234881
    },
    "dr_coord": {
      "lat": 52.37857,
      "lon": -1.237448
    }
  },
  {
    "index": 18000,
    "timestamp": 67918.0,
    "relative_time_s": 1800.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.705,
    "dr_survivability_s": 17.32,
    "forecast_gnss": 1.249,
    "forecast_hybrid": 10.294,
    "forecast_dr": 8.809,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.365463,
      "lon": -1.236747
    },
    "vyra_coord": {
      "lat": 52.365463,
      "lon": -1.236748
    },
    "hybrid_coord": {
      "lat": 52.365455,
      "lon": -1.236764
    },
    "gnss_coord": {
      "lat": 52.365463,
      "lon": -1.236747
    },
    "dr_coord": {
      "lat": 52.378118,
      "lon": -1.239201
    }
  },
  {
    "index": 18250,
    "timestamp": 67943.0,
    "relative_time_s": 1825.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 8.73,
    "forecast_gnss": 1.304,
    "forecast_hybrid": 11.459,
    "forecast_dr": 13.405,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.366104,
      "lon": -1.237071
    },
    "vyra_coord": {
      "lat": 52.366104,
      "lon": -1.237071
    },
    "hybrid_coord": {
      "lat": 52.366104,
      "lon": -1.237071
    },
    "gnss_coord": {
      "lat": 52.366104,
      "lon": -1.237071
    },
    "dr_coord": {
      "lat": 52.378613,
      "lon": -1.239943
    }
  },
  {
    "index": 18500,
    "timestamp": 67968.0,
    "relative_time_s": 1850.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 3.73,
    "forecast_gnss": 1.416,
    "forecast_hybrid": 17.532,
    "forecast_dr": 23.082,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.366156,
      "lon": -1.233305
    },
    "vyra_coord": {
      "lat": 52.366156,
      "lon": -1.233306
    },
    "hybrid_coord": {
      "lat": 52.366155,
      "lon": -1.233306
    },
    "gnss_coord": {
      "lat": 52.366156,
      "lon": -1.233305
    },
    "dr_coord": {
      "lat": 52.379501,
      "lon": -1.236422
    }
  },
  {
    "index": 18750,
    "timestamp": 67993.0,
    "relative_time_s": 1875.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.994,
    "degradation_prob": 0.006,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.81,
    "forecast_gnss": 1.595,
    "forecast_hybrid": 16.127,
    "forecast_dr": 16.303,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.364646,
      "lon": -1.231223
    },
    "vyra_coord": {
      "lat": 52.364646,
      "lon": -1.231223
    },
    "hybrid_coord": {
      "lat": 52.364646,
      "lon": -1.231224
    },
    "gnss_coord": {
      "lat": 52.364646,
      "lon": -1.231223
    },
    "dr_coord": {
      "lat": 52.37852,
      "lon": -1.233595
    }
  },
  {
    "index": 19000,
    "timestamp": 68018.0,
    "relative_time_s": 1900.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 8.19,
    "forecast_gnss": 1.212,
    "forecast_hybrid": 11.377,
    "forecast_dr": 10.844,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.364307,
      "lon": -1.22924
    },
    "vyra_coord": {
      "lat": 52.364307,
      "lon": -1.229241
    },
    "hybrid_coord": {
      "lat": 52.364308,
      "lon": -1.22924
    },
    "gnss_coord": {
      "lat": 52.364307,
      "lon": -1.22924
    },
    "dr_coord": {
      "lat": 52.378621,
      "lon": -1.23153
    }
  },
  {
    "index": 19250,
    "timestamp": 68043.0,
    "relative_time_s": 1925.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.892,
    "dr_survivability_s": 16.69,
    "forecast_gnss": 1.286,
    "forecast_hybrid": 10.332,
    "forecast_dr": 9.148,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.363231,
      "lon": -1.22892
    },
    "vyra_coord": {
      "lat": 52.363231,
      "lon": -1.228921
    },
    "hybrid_coord": {
      "lat": 52.36321,
      "lon": -1.228944
    },
    "gnss_coord": {
      "lat": 52.363231,
      "lon": -1.22892
    },
    "dr_coord": {
      "lat": 52.37764,
      "lon": -1.230613
    }
  },
  {
    "index": 19500,
    "timestamp": 68068.0,
    "relative_time_s": 1950.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 5.99,
    "forecast_gnss": 1.099,
    "forecast_hybrid": 10.594,
    "forecast_dr": 16.767,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.364294,
      "lon": -1.229204
    },
    "vyra_coord": {
      "lat": 52.364295,
      "lon": -1.229205
    },
    "hybrid_coord": {
      "lat": 52.364295,
      "lon": -1.229205
    },
    "gnss_coord": {
      "lat": 52.364294,
      "lon": -1.229204
    },
    "dr_coord": {
      "lat": 52.378487,
      "lon": -1.231672
    }
  },
  {
    "index": 19750,
    "timestamp": 68093.0,
    "relative_time_s": 1975.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.85,
    "forecast_gnss": 1.656,
    "forecast_hybrid": 16.187,
    "forecast_dr": 20.966,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.364645,
      "lon": -1.231223
    },
    "vyra_coord": {
      "lat": 52.364645,
      "lon": -1.231224
    },
    "hybrid_coord": {
      "lat": 52.364646,
      "lon": -1.231223
    },
    "gnss_coord": {
      "lat": 52.364645,
      "lon": -1.231223
    },
    "dr_coord": {
      "lat": 52.37829,
      "lon": -1.233794
    }
  },
  {
    "index": 20000,
    "timestamp": 68118.0,
    "relative_time_s": 2000.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 6.94,
    "forecast_gnss": 1.25,
    "forecast_hybrid": 11.405,
    "forecast_dr": 15.053,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.366096,
      "lon": -1.23307
    },
    "vyra_coord": {
      "lat": 52.366096,
      "lon": -1.23307
    },
    "hybrid_coord": {
      "lat": 52.366096,
      "lon": -1.23307
    },
    "gnss_coord": {
      "lat": 52.366096,
      "lon": -1.23307
    },
    "dr_coord": {
      "lat": 52.379084,
      "lon": -1.236521
    }
  },
  {
    "index": 20250,
    "timestamp": 68143.0,
    "relative_time_s": 2025.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.555,
    "dr_survivability_s": 4.73,
    "forecast_gnss": 1.805,
    "forecast_hybrid": 15.679,
    "forecast_dr": 17.536,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.366119,
      "lon": -1.23694
    },
    "vyra_coord": {
      "lat": 52.366119,
      "lon": -1.23694
    },
    "hybrid_coord": {
      "lat": 52.366118,
      "lon": -1.23694
    },
    "gnss_coord": {
      "lat": 52.366119,
      "lon": -1.23694
    },
    "dr_coord": {
      "lat": 52.378006,
      "lon": -1.24005
    }
  },
  {
    "index": 20500,
    "timestamp": 68168.0,
    "relative_time_s": 2050.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.555,
    "dr_survivability_s": 3.33,
    "forecast_gnss": 1.66,
    "forecast_hybrid": 13.1,
    "forecast_dr": 29.522,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.366605,
      "lon": -1.240142
    },
    "vyra_coord": {
      "lat": 52.366605,
      "lon": -1.240143
    },
    "hybrid_coord": {
      "lat": 52.366604,
      "lon": -1.240141
    },
    "gnss_coord": {
      "lat": 52.366605,
      "lon": -1.240142
    },
    "dr_coord": {
      "lat": 52.377499,
      "lon": -1.243254
    }
  },
  {
    "index": 20750,
    "timestamp": 68193.0,
    "relative_time_s": 2075.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.892,
    "degradation_prob": 0.108,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 4.0,
    "forecast_gnss": 9.848,
    "forecast_hybrid": 22.187,
    "forecast_dr": 21.672,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.367717,
      "lon": -1.242112
    },
    "vyra_coord": {
      "lat": 52.367717,
      "lon": -1.242113
    },
    "hybrid_coord": {
      "lat": 52.367718,
      "lon": -1.242112
    },
    "gnss_coord": {
      "lat": 52.367717,
      "lon": -1.242112
    },
    "dr_coord": {
      "lat": 52.377881,
      "lon": -1.24586
    }
  },
  {
    "index": 21000,
    "timestamp": 68218.0,
    "relative_time_s": 2100.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.587,
    "dr_survivability_s": 5.36,
    "forecast_gnss": 1.579,
    "forecast_hybrid": 15.736,
    "forecast_dr": 11.244,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.368775,
      "lon": -1.240252
    },
    "vyra_coord": {
      "lat": 52.368775,
      "lon": -1.240252
    },
    "hybrid_coord": {
      "lat": 52.368775,
      "lon": -1.240252
    },
    "gnss_coord": {
      "lat": 52.368775,
      "lon": -1.240252
    },
    "dr_coord": {
      "lat": 52.379385,
      "lon": -1.245128
    }
  },
  {
    "index": 21250,
    "timestamp": 68243.0,
    "relative_time_s": 2125.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.601,
    "dr_survivability_s": 5.5,
    "forecast_gnss": 1.548,
    "forecast_hybrid": 15.723,
    "forecast_dr": 12.296,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.368648,
      "lon": -1.24044
    },
    "vyra_coord": {
      "lat": 52.368649,
      "lon": -1.240441
    },
    "hybrid_coord": {
      "lat": 52.368648,
      "lon": -1.240441
    },
    "gnss_coord": {
      "lat": 52.368648,
      "lon": -1.24044
    },
    "dr_coord": {
      "lat": 52.379205,
      "lon": -1.245162
    }
  },
  {
    "index": 21500,
    "timestamp": 68268.0,
    "relative_time_s": 2150.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.995,
    "degradation_prob": 0.005,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 4.61,
    "forecast_gnss": 1.561,
    "forecast_hybrid": 11.046,
    "forecast_dr": 15.183,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.369529,
      "lon": -1.241199
    },
    "vyra_coord": {
      "lat": 52.369529,
      "lon": -1.241199
    },
    "hybrid_coord": {
      "lat": 52.369529,
      "lon": -1.241199
    },
    "gnss_coord": {
      "lat": 52.369529,
      "lon": -1.241199
    },
    "dr_coord": {
      "lat": 52.379657,
      "lon": -1.246636
    }
  },
  {
    "index": 21750,
    "timestamp": 68293.0,
    "relative_time_s": 2175.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 4.76,
    "forecast_gnss": 1.54,
    "forecast_hybrid": 11.026,
    "forecast_dr": 13.463,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.370129,
      "lon": -1.242278
    },
    "vyra_coord": {
      "lat": 52.370129,
      "lon": -1.242278
    },
    "hybrid_coord": {
      "lat": 52.370129,
      "lon": -1.242278
    },
    "gnss_coord": {
      "lat": 52.370129,
      "lon": -1.242278
    },
    "dr_coord": {
      "lat": 52.37975,
      "lon": -1.248105
    }
  },
  {
    "index": 22000,
    "timestamp": 68318.0,
    "relative_time_s": 2200.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.05,
    "forecast_gnss": 1.629,
    "forecast_hybrid": 14.564,
    "forecast_dr": 28.579,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.370926,
      "lon": -1.24059
    },
    "vyra_coord": {
      "lat": 52.370926,
      "lon": -1.24059
    },
    "hybrid_coord": {
      "lat": 52.370926,
      "lon": -1.240589
    },
    "gnss_coord": {
      "lat": 52.370926,
      "lon": -1.24059
    },
    "dr_coord": {
      "lat": 52.381039,
      "lon": -1.247583
    }
  },
  {
    "index": 22250,
    "timestamp": 68343.0,
    "relative_time_s": 2225.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.989,
    "degradation_prob": 0.011,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 3.17,
    "forecast_gnss": 1.631,
    "forecast_hybrid": 15.786,
    "forecast_dr": 22.255,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372183,
      "lon": -1.240217
    },
    "vyra_coord": {
      "lat": 52.372183,
      "lon": -1.240217
    },
    "hybrid_coord": {
      "lat": 52.372184,
      "lon": -1.240217
    },
    "gnss_coord": {
      "lat": 52.372183,
      "lon": -1.240217
    },
    "dr_coord": {
      "lat": 52.382152,
      "lon": -1.248612
    }
  },
  {
    "index": 22500,
    "timestamp": 68368.0,
    "relative_time_s": 2250.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.554,
    "dr_survivability_s": 11.99,
    "forecast_gnss": 1.348,
    "forecast_hybrid": 11.503,
    "forecast_dr": 12.952,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372622,
      "lon": -1.242798
    },
    "vyra_coord": {
      "lat": 52.372622,
      "lon": -1.242798
    },
    "hybrid_coord": {
      "lat": 52.372622,
      "lon": -1.242799
    },
    "gnss_coord": {
      "lat": 52.372622,
      "lon": -1.242798
    },
    "dr_coord": {
      "lat": 52.381469,
      "lon": -1.251056
    }
  },
  {
    "index": 22750,
    "timestamp": 68393.0,
    "relative_time_s": 2275.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 5.21,
    "forecast_gnss": 1.476,
    "forecast_hybrid": 10.972,
    "forecast_dr": 13.794,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371656,
      "lon": -1.241497
    },
    "vyra_coord": {
      "lat": 52.371656,
      "lon": -1.241497
    },
    "hybrid_coord": {
      "lat": 52.371655,
      "lon": -1.241496
    },
    "gnss_coord": {
      "lat": 52.371656,
      "lon": -1.241497
    },
    "dr_coord": {
      "lat": 52.381203,
      "lon": -1.249038
    }
  },
  {
    "index": 23000,
    "timestamp": 68418.0,
    "relative_time_s": 2300.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.998,
    "degradation_prob": 0.002,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 5.58,
    "forecast_gnss": 1.522,
    "forecast_hybrid": 11.018,
    "forecast_dr": 13.481,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371741,
      "lon": -1.241293
    },
    "vyra_coord": {
      "lat": 52.371741,
      "lon": -1.241293
    },
    "hybrid_coord": {
      "lat": 52.371742,
      "lon": -1.241293
    },
    "gnss_coord": {
      "lat": 52.371741,
      "lon": -1.241293
    },
    "dr_coord": {
      "lat": 52.381344,
      "lon": -1.248959
    }
  },
  {
    "index": 23250,
    "timestamp": 68443.0,
    "relative_time_s": 2325.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.995,
    "degradation_prob": 0.005,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 4.89,
    "forecast_gnss": 1.548,
    "forecast_hybrid": 11.034,
    "forecast_dr": 17.859,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371603,
      "lon": -1.242088
    },
    "vyra_coord": {
      "lat": 52.371603,
      "lon": -1.242089
    },
    "hybrid_coord": {
      "lat": 52.371604,
      "lon": -1.242089
    },
    "gnss_coord": {
      "lat": 52.371603,
      "lon": -1.242088
    },
    "dr_coord": {
      "lat": 52.380899,
      "lon": -1.2494
    }
  },
  {
    "index": 23500,
    "timestamp": 68468.0,
    "relative_time_s": 2350.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.997,
    "degradation_prob": 0.003,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 3.79,
    "forecast_gnss": 1.589,
    "forecast_hybrid": 13.029,
    "forecast_dr": 17.028,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372923,
      "lon": -1.243154
    },
    "vyra_coord": {
      "lat": 52.372923,
      "lon": -1.243154
    },
    "hybrid_coord": {
      "lat": 52.372923,
      "lon": -1.243154
    },
    "gnss_coord": {
      "lat": 52.372923,
      "lon": -1.243154
    },
    "dr_coord": {
      "lat": 52.381411,
      "lon": -1.25169
    }
  },
  {
    "index": 23750,
    "timestamp": 68493.0,
    "relative_time_s": 2375.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 1.0,
    "degradation_prob": 0.0,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 2.4,
    "forecast_gnss": 1.538,
    "forecast_hybrid": 23.404,
    "forecast_dr": 21.835,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372715,
      "lon": -1.245849
    },
    "vyra_coord": {
      "lat": 52.372715,
      "lon": -1.245849
    },
    "hybrid_coord": {
      "lat": 52.372715,
      "lon": -1.24585
    },
    "gnss_coord": {
      "lat": 52.372715,
      "lon": -1.245849
    },
    "dr_coord": {
      "lat": 52.380075,
      "lon": -1.253331
    }
  },
  {
    "index": 24000,
    "timestamp": 68518.0,
    "relative_time_s": 2400.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.789,
    "degradation_prob": 0.211,
    "dr_uncertainty_std_m": 0.662,
    "dr_survivability_s": 2.57,
    "forecast_gnss": 17.963,
    "forecast_hybrid": 30.553,
    "forecast_dr": 33.605,
    "selected_mode": "GNSS",
    "decision_reason": "emergency_override",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.372263,
      "lon": -1.250497
    },
    "vyra_coord": {
      "lat": 52.372263,
      "lon": -1.250497
    },
    "hybrid_coord": {
      "lat": 52.372264,
      "lon": -1.250498
    },
    "gnss_coord": {
      "lat": 52.372263,
      "lon": -1.250497
    },
    "dr_coord": {
      "lat": 52.377635,
      "lon": -1.255884
    }
  },
  {
    "index": 24250,
    "timestamp": 68543.0,
    "relative_time_s": 2425.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 4.5,
    "forecast_gnss": 1.458,
    "forecast_hybrid": 15.63,
    "forecast_dr": 20.39,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.371464,
      "lon": -1.254077
    },
    "vyra_coord": {
      "lat": 52.371464,
      "lon": -1.254077
    },
    "hybrid_coord": {
      "lat": 52.371464,
      "lon": -1.254078
    },
    "gnss_coord": {
      "lat": 52.371464,
      "lon": -1.254077
    },
    "dr_coord": {
      "lat": 52.375422,
      "lon": -1.257106
    }
  },
  {
    "index": 24500,
    "timestamp": 68568.0,
    "relative_time_s": 2450.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.999,
    "degradation_prob": 0.001,
    "dr_uncertainty_std_m": 0.552,
    "dr_survivability_s": 4.61,
    "forecast_gnss": 1.37,
    "forecast_hybrid": 10.865,
    "forecast_dr": 27.94,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.37172,
      "lon": -1.254114
    },
    "vyra_coord": {
      "lat": 52.37172,
      "lon": -1.254114
    },
    "hybrid_coord": {
      "lat": 52.371721,
      "lon": -1.254113
    },
    "gnss_coord": {
      "lat": 52.37172,
      "lon": -1.254114
    },
    "dr_coord": {
      "lat": 52.375566,
      "lon": -1.257477
    }
  },
  {
    "index": 24620,
    "timestamp": 68580.0,
    "relative_time_s": 2462.0,
    "scenario": "NORMAL",
    "is_outage": false,
    "is_degraded": false,
    "gnss_quality": 0.996,
    "degradation_prob": 0.004,
    "dr_uncertainty_std_m": 0.553,
    "dr_survivability_s": 2.68,
    "forecast_gnss": 1.562,
    "forecast_hybrid": 21.118,
    "forecast_dr": 29.906,
    "selected_mode": "GNSS",
    "decision_reason": "maintain_optimal_mode",
    "current_error_m": 0.0,
    "gt_coord": {
      "lat": 52.370754,
      "lon": -1.254347
    },
    "vyra_coord": {
      "lat": 52.370754,
      "lon": -1.254348
    },
    "hybrid_coord": {
      "lat": 52.370753,
      "lon": -1.254348
    },
    "gnss_coord": {
      "lat": 52.370754,
      "lon": -1.254347
    },
    "dr_coord": {
      "lat": 52.374883,
      "lon": -1.256304
    }
  }
];

export const FALLBACK_INITIAL_STATE = {
  status: 'paused',
  current_index: 0,
  total_epochs: 24621,
  speed_multiplier: 1.0,
  scenario: 'NORMAL',
  trajectory_id: 'V-S3a',
  telemetry: FALLBACK_CHECKPOINTS[0],
};

/**
 * Returns authentic telemetry corresponding to index in V-S3a.
 */
export function getFallbackTelemetry(index = 0) {
  if (!FALLBACK_CHECKPOINTS || FALLBACK_CHECKPOINTS.length === 0) {
    return FALLBACK_INITIAL_STATE.telemetry;
  }
  const total = 24621;
  const clampedIdx = Math.max(0, Math.min(total - 1, index));
  const ratio = clampedIdx / (total - 1);
  const cpIndex = Math.min(
    FALLBACK_CHECKPOINTS.length - 1,
    Math.round(ratio * (FALLBACK_CHECKPOINTS.length - 1))
  );
  const cp = FALLBACK_CHECKPOINTS[cpIndex];
  return {
    ...cp,
    index: clampedIdx,
    relative_time_s: parseFloat((clampedIdx * 0.1).toFixed(1)),
  };
}
