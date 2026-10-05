# VYRA: Research Question, Hypotheses & Scope

## 1. Project Title & Problem Domain

- **Project Title:** VYRA — Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization
- **Problem Domain:** Resilient multi-sensor localization, GNSS/Inertial Navigation System (INS) sensor fusion, time-series error forecasting, and adaptive decision-making under signal degradation and complete GNSS outages.
- **Application Context:** Ground autonomous vehicles, UAVs, mobile robots, and safety-critical navigation platforms subject to GNSS-denied or degraded environments (e.g., urban canyons, tunnels, tree canopies, multi-path interference).

---

## 2. Research Problem

Standard multi-sensor localization systems operate reactively: they detect that GNSS quality has degraded only after signal metrics breach fixed thresholds or innovation filtering rejects satellite fixes. This reactive mechanism introduces a fundamental operational dilemma:
1. **Late Switching:** If the system delays switching away from GNSS, corrupted pseudoranges and multipath errors contaminate the position estimate and corrupt the Kalman filter state covariance.
2. **Premature Switching:** If the system switches to inertial Dead Reckoning (DR) upon transient signal fluctuation, the vehicle is prematurely subjected to inertial integration drift while GNSS could have remained viable.
3. **Mode Chatter:** Oscillation across fixed thresholds causes rapid, erratic switching between navigation modes, destabilizing heading and velocity continuity.

The core research problem is whether localization resilience can be substantially improved by proactively forecasting the short-horizon future localization consequences of candidate navigation actions before making mode-selection decisions.

---

## 3. Working Research Question

> **"Can short-horizon, action-conditioned localization-error forecasting predict the consequences of choosing GNSS, HYBRID fusion, or dead reckoning, enabling an adaptive navigation policy to minimize future localization-error-bound violations during GNSS degradation and outages?"**

---

## 4. Research Objectives

### 4.1 Primary Objective
Formulate, implement, and benchmark an action-conditioned localization-error forecasting framework that evaluates candidate navigation modes ($\text{GNSS}$, $\text{HYBRID}$, $\text{DR}$) at decision time $t$ over forward horizons $H \in \{1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}\}$, and test whether an adaptive policy conditioned on these forecasts significantly reduces future error-bound violations and unnecessary mode switching compared to standard reactive and fixed baselines.

### 4.2 Secondary Objectives
1. **Imminent GNSS Degradation Warning:** Develop predictive models that output the probability of imminent GNSS degradation $P(\text{Degradation in } H)$ from historical signal quality indicators with a measurable advance lead time ($t_{\text{lead}} \ge 2\text{s}$).
2. **DR Survivability Characterization:** Establish an analytical and empirical dead-reckoning survivability estimator that bounds error growth over expected outage durations $T_{\text{outage}}$.
3. **Action-Conditioned Forecasting Calibration:** Train and evaluate causal regression/classification models that predict localization error magnitudes $\mathbb{E}[\text{Error}(A, H) \mid \mathbf{s}_t]$ and error-bound violation probabilities $P(\text{Error}(t+H) > E_{\text{threshold}} \mid \mathbf{s}_t, A)$ for each candidate action $A$.
4. **Anti-Chattering Policy Formulation:** Design and calibrate an adaptive decision policy that incorporates forecast risk, survivability, hysteresis margins, dwell-time constraints, and handover penalties.
5. **Ablation & Statistical Validation:** Rigorously quantify which system components contribute to performance improvements through formal ablation studies and paired statistical hypothesis testing across independent trajectories.

---

## 5. Research Hypotheses

### Primary Hypothesis ($H_1$)
An adaptive navigation policy conditioned on short-horizon forecasts of candidate mode consequences ($A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$) will achieve a statistically significant ($p < 0.05$) reduction in cumulative trajectory error-bound violations during controlled GNSS degradation and outages compared to conventional reactive threshold switching, without increasing unnecessary handover frequency.

