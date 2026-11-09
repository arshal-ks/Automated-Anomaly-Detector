import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.preprocessing import RobustScaler

def preprocess_data(
    raw_df: pd.DataFrame,
    typed_df: pd.DataFrame,
    profile_summary: Dict[str, Any]
) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, list, Dict[str, Any]]:
    """
    Cleans and prepares data for ML and statistical anomaly detection.
    Returns:
      - cleaned_df: readable cleaned dataframe with imputed values
      - feature_df: numerical and encoded feature matrix
      - scaled_features: numpy array scaled using RobustScaler
      - feature_names: list of feature names used in ML
      - preprocessing_stats: metrics about imputations and transformations
    """
    cleaned_df = typed_df.copy()
    num_cols = profile_summary["numerical_columns"]
    cat_cols = profile_summary["categorical_columns"]
    bool_cols = profile_summary["boolean_columns"]
    datetime_cols = profile_summary["datetime_columns"]

    imputations = {}

    # 1. Numerical Imputation
    for col in num_cols:
        series = cleaned_df[col]
        if series.isna().any():
            median_val = series.median()
            if pd.isna(median_val):
                median_val = 0.0
            cleaned_df[col] = series.fillna(median_val)
            imputations[col] = {"type": "median", "value": float(median_val)}
        else:
            cleaned_df[col] = series

    # 2. Categorical Imputation
    for col in cat_cols:
        series = cleaned_df[col]
        if series.isna().any():
            mode_series = series.mode()
            mode_val = str(mode_series.iloc[0]) if not mode_series.empty else "Missing"
            cleaned_df[col] = series.fillna(mode_val)
            imputations[col] = {"type": "mode", "value": mode_val}
        else:
            cleaned_df[col] = series

    # 3. Boolean Imputation
    for col in bool_cols:
        cleaned_df[col] = cleaned_df[col].fillna(False).astype(int)

    # 4. Feature Matrix Assembly for ML algorithms
    # Start with numerical columns (excluding constant columns)
    usable_num_cols = [c for c in num_cols if c not in profile_summary.get("constant_columns", [])]
    
    feature_parts = []
    feature_names = []

    if usable_num_cols:
        num_part = cleaned_df[usable_num_cols].copy()
        feature_parts.append(num_part)
        feature_names.extend(usable_num_cols)

    # For categorical columns with moderate cardinality (2 to 10 unique values), one-hot encode
    usable_cat_cols = [
        c for c in cat_cols 
        if c not in profile_summary.get("constant_columns", [])
        and c not in profile_summary.get("high_cardinality_columns", [])
        and 1 < cleaned_df[c].nunique() <= 10
    ]

    if usable_cat_cols:
        cat_encoded = pd.get_dummies(cleaned_df[usable_cat_cols], prefix=usable_cat_cols, drop_first=True, dtype=float)
        feature_parts.append(cat_encoded)
        feature_names.extend(cat_encoded.columns.tolist())

    # If datetime columns exist, extract hour and dayofweek
    for dt_col in datetime_cols:
        dt_s = pd.to_datetime(raw_df[dt_col], errors="coerce")
        if dt_s.notna().sum() > 0:
            dt_feat = pd.DataFrame(index=cleaned_df.index)
            dt_feat[f"{dt_col}_dayofweek"] = dt_s.dt.day_of_week.fillna(0).astype(float)
            dt_feat[f"{dt_col}_hour"] = dt_s.dt.hour.fillna(0).astype(float)
            feature_parts.append(dt_feat)
            feature_names.extend(dt_feat.columns.tolist())

    if feature_parts:
        feature_df = pd.concat(feature_parts, axis=1)
        # Ensure finite
        feature_df = feature_df.fillna(0).replace([np.inf, -np.inf], 0)
    else:
        # Fallback if no numeric or encodable columns: create dummy frequency feature
        feature_df = pd.DataFrame({"dummy_freq": np.ones(len(cleaned_df))})
        feature_names = ["dummy_freq"]

    # Scale features with RobustScaler (robust to existing outliers)
    scaler = RobustScaler()
    try:
        scaled_features = scaler.fit_transform(feature_df.values)
    except Exception:
        scaled_features = feature_df.values.astype(float)

    preprocessing_stats = {
        "imputed_columns_count": len(imputations),
        "imputations": imputations,
        "ml_feature_count": len(feature_names),
        "ml_features": feature_names
    }

    return cleaned_df, feature_df, scaled_features, feature_names, preprocessing_stats

