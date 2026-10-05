# VYRA: System Architecture & Data Flow

## 1. High-Level Architecture Overview

```text
                  +----------------------------------------------------+
                  |           Benchmark Trajectory Data                |
                  |     (GNSS sentences, IMU readings, Ground Truth)   |
                  +-------------------------+--------------------------+
                                            |
                                            v
                  +----------------------------------------------------+
                  |       Preprocessing & Temporal Alignment           |
                  |   - Timestamps & interpolation (zero future look)  |
                  |   - Coordinate conversion (WGS84 -> ECEF -> ENU)   |
                  +-------------+--------------------------+-----------+
                                |                          |
              +-----------------+                          +------------------+
              | GNSS Channel                               | IMU Channel      |
              v                                            v                  v
+-----------------------------+             +---------------------------------+
|     GNSS Quality Engine     |             |         IMU Processing          |
|  - DOP, satellite count,    |             |  - Bias correction              |
|    C/N0, innovation jitter  |             |  - Coordinate frame rotation    |
+-------------+---------------+             +----------------+----------------+
              |                                              |
              v                                              v
+-----------------------------+             +---------------------------------+
|  GNSS Degradation Predictor |             |     Dead Reckoning (DR) &       |
|  - Persistence, LogReg,     |             |      EKF Hybrid Fusion          |
|    RF, XGBoost              |             |  - State propagation            |
|  - Output: P(degrade in H)  |             |  - Covariance P_k estimation    |
+-------------+---------------+             +----------------+----------------+
              |                                              |
              |                                              v
              |                             +---------------------------------+
              |                             |   DR Survivability Engine       |
              |                             |  - Drift growth modeling        |
              |                             |  - P(error <= bound in outage)  |
              |                             +----------------+----------------+
              |                                              |
              +----------------------+-----------------------+
                                     |
                                     v
                  +----------------------------------------------------+
                  |            VYRA Forecast Engine                    |
                  |  Action-conditioned short-horizon predictions:     |
                  |  - A1: GNSS   -> Expected error / violation risk   |
                  |  - A2: HYBRID -> Expected error / violation risk   |
                  |  - A3: DR     -> Expected error / violation risk   |
                  +--------------------------+-------------------------+
                                             |
                                             v
                  +----------------------------------------------------+
                  |           Adaptive Policy Engine                   |
                  |  - Objective: min predicted future localization    |
                  |    risk subject to dwell-time & switching penalty  |
                  +--------------------------+-------------------------+
                                             |
                                             v
                  +----------------------------------------------------+
                  |         Selected Navigation Mode & Pose            |
                  |               (GNSS / HYBRID / DR)                 |
                  +-------------+--------------------------+-----------+
                                |                          |
                                v                          v
                  +---------------------------+ +----------------------+
                  |   Evaluation Framework    | |   Backend Streaming  |
                  |  - ATE, RTE, RMSE         | |   - FastAPI REST API |
                  |  - Handover stability     | |   - WebSockets       |
                  |  - Ablation analysis      | |   - Dashboard UI     |
                  +---------------------------+ +----------------------+
```

---

## 2. Module Interface Contracts

### 2.1. Preprocessing (`preprocessing/`)
- **Inputs:** Raw data records from dataset (GNSS timestamps, IMU accelerometer & gyroscope readings, reference pose).
- **Outputs:** Synchronized Pandas DataFrame or NumPy arrays in local East-North-Up (ENU) coordinates.
- **Contract:** All windowing methods are causal. Window at time index $k$ contains samples up to $t_k$. Samples $t > t_k$ are prohibited.

### 2.2. GNSS Quality & Prediction (`gnss/`)
- **Inputs:** GNSS sentence parameters (satellite count, HDOP, VDOP, C/N0, fix type) up to time $t$.
- **Outputs:**
  - Quality score vector $\mathbf{q}_t \in [0, 1]^d$.
  - Degradation probability $P_{\text{deg}}(t + H) \in [0, 1]$ for horizon $H \in \{1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}\}$.

### 2.3. Navigation & Dead Reckoning (`navigation/`)
- **Inputs:** Tri-axial specific force $\mathbf{f}^b$, tri-axial angular rates $\boldsymbol{\omega}_{ib}^b$, prior state $\mathbf{x}_{k-1}$, covariance $\mathbf{P}_{k-1}$.
- **Outputs:**
  - Navigation state vector $\mathbf{x}_k = [\mathbf{p}_k, \mathbf{v}_k, \boldsymbol{\psi}_k]^T$ (position, velocity, attitude).
  - State covariance matrix $\mathbf{P}_k$.
  - Hybrid fused state from EKF when GNSS measurement updates are applied.

### 2.4. DR Survivability (`policy/survivability.py`)
- **Inputs:** Current IMU noise characteristics, motion state, covariance $\mathbf{P}_k$, target outage duration $T_{\text{out}}$, error bound $E_{\text{threshold}}$.
- **Outputs:** Estimated probability $P_{\text{surv}}(T_{\text{out}}) = P(\|\mathbf{e}_{\text{DR}}(t + T_{\text{out}})\| \le E_{\text{threshold}})$.

### 2.5. VYRA Forecast Engine (`forecasting/`)
- **Inputs:** Current multimodal state representation $\mathbf{s}_t = [\mathbf{q}_t, \mathbf{x}_t, \mathbf{P}_t, P_{\text{deg}}, \text{history}]$, candidate action $A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$.
- **Outputs:**
  - Forecasted localization error $\widehat{e}(A, H)$.
  - Forecasted error-bound violation probability $\widehat{p}_{\text{viol}}(A, H)$.

### 2.6. Adaptive Policy (`policy/`)
- **Inputs:** Forecast vectors $\{\widehat{e}(A, H), \widehat{p}_{\text{viol}}(A, H)\}_{\forall A}$, current active mode $M_{t-1}$, time elapsed in current mode $\Delta t_{\text{mode}}$.
- **Outputs:** Mode selection $M_t \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$ and handover decision flag.
- **Constraints:** Enforces minimum dwell time $\tau_{\text{dwell}}$ and switching penalty $\lambda_{\text{switch}}$.

---

## 3. Storage and Data Flow Conventions

- All units adhere to SI standards: meters ($m$), seconds ($s$), radians ($rad$), meters per second ($m/s$).
- World frame: Local Cartesian East-North-Up (ENU) anchored to the first valid trajectory GNSS fix.
- Body frame: Standard vehicle coordinate frame (X: Right, Y: Forward, Z: Up or X: Forward, Y: Right, Z: Down as defined by dataset specification).