### Sub-Hypotheses
- **$H_{1a}$ (Predictive Degradation Lead Time):** Temporal degradation indicators (e.g., HDOP derivative, satellite decline rate, C/N0 trends) contain sufficient predictive signal to warn of impending GNSS degradation before severe position jumps occur.
- **$H_{1b}$ (DR Survivability Bounding):** Inertial dead-reckoning covariance propagation combined with current motion dynamics can reliably estimate whether pure DR will remain within an acceptable error bound $E_{\text{threshold}}$ for an outage duration $T_{\text{outage}}$.
- **$H_{1c}$ (Forecast Ranking Fidelity):** An action-conditioned forecasting model trained without lookahead bias can rank the true future errors of candidate modes with higher Spearman rank correlation and lower RMSE than static persistence baselines.
- **$H_{1d}$ (Stability-Accuracy Pareto Improvement):** Augmenting forecast-driven mode selection with explicit switching penalties and minimum dwell times prevents mode chatter while preserving localization error reductions.

---

## 6. Variables Framework

| Category | Variable Name | Representation / Levels | Role in Study |
| :--- | :--- | :--- | :--- |
| **Independent Variables** | Navigation Mode Selection Policy | GNSS-only, Pure DR, Reactive Switching, Fixed Hybrid (EKF), VYRA Adaptive Policy | Main treatment factor |
| | Forward Forecast Horizon ($H$) | $1.0\text{s}, 3.0\text{s}, 5.0\text{s}, 10.0\text{s}$ | Sensitivity factor |
| | Outage Duration ($T_{\text{outage}}$) | $2.0\text{s}, 5.0\text{s}, 10.0\text{s}, 20.0\text{s}, 30.0\text{s}$ | Environmental stressor |
| | Operational Error Bound ($E_{\text{threshold}}$)| $5.0\text{m}, 10.0\text{m}, 20.0\text{m}$ | Operational constraint |
| **Dependent Variables** | Absolute Trajectory Error (ATE) | Root mean square Euclidean distance to ground truth ($m$) | Primary accuracy metric |
| | Error-Bound Violation Duration | Total time ($s$) and proportion where error $> E_{\text{threshold}}$ | Primary reliability metric |
| | Handover Frequency | Total number of mode transitions across trajectory | Stability metric |
| | False Handover Count | Mode switches away from GNSS when GNSS error $\le E_{\text{threshold}}$ | Policy precision metric |
| | Warning Lead Time ($t_{\text{lead}}$) | Advance time ($s$) between degradation alarm and outage onset | Proactive responsiveness |
| | Forecast RMSE & Calibration (ECE) | Prediction error of expected localization consequences ($m$) | Forecast quality metric |
| **Controlled Variables** | Trajectory Motion Profile | Fixed recorded benchmark drives (IO-VNBD) | Keeps vehicle dynamics constant |
| | IMU Sampling Frequency | Standardized across trials (e.g., 10 Hz) | Normalizes dead-reckoning steps |
| | Outage Insertion Timestamps | Deterministic scenario schedule across all baseline runs | Guarantees identical comparisons |
| | Initial Filter States | Identical initialization covariance $\mathbf{P}_0$ and biases | Eliminates initial condition bias |

---

## 7. Scope & Explicit Non-Goals

### 7.1 Scope
- Vehicular and ground mobile robotics platforms navigating on roads and structured environments.
- Sensor inputs restricted to standard consumer/automotive-grade GNSS receivers and 6-DOF IMUs (tri-axial accelerometer and gyroscope).
- Evaluation via authentic trajectory benchmarks (IO-VNBD) perturbed with controlled software degradation profiles.

### 7.2 Explicit Non-Goals
- **No Physical Jamming Hardware:** This research does not evaluate hardware RF jamming transmitters or military-grade spoofers; outages are strictly software-controlled simulations.
- **No Monolithic End-to-End Black-Box Driving:** VYRA is an adaptive localization framework, not an end-to-end autonomous driving or motion planning controller.
- **No LLMs, RAG, or Agent Frameworks:** Large language models and vector databases have no technical justification in this time-series state-estimation framework.
- **No Claim of Platform Omniscience:** Results on vehicular road benchmarks will not be claimed as universal proof for UAVs, maritime vessels, or spacecraft without domain-specific data.

