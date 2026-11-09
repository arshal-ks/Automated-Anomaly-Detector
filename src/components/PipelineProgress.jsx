import React from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Binary, 
  SlidersHorizontal, 
  Filter, 
  Radar, 
  Lightbulb, 
  FileSpreadsheet,
  Check,
  Loader2
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

export default function PipelineProgress({ stages = [], isLoading, currentActiveStage }) {
  const defaultStages = [
    { stage: "File Ingestion", description: "Parsing delimiter & encoding", duration_ms: 0, status: "pending" },
    { stage: "Data Validation", description: "Structure & row validation", duration_ms: 0, status: "pending" },
    { stage: "Data Profiling", description: "Column typing & statistics", duration_ms: 0, status: "pending" },
    { stage: "Data Preprocessing", description: "Robust scaling & imputation", duration_ms: 0, status: "pending" },
    { stage: "Feature Selection", description: "Suitability & variance check", duration_ms: 0, status: "pending" },
    { stage: "Anomaly Detection", description: "Executing multi-model engines", duration_ms: 0, status: "pending" },
    { stage: "Anomaly Explanation", description: "Deterministic reasoning", duration_ms: 0, status: "pending" },
    { stage: "Report Generation", description: "Export buffer formulation", duration_ms: 0, status: "pending" }
  ];

  const displayStages = stages.length > 0 ? stages : defaultStages;

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Radar className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            Automated Processing Pipeline
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-500/30">
          8 Stages
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
              className={`relative rounded-xl p-3 flex flex-col justify-between transition-all duration-300 border ${
                isDone
                  ? 'bg-slate-900/90 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : isActive
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-400/20 ring-1 ring-cyan-400/50'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}
            >
              {/* Top stage header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  0{i + 1}
                </span>
                {isDone ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>

              {/* Stage icon & name */}
              <div className="flex items-center space-x-2 my-1">
                <Icon className={`w-4 h-4 ${isDone ? 'text-cyan-400' : isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                <h4 className="text-xs font-bold text-slate-200 truncate">
                  {stg.stage}
                </h4>
              </div>

              {/* Sub description / timing */}
              <div className="mt-1 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-mono truncate max-w-[80px]" title={stg.description}>
                  {isDone ? `${stg.duration_ms}ms` : 'Ready'}
                </span>
                <span className={`capitalize font-semibold text-[9px] ${
                  isDone ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-slate-500'
                }`}>
                  {isDone ? 'Done' : isActive ? 'Running' : 'Queued'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

