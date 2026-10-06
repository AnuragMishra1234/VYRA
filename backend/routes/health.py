"""Health check router."""

from fastapi import APIRouter
from backend.services.playback_engine import playback_engine

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def get_health():
    """Verify backend health and data cache readiness."""
    return {
        "status": "healthy",
        "service": "VYRA Research Integration API",
        "version": "1.0.0",
        "cache_loaded": playback_engine.total_epochs > 0,
        "total_cached_epochs": playback_engine.total_epochs,
        "default_trajectory": playback_engine.trajectory_id,
    }
