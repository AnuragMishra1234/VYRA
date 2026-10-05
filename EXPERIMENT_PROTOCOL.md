# VYRA: Experiment Protocol & Methodology

## 1. Experiment Specification Template

Every major experiment conducted in VYRA must adhere to this structured protocol template:

```yaml
Experiment_ID: EXP-XXX
Hypothesis: >
  Explicit statement predicting how the independent variable impacts the dependent variable.
Independent_Variable: Navigation policy / Forecast horizon / Outage duration / Threshold
Dependent_Variables:
  - Absolute Trajectory Error (ATE)
  - Root Mean Square Error (RMSE)
  - Time above error threshold (s)
  - Total handover count
  - Warning lead time (s)
Baselines:
  - GNSS-only
  - Pure DR
  - Reactive Threshold Switching
  - Fixed Hybrid (EKF)
Dataset_Splits:
  Train: Trajectory IDs [TRAIN_IDS]
  Validation: Trajectory IDs [VAL_IDS]
  Test: Trajectory IDs [TEST_IDS] (Unseen)
Parameters:
  Error_Threshold: 10.0 m (also sensitivity-tested at 5.0m, 20.0m)
  Random_Seed: 42
  Forecast_Horizon: 5.0 s
Interpretation_Criteria:
  Positive_Result: Statistically significant (p < 0.05) reduction in threshold violations without excessive chattering.
  Negative_Result: No significant difference over reactive switching or excessive false handovers.
```

---

## 2. Controlled Degradation & Outage Protocol

To ensure reproducible benchmarking, real trajectory recordings are perturbed via software-based controlled degradation scenarios:

### Outage Duration Matrix
Controlled zero-GNSS outage intervals:
- **Brief:** $2\text{s}$
- **Short:** $5\text{s}$
- **Medium:** $10\text{s}$
- **Extended:** $20\text{s}$
- **Severe:** $30\text{s}$

### Degradation Profile Phases
1. **Normal Operation:** Pristine GNSS signals from recording.
2. **Mild Degradation:** Increased pseudorange noise, satellite count reduced by $25\%$.
3. **Moderate Degradation:** Satellite count reduced to 4–5, HDOP elevated, multipath noise added.
4. **Severe Degradation:** HDOP $> 6$, high position jitter, satellite count reduced to $<4$.
5. **Complete Outage:** Total loss of GNSS position updates ($0$ satellites received).
6. **Recovery:** Progressive signal reacquisition (outage $\to$ weak $\to$ moderate $\to$ normal).

> [!IMPORTANT]
> **Experimental Rule:** All software perturbations are explicitly documented as **controlled software-simulated outages**. They must never be described as real-world RF jamming or hardware spoofing.

---

## 3. Evaluated Baselines

Every test run evaluates five methods under identical scenario timing and perturbation injections:
1. **B1: GNSS-only:** Accepts raw GNSS position whenever fix exists; holds last position during outages.
2. **B2: Pure DR:** Propagates motion using strapdown inertial mechanization without any GNSS updates.
3. **B3: Reactive Switching:** Instantaneous threshold policy (switches to DR when HDOP $> \tau_{\text{HDOP}}$ or satellites $< 4$; switches back immediately upon recovery).
4. **B4: Fixed Hybrid:** Standard loosely-coupled EKF continuously fusing GNSS and IMU without adaptive mode rejection.
5. **VYRA:** Forecast-driven adaptive policy utilizing action-conditioned error prediction, DR survivability, and switching penalties.

---

## 4. Evaluation Metrics Formulation

### Localization Metrics
- **Absolute Trajectory Error (ATE):**
  $$\text{ATE} = \sqrt{\frac{1}{N} \sum_{k=1}^N \|\mathbf{p}_k^{\text{est}} - \mathbf{p}_k^{\text{gt}}\|^2}$$
- **Relative Trajectory Error (RTE):** Error over fixed travel intervals $\Delta t$.
- **Maximum Error:** $\max_k \|\mathbf{p}_k^{\text{est}} - \mathbf{p}_k^{\text{gt}}\|$.
- **Final Drift:** Displacement error at the end of the outage window.
- **Error-Bound Violation Ratio:** $\frac{1}{N} \sum_{k=1}^N \mathbb{I}(\|\mathbf{p}_k^{\text{est}} - \mathbf{p}_k^{\text{gt}}\| > E_{\text{threshold}})$.

### Policy and Switching Metrics
- **Total Handover Count:** $\sum_{k=2}^N \mathbb{I}(\text{Mode}_k \ne \text{Mode}_{k-1})$.
- **False Handover Rate:** Switches away from GNSS when GNSS error was actually $< E_{\text{threshold}}$.
- **Missed Handover Rate:** Remaining in GNSS when GNSS error exceeded $E_{\text{threshold}}$.
- **Warning Lead Time ($t_{\text{lead}}$):** Elapsed time between early degradation alarm and actual outage onset.

---

## 5. Ablation Studies Matrix

To isolate the source of any observed improvements, the system undergoes systematic ablations:
- **Ablation A:** Remove GNSS degradation prediction (policy acts without advance degradation warning).
- **Ablation B:** Remove DR survivability estimation (policy assumes DR has unbounded validity).
- **Ablation C:** Remove uncertainty covariance handling.
- **Ablation D:** Remove action-conditioned counterfactual forecasting (policy relies only on current state indicators).
- **Ablation E:** Current GNSS quality only (reverts to reactive indicator policy).
- **Ablation F:** Remove switching penalties and dwell time (evaluate policy chattering).

---

## 6. Reproducibility & Integrity Standards

1. **Strict Temporal Splits:** Trajectories are split by physical drive IDs, never shuffled across time steps.
2. **Frozen Configurations:** All policy thresholds and hyperparameters are set via YAML configuration files and frozen prior to test set evaluation.
3. **Multi-Trajectory Statistics:** Experiments report Mean, Median, Standard Deviation, and 95% Confidence Intervals across multiple distinct test trajectories. Single favorable trajectories are never reported as standalone proof.
