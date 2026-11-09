import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  Check, 
  X,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Zap,
  Copy,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Activity,
  Layers,
  Hash,
  Sliders,
  BarChart2,
  Cpu
} from 'lucide-react';

export default function AnomalyTable({ anomalies = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [sortField, setSortField] = useState('row');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedExplanation, setCopiedExplanation] = useState(false);

  // Extract unique methods for filter dropdown
  const uniqueMethods = useMemo(() => {
    const s = new Set();
    anomalies.forEach((a) => {
      const m = a.detection_algorithm || a.detection_method;
      if (m) s.add(m);
    });
    return Array.from(s);
  }, [anomalies]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    return anomalies.filter((item) => {
      const matchSearch =
        item.row.toString().includes(searchTerm) ||
        item.column.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.actual_value).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.explanation && item.explanation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSeverity = severityFilter === 'ALL' || item.severity === severityFilter;
      const methodVal = item.detection_algorithm || item.detection_method;
      const matchMethod = methodFilter === 'ALL' || methodVal === methodFilter;

      return matchSearch && matchSeverity && matchMethod;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'severity') {
        const order = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        valA = order[a.severity] || 0;
        valB = order[b.severity] || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [anomalies, searchTerm, severityFilter, methodFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FFF0F2] text-[#E87583] border border-[#FED7DC] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E87583] mr-1.5 animate-pulse" />
            <ShieldAlert className="w-3 h-3 mr-1 text-[#E87583]" /> Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF4EB] text-[#F36B38] border border-[#FFDFD2]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F36B38] mr-1.5" />
            <Flame className="w-3 h-3 mr-1 text-[#F36B38]" /> High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF8EC] text-[#E9AC52] border border-[#FDE8C9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9AC52] mr-1.5" />
            <AlertTriangle className="w-3 h-3 mr-1 text-[#E9AC52]" /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF3FF] text-[#3987E8] border border-[#DCEBFF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3987E8] mr-1.5" />
            <Zap className="w-3 h-3 mr-1 text-[#3987E8]" /> Low
          </span>
        );
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedExplanation(true);
    setTimeout(() => setCopiedExplanation(false), 2000);
  };

  return (
    <div className="w-full bg-white rounded-[24px] p-6 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)] select-none">
      {/* Table Header and Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-[#E2EAF5]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFF0F2] border border-[#FED7DC] flex items-center justify-center text-[#E87583] shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                <span>Anomaly Detection Results & Explanations</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF3FF] text-[#3987E8] border border-[#DCEBFF]">
                  {filteredData.length} Outliers
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-[#7C8DA5] mt-1">
            Click any row to open the complete 10-parameter forensic explanation panel with real dataset statistics.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#7C8DA5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search feature, value, row..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs text-[#26364D] placeholder-[#7C8DA5] focus:outline-none focus:border-[#3987E8] focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7C8DA5] hover:text-[#26364D]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs font-semibold text-[#26364D] focus:outline-none focus:border-[#3987E8] cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical Severity</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs font-semibold text-[#26364D] focus:outline-none focus:border-[#3987E8] cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            {uniqueMethods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto mt-4 rounded-2xl border border-[#E2EAF5]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F4F8FF] text-[#7C8DA5] uppercase tracking-wider font-semibold border-b border-[#E2EAF5] sticky top-0 z-10">
              <th 
                className="py-3 px-4 cursor-pointer hover:text-[#3987E8] transition"
                onClick={() => handleSort('row')}
              >
                <div className="flex items-center space-x-1">
                  <span>Row #</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7C8DA5]" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-[#3987E8] transition"
                onClick={() => handleSort('column')}
              >
                <div className="flex items-center space-x-1">
                  <span>Column</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7C8DA5]" />
                </div>
              </th>
              <th className="py-3 px-4">Observed Value</th>
              <th className="py-3 px-4">Normal Range</th>
              <th className="py-3 px-4">Algorithm</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-[#3987E8] transition"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center space-x-1">
                  <span>Severity</span>
                  <ArrowUpDown className="w-3 h-3 text-[#7C8DA5]" />
                </div>
              </th>
              <th className="py-3 px-4">Explanation Reason</th>
              <th className="py-3 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2EAF5] font-medium text-[#26364D]">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => {
                const isExpanded = expandedRow === `${item.row}-${item.column}`;
                const algorithmName = item.detection_algorithm || item.detection_method;
                const reasonText = item.reason || item.explanation;

                return (
                  <React.Fragment key={`${item.row}-${item.column}-${idx}`}>
                    <tr
                      onClick={() => setSelectedAnomaly(item)}
                      className="hover:bg-[#F4F8FF] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#3987E8]">
                        #{item.row}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#26364D]">
                        <span className="truncate max-w-[140px] block" title={item.column}>{item.column}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono px-2 py-0.5 rounded-lg bg-[#FFF0F2] text-[#E87583] font-bold border border-[#FED7DC]">
                          {item.actual_value}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#7C8DA5]">
                        {item.normal_range || item.expected_range || 'Normal baseline'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-[#F4F8FF] text-[#26364D] text-[11px] font-mono border border-[#E2EAF5]">
                          {algorithmName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getSeverityBadge(item.severity)}
                      </td>
                      <td className="py-3.5 px-4 text-[#7C8DA5] max-w-sm truncate" title={reasonText}>
                        {reasonText}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnomaly(item);
                          }}
                          className="p-1.5 rounded-xl bg-[#EAF3FF] hover:bg-[#DCEBFF] text-[#3987E8] border border-[#DCEBFF] transition cursor-pointer"
                          title="Open 10-Field Explanation Panel"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#7C8DA5] italic">
                  No anomalies match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2EAF5] mt-4 text-xs text-[#7C8DA5]">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-[#26364D] focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>• Total {filteredData.length} records</span>
        </div>

        <div className="flex items-center space-x-2.5">
          <span>
            Page <strong className="text-[#26364D]">{currentPage}</strong> of <strong className="text-[#26364D]">{totalPages}</strong>
          </span>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] disabled:opacity-40 disabled:cursor-not-allowed text-[#26364D] transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] disabled:opacity-40 disabled:cursor-not-allowed text-[#26364D] transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DETAILED EXPLANATION PANEL MODAL (10-FIELD STATISTICAL AUDIT) */}
      <AnimatePresence>
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#26364D]/40 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="bg-white rounded-[28px] max-w-2xl w-full p-6 sm:p-8 border border-[#E2EAF5] shadow-[0_24px_64px_rgba(57,135,232,0.18)] relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                className="absolute top-6 right-6 p-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#7C8DA5] hover:text-[#26364D] border border-[#E2EAF5] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Panel Header */}
              <div className="flex items-center space-x-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3987E8]">
                      Statistical Anomaly Audit
                    </span>
                    {getSeverityBadge(selectedAnomaly.severity)}
                  </div>
                  <h4 className="text-lg font-extrabold text-[#26364D] tracking-tight">
                    Row #{selectedAnomaly.row} • Feature: <span className="text-[#3987E8] font-mono">{selectedAnomaly.column}</span>
                  </h4>
                </div>
              </div>

              {/* 10 Required Forensic Statistical Fields Cards */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-[#3987E8]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7C8DA5]">
                    Core Statistical Metrics (Calculated from Dataset)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* 1. Row Number */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">1. Row Number</span>
                    <span className="text-sm font-bold font-mono text-[#26364D]">
                      #{selectedAnomaly.row}
                    </span>
                  </div>

                  {/* 2. Column Name */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">2. Column Name</span>
                    <span className="text-sm font-bold text-[#26364D] truncate block" title={selectedAnomaly.column}>
                      {selectedAnomaly.column}
                    </span>
                  </div>

                  {/* 3. Actual Observed Value */}
                  <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#FED7DC]">
                    <span className="text-[11px] font-medium text-[#E87583] block">3. Actual Observed Value</span>
                    <span className="text-sm font-bold font-mono text-[#E87583]">
                      {selectedAnomaly.actual_value}
                    </span>
                  </div>

                  {/* 4. Statistical Mean */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">4. Statistical Mean</span>
                    <span className="text-sm font-bold font-mono text-[#26364D]">
                      {selectedAnomaly.mean !== undefined && selectedAnomaly.mean !== null ? String(selectedAnomaly.mean) : 'N/A'}
                    </span>
                  </div>

                  {/* 5. Median */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">5. Median</span>
                    <span className="text-sm font-bold font-mono text-[#26364D]">
                      {selectedAnomaly.median !== undefined && selectedAnomaly.median !== null ? String(selectedAnomaly.median) : 'N/A'}
                    </span>
                  </div>

                  {/* 6. Standard Deviation */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">6. Standard Deviation</span>
                    <span className="text-sm font-bold font-mono text-[#26364D]">
                      {selectedAnomaly.std_dev !== undefined && selectedAnomaly.std_dev !== null ? String(selectedAnomaly.std_dev) : 'N/A'}
                    </span>
                  </div>

                  {/* 7. Normal Range */}
                  <div className="p-3.5 rounded-2xl bg-[#F1F9F5] border border-[#D5EFE3] sm:col-span-2">
                    <span className="text-[11px] font-medium text-[#45B88A] block">7. Expected Normal Range</span>
                    <span className="text-sm font-bold font-mono text-[#45B88A]">
                      {selectedAnomaly.normal_range || selectedAnomaly.expected_range || 'Dataset standard range'}
                    </span>
                  </div>

                  {/* 8. Detection Algorithm */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
                    <span className="text-[11px] font-medium text-[#7C8DA5] block">8. Algorithm</span>
                    <span className="text-sm font-bold font-mono text-[#3987E8]">
                      {selectedAnomaly.detection_algorithm || selectedAnomaly.detection_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* 9. Severity & 10. Reason for Detection */}
              <div className="p-4.5 rounded-2xl bg-white border border-[#E2EAF5] border-l-4 border-l-[#3987E8] shadow-xs mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#3987E8] uppercase tracking-wider flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>10. Reason for Detection (Human-Readable Explanation)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedAnomaly.reason || selectedAnomaly.explanation)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[11px] text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
                  >
                    {copiedExplanation ? <Check className="w-3 h-3 text-[#45B88A]" /> : <Copy className="w-3 h-3 text-[#3987E8]" />}
                    <span>{copiedExplanation ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#26364D] leading-relaxed font-medium bg-[#F4F8FF] p-3.5 rounded-xl border border-[#E2EAF5]">
                  "{selectedAnomaly.reason || selectedAnomaly.explanation}"
                </p>
              </div>

              {/* Multivariate Contributing Features (for Isolation Forest / LOF) */}
              {selectedAnomaly.contributing_features && selectedAnomaly.contributing_features.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-[#F8FAFF] border border-[#E2EAF5]">
                  <div className="flex items-center space-x-2 mb-2.5">
                    <Sliders className="w-3.5 h-3.5 text-[#3987E8]" />
                    <span className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                      Multivariate Contributing Feature Breakdown
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7C8DA5] mb-3">
                    Features contributing most heavily to the isolation or density irregularity of this record:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[#7C8DA5] border-b border-[#E2EAF5] pb-1">
                          <th className="py-1.5 font-semibold">Feature</th>
                          <th className="py-1.5 font-semibold">Value</th>
                          <th className="py-1.5 font-semibold">Mean</th>
                          <th className="py-1.5 font-semibold">Z-Score</th>
                          <th className="py-1.5 font-semibold">Direction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2EAF5] text-[#26364D]">
                        {selectedAnomaly.contributing_features.slice(0, 5).map((feat, fIdx) => (
                          <tr key={fIdx}>
                            <td className="py-2 font-semibold text-[#3987E8]">{feat.feature}</td>
                            <td className="py-2 font-mono font-bold text-[#E87583]">{feat.value}</td>
                            <td className="py-2 font-mono text-[#7C8DA5]">{feat.mean}</td>
                            <td className="py-2 font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-[#FFF0F2] text-[#E87583] font-bold text-[10px]">
                                {feat.z_score}σ
                              </span>
                            </td>
                            <td className="py-2 text-[11px] text-[#7C8DA5]">{feat.direction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Categorical Frequency Breakdown */}
              {selectedAnomaly.category_frequency && (
                <div className="mb-6 p-4 rounded-2xl bg-[#F8FAFF] border border-[#E2EAF5]">
                  <span className="text-xs font-bold text-[#26364D] uppercase tracking-wider block mb-2">
                    Categorical Frequency Anomaly
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E2EAF5]">
                      <span className="text-[#7C8DA5] block mb-1">Category Frequency:</span>
                      <span className="font-bold text-[#E87583] text-sm">
                        {selectedAnomaly.category_frequency.frequency_pct}% ({selectedAnomaly.category_frequency.count} occurrences)
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E2EAF5]">
                      <span className="text-[#7C8DA5] block mb-1">Dominant Mode Category:</span>
                      <span className="font-bold text-[#45B88A] text-sm">
                        {selectedAnomaly.category_frequency.dominant_category} ({selectedAnomaly.category_frequency.dominant_pct}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2EAF5]">
                <span className="text-[11px] text-[#7C8DA5]">
                  All statistical indicators generated mathematically from active pipeline.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
