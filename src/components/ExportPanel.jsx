import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  FileCheck2
} from 'lucide-react';
import { downloadFile } from '../services/api';

export default function ExportPanel({ sessionId, filename }) {
  const [downloading, setDownloading] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  if (!sessionId) return null;

  const handleDownload = async (type, defaultName) => {
    try {
      setDownloading(type);
      setDownloadError('');
      await downloadFile(type, sessionId, defaultName);
    } catch (err) {
      setDownloadError(err.message || 'Download failed.');
    } finally {
      setDownloading(null);
    }
  };

  const exportOptions = [
    {
      type: 'pdf-report',
      title: 'Executive PDF Audit Report',
      description: 'Comprehensive publication-grade audit with metric KPIs, distribution charts, and mathematical explanations.',
      icon: FileText,
      badge: 'PDF Report',
      iconBg: 'bg-[#EAF3FF] text-[#3987E8] border-[#DCEBFF]',
      btnStyle: 'bg-[#3987E8] hover:bg-[#2E75D3] text-white shadow-[0_4px_14px_rgba(57,135,232,0.28)]',
      defaultName: `audit_report_${filename}.pdf`
    },
    {
      type: 'labeled',
      title: 'Dataset with Anomaly Labels',
      description: 'Original dataset annotated with is_anomaly, anomaly_score, severity, and explanation reasons.',
      icon: FileSpreadsheet,
      badge: 'Annotated CSV',
      iconBg: 'bg-[#F1F6FF] text-[#6AA8F5] border-[#DCEBFF]',
      btnStyle: 'bg-[#6AA8F5] hover:bg-[#4E93EC] text-white shadow-[0_4px_14px_rgba(106,168,245,0.25)]',
      defaultName: `labeled_${filename}`
    },
    {
      type: 'anomalies-only',
      title: 'Anomalies-Only CSV',
      description: 'Filtered dataset isolating only the flagged outlier rows for rapid forensic inspection.',
      icon: AlertTriangle,
      badge: 'Outliers Only',
      iconBg: 'bg-[#FFF0F2] text-[#E87583] border-[#FED7DC]',
      btnStyle: 'bg-[#E87583] hover:bg-[#D65D6C] text-white shadow-[0_4px_14px_rgba(232,117,131,0.25)]',
      defaultName: `anomalies_only_${filename}`
    },
    {
      type: 'cleaned',
      title: 'Cleaned Dataset CSV',
      description: 'Outlier-sanitized dataset with anomalous rows removed, ready for downstream machine learning.',
      icon: CheckCircle,
      badge: 'Sanitized CSV',
      iconBg: 'bg-[#EAF9F3] text-[#45B88A] border-[#C3EFDF]',
      btnStyle: 'bg-[#45B88A] hover:bg-[#349E74] text-white shadow-[0_4px_14px_rgba(69,184,138,0.25)]',
      defaultName: `cleaned_${filename}`
    },
    {
      type: 'original',
      title: 'Original Verified CSV',
      description: 'The untouched raw CSV as ingested with verified unique column names and proper delimiters.',
      icon: FileCheck2,
      badge: 'Verified Raw',
      iconBg: 'bg-[#F4F8FF] text-[#7C8DA5] border-[#E2EAF5]',
      btnStyle: 'bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[#26364D]',
      defaultName: `original_${filename}`
    }
  ];

  return (
    <div className="w-full bg-white rounded-[24px] p-6 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)] select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-[#E2EAF5] mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-[#26364D] tracking-tight">
              Export System & Audit Reports
            </h3>
          </div>
          <p className="text-xs text-[#7C8DA5] mt-1">
            Download executive PDF reports, labeled datasets, or sanitized CSV files.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#3987E8] bg-[#EAF3FF] px-3 py-1 rounded-full border border-[#DCEBFF]">
          Session ID: {sessionId.slice(0, 8)}...
        </span>
      </div>

      {downloadError && (
        <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#FED7DC] text-[#E87583] text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {exportOptions.map((opt, idx) => {
          const Icon = opt.icon;
          const isCurrentLoading = downloading === opt.type;

          return (
            <motion.div
              key={opt.type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="rounded-3xl p-5 bg-[#F4F8FF]/60 hover:bg-[#F4F8FF] border border-[#E2EAF5] flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(57,135,232,0.08)]"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${opt.iconBg} shadow-xs`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white text-[#7C8DA5] border border-[#E2EAF5]">
                    {opt.badge}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#26364D] mb-2 leading-snug">
                  {opt.title}
                </h4>
                <p className="text-[11px] text-[#7C8DA5] leading-relaxed mb-5">
                  {opt.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(opt.type, opt.defaultName)}
                disabled={downloading !== null}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 ${opt.btnStyle}`}
              >
                {isCurrentLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
