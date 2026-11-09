import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from scipy import stats

def detect_iqr(
    cleaned_df: pd.DataFrame,
    numerical_cols: List[str],
    multiplier: float = 1.5
) -> Tuple[np.ndarray, Dict[str, Dict[str, Any]]]:
    """
    Performs univariate Interquartile Range (IQR) anomaly detection.
    Returns:
      - is_outlier_matrix: (N, num_cols) boolean array
      - column_bounds: dictionary with Q1, Q3, IQR, lower_bound, upper_bound per column
    """
    n_rows = len(cleaned_df)
    if not numerical_cols or n_rows == 0:
        return np.zeros((n_rows, 0), dtype=bool), {}

    is_outlier = np.zeros((n_rows, len(numerical_cols)), dtype=bool)
    bounds = {}

    for idx, col in enumerate(numerical_cols):
        s = pd.to_numeric(cleaned_df[col], errors="coerce").fillna(0)
        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1
        
        # Guard against zero IQR (e.g. repeated numbers)
        lower_bound = q1 - multiplier * iqr if iqr > 1e-9 else float(s.min()) - 1e-9
        upper_bound = q3 + multiplier * iqr if iqr > 1e-9 else float(s.max()) + 1e-9

        col_outliers = (s < lower_bound) | (s > upper_bound)
        is_outlier[:, idx] = col_outliers.to_numpy()

        bounds[col] = {
            "q1": round(q1, 4),
            "q3": round(q3, 4),
            "iqr": round(iqr, 4),
            "lower_bound": round(lower_bound, 4),
            "upper_bound": round(upper_bound, 4)
        }

    return is_outlier, bounds

def detect_zscore(
    cleaned_df: pd.DataFrame,
    numerical_cols: List[str],
    threshold: float = 3.0
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Dict[str, Any]]]:
    """
    Performs univariate Z-Score anomaly detection.
    Adapts threshold for small samples (<15 rows) where theoretical maximum
    sample z-score is bounded by (N-1)/sqrt(N).
    """
    n_rows = len(cleaned_df)
    if not numerical_cols or n_rows == 0:
        return np.zeros((n_rows, 0), dtype=bool), np.zeros((n_rows, 0)), {}

    # Small sample adaptive threshold
    effective_threshold = threshold
    if n_rows < 15:
        max_possible_z = (n_rows - 1) / np.sqrt(n_rows)
        effective_threshold = min(threshold, max(1.1, 0.85 * max_possible_z))

    is_outlier = np.zeros((n_rows, len(numerical_cols)), dtype=bool)
    z_matrix = np.zeros((n_rows, len(numerical_cols)), dtype=float)
    col_stats = {}

    for idx, col in enumerate(numerical_cols):
        s = pd.to_numeric(cleaned_df[col], errors="coerce").fillna(0).to_numpy()
        mean_val = float(np.mean(s))
        std_val = float(np.std(s))

        if std_val < 1e-9:
            z_scores = np.zeros_like(s)
            outliers = np.zeros_like(s, dtype=bool)
            lower_bound = mean_val
            upper_bound = mean_val
        else:
            z_scores = np.abs((s - mean_val) / std_val)
            outliers = z_scores >= effective_threshold
            lower_bound = mean_val - effective_threshold * std_val
            upper_bound = mean_val + effective_threshold * std_val

        is_outlier[:, idx] = outliers
        z_matrix[:, idx] = z_scores
        col_stats[col] = {
            "mean": round(mean_val, 4),
            "std": round(std_val, 4),
            "threshold": round(effective_threshold, 2),
            "lower_bound": round(lower_bound, 4),
            "upper_bound": round(upper_bound, 4)
        }

    return is_outlier, z_matrix, col_stats

