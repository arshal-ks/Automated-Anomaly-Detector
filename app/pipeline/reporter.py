import io
import datetime
from xml.sax.saxutils import escape as xml_escape
import pandas as pd
import numpy as np
from typing import Dict, Any, List

def safe_text(val: Any) -> str:
    """Safely stringifies and escapes text for ReportLab XML/HTML Paragraph parsing."""
    if val is None:
        return "N/A"
    return xml_escape(str(val))

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_labeled_dataframe(
    raw_df: pd.DataFrame,
    anomalies: List[Dict[str, Any]]
) -> pd.DataFrame:
    """
    Appends anomaly labeling metadata columns to the original DataFrame.
    """
    df = raw_df.copy()
    n_rows = len(df)
    
    is_anomaly = [False] * n_rows
    severities = ["Normal"] * n_rows
    methods = ["None"] * n_rows
    scores = [0.0] * n_rows
    reasons = [""] * n_rows

    SEVERITY_HIERARCHY = {"Normal": 0, "Low": 1, "Medium": 2, "High": 3, "Critical": 4}
    for item in anomalies:
        row_i = item["row_index"]
        if 0 <= row_i < n_rows:
            is_anomaly[row_i] = True
            
            # Severity upgrade hierarchy
            current_sev = severities[row_i]
            new_sev = item["severity"]
            if SEVERITY_HIERARCHY.get(new_sev, 0) > SEVERITY_HIERARCHY.get(current_sev, 0):
                severities[row_i] = new_sev

            method_name = item.get("detection_algorithm", item.get("detection_method", "Anomaly Model"))
            methods[row_i] = method_name if methods[row_i] == "None" else f"{methods[row_i]}, {method_name}"
            scores[row_i] = max(scores[row_i], item.get("anomaly_score", 0.0))
            
            normal_range_str = item.get("normal_range", item.get("expected_range", "Standard"))
            reason_entry = f"[{item['column']}: {item['actual_value']} (Normal: {normal_range_str}) - {item['severity']}]"
            if reasons[row_i]:
                reasons[row_i] += "; " + reason_entry
            else:
                reasons[row_i] = reason_entry

    df["is_anomaly"] = is_anomaly
    df["anomaly_severity"] = severities
    df["anomaly_score"] = scores
    df["detection_methods"] = methods
    df["anomaly_reasons"] = reasons

    return df

