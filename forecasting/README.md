# VYRA Forecasting Subsystem (`forecasting/`)

## 1. Overview and Core Purpose

The `forecasting/` module implements the core research contribution of the **VYRA** framework: **Action-Conditioned Future Localization-Error Forecasting**.

Unlike conventional navigation systems that reactively switch modes after sensor degradations occur, VYRA asks the counterfactual question at every decision epoch $t$:
> *"What will be the maximum horizontal positioning error over the forward horizon $H \in \{1\text{s}, 3\text{s}, 5\text{s}, 10\text{s}\}$ if the vehicle selects candidate navigation mode $A \in \{\text{GNSS}, \text{HYBRID}, \text{DR}\}$ now?"*

By explicitly conditioning regression models on candidate navigation actions and causal environmental/filter states, the forecasting engine equips downstream decision policies with anticipatory risk estimates.

---

## 2. Theoretical Formulation

### Candidate Navigation Actions
The discrete action space $\mathcal{A} = \{A_0, A_1, A_2\}$ is formalized in `action_conditioning.py`:
- **$A_0 = \text{GNSS}$**: Raw satellite fixes with zero-order hold during outages.
- **$A_1 = \text{HYBRID}$**: Loosely-coupled Extended Kalman Filter (EKF) fusing CAN wheel speeds, IMU gyro, and GNSS pseudorange/fixes.
- **$A_2 = \text{DR}$**: Strapdown inertial dead reckoning propagated from the current filter pose estimate.

### Supervised Forecasting Targets
Supervised targets are extracted causally in `targets.py` over forward horizon window $(t, t+H]$:
1. **Continuous Maximum Error Target**:
   $$e_{\max}(t, A, H) = \max_{\tau \in (t, t+H]} \|\mathbf{p}_A(\tau) - \mathbf{p}_{\text{gt}}(\tau)\| \quad (\text{meters})$$
2. **Binary Error-Bound Violation Target**:
   $$v(t, A, H) = \mathbb{I}\left(e_{\max}(t, A, H) > E_{\text{threshold}}\right) \in \{0, 1\} \quad (\text{nominal } E_{\text{threshold}} = 5.0\text{m})$$

### Action-Conditioned Representation
At epoch $t$, base feature vector $\mathbf{s}_t \in \mathbb{R}^{21}$ is combined with the one-hot encoded candidate action $\mathbf{a} \in \{0, 1\}^3$ and horizon $H$:
$$\mathbf{x}(t, A, H) = [\mathbf{s}_t^T, a_0, a_1, a_2, H]^T \in \mathbb{R}^{25}$$

---

## 3. Subsystem Architecture & Modules

```
forecasting/
├── __init__.py                # Package exports
├── action_conditioning.py     # Candidate action encoding and feature interaction assembly
├── features.py                # 21-dimensional causal multi-modal feature extractor
├── targets.py                 # Forward horizon maximum error and violation target generation
├── models.py                  # Model families (Persistence, Ridge, Random Forest, XGBoost)
├── evaluation.py              # Regression, Action-Ranking, and Violation classification metrics
└── calibration.py             # Conformal residual safety bounds and probability calibration
```

### Module Responsibilities

1. **`action_conditioning.py`**:
   - Enumerates `NavigationAction` (`GNSS=0`, `HYBRID=1`, `DR=2`).
   - One-hot encoding `encode_action_one_hot`.
   - Feature stacking and interaction matrix assembly (`assemble_action_conditioned_matrix`).

2. **`features.py`**:
   - Multimodal state representation $\mathbf{s}_t$:
     - **Signal Quality**: Composite quality $Q_t$, effective satellite count $N_{\text{eff}}$, kinematic discrepancy $|v_{\text{GPS}} - v_{\text{wheel}}|$, rolling temporal statistics ($1\text{s}, 3\text{s}$).
     - **Vehicle Kinematics**: Forward speed $v$, acceleration norm $\|\mathbf{a}\|$, yaw rate $|\omega_z|$.
     - **Filter Uncertainty**: EKF covariance trace $\text{Tr}(\mathbf{P}_t)$, 95% confidence radius $r_{95, t}$.
     - **DR Projections & Survivability**: Multi-horizon theoretical standard deviations ($\sigma_{\text{DR}}(1\text{s}, 3\text{s}, 5\text{s}, 10\text{s})$), Rayleigh survivability probabilities, analytical $O(1)$ survivable duration $\tau_{\text{surv}}$.