def detect_isolation_forest(
    scaled_features: np.ndarray,
    contamination: float = 0.05,
    random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Performs multivariate Isolation Forest anomaly detection.
    Returns:
      - is_outlier: 1D boolean array (True if anomaly)
      - anomaly_scores: 1D float array (normalized 0 to 1, higher = more anomalous)
    """
    n_samples, n_features = scaled_features.shape
    if n_samples < 3 or n_features == 0:
        return np.zeros(n_samples, dtype=bool), np.zeros(n_samples)

    # Contamination must be within (0, 0.5]
    safe_contamination = max(0.01, min(0.35, contamination))

    try:
        iso = IsolationForest(
            contamination=safe_contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples="auto"
        )
        preds = iso.fit_predict(scaled_features)
        # raw decision function: negative means outlier, positive means inlier
        raw_scores = iso.decision_function(scaled_features)
        
        # Normalize score into [0, 1] where 1 is highest anomaly severity
        score_min = raw_scores.min()
        score_max = raw_scores.max()
        if score_max - score_min > 1e-9:
            norm_scores = 1.0 - ((raw_scores - score_min) / (score_max - score_min))
        else:
            norm_scores = np.zeros(n_samples)

        is_outlier = (preds == -1)
        return is_outlier, norm_scores
    except Exception:
        return np.zeros(n_samples, dtype=bool), np.zeros(n_samples)

def detect_local_outlier_factor(
    scaled_features: np.ndarray,
    contamination: float = 0.05
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Performs multivariate Local Outlier Factor (LOF) anomaly detection.
    Returns:
      - is_outlier: 1D boolean array
      - anomaly_scores: 1D float array
    """
    n_samples, n_features = scaled_features.shape
    if n_samples < 5 or n_features == 0:
        return np.zeros(n_samples, dtype=bool), np.zeros(n_samples)

    safe_contamination = max(0.01, min(0.35, contamination))
    n_neighbors = max(2, min(20, n_samples - 1))

    try:
        lof = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=safe_contamination
        )
        preds = lof.fit_predict(scaled_features)
        raw_factors = -lof.negative_outlier_factor_  # ~1.0 for normal, >1.5 for outliers
        
        # Scale to [0, 1]
        raw_min = raw_factors.min()
        raw_max = raw_factors.max()
        if raw_max - raw_min > 1e-9:
            norm_scores = (raw_factors - raw_min) / (raw_max - raw_min)
        else:
            norm_scores = np.zeros(n_samples)

        is_outlier = (preds == -1)
        return is_outlier, norm_scores
    except Exception:
        return np.zeros(n_samples, dtype=bool), np.zeros(n_samples)

