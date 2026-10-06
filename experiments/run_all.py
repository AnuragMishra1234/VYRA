"""Master Orchestrator to Reproduce All VYRA Experiments.

Executes complete research pipeline:
- Phase 2: Prediction experiments
- Phase 3: Dead reckoning & EKF experiments
- Phase 4: Action-conditioned forecasting & policy experiments
- Phase 5: Controlled experimental validation, ablations & statistical analysis
"""

import logging
import sys
from pathlib import Path

# Ensure repo root on path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from experiments.phase5_experiments import execute_phase5_experiments

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    logger.info("Executing VYRA Master Experiment Runner...")
    results = execute_phase5_experiments()
    logger.info("All experiments completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
