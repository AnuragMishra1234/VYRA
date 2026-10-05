# VYRA: Research Gap & Literature Boundary

## 1. Research Gap Framework

This document systematically analyzes nine foundational navigation and state-estimation domains. For each area, it delineates:
1. What existing approaches generally do.
2. What VYRA intends to investigate.
3. What remains uncertain.
4. What must be verified through rigorous literature review.

> [!IMPORTANT]
> **Scientific Objectivity Rule:**  
> The term *"Potential research gap requiring verification"* is strictly maintained throughout. No claim of "first-ever", "unprecedented", or "novel worldwide" is asserted prior to peer-reviewed literature validation.

---

## 2. Domain-by-Domain Analysis

### 2.1 GNSS Reliability Prediction
- **What existing approaches generally do:** Predict satellite signal availability, multipath probability, or Dilution of Precision (DOP) using 3D city building models, ray-tracing, historical geometry tables, or binary classifiers operating on receiver SNR/C/N0.
- **What VYRA intends to investigate:** Time-series learning models that predict imminent GNSS signal degradation ($P(\text{Degradation in } H)$) over short horizons ($1\text{s} - 10\text{s}$) strictly from causal temporal features (DOP derivatives, satellite loss trends, velocity stability).
- **What remains uncertain:** The achievable warning lead time in real driving environments, and whether receiver-reported metrics provide sufficient advance signal before catastrophic multipath or signal loss occurs.
- **What must be verified through literature:** Extent to which machine learning has been applied to GNSS degradation lead-time forecasting vs. static receiver autonomous integrity monitoring (RAIM).

### 2.2 GNSS Outage Handling
- **What existing approaches generally do:** Trigger dead reckoning, visual odometry, or LiDAR odometry once GNSS fix is completely lost. During outages, auxiliary sensors maintain position until GNSS reacquisition.
- **What VYRA intends to investigate:** Proactive pre-outage mode transitions based on predicted degradation, preparing filter covariance and state buffers before total satellite loss occurs.
- **What remains uncertain:** Whether pre-switching before total signal loss prevents filter divergence or unnecessarily causes early inertial drift.
- **What must be verified through literature:** Existing protocols for graceful GNSS reacquisition and bridge filtering in autonomous driving literature.

### 2.3 Dead Reckoning (Inertial Navigation)
- **What existing approaches generally do:** Integrate accelerometer and gyroscope measurements via strapdown inertial algorithms. Low-cost MEMS sensors suffer from runaway integration drift ($O(t^2)$ position error).
- **What VYRA intends to investigate:** Explicitly modeling the expected error growth and uncertainty bounds over finite expected outage durations to estimate "DR survivability" ($P(\text{DR error} \le E_{\text{threshold}})$).
- **What remains uncertain:** How accurately empirical DR error growth can be predicted on dynamic road trajectories with varying road surfaces, engine vibrations, and vehicle maneuvers.
- **What must be verified through literature:** Established mathematical formulations for short-horizon inertial error covariance propagation under non-holonomic vehicle constraints.

### 2.4 GNSS/INS Sensor Fusion
- **What existing approaches generally do:** Employ loosely-coupled or tightly-coupled Extended Kalman Filters (EKF) or Unscented Kalman Filters (UKF) to fuse high-rate IMU motion with low-rate GNSS fixes. Innovations are tested via chi-square gating.
- **What VYRA intends to investigate:** Evaluating whether continuous EKF fusion remains optimal during progressive degradation, or whether corrupted GNSS measurement updates degrade the filter faster than reverting to pure DR or adaptive covariance inflation.
- **What remains uncertain:** The exact threshold of GNSS corruption at which pure DR or frozen EKF outperforms continuous EKF fusion.
- **What must be verified through literature:** Adaptive Kalman filtering techniques (e.g., adaptive measurement noise covariance $\mathbf{R}_k$ scaling) and their comparative performance against discrete mode switching.

