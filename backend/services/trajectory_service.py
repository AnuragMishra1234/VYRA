"""Trajectory Discovery and Information Service."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

from backend.schemas.trajectory import TrajectoryMetadata
from preprocessing.dataset_loader import discover_and_load_trajectories

logger = logging.getLogger(__name__)


class TrajectoryService:
    """Manages benchmark trajectory discovery and metadata caching."""

    def __init__(self, repo_root: Optional[Path] = None) -> None:
        self.repo_root = repo_root or Path(__file__).resolve().parent.parent.parent
        self.raw_dir = self.repo_root / "data" / "raw"
        self.splits_path = self.repo_root / "data" / "splits" / "splits.json"
        self._cached_metadata: Dict[str, TrajectoryMetadata] = {}
        self._splits_cfg: Dict[str, Any] = {}
        self._load_splits()
        self._scan_trajectories()

    def _load_splits(self) -> None:
        if self.splits_path.is_file():
            with open(self.splits_path, "r", encoding="utf-8") as f:
                self._splits_cfg = json.load(f)
        else:
            self._splits_cfg = {"train_ids": ["V-S1"], "val_ids": ["V-S2"], "test_ids": ["V-S3a"]}

    def _get_split_for_id(self, tid: str) -> str:
        for split_name, ids in [("test", self._splits_cfg.get("test_ids", [])),
                                ("val", self._splits_cfg.get("val_ids", [])),
                                ("train", self._splits_cfg.get("train_ids", []))]:
            if tid in ids:
                return split_name
        return "unassigned"

    def _scan_trajectories(self) -> None:
        try:
            trajs = discover_and_load_trajectories(self.raw_dir)
            for tid, tdata in trajs.items():
                df = tdata.df
                lat_col = "latitude" if "latitude" in df.columns else "lat"
                lon_col = "longitude" if "longitude" in df.columns else "lon"

                t_start = float(df["timestamp"].iloc[0])
                t_end = float(df["timestamp"].iloc[-1])

                meta = TrajectoryMetadata(
                    trajectory_id=tid,
                    total_epochs=len(df),
                    duration_seconds=round(t_end - t_start, 2),
                    sampling_rate_hz=10.0,
                    split=self._get_split_for_id(tid),
                    has_ground_truth="gt_latitude" in df.columns,
                    lat_min=float(df[lat_col].min()),
                    lat_max=float(df[lat_col].max()),
                    lon_min=float(df[lon_col].min()),
                    lon_max=float(df[lon_col].max()),
                )
                self._cached_metadata[tid] = meta
            logger.info("Indexed %d trajectories from %s", len(self._cached_metadata), self.raw_dir)
        except Exception as ex:
            logger.error("Failed to index raw trajectories: %s", ex)

    def get_all_trajectories(self) -> List[TrajectoryMetadata]:
        """Return list of all discovered trajectory descriptors."""
        return list(self._cached_metadata.values())

    def get_trajectory_by_id(self, trajectory_id: str) -> Optional[TrajectoryMetadata]:
        """Retrieve metadata for a specific trajectory."""
        return self._cached_metadata.get(trajectory_id)
