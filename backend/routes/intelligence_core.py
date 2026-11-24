"""API Router for VYRA Engineering Intelligence Core."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.services.engineering_intelligence_service import (
    engineering_intelligence_service,
)

router = APIRouter(prefix="/intelligence", tags=["Engineering Intelligence Core"])


class ExperimentRequest(BaseModel):
    fault_type: str = Field("COMPLETE_GPS_LOSS", description="Fault ID to inject")
    severity: str = Field("HIGH", description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")
    duration_s: float = Field(8.0, ge=1.0, le=35.0, description="Duration of injected fault in seconds")
    start_epoch: int = Field(30, ge=0, description="Initial dataset slice offset")
    slice_count: int = Field(140, ge=60, le=250, description="Number of epochs to evaluate at 10 Hz")
    seed: int = Field(42, description="Random seed for deterministic pseudo-random number generator")
    error_threshold_m: float = Field(5.0, ge=1.0, le=20.0, description="Safety critical error threshold")
    prediction_horizon_s: float = Field(3.0, ge=1.0, le=10.0, description="Candidate forecast horizon in seconds")
    enforce_dwell: bool = Field(True, description="Enforce anti-chattering dwell time (0.5s)")


class ReplayRequest(BaseModel):
    experiment_id: Optional[str] = Field(None, description="Cached experiment ID to replay")
    config: Optional[Dict[str, Any]] = Field(None, description="Original experiment configuration dictionary")


@router.get("/faults")
async def get_fault_catalog():
    """Retrieve specifications of the 6 authentic fault models in the laboratory."""
    return {
        "count": len(engineering_intelligence_service.get_fault_catalog()),
        "faults": engineering_intelligence_service.get_fault_catalog(),
    }


@router.post("/experiment")
async def run_fault_experiment(req: ExperimentRequest):
    """Execute a controlled fault injection experiment through the VYRA navigation core."""
    data = req.model_dump() if hasattr(req, "model_dump") else req.dict()
    result = engineering_intelligence_service.run_experiment(data)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result


@router.post("/replay")
async def replay_experiment(req: ReplayRequest):
    """Deterministically rerun an experiment and verify 100% concordance and bitwise reproducibility."""
    cfg = req.config or {}
    result = engineering_intelligence_service.replay_experiment(config=cfg, original_id=req.experiment_id)
    if result.get("status") != "SUCCESS":
        raise HTTPException(status_code=400, detail="Replay failed to evaluate")
    return result


@router.get("/decision")
async def get_decision_inspection(
    epoch_index: int = Query(0, ge=0, description="Epoch index to inspect"),
    experiment_id: Optional[str] = Query(None, description="Experiment identifier"),
):
    """Fetch complete observation, candidate decomposition J(A), and predicted vs ground truth outcome."""
    result = engineering_intelligence_service.get_decision_inspection(
        experiment_id=experiment_id,
        epoch_index=epoch_index,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result
