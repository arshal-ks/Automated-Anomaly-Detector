import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def format_val(v: Any) -> str:
    """Format numerical or text value cleanly for human reading."""
    if v is None or pd.isna(v):
        return "N/A"
    if isinstance(v, (int, np.integer)):
        return f"{v:,}"
    if isinstance(v, (float, np.floating)):
        if abs(v) >= 1000 or (abs(v) < 0.01 and v != 0):
            return f"{v:,.2f}"
        return f"{v:.4f}".rstrip("0").rstrip(".")
    return str(v)

def generate_anomaly_explanations(
    raw_df: pd.DataFrame,
    cleaned_df: pd.DataFrame,
    detection_results: Dict[str, Any],
    profile_summary: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Produces deterministic, statistically grounded human-readable explanations
    for each detected anomaly using actual dataset statistics.

    For every anomaly, calculates and provides:
    1. Row number
    2. Column name
    3. Actual observed value
    4. Statistical mean
    5. Median
    6. Standard deviation (where applicable)
    7. Normal range
    8. Detection algorithm
    9. Anomaly severity (Low, Medium, High, Critical)
    10. Reason for detection
    """
    anomalies: List[Dict[str, Any]] = []
    selected_mask = detection_results["selected_mask"]
    anomaly_indices = np.where(selected_mask)[0]

    num_cols = profile_summary.get("numerical_columns", [])
    cat_cols = profile_summary.get("categorical_columns", [])
    col_profiles = profile_summary.get("columns_profile", {})
    
    iqr_data = detection_results["iqr"]
    z_data = detection_results["zscore"]
    iforest_data = detection_results["isolation_forest"]
    lof_data = detection_results["lof"]
    rare_cat_data = detection_results["categorical_rare"]

    total_records = len(raw_df)

    for row_idx in anomaly_indices:
        display_row = int(row_idx + 1)
        flagged_columns = []

        # =====================================================================
        # 1. Evaluate IQR Violations (Per-column Non-parametric)
        # =====================================================================
        for col_i, col in enumerate(num_cols):
            if iqr_data["matrix"].shape[1] > col_i and iqr_data["matrix"][row_idx, col_i]:
                bounds = iqr_data["bounds"].get(col, {})
                col_stats = col_profiles.get(col, {}).get("stats", {})
                
                actual_val = pd.to_numeric(raw_df[col].iloc[row_idx], errors="coerce")
                if pd.isna(actual_val):
                    actual_val = float(cleaned_df[col].iloc[row_idx])
                
                lb = bounds.get("lower_bound", 0.0)
                ub = bounds.get("upper_bound", 0.0)
                iqr_val = bounds.get("iqr", 1.0)
                mean_val = col_stats.get("mean", None)
                median_val = col_stats.get("median", bounds.get("q1", 0) + iqr_val / 2.0)
                std_val = col_stats.get("std", None)
                
                diff = actual_val - ub if actual_val > ub else lb - actual_val
                ratio = (diff / iqr_val) if iqr_val > 1e-9 else 1.0
                
                # Severity tiers: Low, Medium, High, Critical
                if ratio >= 3.0:
                    severity = "Critical"
                elif ratio >= 1.5:
                    severity = "High"
                elif ratio >= 0.75:
                    severity = "Medium"
                else:
                    severity = "Low"

                is_upper = actual_val > ub
                direction = "above the upper IQR boundary" if is_upper else "below the lower IQR boundary"
                boundary_val = ub if is_upper else lb
                
                reason = (
                    f"The observed value of {format_val(actual_val)} is {direction} ({format_val(boundary_val)}). "
                    f"Most records in this dataset fall within the normal range of {format_val(lb)} to {format_val(ub)} "
                    f"(median: {format_val(median_val)}, IQR: {format_val(iqr_val)})."
                )

                flagged_columns.append({
                    "row": display_row,
                    "row_index": int(row_idx),
                    "column": col,
                    "actual_value": format_val(actual_val),
                    "raw_actual_value": float(actual_val) if not pd.isna(actual_val) else 0.0,
                    "mean": format_val(mean_val),
                    "median": format_val(median_val),
                    "std_dev": format_val(std_val),
                    "normal_range": f"{format_val(lb)} to {format_val(ub)}",
                    "expected_range": f"{format_val(lb)} to {format_val(ub)}",
                    "detection_algorithm": "IQR",
                    "detection_method": "IQR",
                    "severity": severity,
                    "anomaly_score": round(min(1.0, 0.45 + ratio * 0.2), 3),
                    "reason": reason,
                    "explanation": reason,
                    "stats_breakdown": {
                        "mean": mean_val,
                        "median": median_val,
                        "std_dev": std_val,
                        "q1": bounds.get("q1"),
                        "q3": bounds.get("q3"),
                        "iqr": iqr_val,
                        "lower_bound": lb,
                        "upper_bound": ub,
                        "iqr_deviation_ratio": round(ratio, 2)
                    },
                    "contributing_features": []
                })

        # =====================================================================
        # 2. Evaluate Z-Score Violations (Gaussian Standard Deviations)
        # =====================================================================
        for col_i, col in enumerate(num_cols):
            if z_data["matrix"].shape[1] > col_i and z_data["matrix"][row_idx, col_i]:
                z_score = float(z_data["z_scores"][row_idx, col_i])
                stats = z_data["stats"].get(col, {})
                col_stats = col_profiles.get(col, {}).get("stats", {})

                mean_val = stats.get("mean", col_stats.get("mean", 0.0))
                std_val = stats.get("std", col_stats.get("std", 1.0))
                median_val = col_stats.get("median", mean_val)
                lb = stats.get("lower_bound", mean_val - 3 * std_val)
                ub = stats.get("upper_bound", mean_val + 3 * std_val)

                actual_val = pd.to_numeric(raw_df[col].iloc[row_idx], errors="coerce")
                if pd.isna(actual_val):
                    actual_val = float(cleaned_df[col].iloc[row_idx])

                # Severity tiers: Low, Medium, High, Critical
                if z_score >= 5.0:
                    severity = "Critical"
                elif z_score >= 3.8:
                    severity = "High"
                elif z_score >= 2.8:
                    severity = "Medium"
                else:
                    severity = "Low"

                direction = "above" if actual_val > mean_val else "below"
                
                # Check if this column was already added by IQR
                matched_existing = next((item for item in flagged_columns if item["column"] == col), None)
                if matched_existing:
                    matched_existing["detection_algorithm"] = "IQR + Z-Score"
                    matched_existing["detection_method"] = "IQR + Z-Score"
                    matched_existing["mean"] = format_val(mean_val)
                    matched_existing["std_dev"] = format_val(std_val)
                    
                    # Upgrade severity if Z-score is higher
                    sev_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
                    if sev_rank.get(severity, 0) > sev_rank.get(matched_existing["severity"], 0):
                        matched_existing["severity"] = severity
                    
                    combined_reason = (
                        f"The value of {format_val(actual_val)} is unusually far from the dataset mean ({format_val(mean_val)}), "
                        f"with a Z-score of {z_score:.2f} standard deviations ({direction} mean). "
                        f"It also exceeds the calculated IQR boundary ({matched_existing['expected_range']})."
                    )
                    matched_existing["reason"] = combined_reason
                    matched_existing["explanation"] = combined_reason
                    matched_existing["stats_breakdown"]["z_score"] = round(z_score, 2)
                else:
                    reason = (
                        f"The value of {format_val(actual_val)} is unusually far from the dataset mean ({format_val(mean_val)}), "
                        f"with a Z-score of {z_score:.2f} standard deviations ({format_val(abs(actual_val - mean_val))} units {direction} mean; std dev: {format_val(std_val)})."
                    )

                    flagged_columns.append({
                        "row": display_row,
                        "row_index": int(row_idx),
                        "column": col,
                        "actual_value": format_val(actual_val),
                        "raw_actual_value": float(actual_val) if not pd.isna(actual_val) else 0.0,
                        "mean": format_val(mean_val),
                        "median": format_val(median_val),
                        "std_dev": format_val(std_val),
                        "normal_range": f"{format_val(lb)} to {format_val(ub)}",
                        "expected_range": f"{format_val(lb)} to {format_val(ub)}",
                        "detection_algorithm": "Z-Score",
                        "detection_method": "Z-Score",
                        "severity": severity,
                        "anomaly_score": round(min(1.0, z_score / 5.5), 3),
                        "reason": reason,
                        "explanation": reason,
                        "stats_breakdown": {
                            "mean": mean_val,
                            "median": median_val,
                            "std_dev": std_val,
                            "z_score": round(z_score, 2),
                            "lower_bound": lb,
                            "upper_bound": ub
                        },
                        "contributing_features": []
                    })

        # =====================================================================
        # 3. Evaluate Categorical Frequency Anomalies
        # =====================================================================
        for col_i, col in enumerate(cat_cols):
            if rare_cat_data["matrix"].shape[1] > col_i and rare_cat_data["matrix"][row_idx, col_i]:
                actual_val = str(raw_df[col].iloc[row_idx])
                s = raw_df[col].astype(str)
                counts = s.value_counts()
                occurrence_count = int(counts.get(actual_val, 1))
                freq_pct = (occurrence_count / total_records) * 100.0 if total_records > 0 else 0.0
                
                mode_val = str(counts.index[0]) if len(counts) > 0 else "N/A"
                mode_count = int(counts.iloc[0]) if len(counts) > 0 else 0
                mode_pct = (mode_count / total_records) * 100.0 if total_records > 0 else 0.0

                if freq_pct < 0.5:
                    severity = "Critical"
                elif freq_pct < 1.5:
                    severity = "High"
                elif freq_pct < 3.0:
                    severity = "Medium"
                else:
                    severity = "Low"

                reason = (
                    f"The category '{actual_val}' appears in only {freq_pct:.2f}% of all records ({occurrence_count} occurrences), "
                    f"making it an unusually rare categorical anomaly. The predominant category is '{mode_val}' ({mode_pct:.1f}%)."
                )

                flagged_columns.append({
                    "row": display_row,
                    "row_index": int(row_idx),
                    "column": col,
                    "actual_value": actual_val,
                    "raw_actual_value": float(freq_pct),
                    "mean": "N/A",
                    "median": "N/A",
                    "std_dev": "N/A",
                    "normal_range": f"Frequent category (e.g. '{mode_val}')",
                    "expected_range": f"Frequent category (e.g. '{mode_val}')",
                    "detection_algorithm": "Category Frequency",
                    "detection_method": "Category Frequency",
                    "severity": severity,
                    "anomaly_score": round(max(0.5, 1.0 - (freq_pct / 5.0)), 3),
                    "reason": reason,
                    "explanation": reason,
                    "stats_breakdown": {
                        "category": actual_val,
                        "frequency_pct": round(freq_pct, 2),
                        "occurrence_count": occurrence_count,
                        "mode_category": mode_val,
                        "mode_pct": round(mode_pct, 2)
                    },
                    "contributing_features": []
                })

        # =====================================================================
        # 4. Evaluate Multivariate Anomalies (Isolation Forest & LOF)
        # =====================================================================
        # If flagged by multivariate models (either alone or alongside subtle deviations),
        # compute feature-by-feature deviation to pinpoint the exact contributing features.
        is_if = iforest_data["mask"][row_idx] if len(iforest_data["mask"]) > row_idx else False
        is_lof = lof_data["mask"][row_idx] if len(lof_data["mask"]) > row_idx else False
        
        if (is_if or is_lof) and not flagged_columns:
            # Rank all numerical features by standard deviation or IQR deviation
            feature_deviations = []
            for col in num_cols:
                raw_v = pd.to_numeric(cleaned_df[col].iloc[row_idx], errors="coerce")
                if not pd.isna(raw_v):
                    c_stats = col_profiles.get(col, {}).get("stats", {})
                    c_mean = c_stats.get("mean", 0.0)
                    c_median = c_stats.get("median", c_mean)
                    c_std = c_stats.get("std", 1.0)
                    c_iqr = c_stats.get("iqr", 1.0)
                    c_lb = c_stats.get("q1", c_mean) - 1.5 * c_iqr if c_iqr > 1e-9 else c_mean - 3 * c_std
                    c_ub = c_stats.get("q3", c_mean) + 1.5 * c_iqr if c_iqr > 1e-9 else c_mean + 3 * c_std

                    std_safe = c_std if (c_std is not None and c_std > 1e-9) else 1.0
                    z_val = abs(raw_v - c_mean) / std_safe

                    feature_deviations.append({
                        "feature": col,
                        "value": format_val(raw_v),
                        "raw_val": float(raw_v),
                        "mean": format_val(c_mean),
                        "median": format_val(c_median),
                        "std_dev": format_val(c_std),
                        "normal_range": f"{format_val(c_lb)} to {format_val(c_ub)}",
                        "z_score": round(float(z_val), 2),
                        "deviation_score": round(float(z_val), 2),
                        "direction": "Above mean" if raw_v >= c_mean else "Below mean",
                        "c_mean": c_mean,
                        "c_median": c_median,
                        "c_std": c_std,
                        "c_lb": c_lb,
                        "c_ub": c_ub
                    })

            # Sort features descending by deviation score
            feature_deviations.sort(key=lambda x: x["deviation_score"], reverse=True)
            top_feature = feature_deviations[0] if feature_deviations else {
                "feature": "Multivariate Vector",
                "value": "Complex interaction",
                "mean": "N/A",
                "median": "N/A",
                "std_dev": "N/A",
                "normal_range": "Normal cluster space",
                "z_score": 0.0,
                "c_mean": 0.0,
                "c_median": 0.0,
                "c_std": 0.0,
                "c_lb": 0.0,
                "c_ub": 0.0
            }

            score_if = float(iforest_data["scores"][row_idx]) if len(iforest_data["scores"]) > row_idx else 0.5
            score_lof = float(lof_data["scores"][row_idx]) if len(lof_data["scores"]) > row_idx else 0.5
            comb_score = round(max(score_if, score_lof), 3)

            # Determine severity
            if comb_score >= 0.88 or top_feature.get("z_score", 0) >= 4.5:
                severity = "Critical"
            elif comb_score >= 0.72 or top_feature.get("z_score", 0) >= 3.2:
                severity = "High"
            elif comb_score >= 0.55:
                severity = "Medium"
            else:
                severity = "Low"

            # Formulate specific reasoning matching the user's algorithm prompt
            if is_if and is_lof:
                method = "Isolation Forest & LOF"
                contrib_text = f"Primary displaced feature: '{top_feature['feature']}' at {top_feature['value']} (Z-score: {top_feature['z_score']:.2f})."
                reason = (
                    f"This record has a combination of feature values that makes it unusually easy to isolate compared with other records, "
                    f"and exhibits a substantially different local density compared with its neighboring records. {contrib_text}"
                )
            elif is_if:
                method = "Isolation Forest"
                contrib_text = f"Contributing feature: '{top_feature['feature']}' with value {top_feature['value']} (mean: {top_feature['mean']}, std dev: {top_feature['std_dev']})."
                reason = (
                    f"This record has a combination of feature values that makes it unusually easy to isolate compared with other records. "
                    f"{contrib_text} Anomaly isolation score: {score_if:.2f}."
                )
            else:
                method = "Local Outlier Factor"
                reason = (
                    f"This record has a substantially different local density compared with its neighboring records "
                    f"(LOF anomaly score: {score_lof:.2f}). Most displaced feature is '{top_feature['feature']}' at {top_feature['value']} "
                    f"(expected range: {top_feature['normal_range']})."
                )

            # Format top contributing features cleanly for frontend panel
            contributing_list = [
                {
                    "feature": f["feature"],
                    "value": f["value"],
                    "mean": f["mean"],
                    "median": f["median"],
                    "std_dev": f["std_dev"],
                    "z_score": f["z_score"],
                    "direction": f["direction"],
                    "impact": "High" if f["z_score"] >= 2.5 else "Moderate"
                }
                for f in feature_deviations[:4]
            ]

            flagged_columns.append({
                "row": display_row,
                "row_index": int(row_idx),
                "column": top_feature["feature"],
                "actual_value": top_feature["value"],
                "raw_actual_value": float(top_feature.get("raw_val", 0.0)),
                "mean": top_feature["mean"],
                "median": top_feature["median"],
                "std_dev": top_feature["std_dev"],
                "normal_range": top_feature["normal_range"],
                "expected_range": top_feature["normal_range"],
                "detection_algorithm": method,
                "detection_method": method,
                "severity": severity,
                "anomaly_score": comb_score,
                "reason": reason,
                "explanation": reason,
                "stats_breakdown": {
                    "mean": top_feature.get("c_mean"),
                    "median": top_feature.get("c_median"),
                    "std_dev": top_feature.get("c_std"),
                    "isolation_score": score_if,
                    "lof_score": score_lof,
                    "top_z_score": top_feature.get("z_score")
                },
                "contributing_features": contributing_list
            })

        # Fallback: if row was flagged in selected_mask but no detector specific entry was built
        if not flagged_columns:
            primary_col = num_cols[0] if num_cols else (cat_cols[0] if cat_cols else "Record Vector")
            actual_v = str(raw_df[primary_col].iloc[row_idx]) if primary_col in raw_df.columns else "Anomalous Record"
            method_label = detection_results.get("selected_method_name", "Ensemble Consensus")
            fallback_reason = (
                f"Row #{display_row} was flagged as an outlier by consensus among active detection algorithms, "
                f"exhibiting significant structural or multifeature deviation from standard dataset distribution."
            )
            flagged_columns.append({
                "row": display_row,
                "row_index": int(row_idx),
                "column": primary_col,
                "actual_value": actual_v,
                "raw_actual_value": 0.0,
                "mean": "N/A",
                "median": "N/A",
                "std_dev": "N/A",
                "normal_range": "Baseline Cluster",
                "expected_range": "Baseline Cluster",
                "detection_algorithm": method_label,
                "detection_method": method_label,
                "severity": "Medium",
                "anomaly_score": 0.65,
                "reason": fallback_reason,
                "explanation": fallback_reason,
                "stats_breakdown": {},
                "contributing_features": []
            })

        # Append all flagged column entries for this row
        for item in flagged_columns:
            anomalies.append(item)

    # Sort anomalies by severity: Critical (0), High (1), Medium (2), Low (3)
    # and then descending by anomaly_score
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    anomalies.sort(key=lambda x: (severity_order.get(x["severity"], 4), -x["anomaly_score"]))

    return anomalies
