import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  Hash, 
  Type, 
  Calendar, 
  CheckSquare, 
  ChevronDown, 
  ChevronUp,
  Search
} from 'lucide-react';

export default function ProfilingDrawer({ isOpen, onClose, profiling }) {
  const [activeTypeTab, setActiveTypeTab] = useState('numerical');
  const [expandedCol, setExpandedCol] = useState(null);
  const [searchCol, setSearchCol] = useState('');

  if (!isOpen || !profiling) return null;

  const {
    numerical_columns = [],
    categorical_columns = [],
    datetime_columns = [],
    boolean_columns = [],
    constant_columns = [],
    high_cardinality_columns = [],
    columns_profile = {},
    total_records = 0,
    total_columns = 0,
    missing_percentage = 0,
    duplicate_records = 0
  } = profiling;

  const currentCols =
    activeTypeTab === 'numerical'
      ? numerical_columns
      : activeTypeTab === 'categorical'
      ? categorical_columns
      : activeTypeTab === 'datetime'
      ? datetime_columns
      : boolean_columns;

  const filteredCols = currentCols.filter((c) =>
    c.toLowerCase().includes(searchCol.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#26364D]/25 backdrop-blur-sm select-none">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="bg-white w-full max-w-2xl h-full flex flex-col p-6 overflow-hidden border-l border-[#E2EAF5] shadow-2xl relative"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF5]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26364D] tracking-tight">
                Automatic Data Profiling
              </h3>
              <p className="text-xs text-[#7C8DA5]">
                {total_columns} columns • {total_records.toLocaleString()} records • {missing_percentage}% missing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#7C8DA5] hover:text-[#26364D] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Dataset Summary Banner */}
        <div className="grid grid-cols-4 gap-2.5 my-4 p-3.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] text-center">
          <div>
            <span className="text-[10px] text-[#7C8DA5] block uppercase font-bold">Records</span>
            <span className="text-sm font-extrabold text-[#26364D]">{total_records.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#7C8DA5] block uppercase font-bold">Columns</span>
            <span className="text-sm font-extrabold text-[#3987E8]">{total_columns}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#7C8DA5] block uppercase font-bold">Missing %</span>
            <span className="text-sm font-extrabold text-[#E9AC52]">{missing_percentage}%</span>
          </div>
          <div>
            <span className="text-[10px] text-[#7C8DA5] block uppercase font-bold">Duplicates</span>
            <span className="text-sm font-extrabold text-[#E87583]">{duplicate_records}</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-[#7C8DA5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search column..."
            value={searchCol}
            onChange={(e) => setSearchCol(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs text-[#26364D] placeholder-[#7C8DA5] focus:outline-none focus:border-[#3987E8]"
          />
        </div>

        {/* Column Type Selectors */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
          <button
            type="button"
            onClick={() => setActiveTypeTab('numerical')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'numerical'
                ? 'bg-white text-[#3987E8] border border-[#E2EAF5] shadow-xs'
                : 'text-[#7C8DA5] hover:text-[#26364D]'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Num ({numerical_columns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('categorical')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'categorical'
                ? 'bg-white text-[#3987E8] border border-[#E2EAF5] shadow-xs'
                : 'text-[#7C8DA5] hover:text-[#26364D]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Cat ({categorical_columns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('datetime')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'datetime'
                ? 'bg-white text-[#3987E8] border border-[#E2EAF5] shadow-xs'
                : 'text-[#7C8DA5] hover:text-[#26364D]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Date ({datetime_columns.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTypeTab('boolean')}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeTab === 'boolean'
                ? 'bg-white text-[#3987E8] border border-[#E2EAF5] shadow-xs'
                : 'text-[#7C8DA5] hover:text-[#26364D]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Bool ({boolean_columns.length})</span>
          </button>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredCols.length > 0 ? (
            filteredCols.map((colName) => {
              const prof = columns_profile[colName] || {};
              const stats = prof.stats || {};
              const isConstant = constant_columns.includes(colName);
              const isHighCard = high_cardinality_columns.includes(colName);
              const isExpanded = expandedCol === colName;

              return (
                <div
                  key={colName}
                  className="rounded-2xl border border-[#E2EAF5] bg-[#F4F8FF]/60 overflow-hidden transition"
                >
                  <div
                    onClick={() => setExpandedCol(isExpanded ? null : colName)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#F4F8FF]"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-bold text-[#26364D] text-xs">{colName}</span>
                      {isConstant && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF8EC] text-[#E9AC52] border border-[#FDE8C9]">
                          CONSTANT
                        </span>
                      )}
                      {isHighCard && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EAF3FF] text-[#3987E8] border border-[#DCEBFF]">
                          HIGH CARDINALITY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-[#7C8DA5] font-mono">
                      <span>Unique: <strong className="text-[#3987E8]">{prof.unique_values || 0}</strong></span>
                      <span>Missing: <strong className="text-[#E9AC52]">{prof.missing_count || 0}</strong></span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#26364D]" /> : <ChevronDown className="w-4 h-4 text-[#7C8DA5]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-[#E2EAF5] space-y-3">
                      {/* Summary Badges */}
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-[#26364D]">
                          Inferred Type: <strong className="text-[#3987E8] capitalize">{prof.inferred_type}</strong>
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-[#26364D]">
                          Missing Ratio: <strong className="text-[#E9AC52]">{prof.missing_percentage}%</strong>
                        </span>
                      </div>

                      {/* Detailed Stats for Numerical */}
                      {prof.inferred_type === 'numerical' && stats && (
                        <div className="grid grid-cols-4 gap-2 text-xs font-mono pt-2">
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">MEAN</span>
                            <span className="text-[#26364D] font-bold">{stats.mean ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">STD DEV</span>
                            <span className="text-[#26364D] font-bold">{stats.std ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">MIN</span>
                            <span className="text-[#E87583] font-bold">{stats.min ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">MAX</span>
                            <span className="text-[#E87583] font-bold">{stats.max ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">25% (Q1)</span>
                            <span className="text-[#3987E8] font-bold">{stats.q25 ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">MEDIAN (Q2)</span>
                            <span className="text-[#45B88A] font-bold">{stats.median ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">75% (Q3)</span>
                            <span className="text-[#3987E8] font-bold">{stats.q75 ?? 'N/A'}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5]">
                            <span className="text-[#7C8DA5] block text-[10px]">IQR</span>
                            <span className="text-[#6AA8F5] font-bold">{stats.iqr ?? 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Top Values for Categorical */}
                      {prof.top_values && Object.keys(prof.top_values).length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-bold text-[#7C8DA5] block mb-1.5 uppercase font-mono">
                            Top Frequent Values:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(prof.top_values).map(([val, cnt]) => (
                              <span
                                key={val}
                                className="px-2.5 py-1 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs text-[#26364D] flex items-center space-x-1.5"
                              >
                                <span className="font-semibold">{val}</span>
                                <span className="text-[#3987E8] text-[10px]">({cnt})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-[#7C8DA5] text-xs italic">
              No columns match the selected type or search filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E2EAF5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Close Profiling
          </button>
        </div>
      </motion.div>
    </div>
  );
}
