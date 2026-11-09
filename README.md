# ANOMALY DETECTOR
> **Intelligent Data. Detect the Unexpected.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)

**ANOMALY DETECTOR** is an automated, end-to-end data pipeline and audit platform engineered to accept **ANY valid CSV file**, automatically profile its structure without predefined schemas, apply multi-model statistical and machine learning anomaly detection, and deliver deterministic, mathematically grounded explanations for every detected outlier event.

---

## 🌟 Key Features

### 1. Universal Dynamic CSV Ingestion
- **Schema-Agnostic**: Operates on any CSV regardless of column headers, order, or record counts.
- **Auto-Delimiter & Encoding Detection**: Intelligently identifies `,`, `;`, `\t`, `|`, `:`, and encodings (`utf-8`, `utf-8-sig`, `latin-1`, `cp1252`).
- **Data Safeguards**: Automatic header deduplication, whitespace trimming, and empty column normalization.
- **Dataset Previews**: Instant tabular view of raw ingested data with column metadata.
- **Pre-Packaged Benchmarks**: 1-click test datasets (Financial Fraud, Cloud Server Telemetry, Industrial IoT Turbines).

### 2. Automatic Data Profiling
- **Type Inference Engine**: Accurately classifies columns as **Numerical**, **Categorical**, **Datetime**, or **Boolean**.
- **Missing & Duplicate Analysis**: Computes cell-level missingness, column percentages, and duplicate row ratios.
- **Descriptive Statistics**: Calculates count, mean, standard deviation, min, 25% (Q1), median, 75% (Q3), max, IQR, and skewness for numerical fields.
- **Cardinality Alerts**: Flags constant columns ($unique \le 1$) and high-cardinality categorical fields.

### 3. Automated 8-Stage Processing Pipeline
Displays real-time execution duration and status for every stage:
1. `File Ingestion` — Encodings, delimiters, and streaming parse.
2. `Data Validation` — Structural integrity checks and corrupt line isolation.
3. `Data Profiling` — Semantic typing, distribution analysis, and missing data audits.
4. `Data Preprocessing` — Imputation (median/mode) and `RobustScaler` transformation.
5. `Feature Selection` — Variance filtering, identifier exclusion, and one-hot encoding.
6. `Anomaly Detection` — Parallel multi-model detection execution.
7. `Anomaly Explanation` — Statistical boundary calculation and reasoning generation.
8. `Report Generation` — Compilation of executive PDF report and sanitized CSV exports.

### 4. Multi-Model Anomaly Detection Engine
- **Interquartile Range (IQR)**: Non-parametric detection via $[Q1 - 1.5 \times IQR, Q3 + 1.5 \times IQR]$.
- **Z-Score (Gaussian 3-Sigma)**: Parametric deviations relative to mean $\mu$ and std $\sigma$, with adaptive thresholds for small datasets ($N < 15$).
- **Isolation Forest**: Multi-dimensional tree isolation measuring path length anomalies in feature space.
- **Local Outlier Factor (LOF)**: Density-based local reachability distance with adaptive neighbor sizing.
- **Autonomous Ensemble**: Dynamic model selection and voting consensus tailored to dataset dimensions and skewness.
- **Configurable Sensitivity**: Interactive contamination slider from 1% to 25%.

### 5. Deterministic Anomaly Explanation Engine
Every flagged outlier delivers an audit report containing:
- **Row Number & Column Name**: Exact position in the dataset.
- **Actual Value vs. Normal Boundaries**: Formatted values comparing raw inputs against mathematical thresholds.
- **Detection Algorithm**: Which model(s) triggered the alarm.
- **Calculated Severity**: High, Medium, or Low based on standard deviation distance and IQR ratios.
- **Human-Readable Natural Reasoning**: Statistically validated explanation (no canned or dummy text).

### 6. Interactive Visualizations & Analytics
- **Overview & Severity**: Donut chart of Normal vs Anomalous records and severity distribution bar charts.
- **Anomalies by Column**: Horizontal bar charts identifying high-risk attributes.
- **Distribution & Outlier Scatter**: Time-series/sequence area chart highlighting anomaly points in glowing neon.
- **Algorithm Comparison**: Multi-model detection count and impact percentage comparison.
- **Data Cleansing Impact**: Before vs After data quality charts.