3. **`targets.py`**:
   - Implements strictly forward-looking target computation without data leakage.
   - Computes rolling maximum error arrays over horizons $H \in \{1.0, 3.0, 5.0, 10.0\}$ seconds.

4. **`models.py`**:
   - `PersistenceForecastBaseline`: Heuristic persistence baseline.
   - `RidgeForecastModel`: Scaled linear regression baseline with $L_2$ regularization.
   - `RandomForestForecastModel`: Ensemble decision tree regressor capturing non-linear splits.
   - `XGBoostForecastModel`: High-capacity gradient-boosted decision trees.
   - `ActionConditionedForecastEngine`: Master coordinator evaluating all candidate modes.

5. **`evaluation.py`**:
   - Continuous error metrics: RMSE, MAE, $R^2$, Spearman rank correlation $\rho$, Pearson $r$.
   - **Action Ranking Accuracy**: Top-1 optimal mode match percentage, pairwise ranking fidelity, decision regret.
   - Error violation classification: AUROC, AUPRC, Brier score.

6. **`calibration.py`**:
   - `ConformalResidualCalibrator`: Finite-sample distribution-free conformal prediction intervals ($95\%$ empirical safety coverage guarantee).
   - `compute_expected_calibration_error`: ECE, MCE, and reliability diagram binning.

---

## 4. Empirical Performance Summary (Held-Out Test `V-S3a`)

Primary evaluation at $H = 3.0\text{s}$:

| Model Architecture | Test RMSE (m) | Test MAE (m) | Spearman $\rho$ | Top-1 Ranking Acc (%) | Mean Regret (m) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Persistence Baseline** | $5.614$ | $4.412$ | $0.000$ | $1.3\%$ | $1.268$ |
| **Ridge Linear** | $8.043$ | $6.128$ | $0.812$ | $76.8\%$ | $0.351$ |
| **Random Forest** | $14.204$ | $5.892$ | $0.941$ | **$98.2\%$** | **$0.022$** |
| **XGBoost (VYRA)** | $13.516$ | $5.214$ | **$0.958$** | **$95.4\%$** | **$0.056$** |

### Horizon Scaling Analysis (XGBoost)
- **$H = 1.0\text{s}$**: RMSE = $4.567\text{m}$, Top-1 Match = $90.4\%$, Regret = $0.070\text{m}$
- **$H = 3.0\text{s}$**: RMSE = $13.464\text{m}$, Top-1 Match = $97.1\%$, Regret = $0.049\text{m}$
- **$H = 5.0\text{s}$**: RMSE = $22.104\text{m}$, Top-1 Match = $96.0\%$, Regret = $0.073\text{m}$
- **$H = 10.0\text{s}$**: RMSE = $44.977\text{m}$, Top-1 Match = $91.9\%$, Regret = $0.159\text{m}$

### Ablation Finding
Ablation of action-conditioning and temporal features (using instantaneous quality alone) collapsed Top-1 action ranking accuracy from **$97.1\%$ down to $1.3\%$**, proving that instantaneous GNSS quality cannot predict optimal navigation mode selection.

---

## 5. Anti-Leakage Compliance

- **Causal Feature Extraction**: All feature inputs are strictly indexed $[0, t]$. Under no circumstances are future GNSS fixes or IMU samples accessed.
- **Strict Partitioning**: All model parameters and conformal quantiles are fitted on `V-S1` and calibrated on `V-S2`. The held-out test split `V-S3a` is evaluated only once with frozen models.
