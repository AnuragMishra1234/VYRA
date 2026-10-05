"""VYRA Preprocessing Package.

Public API exposing dataset loading, inspection, cleaning, synchronization,
coordinate transformations, normalization, temporal splitting, sliding windowing,
and quality/anti-leakage checks.
"""

from preprocessing.cleaning import (
    CleaningReport,
    clean_all_trajectories,
    clean_trajectory,
)
from preprocessing.coordinate_utils import (
    GeodeticAnchor,
    add_enu_coordinates_to_df,
    ecef_to_enu,
    geodetic_to_ecef,
    geodetic_to_enu,
)
from preprocessing.dataset_inspector import (
    inspect_dataset,
    inspect_single_trajectory,
)
from preprocessing.dataset_loader import (
    DatasetNotFoundError,
    DatasetValidationError,
    TrajectoryData,
    discover_and_load_trajectories,
    load_single_trajectory,
    standardize_columns,
)
from preprocessing.normalization import (
    ColumnStatistics,
    TrajectoryNormalizer,
)
from preprocessing.quality_checks import (
    DataIntegrityViolationError,
    check_coordinate_bounds,
    check_no_nan_or_inf_in_tensors,
    check_normalization_leakage,
    check_split_leakage,
    check_timestamp_integrity,
    check_window_causal_integrity,
)
from preprocessing.synchronization import (
    synchronize_causally,
    synchronize_trajectory,
)
from preprocessing.temporal_split import (
    DatasetSplits,
    load_splits,
    save_splits,
    split_trajectories_chronologically,
)
from preprocessing.windowing import (
    WindowedDataset,
    WindowSampleMetadata,
    create_sliding_windows_for_trajectory,
    create_windowed_dataset_from_dict,
)

__all__ = [
    # Loader
    "TrajectoryData",
    "DatasetNotFoundError",
    "DatasetValidationError",
    "load_single_trajectory",
    "discover_and_load_trajectories",
    "standardize_columns",
    # Inspector
    "inspect_single_trajectory",
    "inspect_dataset",
    # Cleaning
    "CleaningReport",
    "clean_trajectory",
    "clean_all_trajectories",
    # Synchronization
    "synchronize_causally",
    "synchronize_trajectory",
    # Coordinates
    "GeodeticAnchor",
    "geodetic_to_ecef",
    "ecef_to_enu",
    "geodetic_to_enu",
    "add_enu_coordinates_to_df",
    # Normalization
    "ColumnStatistics",
    "TrajectoryNormalizer",
    # Temporal Split
    "DatasetSplits",
    "split_trajectories_chronologically",
    "save_splits",
    "load_splits",
    # Windowing
    "WindowSampleMetadata",
    "WindowedDataset",
    "create_sliding_windows_for_trajectory",
    "create_windowed_dataset_from_dict",
    # Quality & Leakage Checks
    "DataIntegrityViolationError",
    "check_timestamp_integrity",
    "check_coordinate_bounds",
    "check_split_leakage",
    "check_window_causal_integrity",
    "check_no_nan_or_inf_in_tensors",
    "check_normalization_leakage",
]