### 7. Full-Featured Results Grid
- Instant search across rows, columns, values, and explanations.
- Multi-criteria filtering by Severity (High / Medium / Low) and Algorithm.
- Multi-column sorting and selectable pagination (10, 25, 50 rows per page).
- Deep audit modal popup for inspecting individual anomaly events.

### 8. Multi-Format Export System
- 📄 **Executive PDF Audit Report**: ReportLab-generated professional audit document with metrics tables and top anomalies.
- 📊 **Labeled CSV**: Original dataset with appended `is_anomaly`, `anomaly_score`, `anomaly_severity`, and `anomaly_reasons` columns.
- 🚨 **Anomalies-Only CSV**: Filtered table isolating detected outlier rows.
- 🧹 **Cleaned CSV**: Sanitized dataset with outliers removed, ready for production ML training.
- 💾 **Original CSV**: Verified raw ingested dataset.

---

## 🏗️ Project Architecture

```
automated-data-pipeline/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application, CORS, and export endpoints
│   │   ├── pipeline/
│   │   │   ├── __init__.py
│   │   │   ├── ingestion.py           # Universal CSV ingestion & encoding/delimiter sniffer
│   │   │   ├── profiling.py           # Comprehensive statistical profiling & type inference
│   │   │   ├── preprocessing.py       # Imputation, scaling, and feature encoding
│   │   │   ├── anomaly_engine.py      # IQR, Z-Score, Isolation Forest, LOF, Auto-ensemble
│   │   │   ├── explainer.py           # Deterministic statistical explanation generator
│   │   │   └── reporter.py            # ReportLab PDF generator & CSV annotators
│   │   └── samples/
│   │       ├── __init__.py
│   │       └── sample_data.py         # Realistic benchmark dataset generators
│   ├── tests/
│   │   ├── test_pipeline.py           # Unit tests for edge cases, small data, delimiters
│   │   └── test_api.py                # Integration tests for FastAPI endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top bar with status and quick navigation
│   │   │   ├── FileUpload.jsx         # Drag-and-drop zone and benchmark selectors
│   │   │   ├── PipelineProgress.jsx   # 8-stage progress tracker with live timers
│   │   │   ├── DashboardStats.jsx     # Futuristic KPI cards
│   │   │   ├── Visualizations.jsx     # Recharts analytics charts
│   │   │   ├── AnomalyTable.jsx       # Interactive data grid with search & audit modal
│   │   │   ├── ProfilingDrawer.jsx    # Column-level statistical breakdown drawer
│   │   │   ├── DataPreviewModal.jsx   # Tabular raw dataset preview modal
│   │   │   ├── ExportPanel.jsx        # Multi-format export download station
│   │   │   └── SettingsModal.jsx      # Algorithm & sensitivity configuration
│   │   ├── services/
│   │   │   └── api.js                 # API client for backend communication
│   │   ├── App.jsx                    # Root application container
│   │   ├── index.css                  # Futuristic dark cyber theme and glassmorphism
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

---

### Step 1: Start the Backend (FastAPI)

1. Open a terminal in the project directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend API will be available at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Start the Frontend (React + Vite)

1. Open a second terminal in the project directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application UI will be live at `http://127.0.0.1:5173`.*

---

## 🧪 Running the Test Suite

Run all automated unit and API integration tests:
```bash
cd backend
python -m pytest tests/ -v
```

All 12 test suites verify:
- Empty CSV validation & error responses
- Duplicate column renaming
- Custom delimiters (`;`, `\t`, etc.)
- Categorical-only datasets
- Numerical-only datasets
- Ultra-small sample safety ($N < 4$)
- Missing data imputation
- Executive PDF report generation
- Full REST API upload & export endpoints

---

## 🎨 Design Philosophy
Crafted with a **futuristic cyber-dark aesthetic**:
- **Palette**: Deep void canvas (`#07090e`), neon cyan (`#00f0ff`), violet glow (`#8b5cf6`), and critical rose accents (`#f43f5e`).
- **Glassmorphism**: Ultra-smooth frosted backdrops with multi-layered depth.
- **Micro-Interactions**: Animated stage progress counters, hover scaling, and celebratory particle animations upon pipeline completion.

---

## 📄 License
MIT License. Built for advanced automated data engineering and anomaly detection workflows.