def generate_pdf_report(
    metadata: Dict[str, Any],
    profile_summary: Dict[str, Any],
    detection_results: Dict[str, Any],
    anomalies: List[Dict[str, Any]],
    timing_ms: float = 0.0
) -> bytes:
    """
    Builds a professional, comprehensive PDF executive anomaly report.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0f172a")
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#0284c7")
    )
    heading2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b")
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )
    table_cell_header = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    severity_crit = ParagraphStyle(
        "SevCrit",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#991b1b")
    )
    severity_high = ParagraphStyle(
        "SevHigh",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#dc2626")
    )
    severity_med = ParagraphStyle(
        "SevMed",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#d97706")
    )

    story = []

    # Title & Header
    story.append(Paragraph("ANOMALY DETECTOR", title_style))
    story.append(Paragraph("INTELLIGENT DATA. DETECT THE UNEXPECTED. — COMPREHENSIVE AUDIT REPORT", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0284c7"), spaceAfter=12))

    # Executive Summary Card
    total_records = metadata.get("total_rows", 0)
    unique_anom_rows = len(set(a["row_index"] for a in anomalies))
    anomaly_pct = round((unique_anom_rows / total_records) * 100, 2) if total_records > 0 else 0
    normal_records = max(0, total_records - unique_anom_rows)

    summary_data = [
        [
            Paragraph("Dataset File", table_cell_bold), Paragraph(safe_text(metadata.get("filename", "Uploaded CSV")), table_cell),
            Paragraph("Generated At", table_cell_bold), Paragraph(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), table_cell)
        ],
        [
            Paragraph("Total Records", table_cell_bold), Paragraph(f"{total_records:,}", table_cell),
            Paragraph("Total Columns", table_cell_bold), Paragraph(f"{metadata.get('total_columns', 0):,}", table_cell)
        ],
        [
            Paragraph("Detected Anomalies", table_cell_bold), Paragraph(f"<b>{unique_anom_rows:,}</b> ({anomaly_pct}%)", table_cell),
            Paragraph("Normal Records", table_cell_bold), Paragraph(f"{normal_records:,}", table_cell)
        ],
        [
            Paragraph("Missing Data", table_cell_bold), Paragraph(f"{profile_summary.get('missing_percentage', 0)}% ({profile_summary.get('total_missing_cells', 0):,} cells)", table_cell),
            Paragraph("Duplicate Rows", table_cell_bold), Paragraph(f"{profile_summary.get('duplicate_records', 0):,} ({profile_summary.get('duplicate_percentage', 0)}%)", table_cell)
        ],
        [
            Paragraph("Pipeline Speed", table_cell_bold), Paragraph(f"{timing_ms:.2f} ms", table_cell),
            Paragraph("Primary Detection Engine", table_cell_bold), Paragraph(safe_text(detection_results.get("selected_method_name", "Auto Ensemble")), table_cell)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[1.3*inch, 2.2*inch, 1.4*inch, 2.3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Algorithm Comparison Table
    story.append(Paragraph("Algorithm Comparison & Detection Metrics", heading2_style))
    algo_headers = [
        Paragraph("Algorithm", table_cell_header),
        Paragraph("Method Type", table_cell_header),
        Paragraph("Anomalies Found", table_cell_header),
        Paragraph("Dataset Impact %", table_cell_header)
    ]
    algo_rows = [algo_headers]
    comp = detection_results.get("comparison", {})
    type_map = {
        "iqr": "Statistical (Non-Parametric)",
        "zscore": "Parametric (Gaussian 3-Sigma)",
        "isolation_forest": "Machine Learning (Ensemble Trees)",
        "lof": "Density-Based (Local Outlier Factor)"
    }
    for key, info in comp.items():
        algo_rows.append([
            Paragraph(safe_text(info["name"]), table_cell_bold),
            Paragraph(type_map.get(key, "General"), table_cell),
            Paragraph(f"{info['anomaly_count']:,}", table_cell),
            Paragraph(f"{info['percentage']}%", table_cell)
        ])

    algo_table = Table(algo_rows, colWidths=[2.5*inch, 2.2*inch, 1.3*inch, 1.2*inch])
    algo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(algo_table)
    story.append(Spacer(1, 14))

    # Top Detected Anomalies Table with Explanations
    story.append(Paragraph(f"Detailed Anomaly Explanations (Top {min(25, len(anomalies))} Records)", heading2_style))
    story.append(Paragraph(
        "Each entry below specifies the exact record, affected column, actual vs expected normal boundaries, "
        "and mathematically reasoned anomaly cause.",
        body_style
    ))
    story.append(Spacer(1, 8))

    anom_headers = [
        Paragraph("Row", table_cell_header),
        Paragraph("Column", table_cell_header),
        Paragraph("Actual Value", table_cell_header),
        Paragraph("Normal Range", table_cell_header),
        Paragraph("Method", table_cell_header),
        Paragraph("Severity", table_cell_header),
        Paragraph("Explanation", table_cell_header)
    ]
    anom_table_rows = [anom_headers]

    if anomalies:
        for item in anomalies[:25]:
            if item["severity"] == "Critical":
                sev_style = severity_crit
            elif item["severity"] == "High":
                sev_style = severity_high
            else:
                sev_style = severity_med
            anom_table_rows.append([
                Paragraph(safe_text(item.get("row")), table_cell_bold),
                Paragraph(safe_text(item.get("column")), table_cell_bold),
                Paragraph(safe_text(item.get("actual_value")), table_cell),
                Paragraph(safe_text(item.get("normal_range", item.get("expected_range", "N/A"))), table_cell),
                Paragraph(safe_text(item.get("detection_algorithm", item.get("detection_method", "Model"))), table_cell),
                Paragraph(safe_text(item.get("severity")), sev_style),
                Paragraph(safe_text(item.get("reason", item.get("explanation", ""))), table_cell)
            ])
    else:
        anom_table_rows.append([
            Paragraph("-", table_cell),
            Paragraph("All Columns", table_cell),
            Paragraph("Normal", table_cell),
            Paragraph("In Bounds", table_cell),
            Paragraph("Ensemble", table_cell),
            Paragraph("Normal", table_cell),
            Paragraph("No anomalies detected in this dataset under the active algorithm parameters.", table_cell)
        ])

    anom_table = Table(
        anom_table_rows,
        colWidths=[0.45*inch, 1.05*inch, 0.9*inch, 1.1*inch, 0.9*inch, 0.65*inch, 2.15*inch]
    )
    anom_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0284c7")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(anom_table)

    # Footer note
    story.append(Spacer(1, 14))
    story.append(Paragraph("Report automatically generated by Anomaly Detector Engine. Confidential and statistically validated.", subtitle_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

