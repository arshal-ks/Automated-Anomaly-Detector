import io
import re
import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app, process_pipeline
from app.pipeline.ingestion import ingest_csv
from app.pipeline.profiling import profile_dataset
from app.pipeline.reporter import generate_pdf_report, generate_labeled_dataframe

client = TestClient(app)

# =====================================================================
# TEST CASE 1: CSV with only numerical columns
# =====================================================================
def test_case_1_only_numerical_columns():
    csv_content = """feat_a,feat_b,feat_c,feat_d
10.5,100.2,-5.4,0.01
11.2,102.1,-4.9,0.02
10.8,99.8,-5.1,0.015
12.1,105.0,-4.5,0.03
10.9,101.4,-5.2,0.018
11.5,103.2,-4.8,0.022
10.7,98.9,-5.3,0.012
11.0,100.5,-5.0,0.019
9999.0,5555.0,8888.0,99.0
"""
    result = process_pipeline(csv_content.encode("utf-8"), "only_numerical.csv")
    
    assert result["metadata"]["total_rows"] == 9
    assert result["metadata"]["total_columns"] == 4
    assert len(result["profiling"]["numerical_columns"]) == 4
    assert len(result["profiling"]["categorical_columns"]) == 0
    assert result["detection"]["total_anomalies"] >= 1
    
    # Verify every anomaly has required 10-point explanation structure
    for anom in result["anomalies"]:
        assert "row" in anom
        assert "column" in anom
        assert "actual_value" in anom
        assert "mean" in anom
        assert "median" in anom
        assert "std_dev" in anom
        assert "normal_range" in anom
        assert "detection_algorithm" in anom
        assert "detection_method" in anom
        assert anom["detection_method"] != ""
        assert anom["severity"] in ["Critical", "High", "Medium", "Low"]
        assert len(anom["reason"]) > 10

# =====================================================================
# TEST CASE 2: CSV with only categorical columns
# =====================================================================
def test_case_2_only_categorical_columns():
    rows = []
    # 35 standard records
    for i in range(35):
        rows.append(f"US,Direct,Active,Gold")
    # 1 rare anomaly record
    rows.append("Antarctica,SatelliteRelay,Suspended,TitaniumVIP")
    
    csv_content = "country,channel,status,tier\n" + "\n".join(rows)
    result = process_pipeline(csv_content.encode("utf-8"), "only_categorical.csv")
    
    assert result["metadata"]["total_rows"] == 36
    assert len(result["profiling"]["categorical_columns"]) == 4
    assert len(result["profiling"]["numerical_columns"]) == 0
    assert result["detection"]["total_anomalies"] >= 1
    
    # Check rare category explanation
    anom = result["anomalies"][0]
    assert anom["detection_method"] in ["Category Frequency", "Categorical Frequency Outlier"]
    assert "rare" in anom["reason"].lower() or "category" in anom["reason"].lower()

# =====================================================================
# TEST CASE 3: CSV with mixed numerical and categorical columns
# =====================================================================
def test_case_3_mixed_columns():
    csv_content = """user_id,plan,usage_hours,monthly_spend,is_churned
U101,Basic,24.5,19.99,false
U102,Pro,110.2,99.50,false
U103,Basic,18.0,19.99,false
U104,Enterprise,320.5,499.00,false
U105,Pro,95.0,99.50,false
U106,Basic,30.1,19.99,false
U107,Enterprise,340.0,499.00,false
U108,Basic,22.0,19.99,false
U109,Pro,105.4,99.50,false
U110,HackerTier,9999.0,88888.00,true
"""
    result = process_pipeline(csv_content.encode("utf-8"), "mixed_dataset.csv")
    
    assert result["metadata"]["total_rows"] == 10
    assert "usage_hours" in result["profiling"]["numerical_columns"]
    assert "monthly_spend" in result["profiling"]["numerical_columns"]
    assert "plan" in result["profiling"]["categorical_columns"]
    assert result["detection"]["total_anomalies"] >= 1

