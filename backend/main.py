"""VYRA Research Dashboard Backend Application.

Provides REST and WebSocket endpoints for trajectory playback, real-time sensor fusion telemetry,
action-conditioned candidate forecasting, and validated publication results.
"""

from __future__ import annotations

import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.health import router as health_router
from backend.routes.playback import router as playback_router
from backend.routes.results import router as results_router
from backend.routes.trajectories import router as trajectories_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vyra.backend")

app = FastAPI(
    title="VYRA Research Navigation & Telemetry API",
    description="Backend API supporting the VYRA Interactive Research Dashboard and Replay Engine.",
    version="1.0.0",
)

# Enable CORS for frontend Vite development server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api prefix
app.include_router(health_router, prefix="/api")
app.include_router(playback_router, prefix="/api")
app.include_router(results_router, prefix="/api")
app.include_router(trajectories_router, prefix="/api")

# Mount static figures directory
repo_root = Path(__file__).resolve().parent.parent
figures_dir = repo_root / "results" / "figures"
if figures_dir.is_dir():
    app.mount("/api/figures", StaticFiles(directory=str(figures_dir)), name="figures")
    logger.info("Mounted figures directory at /api/figures from %s", figures_dir)


@app.get("/api/info")
async def api_info():
    """API info endpoint."""
    return {
        "project": "VYRA",
        "description": "Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization",
        "docs_url": "/docs",
        "api_health": "/api/health",
        "playback_state": "/api/playback/state",
        "master_results": "/api/results/master",
    }


# Mount built frontend application if available
frontend_dist = repo_root / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
    logger.info("Mounted frontend static application from %s", frontend_dist)
else:
    @app.get("/")
    async def root():
        return await api_info()

