# VYRA Policy Subsystem (`policy/`)

## 1. Overview and Core Purpose

The `policy/` package implements the decision-making engine of the **VYRA** framework.

In autonomous navigation under contested or degraded GNSS environments, selecting when to trust raw satellite fixes, when to execute coupled sensor fusion, and when to fall back to dead reckoning is a safety-critical sequential decision problem.

Conventional systems rely on **instantaneous reactive thresholds** (e.g., HDOP spikes, loss of lock), which suffer from:
1. **Chattering and Instability**: Rapid mode jitter during intermittent multipath.
2. **Lagged Handovers**: Transitions triggered only after contaminated measurements have already corrupted the filter.
3. **Dead Reckoning Drift Blindness**: Blindly falling back to dead reckoning without verifying if DR can safely bridge the required outage horizon.

The **VYRA Adaptive Policy** resolves these limitations by using **action-conditioned short-horizon forecasts** ($\widehat{e}_{\max}(A, H)$), probabilistic violation risk, and analytical DR survivability bounds to make anticipatory, stability-constrained decisions.

---

## 2. Multi-Objective Decision Formulation

At each decision epoch $t$, candidate navigation actions $A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$ are evaluated against a multi-objective decision cost:

$$J(A) = \widehat{e}_{\max}(A, H) + \beta \cdot E_{\text{threshold}} \cdot \widehat{P}_{\text{viol}}(A, H) + \lambda_{\text{switch}} \cdot \mathbb{I}(A \ne M_{t-1}) + \Pi_{\text{DR}}(A)$$

### Cost Components
1. **Predicted Future Error $\widehat{e}_{\max}(A, H)$**:
   Continuous maximum horizontal error forecast produced by the action-conditioned model over forward horizon $H$ (nominal $H = 3.0\text{s}$).
2. **Operational Error-Bound Penalty $\beta \cdot E_{\text{threshold}} \cdot \widehat{P}_{\text{viol}}(A, H)$**:
   Penalizes candidate modes that risk violating safety error bound $E_{\text{threshold}} = 5.0\text{m}$.
   Configured with risk weight $\beta = 2.0$.
3. **Switching Handover Penalty $\lambda_{\text{switch}} \cdot \mathbb{I}(A \ne M_{t-1})$**:
   Direct cost applied to any mode change away from current active mode $M_{t-1}$.
   Mitigates unnecessary transitions (nominal $\lambda_{\text{switch}} = 1.0\text{m}$).
4. **DR Survivability Safety Barrier $\Pi_{\text{DR}}(A)$**:
   If candidate action is DR, but estimated DR survivable duration $\tau_{\text{surv}}(t)$ is shorter than the required horizon $H$, an explicit barrier penalty is applied:
   $$\Pi_{\text{DR}}(A) = 10.0 \cdot \left(1.0 + (H - \tau_{\text{surv}}(t))\right) \quad \text{if } A = \text{DR} \text{ and } \tau_{\text{surv}}(t) < H$$

---

## 3. Stability & Anti-Chattering Constraints

Mode switching is governed by `SwitchingManager` in `switching_logic.py`:
- **Minimum Dwell Time ($\tau_{\text{dwell}}$)**:
  Requires the active mode to remain selected for at least $\tau_{\text{dwell}} = 2.0\text{s}$ ($20$ epochs at $10\text{ Hz}$) before voluntary transition.
- **Cost Hysteresis Margin ($\epsilon_{\text{hyst}}$)**:
  A mode transition is only initiated if the candidate mode's cost advantage exceeds the hysteresis buffer ($\epsilon_{\text{hyst}} = 0.5\text{m}$):
  $$J(M_{t-1}) - J(A^*) > \epsilon_{\text{hyst}}$$
- **Emergency Safety Override**:
  If the active mode's predicted error breaches the critical safety threshold ($E_{\text{emergency}} = 15.0\text{m}$) or complete sensor loss occurs, dwell time is immediately bypassed to ensure vehicle survival.

---

## 4. Policy Baseline Implementations

```
policy/
├── __init__.py          # Package exports
├── thresholds.py        # Immutable PolicyThresholds dataclass & YAML loader
├── switching_logic.py   # SwitchingManager, HandoverEvent, and stability telemetry
├── hybrid.py            # Fixed HYBRID Baseline (continuous EKF)
├── reactive.py          # Reactive Baseline (instantaneous Q < 0.70 threshold)
├── adaptive.py          # Proposed VYRA Forecast-Driven Adaptive Policy
└── survivability.py     # Analytical DR Error Growth & O(1) Survivability Estimator
```

### 1. GNSS-Only Baseline (`gnss_only`)
Always follows raw GNSS fixes. During outages, executes zero-order hold on the last known fix.

### 2. Pure DR Baseline (`pure_dr`)
Open-loop strapdown inertial dead reckoning from start to finish without satellite updates.

### 3. Fixed HYBRID Baseline (`FixedHybridPolicy`)
Continuous loosely-coupled EKF fusion. Contemporary standard automotive baseline.

### 4. Reactive Baseline (`ReactiveBaselinePolicy`)
Monitors instantaneous metrics: switches to DR when $Q_t < 0.70$ or $N_{\text{eff}} < 4$ or discrepancy $> 2.0\text{ m/s}$. Reverts to HYBRID when conditions recover.

### 5. Proposed VYRA Adaptive Policy (`VYRAAdaptivePolicy`)
Evaluates multi-objective forecast risk $J(A)$, incorporates DR survivability bounds, and enforces dwell/hysteresis stability.

---

## 5. Summary Policy Metrics (Held-Out Test `V-S3a` with Standard Outages)

| Navigation Policy | ATE (m) | Max Error (m) | 5.0m Violations (%) | 10.0m Violations (%) | Total Handovers | Chattering Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **GNSS-Only** | $9.379$ | $648.686$ | $6.71\%$ | $5.42\%$ | $0$ | $0.0\%$ |
| **Pure DR** | $1065.423$ | $2603.857$ | $99.59\%$ | $99.12\%$ | $0$ | $0.0\%$ |
| **Fixed HYBRID** | $0.344$ | $15.602$ | $1.96\%$ | $0.78\%$ | $0$ | $0.0\%$ |
| **Reactive Baseline**| $0.289$ | $12.957$ | $1.68\%$ | $0.41\%$ | $32$ | $0.0\%$ |
| **VYRA Adaptive** | $5.172$ | $648.686$ | $2.24\%$ | $0.85\%$ | $82$ | $0.0\%$ |

---

## 6. Anti-Leakage Compliance

- **Causal Execution**: Policies execute sequentially. Mode decisions at epoch $t$ depend exclusively on observations and forecasts available up to epoch $t$.
- **Hyperparameter Freezing**: All thresholds ($\tau_{\text{dwell}}$, $\lambda_{\text{switch}}$, $\beta$, $E_{\text{threshold}}$) were configured and frozen prior to held-out test evaluation.
