# VYRA Navigation Subsystem

## 1. Overview & Purpose

The `navigation` package provides a mathematically sound, uncertainty-aware navigation foundation for the VYRA research framework. It decouples **navigation state estimation** from **navigation mode decisions**:
- **Phase 3 (This Subsystem):** Estimates position, velocity, heading, gyroscope bias, state covariance, and Dead Reckoning (DR) survivability.
- **Phase 4 (Forecasting):** Consumes these continuous state and uncertainty representations to predict the future localization consequences of candidate modes ($\text{GNSS}$, $\text{HYBRID}$, $\text{DR}$).
- **Phase 5 (Adaptive Policy):** Evaluates forecast risks and selects the optimal navigation mode under dwell-time constraints.

---

## 2. Sensor Channels & Units

Derived and validated on the authentic **IO-VNBD** vehicular dataset:

| Channel | Raw Dataset Field | Internal Unit | Physical Meaning |
| :--- | :--- | :--- | :--- |
| **Longitudinal Acceleration** | `Indicated Longitudinal Acceleration (g)` | $\text{m/s}^2$ | Forward acceleration ($a_{\text{long}} = g_{\text{raw}} \times 9.80665$) |
| **Lateral Acceleration** | `Indicated Lateral Acceleration (g)` | $\text{m/s}^2$ | Lateral right acceleration ($a_{\text{lat}} = g_{\text{raw}} \times 9.80665$) |
| **Angular Yaw Rate** | `Yaw Rate (deg/sec)` | $\text{rad/s}$ | Vertical axis rotation rate ($\omega_z = \text{deg/s} \times \frac{\pi}{180}$) |
| **Wheel Speed Odometry** | `Indicated Vehicle Speed (km/hr)` | $\text{m/s}$ | Vehicle ground speed ($v_{\text{wheel}} = \text{km/h} / 3.6$) |
| **Geodetic Coordinates** | `Latitude (degrees)`, `Longitude (degrees)` | Degrees / WGS-84 | Global geodetic position fixes |
| **Elevation / Altitude** | `Height (km)` [Empirically in meters: 90-145 m] | Meters | Height above reference ellipsoid |

---

## 3. Coordinate Frames & Conventions

1. **Body Frame ($b$):**
   - $+Y_b$: Longitudinal forward vehicle heading
   - $+X_b$: Lateral right axis
   - $+Z_b$: Vertical up axis (right-handed convention; CCW yaw rate is positive)
2. **Navigation Frame ($n$ / Local ENU):**
   - Tangent plane anchored to initial valid geodetic fix $(lat_0, lon_0, alt_0)$
   - $+X_n$: East ($p_E$, meters)
   - $+Y_n$: North ($p_N$, meters)
   - $+Z_n$: Up ($p_U$, meters)
3. **Heading Conversions:**
   - Compass Azimuth $\psi$: $[0^\circ, 360^\circ)$ clockwise from North
   - ENU Yaw $\theta$: $[-\pi, \pi)$ radians counter-clockwise from East
   - Conversion: $\theta = \frac{\pi}{2} - \text{radians}(\psi)$, $\psi = \left(90^\circ - \text{degrees}(\theta)\right) \pmod{360^\circ}$

---

## 4. Architectural Modules

### `coordinate_frames.py`
- WGS84 Ellipsoidal to ECEF and local ENU conversions.
- Direct geodetic to ENU projections and 2D body-to-navigation rotation matrices.

### `imu_processing.py`
- Preprocesses raw automotive CAN / IMU records into `IMUObservation` containers.
- Enforces causal time delta clamping ($0.05\text{s} \le \Delta t \le 1.0\text{s}$).
- Zero Velocity Update (ZUPT) detection: clamps stationary gyro noise to prevent standstill heading drift.

### `dead_reckoning.py`
- Strapdown 2D dead-reckoning mechanization in ENU coordinates:
  $$\theta_k = \theta_{k-1} + \omega_{z, k} \Delta t$$
  $$v_{E, k} = v_k \cos(\theta_k), \quad v_{N, k} = v_k \sin(\theta_k)$$
  $$p_{E, k} = p_{E, k-1} + \frac{1}{2}(v_{E, k-1} + v_{E, k}) \Delta t$$
  $$p_{N, k} = p_{N, k-1} + \frac{1}{2}(v_{N, k-1} + v_{N, k}) \Delta t$$

### `ekf.py`
- 6-state Extended Kalman Filter:
  $$\mathbf{x} = [p_E, p_N, v_E, v_N, \theta, b_g]^T \in \mathbb{R}^6$$
- Process noise matrix $\mathbf{Q} \in \mathbb{R}^{6 \times 6}$.
- Quality-adaptive measurement covariance $\mathbf{R}_k$:
  $$\mathbf{R}_k = \mathbf{R}_{\text{nominal}} \left(1 + \gamma \frac{1 - Q_k}{\max(Q_k, 0.01)}\right)$$
- Normalized Innovation Squared (NIS) gating with $\chi^2(4)$ threshold (13.28 at 99%).
- Joseph-form covariance update ensuring positive semi-definiteness:
  $$\mathbf{P}_k = (I - K H) \mathbf{P}_k^- (I - K H)^T + K \mathbf{R}_k K^T$$

### `uncertainty.py`
- Extracts horizontal 1-sigma uncertainty $\sigma_{\text{horiz}} = \sqrt{\text{Tr}(\mathbf{P}_{\text{pos}})}$.
- Computes 95% confidence ellipse radius $r_{95} = \sqrt{5.991 \cdot \lambda_{\max}}$.
- Validates empirical calibration coverage: fraction of epochs satisfying $\|\mathbf{e}\| \le r_{95}$.

### `policy/survivability.py`
- Analytical DR survivability estimator bounding error growth over outage horizons $T$:
  $$\sigma_{\text{pos}}^2(T) = \sigma_{\text{pos}, 0}^2 + \sigma_v^2 T^2 + \frac{1}{3} v^2 \sigma_\theta^2 T^2 + \frac{1}{12} v^2 \sigma_\omega^2 T^4$$
  $$S(T, E_{\text{thresh}}) = 1 - \exp\left(-\frac{E_{\text{thresh}}^2}{2 \sigma_{\text{pos}}^2(T)}\right) \in [0.0, 1.0]$$

---

## 5. Summary of Experimental Benchmarks (Test Set `V-S3a`)

| Navigation Mode | ATE (m) | Max Error (m) | 5m Error Violation Rate | 10m Error Violation Rate |
| :--- | :--- | :--- | :--- | :--- |
| **GNSS-Only (Freeze in Outage)** | 61.223 | 599.865 | 7.81% | 7.50% |
| **Pure Dead Reckoning** | 865.400 | 1612.257 | 98.38% | 97.82% |
| **EKF (Fixed R)** | 1.596 | 18.765 | 2.04% | 0.97% |
| **EKF (Quality-Adaptive R)** | **1.596** | **18.765** | **2.04%** | **0.97%** |

- **Pure DR Drift Rate:** 18.531 m / km over 25.95 km (~1.85% of travel distance).
- **Uncertainty Calibration:** 99.51% empirical coverage for the 95% confidence radius.
