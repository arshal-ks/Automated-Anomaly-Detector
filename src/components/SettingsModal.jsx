import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Check } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  algorithm,
  setAlgorithm,
  contamination,
  setContamination,
  onApply
}) {
  if (!isOpen) return null;

  const algorithms = [
    {
      id: 'auto',
      name: 'Auto Ensemble (Recommended)',
      tag: 'Autonomous',
      desc: 'Dynamically selects optimal parametric or non-parametric algorithms based on sample size, dimensionality, and skewness.'
    },
    {
      id: 'iqr',
      name: 'Interquartile Range (IQR)',
      tag: 'Non-Parametric',
      desc: 'Robust against extreme outliers; calculates [Q1 - 1.5×IQR, Q3 + 1.5×IQR] boundaries without assuming normal distribution.'
    },
    {
      id: 'zscore',
      name: 'Z-Score (3-Sigma)',
      tag: 'Parametric',
      desc: 'Measures standard deviations from the dataset mean; optimal for normally distributed metric attributes.'
    },
    {
      id: 'isolation_forest',
      name: 'Isolation Forest',
      tag: 'Tree-based ML',
      desc: 'Builds random decision trees; anomalies require fewer splits to isolate in high-dimensional feature space.'
    },
    {
      id: 'lof',
      name: 'Local Outlier Factor (LOF)',
      tag: 'Density-based',
      desc: 'Compares local density of a record with its nearest neighbors; highly effective for varying-density clusters.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26364D]/25 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-[24px] max-w-xl w-full p-6 border border-[#E2EAF5] shadow-[0_16px_40px_rgba(57,135,232,0.15)] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAF5]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#26364D] tracking-tight">
                Detection Engine Settings
              </h3>
              <p className="text-xs text-[#7C8DA5]">
                Select anomaly detection algorithm and configure sensitivity rate.
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

        {/* Algorithm Radio Options */}
        <div className="my-5 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
          <label className="text-[11px] font-bold text-[#7C8DA5] uppercase tracking-wider block mb-2">
            Detection Algorithm
          </label>
          {algorithms.map((algo) => {
            const isSelected = algorithm === algo.id;
            return (
              <div
                key={algo.id}
                onClick={() => setAlgorithm(algo.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EAF3FF] border-[#3987E8] shadow-xs'
                    : 'bg-[#F4F8FF]/60 border-[#E2EAF5] hover:border-[#DCEBFF] hover:bg-[#F4F8FF]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#26364D]">{algo.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white text-[#3987E8] border border-[#DCEBFF]">
                      {algo.tag}
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#3987E8] bg-[#3987E8] text-white' : 'border-[#CBD5E1]'
                  }`}>
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[11px] text-[#7C8DA5] leading-relaxed">
                  {algo.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contamination Slider */}
        <div className="p-4 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] mb-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-[#26364D]">
                Sensitivity / Contamination Rate
              </span>
              <p className="text-[11px] text-[#7C8DA5]">
                Expected outlier proportion in feature space (1% to 25%).
              </p>
            </div>
            <span className="text-sm font-bold text-[#3987E8] bg-white px-2.5 py-0.5 rounded-xl border border-[#DCEBFF]">
              {(contamination * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.25"
            step="0.01"
            value={contamination}
            onChange={(e) => setContamination(parseFloat(e.target.value))}
            className="w-full accent-[#3987E8] cursor-pointer h-1.5 bg-[#E2EAF5] rounded-lg mt-1"
          />
          <div className="flex justify-between text-[10px] text-[#7C8DA5] mt-1.5 font-medium">
            <span>1% (Conservative)</span>
            <span>5% (Balanced)</span>
            <span>25% (High Sensitivity)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[#E2EAF5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[#26364D] text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition cursor-pointer"
          >
            Apply & Re-analyze
          </button>
        </div>
      </motion.div>
    </div>
  );
}
