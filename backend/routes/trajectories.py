"""Trajectory metadata and path geometry router."""

from fastapi import APIRouter, HTTPException, Query
from backend.schemas.trajectory import TrajectoryListResponse, TrajectoryMetadata
from backend.services.trajectory_service import TrajectoryService
from backend.services.playback_engine import playback_engine

router = APIRouter(prefix="/trajectories", tags=["Trajectories"])
trajectory_service = TrajectoryService()


@router.get("", response_model=TrajectoryListResponse)
async def list_trajectories():
    """List all discovered benchmark trajectory drives."""
    trajs = trajectory_service.get_all_trajectories()
    return TrajectoryListResponse(
        trajectories=trajs,
        total_count=len(trajs),
        default_test_id="V-S3a",
    )


@router.get("/{trajectory_id}", response_model=TrajectoryMetadata)
async def get_trajectory_metadata(trajectory_id: str):
    """Retrieve metadata description for a specific drive."""
    meta = trajectory_service.get_trajectory_by_id(trajectory_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Trajectory '{trajectory_id}' not found")
    return meta


@router.get("/{trajectory_id}/paths")
async def get_trajectory_paths(trajectory_id: str, stride: int = Query(10, ge=1, le=100)):
    """Return downsampled polyline lat/lon coordinates for map layer display."""
    if trajectory_id != playback_engine.trajectory_id:
        raise HTTPException(status_code=400, detail=f"Playback cache currently prepared for '{playback_engine.trajectory_id}'")
    return playback_engine.get_trajectory_paths(stride=stride)
