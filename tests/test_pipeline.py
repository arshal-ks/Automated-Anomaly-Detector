import io
import pytest
import pandas as pd
import numpy as np

from app.pipeline.ingestion import ingest_csv
from app.pipeline.profiling import profile_dataset
from app.pipeline.preprocessing import preprocess_data
from app.pipeline.anomaly_engine import run_anomaly_detection
from app.pipeline.explainer import generate_anomaly_explanations
from app.pipeline.reporter import generate_pdf_report, generate_labeled_dataframe
from app.main import process_pipeline

def test_empty_csv():
    with pytest.raises(ValueError, match="empty|no readable text"):
        ingest_csv(b"", "empty.csv")

def test_duplicate_columns():
    csv_bytes = b"amount,category,amount\n100,Groceries,200\n150,Retail,250"
    df, meta = ingest_csv(csv_bytes, "dups.csv")
    assert "amount" in df.columns
    assert "amount_1" in df.columns
    assert df.shape == (2, 3)

def test_unusual_delimiter_semicolon():
    csv_bytes = b"colA;colB;colC\n10;20;30\n40;50;60\n70;80;90\n"
    df, meta = ingest_csv(csv_bytes, "semicolon.csv")
    assert meta["delimiter"] == ";"
    assert df.shape == (3, 3)

def test_unusual_delimiter_tab():
    csv_bytes = b"user_id\tlatency\terror_rate\nusr_1\t45\t0.01\nusr_2\t52\t0.02\nusr_3\t999\t0.95\n"
    df, meta = ingest_csv(csv_bytes, "tab.tsv")
    assert meta["delimiter"] == "\t"
    assert df.shape == (3, 3)

def test_only_categorical_dataset():
    csv_bytes = b"dept,city,role\nSales,NY,Rep\nSales,NY,Rep\nSales,NY,Rep\nIT,SF,Dev\nRareSecret,RareCity,SuperAdmin\n"
    res = process_pipeline(csv_bytes, "categorical_only.csv")
    assert res["profiling"]["numerical_columns_count"] == 0
    assert res["profiling"]["categorical_columns_count"] == 3
    assert res["metadata"]["total_rows"] == 5

def test_only_numerical_dataset():
    data = np.random.normal(50, 5, size=(40, 4))
    data[10, 0] = 5000.0  # Massive outlier
    df = pd.DataFrame(data, columns=["val1", "val2", "val3", "val4"])
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    res = process_pipeline(csv_bytes, "num_only.csv")
    assert res["profiling"]["numerical_columns_count"] == 4
    assert res["detection"]["total_anomalies"] >= 1
    # Check that row 11 (1-indexed) was flagged
    anom_rows = [a["row"] for a in res["anomalies"]]
    assert 11 in anom_rows

def test_small_dataset_safety():
    # Only 3 rows - must not crash LOF or Isolation Forest
    csv_bytes = b"val1,val2\n10,20\n11,22\n9999,8888\n"
    res = process_pipeline(csv_bytes, "small.csv")
    assert res["metadata"]["total_rows"] == 3
    assert len(res["anomalies"]) > 0

def test_missing_values_imputation():
    csv_bytes = b"a,b,c\n1,10,apple\n,12,banana\n3,,apple\n4,15,\n"
    res = process_pipeline(csv_bytes, "missing.csv")
    assert res["profiling"]["total_missing_cells"] == 3

def test_pdf_generation():
    csv_bytes = b"amount,score\n100,0.5\n105,0.6\n95,0.55\n10000,0.99\n"
    res = process_pipeline(csv_bytes, "test_pdf.csv")
    pdf_bytes = generate_pdf_report(
        res["metadata"],
        res["profiling"],
        {"comparison": res["detection"]["comparison"], "selected_method_name": res["detection"]["selected_method_name"]},
        res["anomalies"],
        res["timing_ms"]
    )
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