# =====================================================================
# TEST CASE 4: CSV with missing values (NaN, empty strings, nulls)
# =====================================================================
def test_case_4_missing_values():
    csv_content = """metric_1,metric_2,category_col
100,50,North
105,,North
,52,South
102,48,
108,55,North
99999,,ExtremeNorth
101,51,South
"""
    result = process_pipeline(csv_content.encode("utf-8"), "missing_values.csv")
    
    assert result["profiling"]["total_missing_cells"] > 0
    assert result["profiling"]["missing_percentage"] > 0
    # Cleaned data should have zero NaNs
    assert result["charts"]["before_after"][0]["stage"] == "Missing Values"
    assert result["charts"]["before_after"][0]["before"] == result["profiling"]["total_missing_cells"]
    assert result["charts"]["before_after"][0]["after"] == 0

# =====================================================================
# TEST CASE 5: CSV with duplicate records
# =====================================================================
def test_case_5_duplicate_records():
    csv_content = """val_a,val_b,dept
10,20,Finance
10,20,Finance
10,20,Finance
15,25,Engineering
14,24,Engineering
16,26,Engineering
999,999,SecurityBreach
"""
    result = process_pipeline(csv_content.encode("utf-8"), "duplicates.csv")
    
    assert result["profiling"]["duplicate_records"] >= 2
    assert result["profiling"]["duplicate_percentage"] > 0
    assert result["detection"]["total_anomalies"] >= 1

# =====================================================================
# TEST CASE 6: CSV with date and time columns
# =====================================================================
def test_case_6_datetime_columns():
    csv_content = """timestamp,temperature,humidity
2026-01-01 08:00:00,21.5,45.0
2026-01-01 09:00:00,22.1,44.8
2026-01-01 10:00:00,22.8,44.2
2026-01-01 11:00:00,23.5,43.5
2026-01-01 12:00:00,24.2,42.8
2026-01-01 13:00:00,24.5,42.5
2026-01-01 14:00:00,24.0,43.0
2026-01-01 15:00:00,99.9,9.0
"""
    result = process_pipeline(csv_content.encode("utf-8"), "sensor_timeseries.csv")
    
    assert "timestamp" in result["profiling"]["datetime_columns"]
    assert result["profiling"]["datetime_columns_count"] >= 1
    assert result["detection"]["total_anomalies"] >= 1

# =====================================================================
# TEST CASE 7: CSV with unusual column names (special characters & symbols)
# =====================================================================
def test_case_7_unusual_column_names():
    csv_content = """col with spaces,price ($),A & B,percent %,<alert>,column_!@#
10,100,5,50,OK,1
12,105,6,52,OK,2
11,102,5,51,OK,1
9,98,4,49,OK,2
10,101,5,50,OK,1
11,103,6,51,OK,2
9500,88000,500,999,CRITICAL_BURST,99
"""
    result = process_pipeline(csv_content.encode("utf-8"), "unusual_cols.csv")
    
    assert result["metadata"]["total_columns"] == 6
    assert result["detection"]["total_anomalies"] >= 1
    
    # Test that PDF export works with these unusual column names without XML ExpatError
    session_id = result["session_id"]
    pdf_res = client.get(f"/api/export/pdf-report?session_id={session_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF")
    
    # Test CSV export
    csv_res = client.get(f"/api/export/labeled?session_id={session_id}")
    assert csv_res.status_code == 200
    assert "is_anomaly" in csv_res.text

