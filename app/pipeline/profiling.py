import pandas as pd
import numpy as np
from typing import Dict, Any, List

def infer_column_type(series: pd.Series) -> str:
    """
    Safely infers the true semantic data type of a series:
    'numerical', 'boolean', 'datetime', 'categorical', or 'empty'.
    """
    # Drop NAs and string placeholders for type inspection
    mask = series.isna() | series.astype(str).str.strip().str.lower().isin(["", "nan", "none", "null", "n/a", "na", "<na>"])
    non_null = series[~mask]
    if len(non_null) == 0:
        return "empty"

    # 1. Check boolean
    unique_lower = {str(x).strip().lower() for x in non_null.unique()[:20]}
    boolean_sets = [
        {"true", "false"},
        {"1", "0"},
        {"yes", "no"},
        {"t", "f"},
        {"y", "n"}
    ]
    if any(unique_lower.issubset(b_set) for b_set in boolean_sets):
        return "boolean"

    # 2. Check numerical (int or float)
    # Strip common currency or percent symbols if uniform, but test numeric conversion
    converted_numeric = pd.to_numeric(non_null, errors="coerce")
    num_valid_ratio = converted_numeric.notna().sum() / len(non_null)
    if num_valid_ratio >= 0.85:
        return "numerical"

    # 3. Check datetime
    # We test with a small random or head sample to keep performance high
    sample_to_check = non_null.head(50)
    try:
        # Check if length/format looks like datetime before heavy parsing
        datetime_converted = pd.to_datetime(sample_to_check, errors="coerce", format="mixed")
        date_valid_ratio = datetime_converted.notna().sum() / len(sample_to_check)
        if date_valid_ratio >= 0.85:
            return "datetime"
    except Exception:
        pass

    # 4. Default to categorical
    return "categorical"

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Performs comprehensive profiling of the dataset.
    Returns column types, missingness, duplicates, distributions, and cardinality alerts.
    """
    total_rows = len(df)
    total_cols = len(df.columns)

    # Convert columns according to inferred types for statistics
    typed_df = pd.DataFrame(index=df.index)
    col_profiles: Dict[str, Dict[str, Any]] = {}
    
    numerical_cols: List[str] = []
    categorical_cols: List[str] = []
    datetime_cols: List[str] = []
    boolean_cols: List[str] = []
    constant_cols: List[str] = []
    high_cardinality_cols: List[str] = []

    total_missing_cells = 0

    for col in df.columns:
        s = df[col]
        is_missing_mask = s.isna() | s.astype(str).str.strip().str.lower().isin(["", "nan", "none", "null", "n/a", "na", "<na>"])
        missing_count = int(is_missing_mask.sum())
        missing_pct = round((missing_count / total_rows) * 100, 2) if total_rows > 0 else 0
        total_missing_cells += missing_count

        inferred_type = infer_column_type(s)

        unique_count = int(s.nunique(dropna=True))
        cardinality_ratio = round((unique_count / total_rows), 4) if total_rows > 0 else 0

        # Check for constant / high cardinality
        is_constant = (unique_count <= 1)
        is_high_cardinality = (unique_count > 30 and cardinality_ratio > 0.7) and inferred_type == "categorical"

        if is_constant:
            constant_cols.append(col)
        if is_high_cardinality:
            high_cardinality_cols.append(col)

        profile: Dict[str, Any] = {
            "name": col,
            "type": inferred_type,
            "missing_count": missing_count,
            "missing_percentage": missing_pct,
            "unique_count": unique_count,
            "cardinality_ratio": cardinality_ratio,
            "is_constant": is_constant,
            "is_high_cardinality": is_high_cardinality,
            "stats": {}
        }

        if inferred_type == "numerical":
            numerical_cols.append(col)
            # Safe numeric conversion
            num_series = pd.to_numeric(s, errors="coerce")
            typed_df[col] = num_series
            valid_num = num_series.dropna()
            if len(valid_num) > 0:
                q1 = float(valid_num.quantile(0.25))
                q3 = float(valid_num.quantile(0.75))
                iqr = q3 - q1
                mean_val = float(valid_num.mean())
                std_val = float(valid_num.std()) if len(valid_num) > 1 else 0.0
                min_val = float(valid_num.min())
                max_val = float(valid_num.max())
                median_val = float(valid_num.median())
                skew_val = float(valid_num.skew()) if len(valid_num) > 2 and std_val > 0 else 0.0

                # Sample histogram data (up to 10 bins)
                try:
                    num_unique = len(valid_num.unique())
                    if num_unique > 0:
                        hist_counts, bin_edges = np.histogram(valid_num, bins=max(1, min(10, num_unique)))
                        histogram = [
                            {
                                "bin": f"{bin_edges[i]:.2f} - {bin_edges[i+1]:.2f}",
                                "count": int(hist_counts[i])
                            }
                            for i in range(len(hist_counts))
                        ]
                    else:
                        histogram = []
                except Exception:
                    histogram = []

                profile["stats"] = {
                    "count": int(valid_num.count()),
                    "mean": round(mean_val, 4),
                    "std": round(std_val, 4),
                    "min": round(min_val, 4),
                    "q1": round(q1, 4),
                    "median": round(median_val, 4),
                    "q3": round(q3, 4),
                    "max": round(max_val, 4),
                    "iqr": round(iqr, 4),
                    "skewness": round(skew_val, 4) if not np.isnan(skew_val) else 0.0,
                    "iqr_lower_bound": round(q1 - 1.5 * iqr, 4),
                    "iqr_upper_bound": round(q3 + 1.5 * iqr, 4),
                    "zscore_lower_bound": round(mean_val - 3 * std_val, 4),
                    "zscore_upper_bound": round(mean_val + 3 * std_val, 4),
                    "histogram": histogram
                }
        elif inferred_type == "categorical":
            categorical_cols.append(col)
            typed_df[col] = s.astype(str)
            # Value counts for top 6 categories
            vc = s.value_counts(dropna=True).head(6)
            top_categories = [{"category": str(k), "count": int(v)} for k, v in vc.items()]
            mode_val = str(s.mode().iloc[0]) if not s.mode().empty else "N/A"
            profile["stats"] = {
                "top_categories": top_categories,
                "mode": mode_val,
                "mode_frequency": int(vc.iloc[0]) if len(vc) > 0 else 0
            }
        elif inferred_type == "datetime":
            datetime_cols.append(col)
            dt_series = pd.to_datetime(s, errors="coerce", format="mixed")
            typed_df[col] = dt_series
            valid_dt = dt_series.dropna()
            if len(valid_dt) > 0:
                profile["stats"] = {
                    "min_date": str(valid_dt.min()),
                    "max_date": str(valid_dt.max()),
                    "timespan_days": (valid_dt.max() - valid_dt.min()).days
                }
        elif inferred_type == "boolean":
            boolean_cols.append(col)
            bool_series = s.astype(str).str.strip().str.lower().isin(["true", "1", "yes", "t", "y"])
            typed_df[col] = bool_series
            profile["stats"] = {
                "true_count": int(bool_series.sum()),
                "false_count": int((~bool_series).sum())
            }

        col_profiles[col] = profile

    # Duplicate records check
    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round((duplicate_rows / total_rows) * 100, 2) if total_rows > 0 else 0

    total_cells = total_rows * total_cols
    total_missing_pct = round((total_missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0

    summary = {
        "total_records": total_rows,
        "total_columns": total_cols,
        "numerical_columns_count": len(numerical_cols),
        "categorical_columns_count": len(categorical_cols),
        "datetime_columns_count": len(datetime_cols),
        "boolean_columns_count": len(boolean_cols),
        "numerical_columns": numerical_cols,
        "categorical_columns": categorical_cols,
        "datetime_columns": datetime_cols,
        "boolean_columns": boolean_cols,
        "constant_columns": constant_cols,
        "high_cardinality_columns": high_cardinality_cols,
        "duplicate_records": duplicate_rows,
        "duplicate_percentage": duplicate_pct,
        "total_missing_cells": total_missing_cells,
        "missing_percentage": total_missing_pct,
        "columns_profile": col_profiles
    }

    return summary, typed_df