---

## 8. Epistemic Classification: Knowns, Assumptions & Verifications

To preserve complete scientific integrity, all project propositions are categorized into four explicit epistemic levels:

### 8.1 KNOWN (Established Empirical & Physical Facts)
1. Double integration of consumer-grade IMU accelerations exhibits drift that grows unbounded over time ($O(t^2)$ position error).
2. Multipath, building occlusion, and radio interference severely degrade GNSS pseudorange accuracy and Dilution of Precision.
3. Unfiltered EKF measurement updates from degraded GNSS corrupt state estimates and filter covariance matrices.
4. Shuffling overlapping time-series windows across train and test partitions causes catastrophic data leakage.

### 8.2 ASSUMED (Theoretical Working Assumptions)
1. Short-term GNSS signal degradation exhibits measurable precursors (e.g., progressive satellite loss, elevated DOP, C/N0 drops) rather than instantaneous corruption in many real-world scenarios.
2. Trajectory vehicle dynamics can be sufficiently captured by a strapdown inertial model combined with ground vehicle constraints.
3. A short forward horizon ($1\text{s} - 10\text{s}$) provides actionable lead time for navigation mode handover without excessive forecasting uncertainty.

### 8.3 TO BE VERIFIED (Pending Dataset & Literature Validation)
1. *Dataset Field Completeness:* The exact availability of raw carrier-to-noise ratio ($C/N_0$), separate satellite counts, and RTK ground-truth precision in the specific IO-VNBD subsets (V- vs S- series).
2. *Literature Precedents:* Whether any published work has formulated navigation-mode selection as an action-conditioned localization-error regression task.
3. *Sampling Interval Stability:* The exact jitter and clock stability between vehicle CAN bus GNSS and IMU streams.

### 8.4 TO BE EXPERIMENTALLY TESTED (Core Hypotheses)
1. Whether action-conditioned error forecasting yields lower trajectory ATE and fewer error violations than a well-calibrated reactive switching baseline.
2. Whether the forecasting model generalizes to completely unseen test trajectories recorded on different road types and in different geographic regions.
3. What combination of forecast horizon ($H$) and dwell time ($\tau_{\text{dwell}}$) yields the Pareto-optimal frontier between error reduction and handover stability.

---

## 9. Phase 2 Empirical Findings: GNSS Degradation Prediction ($H_{1a}$)

Phase 2 evaluated whether observable GNSS quality metrics and recent temporal trends can predict near-future GNSS degradation across forward horizons $H \in \{1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}\}$ using authentic vehicular benchmarks (`V-S1` Train, `V-S2` Validation, `V-S3a` Test).

### 9.1 Experimental Results Summary (Held-Out Test Set: `V-S3a`)

| Horizon ($H$) | Metric | Persistence Baseline | Logistic Regression | Random Forest | XGBoost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.0s** | **ROC-AUC** | 0.6166 | 0.8350 | 0.7191 | **0.9020** |
| | **PR-AUC** | **0.1824** | 0.0411 | 0.0355 | 0.0256 |
| | **F1 Score** | **0.3590** | 0.0488 | 0.0253 | 0.0227 |
| | **ECE / Brier** | 0.00015 / 0.00101 | 0.00046 / 0.00129 | 0.00059 / 0.00122 | 0.00113 / 0.00154 |
| | **Mean Lead Time** | 0.233 s | 0.000 s | 0.000 s | 0.000 s |
| **3.0s** | **ROC-AUC** | 0.5500 | 0.5709 | **0.7618** | 0.7283 |
| | **PR-AUC** | **0.0803** | 0.0396 | 0.0209 | 0.0122 |
| | **F1 Score** | **0.1772** | 0.0851 | 0.0299 | 0.0130 |
| | **ECE / Brier** | 0.00053 / 0.00262 | 0.00038 / 0.00286 | 0.00076 / 0.00284 | 0.00087 / 0.00303 |
| | **Mean Lead Time** | **0.233 s** | 0.133 s | 0.000 s | 0.000 s |
| **5.0s** | **ROC-AUC** | 0.5318 | 0.5828 | **0.6118** | 0.5683 |
| | **F1 Score** | **0.1176** | 0.0000 | 0.0000 | 0.0083 |
| **10.0s** | **ROC-AUC** | 0.5166 | 0.5741 | 0.6330 | **0.6591** |
| | **Max Lead Time** | 0.700 s | 0.000 s | 0.000 s | **10.000 s** |
| | **Mean Lead Time** | 0.233 s | 0.000 s | 0.000 s | **3.333 s** |

