# VYRA Data Directory

This directory manages the end-to-end data pipeline for the VYRA research framework.

---

## 1. Directory Structure

```text
data/
├── raw/         # Place original downloaded benchmark datasets here (e.g., IO-VNBD CSV files)
├── processed/   # Generated synchronized, cleaned, and coordinate-transformed trajectories
├── splits/      # Partition definitions (train.json, val.json, test.json) by trajectory ID
└── metadata/    # Generated schema inspection reports, quality summaries, and sensor statistics
```

---

## 2. Where the Dataset Belongs

Raw trajectory files (e.g. from IO-VNBD) must be placed in:
```text
data/raw/
```
Supported formats:
- Tabular CSV (`.csv`) containing vehicular trajectory sensor streams (GNSS, IMU, reference ground truth).

---

## 3. Preprocessing Flow

1. **Ingestion & Validation (`preprocessing/dataset_loader.py`):**
   Discovers files in `data/raw/`, validates columns, parses timestamps, and loads raw sequences.
2. **Dataset Inspection (`preprocessing/dataset_inspector.py`):**
   Analyzes trajectory counts, duration, sampling stability, missing values, and produces `results/processed/dataset_inspection.json`.
3. **Conservative Cleaning (`preprocessing/cleaning.py`):**
   Removes exact duplicates, verifies timestamp monotonicity, and flags sensor anomalies without deleting meaningful signal degradations.
4. **Sensor Synchronization (`preprocessing/synchronization.py`):**
   Aligns IMU and GNSS streams strictly causally (zero lookahead bias).
5. **Coordinate Transformation (`preprocessing/coordinate_utils.py`):**
   Converts geodetic WGS84 (Lat, Lon, Alt) to local Cartesian East-North-Up (ENU) coordinates.
6. **Temporal Splitting (`data/splits/`):**
   Partitions full trajectories into Train, Validation, and Test sets without cross-trajectory contamination.
7. **Sliding-Window Pipeline (`preprocessing/windowing.py`):**
   Extracts causal historical feature windows $[t - L, t]$ and isolated future targets $[t + 1, t + H]$.

---

## 4. Version Control and Security

> [!CAUTION]
> **Files That Must NEVER Be Committed to Git:**
> - Any files in `data/raw/` (except `.gitkeep`)
> - Any large processed files in `data/processed/` (except `.gitkeep`)
> - Proprietary or large archive formats (`*.csv`, `*.bag`, `*.mat`, `*.h5`, `*.parquet`, `*.zip`, `*.tar.gz`)
>
> All raw and large data files are excluded via the root `.gitignore`.
