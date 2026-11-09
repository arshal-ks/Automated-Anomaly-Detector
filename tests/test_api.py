import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

def test_sample_analyze_endpoint():
    response = client.get("/api/sample-analyze?sample_type=financial&algorithm=auto")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert "detection" in data
    assert "anomalies" in data
    assert len(data["anomalies"]) > 0
    assert "charts" in data
    assert data["metadata"]["total_rows"] > 0

    session_id = data["session_id"]

    # Test export endpoints with this session_id
    res_orig = client.get(f"/api/export/original?session_id={session_id}")
    assert res_orig.status_code == 200
    assert "text/csv" in res_orig.headers["content-type"]

    res_labeled = client.get(f"/api/export/labeled?session_id={session_id}")
    assert res_labeled.status_code == 200
    assert "text/csv" in res_labeled.headers["content-type"]

    res_pdf = client.get(f"/api/export/pdf-report?session_id={session_id}")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
    assert res_pdf.content.startswith(b"%PDF")

def test_upload_csv_endpoint():
    csv_content = b"metric_a,metric_b\n10,20\n12,22\n11,21\n1000,5000\n"
    response = client.post(
        "/api/upload-and-analyze",
        files={"file": ("test_upload.csv", io.BytesIO(csv_content), "text/csv")},
        data={"algorithm": "auto", "contamination": "0.05"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filename"] == "test_upload.csv"
    assert data["metadata"]["total_rows"] == 4
    assert len(data["anomalies"]) > 0

