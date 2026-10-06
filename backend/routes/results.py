"""Research results and publication tables router."""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from backend.services.results_service import ResultsService

router = APIRouter(prefix="/results", tags=["Results"])
results_service = ResultsService()


@router.get("/master")
async def get_master_results() -> Dict[str, Any]:
    """Retrieve complete precomputed master results bundle across all 8 tables and experiments."""
    return results_service.get_master_results()


@router.get("/tables/{table_number}")
async def get_table(table_number: int) -> List[Dict[str, Any]]:
    """Retrieve specific validated research table (1 to 8)."""
    if table_number < 1 or table_number > 8:
        raise HTTPException(status_code=400, detail="Table number must be between 1 and 8")
    data = results_service.get_table(table_number)
    return data


@router.get("/figures")
async def get_figures_catalog() -> List[Dict[str, str]]:
    """Retrieve catalog of all publication-grade figures with direct endpoint URLs."""
    return results_service.get_figures_list()