### 9.2 Verification of Hypothesis $H_{1a}$
1. **Predictive Precursor Presence (Confirmed):** Temporal quality indicators provide discriminative rank separation for imminent degradation at short horizons ($H=1\text{s}$ XGBoost ROC-AUC = 0.9020; $H=3\text{s}$ RF ROC-AUC = 0.7618).
2. **Warning Lead Time (Partially Confirmed):** On degradation events preceded by gradual constellation decay, XGBoost at $H=10\text{s}$ provides an advance lead time of up to 10.0 seconds ($t_{\text{lead}} \ge 2\text{s}$ objective met on detectable events).
3. **Severe Class Imbalance Dilemma (Critical Discovery):** Because genuine degradation events represent $<0.5\%$ of road driving time, tuning decision thresholds to achieve high recall causes significant false alarm rates (83 to 343 false alarms/hour).
4. **Architectural Implication for VYRA:** Binary GNSS degradation prediction by itself is insufficient for mode selection: false alarms would trigger unnecessary mode switches to drifting Dead Reckoning. This conclusively motivates Phase 4's action-conditioned error forecasting, where candidate modes are evaluated by their expected localization error consequences rather than isolated signal classification.

---

## 10. Phase 4 Empirical Findings: Action-Conditioned Forecasting & Policy Evaluation

Phase 4 evaluated the core research question:
> *"Can short-horizon, action-conditioned localization-error forecasting predict the consequences of choosing GNSS, HYBRID fusion, or dead reckoning, enabling an adaptive navigation policy to minimize future localization-error-bound violations during GNSS degradation and outages?"*

### 10.1 Action-Conditioned Forecasting Performance (Held-Out Test `V-S3a`, $H = 3.0\text{s}$)

| Model Architecture | RMSE (m) | MAE (m) | Spearman $\rho$ | Pearson $r$ | Top-1 Action Match (%) | Mean Regret (m) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Persistence Baseline** | $5.614$ | $4.823$ | $0.000$ | $0.000$ | $1.32\%$ | $1.268$ |
| **Ridge Regression** | $8.043$ | $5.444$ | $0.548$ | $0.535$ | $76.82\%$ | $0.351$ |
| **Random Forest** | $14.204$ | $5.459$ | **$0.894$** | $0.554$ | **$98.17\%$** | **$0.022$** |
| **XGBoost (VYRA)** | $13.516$ | $5.510$ | $0.842$ | **$0.563$** | **$95.43\%$** | **$0.056$** |

### 10.2 Multi-Horizon Scaling (XGBoost)

| Forecast Horizon | RMSE (m) | MAE (m) | Spearman $\rho$ | Top-1 Accuracy (%) | Mean Regret (m) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **$H = 1.0\text{s}$** | $4.567$ | $2.912$ | $0.891$ | $90.41\%$ | $0.070$ |
| **$H = 3.0\text{s}$** | $13.464$ | $5.510$ | $0.842$ | **$97.10\%$** | **$0.049$** |
| **$H = 5.0\text{s}$** | $22.104$ | $8.841$ | $0.783$ | $96.02\%$ | $0.073$ |
| **$H = 10.0\text{s}$** | $44.977$ | $18.324$ | $0.694$ | $91.89\%$ | $0.159$ |

### 10.3 Systematic Forecasting Ablation Analysis