### 2.5 Adaptive Navigation
- **What existing approaches generally do:** Adapt sensor fusion weighting parameters dynamically based on innovation residuals, fuzzy logic, or neural network gain prediction.
- **What VYRA intends to investigate:** Formulating adaptive navigation as an explicit choice among discrete operational modes ($\text{GNSS}$, $\text{HYBRID}$, $\text{DR}$) driven by predicted future localization consequences.
- **What remains uncertain:** Whether discrete mode selection provides superior stability and interpretability compared to continuous covariance adaptation.
- **What must be verified through literature:** Prior comparative studies between discrete navigation-mode selection and continuous adaptive Kalman filtering.

### 2.6 Mode Switching
- **What existing approaches generally do:** Employ reactive rules: switch to dead reckoning when HDOP exceeds a threshold or satellite count drops below 4; switch back when GNSS fixes reappear.
- **What VYRA intends to investigate:** Quantifying the failure modes of reactive switching (late handovers, false handovers, mode chattering) and comparing them against a forecast-driven policy.
- **What remains uncertain:** The degree to which hysteresis and dwell-time constraints mitigate chattering in reactive versus predictive architectures.
- **What must be verified through literature:** Existing industrial and academic standards for multi-sensor navigation handover logic.

### 2.7 Predictive Navigation
- **What existing approaches generally do:** Use path planners or digital maps to anticipate road curvature, tunnel entrances, or upcoming speed changes.
- **What VYRA intends to investigate:** Short-term localization consequence forecasting that does not rely on pre-mapped 3D point clouds or known road map databases.
- **What remains uncertain:** Feasibility of predicting sensor degradation consequences purely from on-board temporal signal dynamics without external geometric maps.
- **What must be verified through literature:** Map-free predictive localization systems and their historical efficacy.

### 2.8 Forecasting-Based Decision Systems
- **What existing approaches generally do:** Model predictive control (MPC) or reinforcement learning optimizes control inputs based on forecasted state trajectories.
- **What VYRA intends to investigate:** Applying action-conditioned forecasting to sensor selection / estimation mode decisions: evaluating what error would occur under candidate navigation choices before executing the choice.
- **What remains uncertain:** Whether the forecast uncertainty is small enough to reliably discriminate between candidate choices without introducing false handovers.
- **What must be verified through literature:** Use of counterfactual / action-conditioned error prediction in fault-tolerant sensor systems.

---

## 3. Potential Research Gap Requiring Verification

The central potential gap investigated in VYRA can be stated as:

> **Potential Research Gap Requiring Verification:**  
> Existing navigation literature extensively addresses reactive mode switching and adaptive EKF covariance tuning, but there is limited documented work investigating whether **short-horizon, action-conditioned future-error forecasting across discrete navigation modes** ($\text{GNSS}$, $\text{HYBRID}$, $\text{DR}$) can proactively prevent error-bound violations and reduce unnecessary handovers during GNSS degradation and outages without reliance on external 3D geographic maps.

---

## 4. Literature Search Protocol (TODO / Non-Fabrication Rule)

To prevent citation fabrication, this section maintains active search queries that must be executed across IEEE Xplore, ScienceDirect, and Google Scholar during the research review:

```text
[TODO: LITERATURE VERIFICATION QUERIES]
Query 1: ("GNSS degradation prediction" OR "GPS outage prediction") AND ("dead reckoning" OR "INS")
Query 2: ("adaptive mode selection" OR "sensor handover") AND ("GNSS/INS" OR "sensor fusion")
Query 3: ("action-conditioned" OR "counterfactual") AND ("localization error" OR "trajectory error")
Query 4: ("DR survivability" OR "inertial error growth") AND ("GNSS outage")
Query 5: ("forecast-driven" OR "predictive switching") AND ("navigation" OR "Kalman filter")
```

All citations will be recorded only after verified retrieval and inspection.
