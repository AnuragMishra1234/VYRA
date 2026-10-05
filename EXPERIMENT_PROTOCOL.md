# VYRA: Reproducible Experiment Protocol

## 1. Protocol Overview

This document specifies the experimental protocol governing all data handling, model training, evaluation runs, and baseline benchmarking in VYRA. To uphold scientific integrity, parameters awaiting dataset inspection are explicitly designated as `[TODO — VERIFY FROM DATASET]`.

---

## 2. Experimental Specification (Sections A — R)

### A. Dataset
- **Target Dataset:** IO-VNBD (Inertial Odometry and Vehicle Navigation Benchmark Dataset).
- **Source / Authors:** Uche Onyekpeu et al., Coventry University (published in MDPI Data / Sensors).
- **Format:** CSV files per driving trip / sequence.
- **Repository:** `https://github.com/onyekpeu/IO-VNBD`.
- **Status:** `[TODO — VERIFY FROM DATASET: Confirm specific vehicle (V-) vs. smartphone (S-) sub-splits upon download]`.

### B. Trajectory Definition
- A continuous, uninterrupted vehicular drive sequence identified by a unique trajectory ID (e.g., `trajectory_id` or trip CSV filename).
- Trajectories must not be concatenated across trips without timestamp gap handling.

### C. Sampling Rate
- **Target Nominal Rate:** 10 Hz (0.1 s per epoch).
- **Status:** `[TODO — VERIFY FROM DATASET: Compute empirical sampling delta mean and jitter from raw timestamps]`.

### D. Sensors Used
- **GNSS Receiver:** Latitude, Longitude, Altitude, Speed, Heading, Satellites Available, DOP parameters (HDOP, VDOP).
- **IMU:** 3-axis Accelerometer (longitudinal/lateral/vertical acceleration), 3-axis Gyroscope (yaw rate / angular rates).
- **Odometry:** Wheel speed / CAN bus speed (if available in subset).
- **Status:** `[TODO — VERIFY FROM DATASET: Check column names and unit scaling across V- and S- series]`.

### E. Coordinate Systems
- **Raw Geographic:** WGS84 Ellipsoidal (Latitude [deg], Longitude [deg], Altitude [m]).
- **Global Cartesian:** Earth-Centered Earth-Fixed (ECEF) [m].
- **Local Navigation Frame:** East-North-Up (ENU) tangent frame [m], anchored to the initial valid GNSS position of each trajectory.
- **Body Frame:** Vehicle body frame (X-Right, Y-Forward, Z-Up or dataset-specific convention).

### F. Ground-Truth Definition
- Benchmark reference trajectory provided with the dataset (e.g., dual-antenna RTK GNSS / high-grade tactical INS).
- **Status:** `[TODO — VERIFY FROM DATASET: Verify ground-truth accuracy specification and reference sensor from IO-VNBD documentation]`.

### G. Training Split
- Distinct physical drive trajectories partitioned exclusively for model training.
- No temporal overlap with validation or test partitions.
- Minimum 60% of total available trajectories.

### H. Validation Split
- Separate, independent trajectories reserved for hyperparameter tuning, probability calibration, and threshold optimization.
- Minimum 20% of total available trajectories.

### I. Test Split
- Completely held-out, unseen trajectories reserved strictly for final evaluation.
- Never exposed to feature normalization fitting, model training, or threshold tuning.
- Minimum 20% of total available trajectories.

### J. Window Size (History)
- **Causal Observation Window:** $L_{\text{history}} = 50$ epochs ($5.0\text{ s}$ at 10 Hz nominal rate).
- Captures short-term motion trends, acceleration jitter, and GNSS quality derivatives.

### K. Forecast Horizons
- Evaluated forward horizons: $H \in \{1.0\text{s}, 3.0\text{s}, 5.0\text{s}, 10.0\text{s}\}$.
- Corresponding sample steps at 10 Hz: $K_H \in \{10, 30, 50, 100\}$ steps.

### L. Feature Construction Rules
- Strictly causal: A feature vector at time step $k$ ($t_k$) must be constructed using data **only** from the window $[t_k - L_{\text{history}}, t_k]$.
- Measurements from $t > t_k$ are strictly forbidden.

### M. Label Construction Rules
- Supervised targets represent the consequence observed over the future interval $[t_k + 1, t_k + H]$.
- Formulations:
  1. Position error at horizon: $\|\mathbf{p}_{\text{est}}(t_k + H) - \mathbf{p}_{\text{gt}}(t_k + H)\|$.
  2. Maximum error in horizon: $\max_{\tau \in [t_k, t_k + H]} \|\mathbf{p}_{\text{est}}(\tau) - \mathbf{p}_{\text{gt}}(\tau)\|$.
  3. Binary error-bound violation: $\mathbb{I}(\|\mathbf{p}_{\text{est}}(t_k + H) - \mathbf{p}_{\text{gt}}(t_k + H)\| > E_{\text{threshold}})$.

### N. Leakage Prevention Rules
1. Split assignment occurs strictly at the trajectory ID level, never by shuffling individual time rows.
2. Normalization scalers (mean, variance, min-max) are fitted **only** on the training split.
3. Sliding windows must terminate at trajectory boundaries and never bridge separate trajectories.
4. Future ground truth and future sensor inputs are segregated from historical feature vectors.

### O. Random Seeds
- Global deterministic seed: `42` across all random number generators (NumPy, scikit-learn, XGBoost).

### P. Evaluation Metrics
- **Localization:** Absolute Trajectory Error (ATE), Relative Trajectory Error (RTE), RMSE (ENU), Maximum Error, Terminal Drift.
- **Reliability:** Time above error threshold ($E_{\text{threshold}} \in \{5\text{m}, 10\text{m}, 20\text{m}\}$), violation percentage.
- **Policy Stability:** Total handover count, false handover rate, missed handover rate, mode chattering frequency.
- **Forecasting Quality:** Forecast RMSE, Mean Absolute Error (MAE), Expected Calibration Error (ECE), Spearman rank correlation.

### Q. Baseline Definitions
1. **GNSS-only:** Accepts GNSS position fixes directly; holds last fix during outages.
2. **Pure DR:** Propagates strapdown inertial navigation continuously without GNSS updates.
3. **Reactive Switching:** Rule-based switching to DR when HDOP $> \tau_{\text{HDOP}}$ or satellite count $< 4$; returns to GNSS upon reacquisition.
4. **Fixed Hybrid:** Fixed-gain Extended Kalman Filter continuously fusing GNSS and IMU without adaptive outlier rejection.
5. **VYRA Adaptive Policy:** Forecast-driven policy evaluating predicted future risks of candidate actions subject to dwell time and switching penalties.

### R. Reproducibility Requirements
- Every experimental execution logs: configuration hash, git commit hash, trajectory IDs per split, software versions, and generated metrics in structured JSON format under `results/`.
