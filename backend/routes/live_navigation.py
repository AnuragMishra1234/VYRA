"""Live Navigation API Router for VYRA Interactive Demonstration."""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field

from backend.services.live_navigation_service import live_navigation_service

router = APIRouter(prefix="/live-navigation", tags=["Live Navigation"])


class WhatIfRequest(BaseModel):
    gnss_quality: float = Field(0.9, ge=0.0, le=1.0, description="Composite GNSS quality score [0.0, 1.0]")
    satellite_count: int = Field(12, ge=0, le=24, description="Number of tracked GNSS satellites")
    outage_duration_s: float = Field(0.0, ge=0.0, le=60.0, description="Injected outage duration in seconds")
    vehicle_speed_mps: float = Field(12.5, ge=0.0, le=50.0, description="Vehicle speed in meters/second")
    prediction_horizon_s: float = Field(3.0, ge=1.0, le=15.0, description="Error forecasting horizon in seconds")
    error_threshold_m: float = Field(5.0, ge=1.0, le=30.0, description="Critical localization error threshold")
    initial_mode: str = Field("HYBRID", description="Pre-decision active navigation mode")
    degradation_level: str = Field("NONE", description="Degradation type: NONE, MINOR, MULTIPATH, SEVERE")


class ChatbotQueryRequest(BaseModel):
    query: str = Field(..., description="Technical question about VYRA")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Current simulation state/telemetry")


class ReportRequest(BaseModel):
    experiment_id: str = Field("EXP-LIVE-001", description="Unique experiment identifier")
    title: str = Field("VYRA Live Navigation Experiment Report", description="Report title")
    scenario: str = Field("GNSS Outage Stress Test", description="Executed scenario description")
    outage_duration_s: float = Field(10.0, ge=0.0, le=60.0, description="Tested outage duration")
    notes: Optional[str] = Field("", description="Operator/Examiner experiment notes")


@router.get("/simulate")
async def get_simulation_slice(
    start_index: int = Query(0, ge=0),
    count: int = Query(100, ge=1, le=500),
    injected_outage_start: Optional[int] = Query(None, ge=0),
    injected_outage_duration_s: float = Query(0.0, ge=0.0, le=60.0),
):
    """Retrieve simulated telemetry slice with optional dynamic outage injection."""
    return live_navigation_service.get_simulation_slice(
        start_index=start_index,
        count=count,
        injected_outage_start=injected_outage_start,
        injected_outage_duration_s=injected_outage_duration_s,
    )


@router.post("/what-if")
async def run_what_if_scenario(req: WhatIfRequest):
    """Evaluate multi-objective decision costs and forecast errors for scenario inputs."""
    return live_navigation_service.evaluate_what_if_scenario(
        gnss_quality=req.gnss_quality,
        satellite_count=req.satellite_count,
        outage_duration_s=req.outage_duration_s,
        vehicle_speed_mps=req.vehicle_speed_mps,
        prediction_horizon_s=req.prediction_horizon_s,
        error_threshold_m=req.error_threshold_m,
        initial_mode=req.initial_mode,
        degradation_level=req.degradation_level,
    )


@router.get("/comparison")
async def get_algorithm_comparison(
    dataset: str = Query("V-S3a"),
    scenario: str = Query("all_outages"),
    outage_duration_s: Optional[float] = Query(None, ge=0.0, le=60.0),
):
    """Return authentic 5-baseline comparison benchmark metrics."""
    return live_navigation_service.get_algorithm_comparison(
        dataset=dataset,
        scenario=scenario,
        outage_duration_s=outage_duration_s,
    )


@router.post("/chatbot")
async def answer_bot_query(req: ChatbotQueryRequest):
    """Answer technical questions about the VYRA system with scientific grounding."""
    return live_navigation_service.answer_bot_query(
        query=req.query,
        context=req.context,
    )


@router.post("/report/pdf")
async def generate_experiment_pdf(req: ReportRequest):
    """Generate and download a publication-grade PDF report."""
    try:
        pdf_bytes = live_navigation_service.generate_pdf_report(
            experiment_id=req.experiment_id,
            title=req.title,
            scenario=req.scenario,
            outage_duration_s=req.outage_duration_s,
            notes=req.notes or "",
        )
        filename = f"VYRA_Report_{req.experiment_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {ex}")
