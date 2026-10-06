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

### 2.5. VYRA Action-Conditioned Forecast Engine (`forecasting/`)
- **Inputs:**
  - Decision-time causal state feature vector $\mathbf{s}_t \in \mathbb{R}^{21}$ combining GNSS quality metrics ($Q_t, N_{\text{eff}}, |v_{\text{GPS}} - v_{\text{wheel}}|$, rolling temporal means/stds), vehicle kinematics ($v, \|\mathbf{a}\|, |\omega_z|$), EKF covariance trace $\text{Tr}(\mathbf{P}_t)$, 95% confidence radius $r_{95, t}$, and analytical DR survivability bounds ($\sigma_{\text{DR}}(H), \tau_{\text{surv}}$).
  - Candidate navigation action $A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$ encoded as a 3-element one-hot vector $\mathbf{a} \in \{0, 1\}^3$.
  - Forward forecast horizon $H \in \{1.0\text{s}, 3.0\text{s}, 5.0\text{s}, 10.0\text{s}\}$.
- **Model Architectures:**
  - Heuristic Persistence Baseline (`PersistenceForecastBaseline`).
  - Regularized Ridge Linear Regression (`RidgeForecastModel`).
  - Random Forest Regressor (`RandomForestForecastModel`).
  - Gradient Boosted Decision Trees (`XGBoostForecastModel`).
- **Outputs:**
  - Counterfactual maximum localization error forecast: $\widehat{e}_{\max}(s_t, A, H)$ (meters).
  - Error-bound violation risk: $\widehat{P}_{\text{viol}}(s_t, A, H) = P(e_{\max} > E_{\text{threshold}})$.
  - Conformal distribution-free safety upper bound: $\widehat{e}_{\max} + q_{1-\alpha}$ guaranteeing $95\%$ empirical test coverage.

### 2.6. Adaptive Navigation Policy (`policy/`)
- **Inputs:**
  - Candidate mode forecasts $\{\widehat{e}_{\max}(A, H), \widehat{P}_{\text{viol}}(A, H)\}_{\forall A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}}$.
  - Analytical DR survivability duration $\tau_{\text{surv}}(t)$.
  - Active operating mode $M_{t-1}$ and elapsed dwell duration $\Delta t_{\text{mode}}$.
- **Multi-Objective Cost Formulation:**
  $$J(A) = \widehat{e}_{\max}(A, H) + \beta \cdot E_{\text{threshold}} \cdot \widehat{P}_{\text{viol}}(A, H) + \lambda_{\text{switch}} \cdot \mathbb{I}(A \ne M_{t-1}) + \Pi_{\text{DR}}(A)$$
  where $\beta = 2.0$, $E_{\text{threshold}} = 5.0\text{m}$, $\lambda_{\text{switch}} = 1.0\text{m}$, and $\Pi_{\text{DR}}(A)$ is an explicit survivability barrier.
- **Stability and Execution Constraints:**
  - Minimum dwell time constraint $\tau_{\text{dwell}} = 2.0\text{s}$ ($20$ epochs at $10\text{ Hz}$).
  - Hysteresis margin $\epsilon_{\text{hyst}} = 0.5\text{m}$ preventing switching jitter.
  - Emergency safety override ($E_{\text{emergency}} = 15.0\text{m}$ or sensor dropout) bypassing dwell constraints during critical faults.
- **Outputs:** Selected discrete navigation mode $M_t \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$ and transition telemetry.

---

## 3. Storage and Data Flow Conventions

- All units adhere to SI standards: meters ($m$), seconds ($s$), radians ($rad$), meters per second ($m/s$).
- World frame: Local Cartesian East-North-Up (ENU) anchored to the first valid trajectory GNSS fix.
- Body frame: Standard vehicle coordinate frame (X: Right, Y: Forward, Z: Up or X: Forward, Y: Right, Z: Down as defined by dataset specification).

---

## 4. Phase 6 System Integration, Replay Engine & Research Dashboard

