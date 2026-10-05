# VYRA: Research Gap & Literature Boundary

## 1. Context & Motivation

Navigation systems combining Global Navigation Satellite Systems (GNSS) and Inertial Measurement Units (IMUs) are foundational across autonomous transportation, mobile robotics, and aerospace. However, in urban canyons, forested regions, tunnels, or contested electronic environments, GNSS signals suffer from multipath, severe attenuation, and complete dropouts.

Inertial Dead Reckoning (DR) provides independent continuity, but double integration of noisy accelerometer and gyroscopic readings induces drift that compounds quadratically or cubically over time. Extended Kalman Filters (EKF) fuse both modalities, but corrupted GNSS measurements with undetected outliers or degraded covariance matrices can catastrophically contaminate the filter state.

---

## 2. The Identified Research Gap

### Limitations of Conventional Reactive Switching
Existing multi-sensor navigation frameworks predominantly rely on **reactive decision logic**:
- **Mechanism:** Switching is triggered only *after* observable degradation exceeds an instantaneous threshold (e.g., HDOP $> 4.0$, satellite count $< 4$, innovation residual test failure).
- **Failure Mode 1 (Late Switching):** By the time a reactive threshold is breached, corrupted GNSS measurements have already introduced severe trajectory bias or contaminated the EKF covariance.
- **Failure Mode 2 (Premature / False Switching):** Momentary signal fluctuations or minor multipath anomalies cause premature handovers to pure DR, incurring unneeded inertial drift while GNSS would have remained viable.
- **Failure Mode 3 (Mode Chatter):** Operating near fixed thresholds leads to frequent, erratic switching between modes, disrupting velocity and heading continuity.

### The Investigated Gap
While literature extensively explores machine-learning-assisted GNSS/INS fusion (e.g., AI-assisted pseudo-measurement generation, EKF gain adaptation) and separate time-series signal quality prediction, there is a distinct gap in:
> **Formulating navigation-mode selection as an action-conditioned future-error forecasting problem:** Explicitly forecasting the expected future localization error/risk for candidate modes ($A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$) over a short forward horizon ($H \in [1, 10]\text{s}$), and executing an adaptive policy optimized against predicted error bounds, survivability, and handover stability.

---

## 3. Literature Review Protocol (Disproving the Contribution)

To adhere to rigorous scientific standards, the project adopts an adversarial literature review protocol:
**The goal is actively to find prior art that disproves or subsumes our proposed contribution.**

### Search Parameters
- **Timeframe:** 2023 – 2026 (plus foundational prior work in GNSS/INS fusion).
- **Databases:** IEEE Xplore, ScienceDirect, SpringerLink, ACM Digital Library, MDPI, arXiv, Google Scholar.
- **Search Keyphrases:**
  - `"GNSS degradation prediction" AND "inertial navigation"`
  - `"counterfactual" OR "action-conditioned" AND "localization error"`
  - `"adaptive mode selection" AND "GNSS/INS"`
  - `"future error forecasting" AND "dead reckoning"`
  - `"predictive handover" AND "sensor fusion"`
  - `"DR survivability" AND "outage prediction"`

### Contribution Classification Schema
Any related work found during the literature search will be classified into:
- **Category A (Strong Opportunity):** Concept unaddressed or only addressed in disjointed components.
- **Category B (Incremental but Defensible):** Predictive switching explored in specific subdomains (e.g., aircraft only) with distinct formulations.
- **Category C (Cosmetic Difference):** Equivalent predictive policy already published under alternative terminology.
- **Category D (Saturated):** Directly addressed and benchmarked.

---

## 4. Novelty Rules & Scientific Integrity

1. **No Absolute Claims:** We never claim "first ever worldwide" or "unique approach".
2. **Empirical Justification:** Research value must be proven by ablation studies (e.g., removing action conditioning, removing degradation prediction) and benchmarked against standard baselines.
3. **Transparent Limitations:** If the empirical evidence reveals that predictive forecasting yields negligible improvement over calibrated reactive switching, the findings will be reported honestly.
