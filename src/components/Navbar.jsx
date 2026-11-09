import React from 'react';
import { ShieldAlert, Cpu, Settings, Eye, BarChart3, Sparkles } from 'lucide-react';

export default function Navbar({
  onOpenSettings,
  onOpenProfiling,
  onOpenPreview,
  hasData,
  selectedAlgo
}) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 backdrop-blur-xl bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-600/30 to-pink-500/20 border border-cyan-400/40 shadow-lg shadow-cyan-500/20">
            <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-sm pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-wider text-white">
                ANOMALY <span className="text-cyan-400">DETECTOR</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 border border-violet-500/30 text-violet-300">
                <Sparkles className="w-3 h-3 mr-1 text-violet-400" /> v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Intelligent Data. Detect the Unexpected.
            </p>
          </div>
        </div>

        {/* Right Actions & Status */}
        <div className="flex items-center space-x-3">
          {/* Engine status indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">ENGINE ACTIVE</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 uppercase font-mono">{selectedAlgo}</span>
          </div>

          {hasData && (
            <>
              <button
                onClick={onOpenPreview}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-medium transition cursor-pointer"
                title="Preview Raw Dataset"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Data Preview</span>
              </button>

              <button
                onClick={onOpenProfiling}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-medium transition cursor-pointer"
                title="View Dataset Profiling"
              >
                <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden sm:inline">Profiling</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 hover:from-cyan-500/20 hover:to-violet-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition cursor-pointer"
            title="Configure Algorithm & Sensitivity"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Config</span>
          </button>
        </div>
      </div>
    </header>
  );
}