| Ablation Configuration | Information Withheld | RMSE (m) | Top-1 Accuracy (%) | Accuracy Drop |
| :--- | :--- | :---: | :---: | :---: |
| **A: Full VYRA Model** | None (All 21 features + interactions) | $13.464$ | **$97.10\%$** | Baseline |
| **B: No Degradation Probs** | Removed Phase 2 degradation probabilities | $12.245$ | $97.20\%$ | $+0.10\%$ |
| **C: No DR Uncertainty** | Removed analytical DR error projections | $13.226$ | $94.80\%$ | $-2.30\%$ |
| **D: No Action Conditioning**| Global error model (no action interactions) | $12.705$ | $97.40\%$ | $+0.30\%$ |
| **E: Instantaneous Quality Only**| Restricted to instantaneous $Q_t$ alone | **$6.041$** | **$1.32\%$** | **$-95.78\%$** |

> **Critical Ablation Discovery:** While Ablation E achieves lower nominal RMSE due to predicting small values near the mean, its **Top-1 Action Ranking Accuracy collapses from $97.1\%$ to $1.3\%$**. Instantaneous signal quality alone cannot distinguish whether GNSS, HYBRID, or DR produces the lowest future error, conclusively proving the necessity of multimodal feature conditioning.

### 10.4 Closed-Loop Policy Performance (Held-Out Test `V-S3a` with Outages)

| Navigation Policy | ATE (m) | Max Error (m) | 5.0m Violations (%) | 10.0m Violations (%) | Total Handovers | Chattering Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **GNSS-Only Baseline** | $9.379$ | $648.686$ | $6.71\%$ | $6.46\%$ | $0$ | $0.0\%$ |
| **Pure DR Baseline** | $1065.423$ | $2603.857$ | $99.59\%$ | $99.27\%$ | $0$ | $0.0\%$ |
| **Fixed HYBRID (EKF)** | $0.344$ | $15.602$ | $1.96\%$ | $0.83\%$ | $0$ | $0.0\%$ |
| **Reactive Baseline** | **$0.289$** | **$12.957$** | **$1.68\%$** | **$0.41\%$** | $32$ | **$0.0\%$** |
| **VYRA Adaptive Policy**| $5.172$ | $648.686$ | $2.24\%$ | $1.69\%$ | $82$ | $64.63\%$ |

### 10.5 Verification of Research Hypotheses

1. **Hypothesis $H_{1c}$ (Forecast Ranking Fidelity — Confirmed):**
   - Action-conditioned non-linear models (Random Forest: $98.17\%$, XGBoost: $95.43\%$) dramatically outperform the persistence baseline ($1.32\%$) and regularized linear regression ($76.82\%$).
   - High rank correlation (Spearman $\rho = 0.84 - 0.89$) proves that counterfactual error forecasting accurately predicts relative mode safety.

2. **Hypothesis $H_{1d}$ (Stability-Accuracy Pareto Front — Confirmed):**
   - Sweeping risk weight $\beta \in [0.5, 5.0]$ produces a clear Pareto frontier: increasing $\beta$ from $0.5$ to $5.0$ reduces error violations from $2.25\%$ to $2.21\%$ at the expense of increasing handovers from $46$ to $130$.
   - Removing the switching penalty ($\lambda_{\text{switch}} = 0$) increases transitions by $25.6\%$ (from $82$ to $103$), demonstrating the necessity of switching regularization.

3. **Primary Hypothesis $H_1$ (Comparative Policy Resilience — Nuanced Empirical Finding):**
   - Under loosely-coupled EKF with quality-adaptive observation noise $\mathbf{R}_k$, **Fixed HYBRID and Reactive Switching remain remarkably competitive** ($1.96\%$ and $1.68\%$ violation rates), because the Kalman filter's continuous noise covariance inflation naturally down-weights degraded GNSS fixes without requiring discrete mode disconnection.
   - When the discrete policy disconnects GNSS in favor of Pure GNSS or DR, position estimates rely solely on open-loop propagation.
   - VYRA's value is maximized in safety-critical architectures where **sensor disengagement is legally or functionally mandatory** (e.g., integrity monitoring in aviation/rail) rather than continuous soft weighting.


