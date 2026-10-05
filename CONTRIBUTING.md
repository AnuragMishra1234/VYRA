# VYRA: Research and Engineering Guidelines

## 1. Core Research Principles & Scientific Integrity

Every contributor and automated coding agent working on VYRA must adhere to these non-negotiable rules:

1. **Zero Fabrication:** Never fabricate experimental metrics, dataset columns, citations, accuracy scores, or ground truth.
2. **Transparent Uncertainty:** If a detail, column, or parameter is unknown, explicitly state:
   > *"This needs to be verified from the dataset/literature/code."*
3. **Strict Anti-Leakage:** Never introduce future information into historical feature windows. Features at step $k$ must be strictly causal ($t \le t_k$).
4. **Accurate Terminology:** Never describe software-simulated outages as physical RF jamming or hardware spoofing.
5. **No Technology Bloat:** Do not add LLMs, RAG pipelines, agent frameworks, or vector databases unless explicitly justified and approved.
6. **Reproducibility:** Never evaluate the final model on test sets with parameters tuned post-hoc. Freeze all hyperparameters on validation data.

---

## 2. Standard 8-Step Feature Implementation Workflow

When introducing any new module or algorithmic capability:

1. **Identify the relevant VYRA module:** Align the feature with the appropriate directory (`gnss/`, `navigation/`, `forecasting/`, etc.).
2. **Define inputs:** Specify expected data structures, coordinate frames, and timestamp formats.
3. **Define outputs:** Specify return shapes, uncertainty bounds, and physical units.
4. **Check dependencies:** Ensure all imported utilities exist and do not introduce cyclical dependencies.
5. **Implement the smallest correct version:** Keep implementations focused, numerically stable, and documented.
6. **Add / update unit tests:** Provide deterministic unit tests in `tests/` asserting causal integrity and boundary conditions.
7. **Run validation:** Execute tests via `pytest` to confirm backward compatibility.
8. **Report changes:** Clearly document what was changed, the scientific rationale, and interface impacts.

---

## 3. Code & Testing Standards

- **Formatting:** Clean, readable Python 3.11 code with PEP 8 compliance.
- **Type Annotations:** Use Python type hinting across all public functions and classes.
- **Docstrings:** Document mathematical formulas, reference frames, and assumptions in Google or NumPy docstring format.
- **Numerical Robustness:** Use epsilon guards against division-by-zero, matrix positive-definiteness checks for EKF covariance matrices, and normalized angles in $[-\pi, \pi)$.