# =====================================================================
# TEST CASE 8: CSV with thousands of rows (e.g. 3,500 rows)
# =====================================================================
def test_case_8_thousands_of_rows():
    np.random.seed(42)
    n_rows = 3500
    x = np.random.normal(50, 5, n_rows)
    y = np.random.normal(200, 20, n_rows)
    
    # Inject 5 extreme outliers
    x[100] = 999.0
    y[500] = 5000.0
    x[1500] = -300.0
    y[2500] = 8888.0
    x[3200] = 1200.0
    
    df = pd.DataFrame({"x_metric": x, "y_metric": y})
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    
    result = process_pipeline(csv_bytes, "large_dataset.csv")
    assert result["metadata"]["total_rows"] == 3500
    assert result["detection"]["total_anomalies"] >= 5
    # Scatter points must be subsampled cleanly to prevent frontend lag
    assert len(result["charts"]["scatter_points"]) <= 250
    assert result["timing_ms"] > 0

# =====================================================================
# TEST CASE 9: CSV with very few rows (e.g. 3 rows)
# =====================================================================
def test_case_9_very_few_rows():
    csv_content = """metric_a,metric_b
10.0,20.0
11.0,21.0
9999.0,8888.0
"""
    result = process_pipeline(csv_content.encode("utf-8"), "tiny_dataset.csv")
    
    assert result["metadata"]["total_rows"] == 3
    # Must handle small datasets safely without crashing or throwing
    assert result["detection"]["total_anomalies"] >= 1
    assert result["detection"]["selected_method_name"] != ""

# =====================================================================
# TEST CASE 10: CSV containing obvious statistical outliers
# =====================================================================
def test_case_10_obvious_statistical_outliers():
    csv_content = """sensor_reading,voltage
50.1,12.0
49.8,12.1
50.2,11.9
50.0,12.0
50.3,12.2
49.9,12.0
50.1,12.1
99999.0,999.0
-50000.0,-120.0
"""
    result = process_pipeline(csv_content.encode("utf-8"), "obvious_outliers.csv")
    
    # Should detect the extreme outliers with Critical / High severity
    anomalies = result["anomalies"]
    assert len(anomalies) >= 2
    
    severities = set(a["severity"] for a in anomalies)
    assert ("Critical" in severities) or ("High" in severities)
    
    # Check severity counts in chart data
    sev_chart = {item["severity"]: item["count"] for item in result["charts"]["severity_dist"]}
    assert "Critical" in sev_chart
    assert "High" in sev_chart

# =====================================================================
# VERIFICATION: API Endpoints (Upload, Reset, Exports)
# =====================================================================
def test_api_full_workflow():
    # 1. Test multipart CSV upload
    test_csv = b"val1,val2\n10,20\n11,21\n12,22\n1000,2000\n"
    response = client.post(
        "/api/upload-and-analyze",
        files={"file": ("test_upload.csv", test_csv, "text/csv")},
        data={"algorithm": "auto", "contamination": "0.05"}
    )
    assert response.status_code == 200
    data = response.json()
    session_id = data["session_id"]
    assert session_id is not None
    assert data["metadata"]["filename"] == "test_upload.csv"
    assert len(data["anomalies"]) >= 1

    # 2. Test Original CSV export
    orig_res = client.get(f"/api/export/original?session_id={session_id}")
    assert orig_res.status_code == 200
    assert "val1,val2" in orig_res.text

    # 3. Test Labeled CSV export
    labeled_res = client.get(f"/api/export/labeled?session_id={session_id}")
    assert labeled_res.status_code == 200
    assert "is_anomaly" in labeled_res.text
    assert "anomaly_severity" in labeled_res.text

    # 4. Test Anomalies-Only CSV export
    anom_res = client.get(f"/api/export/anomalies-only?session_id={session_id}")
    assert anom_res.status_code == 200

    # 5. Test Cleaned CSV export
    clean_res = client.get(f"/api/export/cleaned?session_id={session_id}")
    assert clean_res.status_code == 200

    # 6. Test PDF report export
    pdf_res = client.get(f"/api/export/pdf-report?session_id={session_id}")
    assert pdf_res.status_code == 200
    assert pdf_res.content.startswith(b"%PDF")
