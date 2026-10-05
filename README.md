# VYRA: Forecast-Driven Adaptive Navigation-Mode Selection

> **Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization**

[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![Status](https://img.shields.io/badge/status-Phase%200%3A%20Scaffolding-yellow.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#)

---

## 1. Overview

**VYRA** is a research framework investigating whether short-horizon, action-conditioned localization-error forecasting can improve adaptive navigation-mode selection during GNSS degradation and outages.

Traditional navigation systems react to degradation only after signal quality drops or position estimation fails. In contrast, VYRA models the short-term future localization consequences of candidate navigation decisions:
1. **GNSS** — Raw GNSS positioning.
2. **HYBRID** — GNSS + inertial dead reckoning fusion (e.g., EKF).
3. **DR** — Pure inertial dead reckoning.

At each decision time $t$, VYRA evaluates:
$$\text{Candidate Action } A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\} \implies \text{Forecasted Future Error / Risk over Horizon } H$$

An adaptive policy then selects the navigation mode expected to provide the optimal balance between localization accuracy, error-bound compliance, and handover stability (preventing chattering).

---

## 2. Core Research Question

> **"Can short-horizon, action-conditioned/counterfactual localization-error forecasting predict the consequences of choosing GNSS, HYBRID fusion, or dead reckoning, and can an adaptive policy use those forecasts to reduce future error-bound violations and unnecessary navigation-mode switching during GNSS degradation and outages?"**

---

## 3. Key Navigation Modes

| Mode | Source Sensors | Description | Typical Failure Mode |
| :--- | :--- | :--- | :--- |
| **GNSS** | GNSS Receiver | Absolute position measurements | Multipath, urban canyons, outages, jamming/spoofing |
| **HYBRID** | GNSS + IMU | Sensor fusion (e.g., Extended Kalman Filter) | Corrupted GNSS innovation updates degrading state |
| **DR** | IMU (Acc + Gyro) | Strapdown inertial dead reckoning | Drift accumulation from sensor bias & integration errors |

---

## 4. Evaluated Baselines

Every experiment compares the proposed VYRA policy against four standard baselines under identical degradation scenarios:
1. **GNSS-only:** Always rely on GNSS when signals are received.
2. **Pure DR:** Sole reliance on inertial dead reckoning.
3. **Reactive Switching:** Conventional threshold-based switching (e.g., switch to DR when GNSS quality drops below a threshold).
4. **Fixed Hybrid:** Fixed-parameter GNSS/INS fusion without adaptive switching.
5. **VYRA Adaptive Policy:** Forecast-driven policy using predicted future error, bound-violation probability, and switching penalties.

---

## 5. Repository Structure

```text
VYRA/
├── README.md               # Project overview and instructions
├── PROJECT_CONTEXT.md      # Authoritative project specification
├── RESEARCH_QUESTION.md    # Formal research question and hypotheses
├── RESEARCH_GAP.md         # Literature gap and novelty boundaries
├── EXPERIMENT_PROTOCOL.md  # Experimental methodology and reproducibility protocol
├── SYSTEM_ARCHITECTURE.md  # Detailed software and dataflow architecture
├── DATASET.md              # Dataset requirements, schema, and splits
├── CONTRIBUTING.md         # Engineering and research contribution guidelines
├── requirements.txt        # Python dependency manifest
├── .gitignore              # Git ignore rules for datasets, cache, and artifacts
│
├── config/                 # Experiment and system configuration files
│   └── config.yaml
│
├── data/                   # Data pipelines (raw datasets untracked in git)
│   ├── raw/                # Original sensor recordings (IO-VNBD)
│   ├── processed/          # Synchronized and normalized trajectories
│   ├── splits/             # Trajectory-level train/validation/test partitions
│   └── metadata/           # Trajectory descriptions and quality reports
│
├── preprocessing/          # Data loading, inspection, alignment, and coordinate utils
├── gnss/                   # GNSS quality indicators, degradation labeling, and predictors
├── navigation/             # IMU processing, dead reckoning, EKF fusion, and uncertainty
├── forecasting/            # Action-conditioned error forecasting engine
├── policy/                 # Reactive, hybrid, and VYRA adaptive mode-selection policies
├── simulation/             # Controlled software GNSS degradation and outage injection
├── models/                 # Model implementations (baselines, ML, deep architectures)
├── experiments/            # Reproducible experiment runners and protocol scripts
├── evaluation/             # Metrics calculation (ATE, RTE, RMSE, lead time, handovers)
├── backend/                # FastAPI and WebSocket playback services
├── frontend/               # React visualization dashboard
├── notebooks/              # Exploratory analysis notebooks
├── results/                # Generated research figures, tables, and metrics
└── tests/                  # Unit and integration test suites
```

---

## 6. Quickstart

### Prerequisites
- Python 3.11+
- Virtual environment tool (`venv`)

### Installation
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Running Tests
```powershell
pytest tests/
```

---

## 7. Research Principles

- **No Data Leakage:** Strict trajectory-level splitting; models at time $t$ never access information from $t+1$ onwards.
- **Controlled Simulation:** Outage and degradation scenarios are controlled software simulations and must never be represented as live RF jamming.
- **Empirical Rigor:** Hypotheses are tested across multiple trajectories with statistical significance reporting.
