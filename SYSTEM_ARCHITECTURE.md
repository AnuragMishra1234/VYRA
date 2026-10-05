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
- **Inputs:** Causal IMU observations (`IMUObservation`: $a_{\text{long}}$, $a_{\text{lat}}$, $\omega_z$, $v_{\text{wheel}}$, $\Delta t$), prior navigation state $\mathbf{x}_{k-1}$, covariance $\mathbf{P}_{k-1}$, and GNSS observations when available.
- **Implementations:**
  - `DeadReckoningEngine`: Strapdown 2D dead reckoning propagating position, velocity, and ENU heading solely from odometry and gyroscope.
  - `ExtendedKalmanFilter`: 6-state loosely-coupled filter:
    $$\mathbf{x} = [p_E, p_N, v_E, v_N, \theta, b_g]^T \in \mathbb{R}^6$$
    - Prediction step driven by wheel odometry speed and yaw rate.
    - Quality-adaptive measurement noise $\mathbf{R}_k = \mathbf{R}_{\text{nominal}} (1 + \gamma \frac{1 - Q_k}{Q_k})$.
    - Normalized Innovation Squared (NIS) gating with $\chi^2(4)$ threshold ($13.28$ at $99\%$).
    - Joseph-form covariance updates for numerical stability.
- **Outputs (`EKFState`):**
  - Continuous pose: $(p_E, p_N)$ in meters, velocity $(v_E, v_N)$ in m/s, heading $\theta$ in radians.
  - Full $6 \times 6$ covariance matrix $\mathbf{P}_k$.
  - Horizontal uncertainty metrics (`NavigationUncertainty`): $\sigma_{\text{horiz}}$, $95\%$ confidence ellipse radius $r_{95} = \sqrt{5.991 \cdot \lambda_{\max}}$, covariance trace $\text{Tr}(\mathbf{P})$.

### 2.4. DR Survivability Engine (`policy/survivability.py`)
- **Inputs:** Current filter state $\mathbf{x}_t$, covariance $\mathbf{P}_t$, vehicle ground speed $v_t$, candidate outage duration $T_{\text{out}}$, operational error bound $E_{\text{threshold}}$.
- **Mathematical Model:** Bounded variance growth:
  $$\sigma_{\text{pos}}^2(T) = \sigma_{\text{pos}, 0}^2 + \sigma_v^2 T^2 + \frac{1}{3} v^2 \sigma_\theta^2 T^2 + \frac{1}{12} v^2 \sigma_\omega^2 T^4$$
- **Outputs (`SurvivabilityEstimate`):**
  - Analytical survivability probability: $S(T, E_{\text{threshold}}) = 1 - \exp\left(-\frac{E_{\text{threshold}}^2}{2 \sigma_{\text{pos}}^2(T)}\right) \in [0.0, 1.0]$.
  - Predicted survivable duration $T_{\text{surv}}$ in seconds (duration until $S(T) < 0.50$).

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
