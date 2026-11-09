import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw, Trash2, Database, AlertCircle, Sparkles } from 'lucide-react';

export default function FileUpload({
  onFileSelect,
  onLoadSample,
  onReset,
  currentFile,
  metadata,
  isLoading
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
        setDragError('Please drop a valid .csv file.');
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

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".csv,text/csv,application/vnd.ms-excel"
        className="hidden"
      />

      {!metadata ? (
        /* Upload Drag & Drop Box */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-12 text-center ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/20 scale-[1.01]'
              : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          {/* Subtle gradient background element */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-violet-500/20 to-pink-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>

            <div className="max-w-md">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Drop your CSV dataset here, or{' '}
                <button
                  type="button"
                  onClick={triggerBrowse}
                  disabled={isLoading}
                  className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                >
                  Browse Files
                </button>
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Accepts ANY valid CSV file. Automatic schema profiling, dynamic column typing, delimiter detection, and multi-model anomaly analysis.
              </p>
            </div>

            <button
              type="button"
              onClick={triggerBrowse}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              Select CSV File
            </button>

            {dragError && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30">
                <AlertCircle className="w-4 h-4" />
                <span>{dragError}</span>
              </div>
            )}

            {/* Quick sample dataset buttons */}
            <div className="pt-4 border-t border-slate-800/80 w-full max-w-xl">
              <div className="flex items-center justify-center space-x-2 mb-2 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Or load an instant benchmark dataset:</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onLoadSample('financial')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  💳 Financial Transactions
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('server')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  🖥️ Cloud Server Telemetry
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSample('iot')}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  ⚙️ Industrial IoT Sensors
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* File Uploaded Info Card */
        <div className="glass-panel-glow rounded-2xl p-5 border border-cyan-500/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* File identity and meta badges */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-white text-base tracking-wide truncate max-w-xs sm:max-w-md">
                    {metadata.filename}
                  </h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> READY
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span>Size: <strong className="text-slate-200">{metadata.file_size_kb} KB</strong></span>
                  <span>•</span>
                  <span>Records: <strong className="text-cyan-300">{metadata.total_rows.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Columns: <strong className="text-violet-300">{metadata.total_columns}</strong></span>
                  <span>•</span>
                  <span>Delimiter: <code className="text-amber-300 bg-slate-800 px-1 rounded">{metadata.delimiter === '\t' ? 'TAB' : metadata.delimiter}</code></span>
                  <span>•</span>
                  <span>Encoding: <strong className="text-slate-300">{metadata.encoding}</strong></span>
                </div>
              </div>
            </div>

            {/* Actions: Replace / Reset */}
            <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={triggerBrowse}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                title="Replace current dataset with another CSV"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Replace File</span>
              </button>
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:text-rose-200 transition cursor-pointer"
                title="Remove dataset and start fresh"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

