import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

def upload_csv(csv_bytes, filename):
    boundary = "----WebKitFormBoundary" + uuid.uuid4().hex
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b'Content-Type: text/csv\r\n\r\n')
    body.extend(csv_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="algorithm"\r\n\r\nauto\r\n')
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="contamination"\r\n\r\n0.05\r\n')
    body.extend(f"--{boundary}--\r\n".encode())

    req = urllib.request.Request(
        f"{BASE_URL}/api/upload-and-analyze",
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def test_live_workflow():
    print("[1/6] Testing Health Endpoint...")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as r:
        assert r.status == 200
        health = json.loads(r.read())
        print(f" -> Status: {health['status']}")

    print("[2/6] Testing CSV Upload #1 (Unusual column names with XML symbols)...")
    csv_bytes1 = b"Col <X>,Price ($),Units & Pcs\n10,100,5\n11,102,6\n10.5,101,5\n9.8,99,4\n9999.0,88888,999\n"
    res1 = upload_csv(csv_bytes1, "unusual_symbols.csv")
    sid1 = res1["session_id"]
    print(f" -> First upload succeeded (Rows: {res1['metadata']['total_rows']}, Cols: {res1['metadata']['total_columns']})")
    assert res1["metadata"]["total_rows"] == 5

    print("[3/6] Testing PDF Report Download for Upload #1...")
    pdf_url = f"{BASE_URL}/api/export/pdf-report?session_id={sid1}"
    with urllib.request.urlopen(pdf_url) as r:
        assert r.status == 200
        pdf_content = r.read()
        assert pdf_content.startswith(b"%PDF")
        print(f" -> PDF generated successfully ({len(pdf_content):,} bytes, valid %PDF header)")

    print("[4/6] Testing CSV Upload #2 (Completely different schema: Only Categorical)...")
    rows = ["country,tier"] + ["US,Standard"] * 25 + ["Antarctica,RareVip"]
    csv_bytes2 = "\n".join(rows).encode("utf-8")
    res2 = upload_csv(csv_bytes2, "customer_locations.csv")
    sid2 = res2["session_id"]
    print(f" -> Second upload succeeded! New Session ID: {sid2[:8]}...")
    print(f" -> New Dataset Rows: {res2['metadata']['total_rows']}, Cols: {res2['metadata']['total_columns']}")
    assert sid1 != sid2, "Session ID must be uniquely generated for subsequent upload"
    assert res2["metadata"]["filename"] == "customer_locations.csv"
    assert res2["metadata"]["total_rows"] == 26
    assert len(res2["profiling"]["categorical_columns"]) == 2
    assert len(res2["profiling"]["numerical_columns"]) == 0
    print(" -> Verified second dataset completely replaced prior schema and metrics!")

    print("[5/6] Testing Labeled CSV for Upload #2...")
    csv_url = f"{BASE_URL}/api/export/labeled?session_id={sid2}"
    with urllib.request.urlopen(csv_url) as r:
        assert r.status == 200
        csv_text = r.read().decode("utf-8")
        assert "Antarctica" in csv_text
        assert "Col <X>" not in csv_text, "Previous dataset columns must not leak into new session!"
        print(" -> Data isolation between sessions verified!")

    print("[6/6] Testing PDF Report Download for Upload #2...")
    pdf_url2 = f"{BASE_URL}/api/export/pdf-report?session_id={sid2}"
    with urllib.request.urlopen(pdf_url2) as r:
        assert r.status == 200
        pdf_content2 = r.read()
        assert pdf_content2.startswith(b"%PDF")
        print(f" -> PDF for Upload #2 generated successfully ({len(pdf_content2):,} bytes)")

    print("\nALL 6 E2E VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_live_workflow()