### 4.1. Precomputed Telemetry Cache (`results/processed/v_s3a_playback_cache.parquet`)
To eliminate runtime model inference latency and ensure bit-level reproducibility during demonstration, the evaluated trajectory `V-S3a` (24,621 epochs, 2,462.0 s driving duration) is serialized into a columnar Parquet cache containing 30 columns:
- Epoch temporal indices: `index`, `timestamp`, `relative_time_s`.
- Scenario state flags: `scenario`, `is_outage`, `is_degraded`.
- Reliability & Quality signals: composite $Q_t$, degradation probability $P(\text{degradation} \mid s_t)$.
- Inertial safety indicators: DR horizontal uncertainty $1\sigma$, survivability duration $T_{\text{surv}}$.
- Action-conditioned forecasts: $\widehat{e}_{\max}(\text{GNSS})$, $\widehat{e}_{\max}(\text{HYBRID})$, $\widehat{e}_{\max}(\text{DR})$ at $\tau = 3.0\text{s}$.
- Adaptive policy outputs: `selected_mode`, formal `decision_reason`.
- Geodetic coordinates (WGS-84): `gt_lat`, `gt_lon` (labeled **OFFLINE REFERENCE**), `gnss_lat`, `gnss_lon`, `vyra_lat`, `vyra_lon`, `hybrid_lat`, `hybrid_lon`, `dr_lat`, `dr_lon`.
- Local ENU Cartesians: `vyra_e`, `vyra_n`, `gt_e`, `gt_n`.

### 4.2. Backend Architecture (`backend/`)
- **FastAPI Core (`backend/main.py`):**
  - High-performance asynchronous REST and WebSocket server.
  - CORS middleware supporting Vite development servers and external clients.
  - Static figure serving at `/api/figures/*` and static production build serving at `/`.
- **Services:**
  - `PlaybackEngine`: In-memory numpy array indexing ($< 0.01\text{ ms}$ query latency), state machine (`playing`, `paused`, `stopped`), transport controls (`play`, `pause`, `step`, `reset`, `seek`, `speed`), and an asynchronous broadcast loop.
  - `ResultsService`: In-memory caching and retrieval of publication Tables 1–8 and figure metadata.
  - `TrajectoryService`: Benchmark trajectory catalog discovery and WGS-84 boundary indexing.
- **API Endpoints:**
  - `GET /api/health`: Health status, cache verification, and epoch counts.
  - `GET /api/playback/state`: Instantaneous engine status and telemetry snapshot.
  - `POST /api/playback/control`: Dispatches transport actions (`play`, `pause`, `step`, `seek`, `speed`).
  - `GET /api/playback/telemetry/{index}`: Exact epoch lookup.
  - `WS /api/playback/stream`: Bidirectional WebSocket connection broadcasting telemetry at $10\text{ Hz} \times \text{speed\_multiplier}$.
  - `GET /api/results/master`: Precomputed master results bundle (Tables 1–8).
  - `GET /api/results/tables/{id}`: Individual publication table queries.
  - `GET /api/results/figures`: Catalog of 16 publication-grade figures.
  - `GET /api/trajectories/{id}/paths`: Downsampled polyline coordinates for map layers.

### 4.3. Research Dashboard Frontend (`frontend/`)
- **Architecture:** Single-page application built with React 18, Vite 6, Tailwind CSS, Leaflet, and Plotly.js.
- **Key Visual Components:**
  - `Header`: Mode badges (`GNSS`, `HYBRID`, `DR`), scenario indicators (`NORMAL`, `DEGRADED`, `OUTAGE (SOFTWARE-SIMULATED)`, `RECOVERY`), WebSocket liveness, and research evidence button.
  - `TransportBar`: Play/pause, step backward/forward, reset, speed multipliers ($0.5\times, 1.0\times, 2.0\times, 5.0\times, 10.0\times$), and interactive trajectory timeline seek bar.
  - `MapView`: High-contrast CartoDB Dark Matter Leaflet map displaying real geodetic coordinates, dynamic vehicle position marker, camera tracking, and layer toggles for Offline Reference GT, VYRA Adaptive, Fixed HYBRID, Raw GNSS, and Pure DR.
  - `CandidateForecastPanel`: The core VYRA contribution visualizer showing 3 candidate cards for $\{ \text{GNSS}, \text{HYBRID}, \text{DR} \}$, displaying predicted future error $\widehat{e}_{t+\tau}(A)$, visual safety margin bars against the $5.0\text{ m}$ threshold, disqualification banners, policy winner highlight, and formal decision rationale.
  - `TelemetryMonitor`: Live numeric readouts and visual gauges for GNSS Quality $Q_t$, $P(\text{degradation})$, DR uncertainty $1\sigma$, DR survivability $T_{\text{surv}}$, and instantaneous horizontal error $e_t$.
  - `PlotsView`: Interactive Plotly time-series plot displaying real-time tracking error versus the $5.0\text{ m}$ safety envelope with outage event highlights.
  - `ResearchModal`: Full-screen tabbed dialog providing complete interactive access to validated experimental Tables 1, 2, 5, 7, and 8, as well as a full gallery of all 16 publication figures.
- **Zero Mock Policy:** All telemetry values originate directly from validated backend parquet and json outputs. Ground truth is strictly designated as **OFFLINE REFERENCE**.

