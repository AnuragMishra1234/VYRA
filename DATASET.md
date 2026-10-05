# VYRA: Dataset Documentation & Acquisition Specification

## 1. Dataset Identification

- **Dataset Name:** IO-VNBD (Inertial Odometry and Vehicle Navigation Benchmark Dataset)
- **Primary Source / Authors:** Uche Onyekpeu et al., Coventry University
- **Publication Venue:** MDPI Data / Sensors
- **Official Repository:** `https://github.com/onyekpeu/IO-VNBD`
- **License:** Open Access / Academic Research Use (as specified in repository)
- **Geographic Coverage:** United Kingdom, Nigeria, France (diverse urban, suburban, motorway, and country road conditions)
- **Vehicle Platform:** Ford Fiesta Titanium instrumented research vehicle + Android smartphone sensor suite

---

## 2. Sensor Modalities & Suitability Analysis

| Modality | Description & Target Fields | Suitability for VYRA |
| :--- | :--- | :--- |
| **GNSS Receiver** | GPS Satellites available, Timestamp, Latitude, Longitude, Height, Velocity, Heading, Sample period | **Directly suitable:** Provides standard receiver quality signals and absolute position fixes for baseline navigation and degradation analysis. |
| **Inertial Sensors (IMU)**| Longitudinal and lateral accelerations, yaw rate / angular velocities, orientation | **Directly suitable:** Enables standalone strapdown dead-reckoning mechanization and EKF hybrid fusion. |
| **Vehicle Odometry / CAN**| Wheel speed, steering angle, vehicle ECU speed | **Beneficial auxiliary input:** Can constrain inertial drift and provide non-holonomic velocity updates. |
| **Smartphone Suite** | 3-axis accelerometer, gyroscope, magnetometer, orientation (Yaw, Pitch, Roll) | **Valuable secondary testbed:** Evaluates generalizability to low-cost consumer sensor hardware. |
| **Ground Truth Reference**| Dual-antenna RTK / Tactical INS reference trajectory | **Mandatory requirement:** Required for computing Absolute Trajectory Error (ATE) and evaluating future error predictions. |

---

## 3. Known Limitations & Verification Requirements

1. **Sampling Frequency:** Reported nominal rate is 10 Hz across vehicle and phone streams. `[TODO — VERIFY FROM DATASET: Check for timestamp jitter or missing epochs]`.
2. **Ground Truth Precision:** Need to verify the specific sensor used as ground truth across each drive sequence (tactical INS vs RTK fixed).
3. **GNSS Metrics Granularity:** Need to confirm whether raw Carrier-to-Noise Ratio ($C/N_0$) or raw pseudoranges are included or whether only satellite counts and DOP are logged.
4. **Coordinate Frames:** Sensor mounting orientation relative to the vehicle chassis frame must be verified from dataset documentation.

---

## 4. Dataset Acquisition Instructions

To obtain the authentic IO-VNBD benchmark dataset for VYRA:

1. Clone or download the dataset repository from GitHub:
   ```bash
   git clone https://github.com/onyekpeu/IO-VNBD.git
   ```
2. Locate the CSV trajectory sequences (e.g., `V-` series for vehicle data and `S-` series for smartphone recordings).
3. Copy or link the raw CSV trajectory files into the `data/raw/` directory:
   ```text
   data/raw/
   ├── trajectory_01.csv
   ├── trajectory_02.csv
   └── ...
   ```
4. Execute the dataset inspection pipeline:
   ```bash
   python -m preprocessing.dataset_inspector
   ```

---

## 5. Directory Layout & Storage Rules

```text
data/
├── raw/         # RAW BENCHMARK FILES (untracked by git, never committed)
├── processed/   # Cleaned, synchronized, coordinate-transformed Parquet files
├── splits/      # Trajectory partition metadata (train.json, val.json, test.json)
└── metadata/    # Generated schema reports and missing-value statistics
```

> [!WARNING]
> **Strict Pipeline Failure Rule:**  
> If `data/raw/` is empty or lacks supported trajectory files, the ingestion pipeline raises an explicit `DatasetNotFoundError` with clear setup instructions. The system will never fabricate synthetic data or proceed with mock values.

---

## 6. Verified Dataset Trajectories & Degradation Distribution (Phase 2)

### 6.1 Trajectory Characteristics

| Trajectory ID | File Size | Sample Count | Duration | Mean Sample Rate | Sats Min / Max / Mean | Discrepancy Max | Split Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `V-S1` | 10.9 MB | 51,746 | ~1.44 hrs (5,174.6 s) | 10.0 Hz | 0.0 / 24.0 / 21.47 | 17.78 m/s | **Train** |
| `V-S2` | 20.0 MB | 93,876 | ~2.61 hrs (9,387.6 s) | 10.0 Hz | 6.0 / 24.0 / 21.82 | 3.03 m/s | **Validation** |
| `V-S3a` | 5.2 MB | 24,621 | ~0.68 hrs (2,462.1 s) | 10.0 Hz | 0.0 / 24.0 / 21.86 | 1.83 m/s | **Test** |
| **Total** | **36.1 MB** | **170,243** | **~4.73 hrs** | **10.0 Hz** | — | — | — |

### 6.2 Empirical Forward Degradation Class Balances

Calculated from `results/processed/gnss_label_statistics.json` under standard navigation integrity criteria:
- Degraded state: $(Q_t < 0.70) \vee (N_{\text{eff}} < 4) \vee (|v_{\text{GPS}} - v_{\text{wheel}}| > 2.0\text{ m/s})$.

| Split | Trajectory | Horizon $H = 1\text{s}$ | Horizon $H = 3\text{s}$ | Horizon $H = 5\text{s}$ | Horizon $H = 10\text{s}$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Train** | `V-S1` | 219 (0.423%) | 321 (0.620%) | 421 (0.814%) | 671 (1.297%) |
| **Val** | `V-S2` | 90 (0.096%) | 205 (0.218%) | 276 (0.294%) | 426 (0.454%) |
| **Test** | `V-S3a` | 30 (0.122%) | 70 (0.284%) | 110 (0.447%) | 210 (0.853%) |
| **Total** | Aggregate | **339 (0.199%)** | **596 (0.350%)** | **807 (0.474%)** | **1,307 (0.768%)** |

