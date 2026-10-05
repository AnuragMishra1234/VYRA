# VYRA: Research Question and Hypotheses

## 1. Primary Research Question

> **Can short-horizon, action-conditioned/counterfactual localization-error forecasting predict the consequences of choosing GNSS, HYBRID fusion, or dead reckoning, and can an adaptive policy use those forecasts to reduce future error-bound violations and unnecessary navigation-mode switching during GNSS degradation and outages?**

---

## 2. Formal Research Hypotheses

### Primary Hypothesis ($H_1$)
An adaptive navigation policy conditioned on short-horizon forecasts of localization consequences across candidate modes ($A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$) achieves statistically significant reductions in trajectory error-bound violations compared to conventional reactive switching, without increasing excessive mode-switching chatter.

### Sub-Hypotheses

1. **$H_{1a}$ (Predictive Lead Time):** Imminent GNSS degradation can be reliably predicted from temporal GNSS signal quality indicators (e.g., HDOP/VDOP trends, satellite count, C/N0 derivative) with a positive warning lead time ($t_{\text{lead}} \ge 2\text{s}$) prior to severe localization error.
2. **$H_{1b}$ (DR Survivability Estimation):** Inertial dead-reckoning error accumulation can be bounded probabilistically over finite outage durations, enabling estimation of whether DR will remain within acceptable limits ($\le E_{\text{threshold}}$).
3. **$H_{1c}$ (Action-Conditioned Forecasting Accuracy):** A predictive model can rank the short-term future error of candidate navigation choices ($A_1, A_2, A_3$) with lower error than static persistence baselines.
4. **$H_{1d}$ (Handover Stability):** Incorporating switching penalties and hysteresis into forecast-driven policy optimization reduces false and chattering handovers compared to pure instantaneous error minimization.

---

## 3. Investigated Variables

| Variable Category | Parameter / Indicator | Description |
| :--- | :--- | :--- |
| **Independent Variables** | Navigation Policy | GNSS-only, Pure DR, Reactive Switching, Fixed Hybrid, VYRA Adaptive Policy |
| | Forecasting Horizon ($H$) | $1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}$ |
| | Outage Scenarios | Controlled software outage durations ($2\text{s}, 5\text{s}, 10\text{s}, 20\text{s}, 30\text{s}$) and attenuation levels |
| | Error Threshold ($E_{\text{threshold}}$) | Operational tolerance bounds ($5\text{m}, 10\text{m}, 20\text{m}$) |
| **Dependent Variables** | Absolute Trajectory Error (ATE) | Global accuracy relative to ground truth reference |
| | Error-Bound Violation Time | Cumulative duration where localization error exceeds $E_{\text{threshold}}$ |
| | Handover Frequency | Total number of navigation mode transitions |
| | False Handover Rate | Switches to DR when GNSS error remained within tolerable bounds |
| | Warning Lead Time | Advance time between degradation prediction and outage onset |

---

## 4. Scope and Scientific Boundaries

- The investigation evaluates **software-simulated degradation and outages** injected into authentic vehicular GNSS/IMU trajectory benchmarks.
- No claim of real RF jamming or military-grade hardware spoofing is made.
- Findings are bounded by the dynamics and sensor noise profiles of the benchmark dataset (IO-VNBD or validated equivalent).
