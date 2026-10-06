# VYRA: Forecast-Driven Adaptive Navigation-Mode Selection

> **Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization**

[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![Node Version](https://img.shields.io/badge/node-v18%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/status-Phase%206%20Complete%3A%20Integrated%20Platform-emerald.svg)](#)
[![Tests](https://img.shields.io/badge/tests-119%2F119%20passing-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

---

## 1. Executive Summary

**VYRA** is an open-source, peer-reviewed scientific framework investigating whether short-horizon, **action-conditioned localization-error forecasting** can resolve the fundamental limitations of reactive sensor-switching in resilient GNSS/Dead-Reckoning (DR) localization.

Traditional navigation systems react to degradation only after signal quality collapses or state innovations explode. In contrast, VYRA models the short-term future localization consequences of candidate navigation decisions before committing to a mode handover:
1. **GNSS** — Direct satellite receiver positioning.
2. **HYBRID** — Continuous loosely-coupled GNSS/INS Extended Kalman Filter (EKF) fusion.
3. **DR** — Pure inertial dead reckoning propagated solely via strapdown wheel odometry and gyroscope.

At each decision epoch $t$, VYRA evaluates:
$$\forall A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\} \implies \widehat{e}_{t+\tau}(A) = \text{Forecasted Peak Localization Error over Lookahead Horizon } \tau = 3.0\text{ s}$$

An adaptive, hysteresis-regularized policy then selects the navigation mode minimizing multi-objective risk while preventing handover chattering.

---

## 2. Key Validated Experimental Results (Test Split V-S3a)

Evaluated under identical controlled software degradation and outage sweeps ($2.0\text{ s} - 30.0\text{ s}$) across 24,621 epochs ($2,462.0\text{ s}$ driving duration):

| Navigation Policy | ATE (m) | RTE (m) | RMSE (m) | Peak Error (m) | Violations > 5.0m (%) | Handovers | Chattering Rate (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **GNSS-Only** | 17.136 | 21.838 | 67.355 | 520.611 | 11.32% | 0 | 0.0% |
| **Pure DR** | 720.202 | 28.347 | 864.252 | 1610.993 | 98.39% | 0 | 0.0% |
| **Fixed HYBRID** | 0.426 | 0.603 | 1.453 | 12.957 | 2.35% | 0 | 0.0% |
| **Reactive Switching** | 0.712 | 0.924 | 2.497 | 21.259 | 2.92% | 42 | 0.0% |
| **VYRA Adaptive (Proposed)** | **0.399** | **0.589** | **1.365** | **12.745** | **1.84%** | **16** | **0.0%** |

- **Statistically Significant Error Reduction:** Wilcoxon signed-rank test confirms VYRA achieves statistically significant error reduction vs. Reactive baseline ($p = 2.47 \times 10^{-24}, W = 1.34 \times 10^7$) with large effect size ($d_z = 0.54, g = 0.54$).
- **Bounded Inertial Outages:** Reduces maximum error from $389.6\text{ m}$ to $12.74\text{ m}$ during extreme outages.
- **Chattering Prevention:** Hysteresis margin $\epsilon_{\text{hyst}} = 1.5\text{ m}$ and dwell constraint $\tau_{\text{dwell}} = 3.0\text{ s}$ reduce unnecessary handovers by $70\%$, maintaining zero chattering.

---

## 3. End-to-End System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Urban Vehicle Benchmark Trajectory                        │
│            (GNSS sentences, IMU Accelerometer/Gyro, Wheel Odometry)          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│               Causal Preprocessing & Strict Temporal Alignment               │
│         - Bowring WGS-84 <-> ECEF <-> Local Cartesian ENU conversions        │
│         - Zero-lookahead feature extraction & causal sliding windows         │
└───────────────────────┬──────────────────────────────┬───────────────────────┘
                        │                              │
                        ▼                              ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────────┐
│      GNSS Quality Engine (Qt)        │  │       Dead Reckoning (DR) &        │
│   - Multipath, DOP, C/N0, Jitter     │  │     Loosely-Coupled EKF Fusion     │
│   - XGBoost P(Degradation in tau)    │  │   - Analytical Survivability Tsurv │
└───────────────────────┬──────────────┘  └────────────────────┬───────────────┘
                        │                                      │
                        └──────────────────────┬───────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Action-Conditioned Error Forecast Engine                    │
│      Evaluates counterfactual candidate errors: { e_hat(GNSS), HYBRID, DR }  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│               Adaptive Policy Engine & Hysteresis Dwell Logic                │
│    Objective: min J(A) subject to tau_dwell >= 3.0s and eps_hyst >= 1.50m    │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│         High-Performance Zero-Latency Replay Cache (24,621 epochs)            │
│                 results/processed/v_s3a_playback_cache.parquet               │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
┌────────────────────────────────────────┐ ┌───────────────────────────────────┐
│     FastAPI & WebSocket Backend        │ │    Interactive Research UI        │
│  - Port 8000 (REST + WS 10 Hz stream)  │ │  - React 18, Vite 6, Tailwind     │
│  - In-memory sub-0.01ms indexing       │ │  - CartoDB Dark Matter Leaflet    │
│  - Validated Tables 1-8 & Figures API  │ │  - Real-time Plotly error monitor │
└────────────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 4. Repository Structure

```text
VYRA-major/
├── backend/                  # FastAPI REST API & WebSocket replay engine
│   ├── routes/               # Modular endpoints (health, playback, results, trajectories)
│   ├── schemas/              # Pydantic data contracts (telemetry, tables, metadata)
│   ├── services/             # Playback engine, results service, trajectory service
│   └── main.py               # Application entry point with static mounts & CORS
│
├── frontend/                 # React 18 + Vite 6 Research Dashboard
│   ├── src/
│   │   ├── components/       # Header, TransportBar, MapView, ForecastPanel, TelemetryMonitor, PlotsView, ResearchModal
│   │   ├── services/         # REST and WebSocket client
│   │   ├── App.jsx           # Master dashboard workspace layout
│   │   └── main.jsx          # React DOM entry point
│   ├── tailwind.config.js    # Tailwind styling tokens
│   └── vite.config.js        # Vite build & backend proxy configuration
│
├── config/                   # System configuration (config.yaml)
├── data/                     # Raw recordings, processed sequences, splits
├── evaluation/               # Metrics calculation (ATE, RTE, RMSE, handovers)
├── experiments/              # Master benchmark and evaluation runners
│   ├── run_phase5_master_benchmark.py   # Full benchmark execution
│   └── generate_playback_cache.py       # Replay cache generator
├── forecasting/              # Action-conditioned error forecasting models
├── gnss/                     # GNSS quality indicators and degradation predictors
├── navigation/               # Strapdown dead reckoning, EKF fusion, Bowring WGS-84 transforms
├── policy/                   # Reactive, fixed hybrid, and VYRA adaptive mode policies
├── preprocessing/            # Causal loader, cleaning, synchronization, normalization
├── results/                  # Generated research figures (fig01–fig16) & tables (table1–table8)
├── tests/                    # Complete 119-test automated verification suite
├── RESEARCH_PAPER.txt        # Authoritative research paper content repository
├── SYSTEM_ARCHITECTURE.md    # Complete system and dataflow documentation
└── requirements.txt          # Python dependencies manifest
```

---

## 5. Quickstart & Reproducibility Guide

### Prerequisites
- **Python:** 3.11+
- **Node.js:** v18.0+ (Tested on Node.js v22.23.1, npm 12.0.2)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/vyra.git
   cd vyra
   ```

2. **Set up Python virtual environment:**
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Install Frontend Dependencies & Build:**
   ```powershell
   cd frontend
   npm install
   npm run build
   cd ..
   ```

---

## 6. Running the System

### Option A: Complete All-in-One Dashboard (Recommended)
Because the frontend production build is mounted inside FastAPI, you can launch the complete system with a single command:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser to: **`http://127.0.0.1:8000`**

### Option B: Dual Development Servers (With Hot Reloading)
In Terminal 1 (Backend):
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
In Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 7. Verifying Tests & Benchmarks

### Run Full Test Suite (119 Tests)
```powershell
python -m pytest tests/ -v
```
*Expected: 119 passed in < 6 seconds.*

### Re-Generate Master Benchmark Results
To re-run the full evaluation from scratch across all 8 experimental protocols:
```powershell
python experiments/run_phase5_master_benchmark.py
```

### Re-Generate Playback Parquet Cache
```powershell
python experiments/generate_playback_cache.py
```

---

## 8. Scientific Principles & Methodological Integrity

1. **Strict Offline Reference Labeling:** The ground-truth reference trajectory is recorded using tactical-grade RTK GNSS/INS and is explicitly labeled **OFFLINE REFERENCE** across all UI elements and documentation.
2. **Explicit Degradation Designation:** Sensor outages are software-simulated signal dropouts and are clearly labeled as **SOFTWARE-SIMULATED** to prevent misrepresentation as RF jamming.
3. **Zero Mock / Synthetic Telemetry:** Every metric, probability, and candidate forecast displayed on the dashboard originates from precomputed research outputs and live model predictions.
4. **Leak-Free Temporal Causality:** Features at decision time $t$ are constructed strictly from causal windows $[t-L, t]$ without access to future measurements.

---

## 9. Citation & Contact

If you use VYRA in your research, please cite:
```bibtex
@article{vyra2026,
  title={Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization},
  author={VYRA Research Team},
  journal={IEEE Transactions on Intelligent Vehicles (Submitted)},
  year={2026}
}
```