def detect_categorical_frequency_anomalies(
    df: pd.DataFrame,
    categorical_cols: List[str],
    freq_threshold: float = 0.05
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Detects rare category outliers for purely or heavily categorical datasets.
    Categories with occurrence < freq_threshold (e.g. 5%) or singleton counts are flagged.
    """
    n_rows = len(df)
    if not categorical_cols or n_rows < 5:
        return np.zeros((n_rows, 0), dtype=bool), {}

    is_outlier = np.zeros((n_rows, len(categorical_cols)), dtype=bool)
    cat_details = {}
    effective_threshold = max(freq_threshold, min(0.08, 1.5 / n_rows))

    for idx, col in enumerate(categorical_cols):
        s = df[col].astype(str)
        norm_counts = s.value_counts(normalize=True)
        raw_counts = s.value_counts()
        rare_cats = set(norm_counts[(norm_counts < effective_threshold) | (raw_counts <= 1)].index)
        
        outliers = s.isin(rare_cats).to_numpy()
        is_outlier[:, idx] = outliers
        cat_details[col] = {
            "rare_categories": list(rare_cats)[:10],
            "frequency_threshold": round(effective_threshold, 3)
        }

    return is_outlier, cat_details

def run_anomaly_detection(
    cleaned_df: pd.DataFrame,
    scaled_features: np.ndarray,
    feature_names: List[str],
    profile_summary: Dict[str, Any],
    algorithm_choice: str = "auto",
    contamination: float = 0.05
) -> Dict[str, Any]:
    """
    Runs configured anomaly detection algorithms and combines results.
    Auto mode selects algorithms dynamically based on data shape and properties.
    """
    n_rows = len(cleaned_df)
    num_cols = profile_summary.get("numerical_columns", [])
    cat_cols = profile_summary.get("categorical_columns", [])
    
    # Run all underlying models to allow side-by-side comparison
    iqr_matrix, iqr_bounds = detect_iqr(cleaned_df, num_cols)
    iqr_row_anomalies = iqr_matrix.any(axis=1) if iqr_matrix.shape[1] > 0 else np.zeros(n_rows, dtype=bool)

    z_matrix, z_scores, z_stats = detect_zscore(cleaned_df, num_cols)
    z_row_anomalies = z_matrix.any(axis=1) if z_matrix.shape[1] > 0 else np.zeros(n_rows, dtype=bool)

    iforest_anomalies, iforest_scores = detect_isolation_forest(scaled_features, contamination)
    lof_anomalies, lof_scores = detect_local_outlier_factor(scaled_features, contamination)

    rare_cat_matrix, rare_cat_details = detect_categorical_frequency_anomalies(cleaned_df, cat_cols)
    cat_row_anomalies = rare_cat_matrix.any(axis=1) if rare_cat_matrix.shape[1] > 0 else np.zeros(n_rows, dtype=bool)

    # Determine automatic recommendation / suitability
    auto_reasons = []
    recommended_algo = "ensemble"
    
    if len(num_cols) == 0:
        recommended_algo = "frequency"
        auto_reasons.append("Dataset has no numerical columns; frequency analysis applied to categorical values.")
    elif n_rows < 15:
        recommended_algo = "iqr"
        auto_reasons.append("Small sample size (<15 rows); non-parametric IQR selected to prevent overfitting.")
    elif len(num_cols) == 1:
        recommended_algo = "iqr"
        auto_reasons.append("Single numerical feature detected; IQR & Z-score optimal for 1D distributions.")
    else:
        recommended_algo = "ensemble"
        auto_reasons.append(f"Multi-feature dataset ({len(num_cols)} numerical features, {n_rows} rows); Ensemble consensus leveraging IQR, Z-Score, Isolation Forest, and LOF selected for maximum precision.")

    # Algorithm comparison summary
    comparison = {
        "iqr": {
            "name": "Interquartile Range (IQR)",
            "anomaly_count": int(iqr_row_anomalies.sum()),
            "percentage": round(float(iqr_row_anomalies.sum()) / n_rows * 100, 2) if n_rows else 0
        },
        "zscore": {
            "name": "Z-Score",
            "anomaly_count": int(z_row_anomalies.sum()),
            "percentage": round(float(z_row_anomalies.sum()) / n_rows * 100, 2) if n_rows else 0
        },
        "isolation_forest": {
            "name": "Isolation Forest",
            "anomaly_count": int(iforest_anomalies.sum()),
            "percentage": round(float(iforest_anomalies.sum()) / n_rows * 100, 2) if n_rows else 0
        },
        "lof": {
            "name": "Local Outlier Factor (LOF)",
            "anomaly_count": int(lof_anomalies.sum()),
            "percentage": round(float(lof_anomalies.sum()) / n_rows * 100, 2) if n_rows else 0
        }
    }

    # Selected primary mask
    primary_choice = algorithm_choice.lower()
    selected_mask = np.zeros(n_rows, dtype=bool)
    selected_method_name = "Auto Ensemble"

    if primary_choice == "iqr":
        selected_mask = iqr_row_anomalies
        selected_method_name = "Interquartile Range (IQR)"
    elif primary_choice in ["zscore", "z-score"]:
        selected_mask = z_row_anomalies
        selected_method_name = "Z-Score"
    elif primary_choice in ["isolation_forest", "iforest"]:
        selected_mask = iforest_anomalies
        selected_method_name = "Isolation Forest"
    elif primary_choice == "lof":
        selected_mask = lof_anomalies
        selected_method_name = "Local Outlier Factor"
    else:
        # Auto / Ensemble: A point is anomalous if detected by at least 2 algorithms,
        # OR if an extreme univariate outlier (>4 Z-score or extreme IQR), OR if only 1 algorithm can run.
        voting = np.zeros(n_rows, dtype=int)
        voting += iqr_row_anomalies.astype(int)
        voting += z_row_anomalies.astype(int)
        voting += iforest_anomalies.astype(int)
        voting += lof_anomalies.astype(int)

        extreme_z = (z_matrix > 3.5).any(axis=1) if z_matrix.shape[1] > 0 else np.zeros(n_rows, dtype=bool)
        
        if len(num_cols) == 0:
            selected_mask = cat_row_anomalies
            selected_method_name = "Categorical Frequency Outlier"
        elif n_rows < 15:
            selected_mask = iqr_row_anomalies | z_row_anomalies
            selected_method_name = "Small-Sample Consensus (IQR & Z-Score)"
        elif len(num_cols) == 1:
            selected_mask = iqr_row_anomalies | z_row_anomalies
            selected_method_name = "Univariate Consensus (IQR & Z-Score)"
        else:
            # At least 2 algorithms agree OR extreme outlier
            selected_mask = (voting >= 2) | extreme_z | (iforest_anomalies & (iforest_scores > 0.85))
            selected_method_name = "Multi-Algorithm Ensemble"

    return {
        "selected_method_name": selected_method_name,
        "selected_mask": selected_mask,
        "auto_recommendation": recommended_algo,
        "auto_reasons": auto_reasons,
        "comparison": comparison,
        # Raw detectors for explanation engine
        "iqr": {"matrix": iqr_matrix, "bounds": iqr_bounds, "mask": iqr_row_anomalies},
        "zscore": {"matrix": z_matrix, "z_scores": z_scores, "stats": z_stats, "mask": z_row_anomalies},
        "isolation_forest": {"scores": iforest_scores, "mask": iforest_anomalies},
        "lof": {"scores": lof_scores, "mask": lof_anomalies},
        "categorical_rare": {"matrix": rare_cat_matrix, "details": rare_cat_details, "mask": cat_row_anomalies}
    }
