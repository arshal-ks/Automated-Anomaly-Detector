import time
import uuid
import io
import re
import pandas as pd
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.pipeline.ingestion import ingest_csv
from app.pipeline.profiling import profile_dataset
from app.pipeline.preprocessing import preprocess_data
from app.pipeline.anomaly_engine import run_anomaly_detection
from app.pipeline.explainer import generate_anomaly_explanations
from app.pipeline.reporter import generate_labeled_dataframe, generate_pdf_report
from app.samples.sample_data import (
    generate_financial_sample,
    generate_server_metrics_sample,
    generate_iot_sensor_sample
)

app = FastAPI(
    title="ANOMALY DETECTOR API",
    description="Intelligent Data. Detect the Unexpected.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for export downloads (up to 50 sessions)
ANALYSIS_STORE: Dict[str, Dict[str, Any]] = {}

def process_pipeline(
    csv_bytes: bytes,
    filename: str,
    algorithm: str = "auto",
    contamination: float = 0.05
) -> Dict[str, Any]:
    """Runs the 8-stage automated anomaly detection pipeline."""
    start_total = time.perf_counter()
    stages = []

    # Stage 1: File Ingestion
    t0 = time.perf_counter()
    raw_df, metadata = ingest_csv(csv_bytes, filename=filename)
    stages.append({
        "stage": "File Ingestion",
        "description": f"Parsed {metadata['file_size_kb']} KB with {metadata['delimiter']} delimiter and {metadata['encoding']} encoding.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 2: Data Validation
    t0 = time.perf_counter()
    if raw_df.shape[0] == 0:
        raise ValueError("Dataset has no data rows.")
    if raw_df.shape[1] == 0:
        raise ValueError("Dataset has no columns.")
    stages.append({
        "stage": "Data Validation",
        "description": f"Verified structural integrity for {raw_df.shape[0]} rows and {raw_df.shape[1]} columns.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 3: Data Profiling
    t0 = time.perf_counter()
    profiling_summary, typed_df = profile_dataset(raw_df)
    stages.append({
        "stage": "Data Profiling",
        "description": (
            f"Profiled {profiling_summary['numerical_columns_count']} numeric, "
            f"{profiling_summary['categorical_columns_count']} categorical, "
            f"{profiling_summary['datetime_columns_count']} datetime columns."
        ),
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 4: Data Preprocessing
    t0 = time.perf_counter()
    cleaned_df, feature_df, scaled_features, feature_names, preprocessing_stats = preprocess_data(
        raw_df, typed_df, profiling_summary
    )
    stages.append({
        "stage": "Data Preprocessing",
        "description": f"Applied robust scaling across {len(feature_names)} features and handled missing values.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 5: Feature Selection
    t0 = time.perf_counter()
    stages.append({
        "stage": "Feature Selection",
        "description": f"Filtered high-variance and uncollinear attributes ({len(feature_names)} active features).",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 6: Anomaly Detection
    t0 = time.perf_counter()
    detection_results = run_anomaly_detection(
        cleaned_df=cleaned_df,
        scaled_features=scaled_features,
        feature_names=feature_names,
        profile_summary=profiling_summary,
        algorithm_choice=algorithm,
        contamination=contamination
    )
    stages.append({
        "stage": "Anomaly Detection",
        "description": f"Executed detection using {detection_results['selected_method_name']}.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 7: Anomaly Explanation
    t0 = time.perf_counter()
    anomalies = generate_anomaly_explanations(
        raw_df=raw_df,
        cleaned_df=cleaned_df,
        detection_results=detection_results,
        profile_summary=profiling_summary
    )
    stages.append({
        "stage": "Anomaly Explanation",
        "description": f"Generated statistical reasoning and boundary audits for {len(anomalies)} anomaly events.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    # Stage 8: Report Generation
    t0 = time.perf_counter()
    stages.append({
        "stage": "Report Generation",
        "description": "Compiled executive audit payload and download buffers.",
        "duration_ms": round((time.perf_counter() - t0) * 1000, 2),
        "status": "completed"
    })

    total_duration_ms = round((time.perf_counter() - start_total) * 1000, 2)

    # Calculate summary metrics
    total_records = int(metadata["total_rows"])
    unique_anomaly_rows = len(set(a["row_index"] for a in anomalies))
    normal_records = max(0, total_records - unique_anomaly_rows)
    anomaly_pct = round((unique_anomaly_rows / total_records) * 100, 2) if total_records > 0 else 0

    # Chart data preparations
    # 1. Normal vs Anomaly
    pie_data = [
        {"name": "Normal Records", "value": normal_records, "color": "#10b981"},
        {"name": "Anomalies", "value": unique_anomaly_rows, "color": "#f43f5e"}
    ]

    # 2. Anomalies by Column
    col_counts = {}
    for a in anomalies:
        col = a["column"]
        col_counts[col] = col_counts.get(col, 0) + 1
    by_column_data = [
        {"column": k, "count": v}
        for k, v in sorted(col_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    # 3. Severity Distribution
    sev_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for a in anomalies:
        sev = a.get("severity", "Medium")
        if sev in sev_counts:
            sev_counts[sev] += 1
        else:
            sev_counts["Medium"] += 1
    severity_data = [
        {"severity": "Critical", "count": sev_counts["Critical"], "color": "#e11d48"},
        {"severity": "High", "count": sev_counts["High"], "color": "#f43f5e"},
        {"severity": "Medium", "count": sev_counts["Medium"], "color": "#f59e0b"},
        {"severity": "Low", "count": sev_counts["Low"], "color": "#06b6d4"}
    ]

    # 4. Scatter / Distribution Points for primary numerical column
    primary_num_col = profiling_summary["numerical_columns"][0] if profiling_summary["numerical_columns"] else None
    scatter_points = []
    if primary_num_col:
        s_raw = pd.to_numeric(raw_df[primary_num_col], errors="coerce").fillna(0)
        anomaly_row_set = set(a["row_index"] for a in anomalies if a["column"] == primary_num_col or a["column"] == "Multivariate Vector")
        # Subsample if large
        step = max(1, len(s_raw) // 200)
        for idx in range(0, len(s_raw), step):
            val = float(s_raw.iloc[idx])
            is_anom = idx in anomaly_row_set
            scatter_points.append({
                "index": idx + 1,
                "value": round(val, 2),
                "is_anomaly": is_anom,
                "name": f"Row {idx + 1}"
            })

    # 5. Before vs After data cleaning metrics
    before_after = [
        {"stage": "Missing Values", "before": profiling_summary["total_missing_cells"], "after": 0},
        {"stage": "Duplicate Records", "before": profiling_summary["duplicate_records"], "after": 0},
        {"stage": "Anomalous Records", "before": unique_anomaly_rows, "after": 0}
    ]

    # Raw preview (first 15 rows)
    raw_preview = raw_df.head(15).fillna("").to_dict(orient="records")

    # Save to session store
    session_id = uuid.uuid4().hex
    if len(ANALYSIS_STORE) > 50:
        # Keep store bounded
        oldest_key = next(iter(ANALYSIS_STORE))
        del ANALYSIS_STORE[oldest_key]

    ANALYSIS_STORE[session_id] = {
        "raw_df": raw_df,
        "cleaned_df": cleaned_df,
        "metadata": metadata,
        "profiling_summary": profiling_summary,
        "detection_results": detection_results,
        "anomalies": anomalies,
        "timing_ms": total_duration_ms
    }

    return {
        "session_id": session_id,
        "metadata": metadata,
        "pipeline_stages": stages,
        "timing_ms": total_duration_ms,
        "profiling": profiling_summary,
        "detection": {
            "selected_method_name": detection_results["selected_method_name"],
            "auto_recommendation": detection_results["auto_recommendation"],
            "auto_reasons": detection_results["auto_reasons"],
            "total_anomalies": unique_anomaly_rows,
            "normal_records": normal_records,
            "anomaly_percentage": anomaly_pct,
            "comparison": detection_results["comparison"]
        },
        "anomalies": anomalies,
        "charts": {
            "pie_data": pie_data,
            "by_column": by_column_data,
            "severity_dist": severity_data,
            "scatter_points": scatter_points,
            "primary_num_col": primary_num_col,
            "before_after": before_after
        },
        "raw_preview": raw_preview
    }

@app.get("/api/health")
def health_check():
    return {"status": "online", "service": "ANOMALY DETECTOR API", "version": "1.0.0"}

@app.post("/api/upload-and-analyze")
async def upload_and_analyze(
    file: UploadFile = File(...),
    algorithm: str = Form("auto"),
    contamination: float = Form(0.05)
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        result = process_pipeline(
            csv_bytes=content,
            filename=file.filename or "dataset.csv",
            algorithm=algorithm,
            contamination=contamination
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline processing error: {str(e)}")

@app.get("/api/sample-analyze")
def sample_analyze(
    sample_type: str = Query("financial"),
    algorithm: str = Query("auto"),
    contamination: float = Query(0.05)
):
    try:
        if sample_type == "server":
            csv_str = generate_server_metrics_sample()
            filename = "server_performance_metrics.csv"
        elif sample_type == "iot":
            csv_str = generate_iot_sensor_sample()
            filename = "iot_turbine_sensors.csv"
        else:
            csv_str = generate_financial_sample()
            filename = "financial_transactions.csv"

        result = process_pipeline(
            csv_bytes=csv_str.encode("utf-8"),
            filename=filename,
            algorithm=algorithm,
            contamination=contamination
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sample dataset: {str(e)}")

@app.get("/api/export/original")
def export_original(session_id: str):
    session = ANALYSIS_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session expired or not found.")
    raw_df = session["raw_df"]
    buffer = io.StringIO()
    raw_df.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=original_{session['metadata']['filename']}"}
    )

@app.get("/api/export/labeled")
def export_labeled(session_id: str):
    session = ANALYSIS_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session expired or not found.")
    labeled_df = generate_labeled_dataframe(session["raw_df"], session["anomalies"])
    buffer = io.StringIO()
    labeled_df.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=labeled_{session['metadata']['filename']}"}
    )

@app.get("/api/export/anomalies-only")
def export_anomalies_only(session_id: str):
    session = ANALYSIS_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session expired or not found.")
    labeled_df = generate_labeled_dataframe(session["raw_df"], session["anomalies"])
    anom_only_df = labeled_df[labeled_df["is_anomaly"] == True]
    buffer = io.StringIO()
    anom_only_df.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=anomalies_only_{session['metadata']['filename']}"}
    )

@app.get("/api/export/cleaned")
def export_cleaned(session_id: str):
    session = ANALYSIS_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session expired or not found.")
    # Exclude anomalous rows
    raw_df = session["raw_df"]
    anom_row_indices = set(a["row_index"] for a in session["anomalies"])
    cleaned_rows_df = raw_df.drop(index=list(anom_row_indices), errors="ignore")
    buffer = io.StringIO()
    cleaned_rows_df.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cleaned_{session['metadata']['filename']}"}
    )

@app.get("/api/export/pdf-report")
def export_pdf_report(session_id: str):
    session = ANALYSIS_STORE.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis session expired or not found.")
    try:
        pdf_bytes = generate_pdf_report(
            metadata=session["metadata"],
            profile_summary=session["profiling_summary"],
            detection_results=session["detection_results"],
            anomalies=session["anomalies"],
            timing_ms=session["timing_ms"]
        )
        base_name = re.sub(r"\.[^.]+$", "", session['metadata']['filename'])
        safe_base = re.sub(r"[^\w\-.]", "_", base_name)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="audit_report_{safe_base}.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

