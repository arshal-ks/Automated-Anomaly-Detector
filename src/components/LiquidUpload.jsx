import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  Sparkles,
  FileCheck,
  ShieldCheck,
  Binary,
  SlidersHorizontal,
  Filter,
  Radar,
  Lightbulb,
  FileSpreadsheet,
  Loader2,
  Check
} from 'lucide-react';

const STAGE_ICONS = {
  "File Ingestion": FileCheck,
  "Data Validation": ShieldCheck,
  "Data Profiling": Binary,
  "Data Preprocessing": SlidersHorizontal,
  "Feature Selection": Filter,
  "Anomaly Detection": Radar,
  "Anomaly Explanation": Lightbulb,
  "Report Generation": FileSpreadsheet
};

export default function LiquidUpload({
  onFileSelect,
  onLoadSample,
  onReset,
  currentFile,
  metadata,
  isLoading,
  stages = [],
  currentActiveStage = 0
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragError('');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        onFileSelect(file);
      } else {
        setDragError('Please upload a valid .csv dataset file.');
      }
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setDragError('');
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const defaultStages = [
    { stage: "File Ingestion", description: "Parsing delimiter & encoding", duration_ms: 0, status: "pending" },
    { stage: "Data Validation", description: "Structure & row validation", duration_ms: 0, status: "pending" },
    { stage: "Data Profiling", description: "Column typing & statistics", duration_ms: 0, status: "pending" },
    { stage: "Data Preprocessing", description: "Imputation & standard scaling", duration_ms: 0, status: "pending" },
    { stage: "Feature Selection", description: "Variance & suitability audit", duration_ms: 0, status: "pending" },
    { stage: "Anomaly Detection", description: "Running statistical & ML models", duration_ms: 0, status: "pending" },
    { stage: "Anomaly Explanation", description: "Calculating statistical boundaries", duration_ms: 0, status: "pending" },
    { stage: "Report Generation", description: "Generating audit & export tables", duration_ms: 0, status: "pending" }
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="w-full space-y-6 select-none">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".csv,text/csv,application/vnd.ms-excel"
        className="hidden"
      />

      {/* Main Upload Card */}
      {!metadata ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-[24px] p-6 sm:p-10 border border-[#E2EAF5] shadow-[0_12px_36px_rgba(57,135,232,0.07)]"
        >
          {/* Header Title & Subtitle */}
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#26364D] tracking-tight">
              Upload Your Dataset
            </h2>
            <p className="text-xs sm:text-sm text-[#7C8DA5] mt-1.5 leading-relaxed">
              Upload any CSV file and let AI uncover hidden patterns.
            </p>
          </div>

          {/* Drag and Drop Zone with light-blue dashed border */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed ${
              isDragOver
                ? 'border-[#3987E8] bg-[#EAF3FF] shadow-[0_8px_30px_rgba(57,135,232,0.15)] scale-[1.01]'
                : 'border-[#6AA8F5]/60 hover:border-[#3987E8] bg-[#F4F8FF]/70 hover:bg-[#F4F8FF]'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Large Cloud Upload Icon */}
              <div
                onClick={triggerBrowse}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-[0_6px_20px_rgba(57,135,232,0.15)] cursor-pointer hover:scale-105 transition-transform group"
              >
                <UploadCloud className="w-9 h-9 sm:w-10 sm:h-10 text-[#3987E8] group-hover:-translate-y-0.5 transition-transform" />
              </div>

              {/* Upload Instruction */}
              <div>
                <p className="text-sm sm:text-base font-bold text-[#26364D]">
                  Drag and drop your CSV dataset here
                </p>
                <p className="text-xs text-[#7C8DA5] mt-1">
                  Supports comma, semicolon, tab, and pipe delimiters with automated type profiling.
                </p>
              </div>

              {/* Browse CSV Button */}
              <button
                type="button"
                onClick={triggerBrowse}
                disabled={isLoading}
                className="px-7 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                Browse CSV
              </button>

              {dragError && (
                <div className="flex items-center space-x-1.5 text-xs text-[#E87583] bg-[#FFF0F2] px-4 py-2 rounded-2xl border border-[#FED7DC]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{dragError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Benchmark Preset Datasets */}
          <div className="mt-6 pt-5 border-t border-[#E2EAF5] text-center">
            <div className="flex items-center justify-center space-x-2 mb-3 text-xs text-[#7C8DA5]">
              <Sparkles className="w-3.5 h-3.5 text-[#3987E8]" />
              <span className="font-medium">Or explore pre-packaged benchmark datasets:</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => onLoadSample('financial')}
                disabled={isLoading}
                className="px-4 py-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-xs font-semibold text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
              >
                💳 Financial Transactions
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('server')}
                disabled={isLoading}
                className="px-4 py-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-xs font-semibold text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
              >
                🖥️ Cloud Server Metrics
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('iot')}
                disabled={isLoading}
                className="px-4 py-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-xs font-semibold text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
              >
                ⚙️ Industrial IoT Turbines
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Uploaded File Information Card */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#E2EAF5] shadow-[0_10px_30px_rgba(57,135,232,0.06)]"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shrink-0 shadow-xs">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h4 className="font-extrabold text-[#26364D] text-base tracking-tight truncate max-w-xs sm:max-w-md">
                    {metadata.filename}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF9F3] text-[#45B88A] border border-[#C3EFDF]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> SYNCED
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#7C8DA5]">
                  <span>Size: <strong className="text-[#26364D]">{metadata.file_size_kb} KB</strong></span>
                  <span>•</span>
                  <span>Records: <strong className="text-[#3987E8]">{metadata.total_rows.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Columns: <strong className="text-[#26364D]">{metadata.total_columns}</strong></span>
                  <span>•</span>
                  <span>Delimiter: <code className="text-[#3987E8] bg-[#F4F8FF] px-1.5 py-0.5 rounded border border-[#E2EAF5] font-mono">{metadata.delimiter === '\t' ? 'TAB' : metadata.delimiter}</code></span>
                  <span>•</span>
                  <span>Encoding: <strong className="text-[#26364D]">{metadata.encoding}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions: Replace / Remove */}
            <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={triggerBrowse}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-xs font-bold text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
                title="Replace dataset"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#3987E8]" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-[#FFF0F2] hover:bg-[#FFE0E4] border border-[#FED7DC] text-xs font-bold text-[#E87583] transition cursor-pointer"
                title="Remove dataset"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#E87583]" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 8-Stage Pipeline Progress Tracker */}
      <div className="bg-white rounded-[24px] p-5 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <Radar className="w-4 h-4 text-[#3987E8]" />
            <h3 className="text-xs font-bold tracking-wide uppercase text-[#26364D]">
              Automated Data Pipeline Stages
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#3987E8] bg-[#EAF3FF] px-3 py-1 rounded-full border border-[#DCEBFF]">
            8 Stages Monitored
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {displayStages.map((stg, i) => {
            const Icon = STAGE_ICONS[stg.stage] || FileCheck;
            const isDone = stg.status === "completed";
            const isActive = isLoading && currentActiveStage === i;

            return (
              <div
                key={stg.stage}
                className={`rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 border ${
                  isDone
                    ? 'bg-[#F4F8FF] border-[#DCEBFF]'
                    : isActive
                    ? 'bg-[#EAF3FF] border-[#3987E8] shadow-xs'
                    : 'bg-[#FAFCFF] border-[#E2EAF5] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#7C8DA5] font-bold">
                    0{i + 1}
                  </span>
                  {isDone ? (
                    <span className="w-4 h-4 rounded-full bg-[#EAF9F3] border border-[#C3EFDF] flex items-center justify-center text-[#45B88A]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#3987E8] animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E2EAF5]" />
                  )}
                </div>

                <div className="flex items-center space-x-1.5 my-1">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isDone ? 'text-[#3987E8]' : isActive ? 'text-[#3987E8]' : 'text-[#7C8DA5]'}`} />
                  <h4 className="text-[11px] font-bold text-[#26364D] truncate">
                    {stg.stage}
                  </h4>
                </div>

                <div className="mt-1 pt-1.5 border-t border-[#E2EAF5] flex items-center justify-between text-[10px]">
                  <span className="text-[#7C8DA5] font-mono truncate max-w-[75px]" title={stg.description}>
                    {isDone ? `${stg.duration_ms}ms` : 'Ready'}
                  </span>
                  <span className={`capitalize font-semibold text-[9px] ${
                    isDone ? 'text-[#45B88A]' : isActive ? 'text-[#3987E8]' : 'text-[#7C8DA5]'
                  }`}>
                    {isDone ? 'Done' : isActive ? 'Running' : 'Queued'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
