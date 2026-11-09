import io
import csv
import re
import pandas as pd
from typing import Tuple, Dict, Any

SUPPORTED_ENCODINGS = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
COMMON_DELIMITERS = [",", ";", "\t", "|", ":"]

def clean_column_names(columns: list) -> list:
    """Ensure column names are unique, non-empty, and trimmed."""
    seen = {}
    cleaned = []
    for i, col in enumerate(columns):
        raw_name = str(col).strip()
        # Strip pandas auto-mangled .1, .2 if present
        base_name = re.sub(r"\.\d+$", "", raw_name)
        if not base_name or base_name.lower().startswith("unnamed"):
            base_name = f"column_{i + 1}"
        
        # Deduplicate
        if base_name in seen:
            seen[base_name] += 1
            new_name = f"{base_name}_{seen[base_name]}"
        else:
            seen[base_name] = 0
            new_name = base_name
        cleaned.append(new_name)
    return cleaned

def detect_delimiter(sample_text: str) -> str:
    """Detect delimiter using csv.Sniffer or fallback frequency count."""
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample_text, delimiters=",".join(COMMON_DELIMITERS))
        return dialect.delimiter
    except Exception:
        # Fallback to counting occurrences in sample lines
        lines = [line for line in sample_text.splitlines() if line.strip()][:10]
        if not lines:
            return ","
        counts = {d: sum(line.count(d) for line in lines) for d in COMMON_DELIMITERS}
        best_del = max(counts, key=counts.get)
        return best_del if counts[best_del] > 0 else ","

def ingest_csv(content_bytes: bytes, filename: str = "dataset.csv") -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Ingests and parses any valid CSV dataset safely.
    Handles multiple encodings, delimiters, bad lines, and duplicate columns.
    """
    if not content_bytes or len(content_bytes.strip()) == 0:
        raise ValueError("The uploaded CSV file is empty. Please provide a file with valid data.")

    # 1. Determine Encoding
    text = None
    used_encoding = None
    for enc in SUPPORTED_ENCODINGS:
        try:
            text = content_bytes.decode(enc)
            used_encoding = enc
            break
        except (UnicodeDecodeError, LookupError):
            continue

    if text is None:
        # Last resort fallback with replacement
        text = content_bytes.decode("utf-8", errors="replace")
        used_encoding = "utf-8 (lossy)"

    # Check non-empty lines
    non_empty_lines = [l for l in text.splitlines() if l.strip()]
    if len(non_empty_lines) == 0:
        raise ValueError("The uploaded CSV file contains no readable text or rows.")

    # 2. Detect Delimiter
    sample_for_delimiter = "\n".join(non_empty_lines[:25])
    delimiter = detect_delimiter(sample_for_delimiter)

    # 3. Read DataFrame using Pandas
    try:
        df = pd.read_csv(
            io.StringIO(text),
            delimiter=delimiter,
            on_bad_lines="skip",
            low_memory=False,
            dtype=object  # read initially as object to prevent premature conversion errors
        )
    except Exception as e:
        # Retry with Python engine if C-engine failed
        try:
            df = pd.read_csv(
                io.StringIO(text),
                sep=None,
                engine="python",
                on_bad_lines="skip",
                dtype=object
            )
            delimiter = "auto"
        except Exception as inner_e:
            raise ValueError(f"Unable to parse CSV structure: {str(e)}. Detailed error: {str(inner_e)}")

    if df.empty or df.shape[0] == 0:
        raise ValueError("The CSV file contains a header but no data rows.")
    if df.shape[1] == 0:
        raise ValueError("The CSV file has no columns.")

    # Clean and deduplicate column names
    df.columns = clean_column_names(df.columns.tolist())

    metadata = {
        "filename": filename,
        "file_size_bytes": len(content_bytes),
        "file_size_kb": round(len(content_bytes) / 1024, 2),
        "total_rows": int(df.shape[0]),
        "total_columns": int(df.shape[1]),
        "delimiter": delimiter,
        "encoding": used_encoding,
        "columns": df.columns.tolist()
    }

    return df, metadata
