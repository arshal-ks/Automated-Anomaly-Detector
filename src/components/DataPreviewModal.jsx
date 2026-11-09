import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileSpreadsheet, Search } from 'lucide-react';

export default function DataPreviewModal({ isOpen, onClose, rawPreview = [], columns = [], filename }) {
  const [filterText, setFilterText] = useState('');

  if (!isOpen) return null;

  const filteredPreview = rawPreview.filter((row) => {
    if (!filterText) return true;
    return Object.values(row).some(
      (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(filterText.toLowerCase())
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26364D]/25 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-[24px] max-w-5xl w-full max-h-[85vh] flex flex-col p-6 border border-[#E2EAF5] shadow-[0_16px_40px_rgba(57,135,232,0.15)] relative"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E2EAF5] gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26364D] tracking-tight">
                Dataset Preview: <span className="text-[#3987E8]">{filename}</span>
              </h3>
              <p className="text-xs text-[#7C8DA5]">
                Displaying first {rawPreview.length} ingested records across {columns.length} columns.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7C8DA5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter preview rows..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-[#F4F8FF] border border-[#E2EAF5] text-xs text-[#26364D] placeholder-[#7C8DA5] focus:outline-none focus:border-[#3987E8]"
              />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#7C8DA5] hover:text-[#26364D] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-auto my-4 rounded-2xl border border-[#E2EAF5]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4F8FF] text-[#26364D] font-mono uppercase tracking-wider sticky top-0 border-b border-[#E2EAF5] z-10">
                <th className="py-3 px-3.5 bg-[#F4F8FF]">#</th>
                {columns.map((col) => (
                  <th key={col} className="py-3 px-3.5 whitespace-nowrap bg-[#F4F8FF]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EAF5] font-mono text-[#26364D]">
              {filteredPreview.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F4F8FF] transition">
                  <td className="py-2.5 px-3.5 text-[#7C8DA5] font-bold">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={col} className="py-2.5 px-3.5 whitespace-nowrap truncate max-w-[200px]">
                      {row[col] !== undefined && row[col] !== null ? (
                        String(row[col])
                      ) : (
                        <span className="text-[#CBD5E1] italic">null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#E2EAF5] flex items-center justify-between text-xs text-[#7C8DA5]">
          <span>{filteredPreview.length} records displayed</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold transition cursor-pointer shadow-xs"
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </div>
  );
}
