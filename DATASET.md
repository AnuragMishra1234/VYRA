# VYRA: Dataset Requirements & Ingestion Specification

## 1. Primary Dataset Target: IO-VNBD

The primary benchmark dataset investigated in VYRA is **IO-VNBD** (Inertial Odometry and Vehicle Navigation Benchmark Dataset), with support for equivalent public vehicular/robotic benchmarks providing synchronized GNSS, IMU, and ground truth references.

> [!IMPORTANT]
> **Schema Discovery Rule:** Never assume hardcoded column names or sampling frequencies. The preprocessing pipeline must inspect the raw schema dynamically upon ingestion.

---

## 2. Sensor Modalities & Target Fields

### 2.1. GNSS Data Stream
Anticipated fields subject to dataset verification:
- `timestamp`: UTC or Unix epoch (seconds / nanoseconds)
- `latitude`, `longitude`, `altitude`: WGS84 ellipsoidal coordinates
- `speed_mps`: Estimated ground velocity ($m/s$)
- `heading_deg`: Course over ground (degrees)
- `satellites_visible` / `satellites_used`: Visible and used satellite counts
- `hdop`, `vdop`, `pdop`: Horizontal, vertical, and position dilution of precision
- `horizontal_accuracy`, `vertical_accuracy`: Reported $1\sigma$ or $2\sigma$ error bounds ($m$)
- `c_n0` / `snr`: Average or per-satellite Carrier-to-Noise density ratio ($dB\text{-}Hz$)
- `fix_type`: Fix status (e.g., 0=Invalid, 1=Autonomous GNSS, 2=DGPS, 4=RTK Fixed, 5=RTK Float)

### 2.2. Inertial Measurement Unit (IMU)
Anticipated fields:
- `timestamp`: High-rate IMU epoch
- `acc_x`, `acc_y`, `acc_z`: Specific force in body frame ($m/s^2$)
- `gyro_x`, `gyro_y`, `gyro_z`: Angular rate in body frame ($rad/s$ or $deg/s$)
- `mag_x`, `mag_y`, `mag_z`: Magnetic flux density (if available, $\mu T$)
- `orientation_quat` / `rpy`: Onboard orientation estimates (if provided)

### 2.3. Ground Truth Reference
- High-precision reference trajectory (e.g., dual-antenna RTK GNSS/high-grade tactical INS or SLAM reference).
- Provides centimeter/decimeter-level 3D position and orientation for ground-truth error evaluation.

---

## 3. Directory Layout

The `data/` directory is partitioned into four distinct stages:

```text
data/
├── raw/         # Untracked in git. Pristine downloaded dataset archives.
├── processed/   # Synchronized, cleaned, and coordinate-transformed parquet/h5 files.
├── splits/      # Partition definitions: train_trajectories.json, val_trajectories.json, test_trajectories.json.
└── metadata/    # Dataset statistics, schema reports, and missing-value logs.
```

---

## 4. Anti-Data-Leakage Splitting Protocol

1. **Partition by Entire Trajectory:** Datasets must be split at the trajectory / trip level. For example:
   - *Training Set:* Trajectories `TR_01` through `TR_06`
   - *Validation Set:* Trajectories `TR_07` and `TR_08`
   - *Unseen Test Set:* Trajectories `TR_09` and `TR_10`
2. **Prohibition of Shuffling:** Rolling time-series windows or overlapping slices from the same physical drive must **never** be placed across both training and test partitions.
3. **Strict Normalization Scope:** All feature scalers (e.g., StandardScaler, MinMax) must be fitted **only** on the training split, then applied to validation and test splits without leakage.
