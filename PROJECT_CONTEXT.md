# VYRA — Complete Project Context

> **Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization**  
> *Authoritative Implementation and Research Specification*

---

## 0. Purpose of This Specification

This document defines the research and implementation context for **VYRA**. VYRA is a research-oriented localization system combining GNSS positioning, inertial dead reckoning, sensor fusion, machine learning, uncertainty estimation, and adaptive mode selection.

The primary objective is to investigate whether forecasting the future localization consequences of candidate navigation actions can improve resilience and mode selection during GNSS degradation and outages.

---

## 1. Project Identity

- **Project Short Name:** VYRA
- **Title:** Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization
- **Domain:** GNSS Resilience, Inertial Navigation, Sensor Fusion, Time-Series Prediction, Adaptive Decision-Making.
- **Candidate Navigation Modes:**
  1. `GNSS`: Raw GNSS positioning.
  2. `HYBRID`: GNSS + inertial dead reckoning fusion.
  3. `DR`: Pure inertial dead reckoning.
- **Target Application Domains:** Autonomous vehicles, UAVs/drones, mobile robotics, industrial platforms, emergency systems, maritime navigation.

---

## 2. Core Intuition & Concept

When navigating with GNSS, signals can degrade or drop out due to urban canyons, multipath interference, satellite occlusion, or radio-frequency interference. Inertial dead reckoning (DR) maintains motion estimation during outages, but errors accumulate due to sensor noise and bias integration drift.

Traditional systems switch reactively:
$$\text{GNSS Quality Drop} \longrightarrow \text{Switch to DR}$$

This creates a tradeoff:
- **Switch too early:** Minor transient degradation triggers unnecessary DR drift accumulation while GNSS recovers.
- **Switch too late:** Severely corrupted GNSS measurements contaminate the position estimate or sensor fusion filter.

**The VYRA Paradigm:** Instead of asking only *"Is GNSS bad now?"*, VYRA asks:
> *"If I choose GNSS, HYBRID, or DR right now, what localization error is likely to occur over the next few seconds?"*

```text
Current Navigation State
        │
        ├───► Forecast Future Risk / Error (GNSS | state, H)
        ├───► Forecast Future Risk / Error (HYBRID | state, H)
        └───► Forecast Future Risk / Error (DR | state, H)
                     │
                     ▼
           Adaptive Decision Policy
                     │
                     ▼
           Selected Navigation Mode
```

---

## 3. Core Research Question

> **Can short-horizon, action-conditioned/counterfactual localization-error forecasting predict the consequences of choosing GNSS, HYBRID fusion, or dead reckoning, and can an adaptive policy use those forecasts to reduce future error-bound violations and unnecessary navigation-mode switching during GNSS degradation and outages?**

---

## 4. Novelty & Scientific Grounding Rules

- Do **not** claim "first ever", "unique worldwide", or "novel because it uses EKF/IMU".
- The research hypothesis must be evaluated critically against existing literature (2023–2026 across IEEE, ACM, Springer, MDPI, arXiv, and open-source projects).
- Research value lies in the formulation of action-conditioned error prediction, calibration, policy design, and empirical verification.

---

## 5. Candidate Navigation Actions & Forecasting Formulations

Candidate actions at time $t$:
- $A_1 = \text{GNSS}$
- $A_2 = \text{HYBRID}$
- $A_3 = \text{DR}$

Over short horizons $H \in \{1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}\}$, the system estimates:
1. Expected position error: $\mathbb{E}[\text{Error}(A, H) \mid \mathbf{s}_t]$
2. Error-bound violation probability: $P(\text{Error}(t+H) > E_{\text{threshold}} \mid \mathbf{s}_t, A)$
3. Multi-objective risk:
   $$\text{Risk}(A) = w_e \cdot \widehat{\text{Error}}(A, H) + w_v \cdot P(\text{Violation}) + \text{Penalty}_{\text{handover}}(A)$$

---

## 6. Inputs & Dataset

- **Primary Dataset:** IO-VNBD (Inertial Odometry and Vehicle Navigation Benchmark Dataset).
- **GNSS Features:** Latitude, longitude, altitude, speed, heading, satellite count, HDOP, VDOP, reported accuracy, C/N0 (carrier-to-noise ratio), fix status, timestamp.
- **IMU Features:** Tri-axial accelerometer ($a_x, a_y, a_z$), tri-axial gyroscope ($g_x, g_y, g_z$), magnetometer, attitude/orientation where available.
- **Reference Ground Truth:** High-precision reference trajectory for validation.

---

## 7. Anti-Data-Leakage Rules

- **Temporal / Trajectory Splitting:** Strict trajectory-level splitting into Train, Validation, and Unseen Test sets. No random window shuffling across splits.
- **Strict Causality:** Features at decision time $t$ must strictly use data up to $t$ ($t \le \tau$). Ground truth after $t$ must never leak into feature inputs.
- **Threshold Freezing:** Policy thresholds and model parameters must be tuned exclusively on Train/Validation sets and frozen before final test evaluation.

---

## 8. Baselines for Comparison

1. **GNSS-only:** Trust GNSS whenever received.
2. **Pure DR:** Propagate inertial dead reckoning continuously.
3. **Reactive Switching:** Rule-based switching when GNSS quality metrics fall below a set threshold.
4. **Fixed Hybrid:** Static GNSS/INS EKF fusion.
5. **VYRA Adaptive Policy:** Predictive, action-conditioned mode selection.

---

## 9. Evaluation Metrics

- **Localization Accuracy:** Absolute Trajectory Error (ATE), Relative Trajectory Error (RTE), Root Mean Square Error (RMSE), Maximum Error, Final Drift.
- **Error-Bound Violations:** Time spent above threshold (e.g., 5m, 10m, 20m), violation frequency.
- **Policy & Handover Stability:** Handover count, false handovers, unnecessary handovers, mode chatter, warning lead time, handover latency.
- **Forecast Quality:** RMSE of predicted vs. actual future error, Brier score, calibration error (ECE).

---

## 10. Controlled Simulation vs. Reality

- Outages and degradations injected into trajectories are **controlled software simulations** (e.g., duration 2s, 5s, 10s, 20s, 30s; attenuation profiles).
- They must **never** be described as live RF jamming or physical hardware tests.

---

## 11. Technology Stack

- **Core Scientific Stack:** Python 3.11+, NumPy, Pandas, SciPy, scikit-learn, XGBoost.
- **Navigation:** Strapdown inertial navigation, EKF / error-state EKF, coordinate frame conversions (ECEF/ENU), covariance propagation.
- **Backend Services:** FastAPI, Pydantic, Uvicorn, WebSockets.
- **Frontend Dashboard:** React, Vite, Tailwind CSS, Leaflet, Plotly.
- **Excluded Technologies:** No LLMs, RAG, LangChain, agent frameworks, vector databases, MongoDB, or Firebase unless scientifically justified.

---

## 12. Development Lifecycle Phases

1. **Phase 1:** Research Foundation & Scaffolding
2. **Phase 2:** Dataset Discovery & Leak-Free Preprocessing Pipeline
3. **Phase 3:** GNSS Quality Engine & Degradation Labeling
4. **Phase 4:** GNSS Degradation Prediction Models
5. **Phase 5:** Dead Reckoning, IMU Mechanization & EKF Fusion
6. **Phase 6:** DR Uncertainty & Survivability Modeling
7. **Phase 7:** VYRA Action-Conditioned Forecast Engine
8. **Phase 8:** Adaptive Navigation Policy Engine
9. **Phase 9:** Controlled Experimental Scenarios
10. **Phase 10:** Comprehensive Evaluation & Ablation Studies
11. **Phase 11:** Backend Serving & Playback Services
12. **Phase 12:** Visualization Dashboard & Research Reporting
