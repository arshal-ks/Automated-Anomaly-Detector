import React from 'react';
import { 
  Database, 
  Columns, 
  AlertTriangle, 
  CheckCircle, 
  Percent, 
  HelpCircle, 
  Copy, 
  Clock 
} from 'lucide-react';

export default function DashboardStats({
  metadata,
  profiling,
  detection,
  timingMs
}) {
  if (!metadata || !detection) return null;

  const totalRecords = metadata.total_rows || 0;
  const totalCols = metadata.total_columns || 0;
  const totalAnomalies = detection.total_anomalies || 0;
  const normalRecords = detection.normal_records || (totalRecords - totalAnomalies);
  const anomalyPct = detection.anomaly_percentage || 0;
  const missingCount = profiling?.total_missing_cells || 0;
  const missingPct = profiling?.missing_percentage || 0;
  const duplicateRows = profiling?.duplicate_records || 0;
  const duplicatePct = profiling?.duplicate_percentage || 0;

  const cards = [
    {
      title: "Total Records",
      value: totalRecords.toLocaleString(),
      subtitle: `${metadata.filename}`,
      icon: Database,
      accent: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      textColor: "text-cyan-400",
      glow: "shadow-cyan-500/10"
    },
    {
      title: "Total Columns",
      value: totalCols,
      subtitle: `${profiling?.numerical_columns_count || 0} Num • ${profiling?.categorical_columns_count || 0} Cat`,
      icon: Columns,
      accent: "from-violet-500/20 to-purple-500/20",
      borderColor: "border-violet-500/30",
      textColor: "text-violet-400",
      glow: "shadow-violet-500/10"
    },
    {
      title: "Total Anomalies",
      value: totalAnomalies.toLocaleString(),
      subtitle: `${anomalyPct}% of records`,
      icon: AlertTriangle,
      accent: "from-rose-500/20 to-pink-500/20",
      borderColor: "border-rose-500/40",
      textColor: "text-rose-400",
      glow: "shadow-rose-500/20",
      badge: "Flagged"
    },
    {
      title: "Normal Records",
      value: normalRecords.toLocaleString(),
      subtitle: `${(100 - anomalyPct).toFixed(1)}% verified clean`,
      icon: CheckCircle,
      accent: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-400",
      glow: "shadow-emerald-500/10"
    },
    {
      title: "Anomaly Rate",
      value: `${anomalyPct}%`,
      subtitle: `${detection.selected_method_name}`,
      icon: Percent,
      accent: "from-amber-500/20 to-orange-500/20",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
      glow: "shadow-amber-500/10"
    },
    {
      title: "Missing Values",
      value: missingCount.toLocaleString(),
      subtitle: `${missingPct}% total data cells`,
      icon: HelpCircle,
      accent: "from-indigo-500/20 to-sky-500/20",
      borderColor: "border-indigo-500/30",
      textColor: "text-indigo-400",
      glow: "shadow-indigo-500/10"
    },
    {
      title: "Duplicate Records",
      value: duplicateRows.toLocaleString(),
      subtitle: `${duplicatePct}% redundancy`,
      icon: Copy,
      accent: "from-fuchsia-500/20 to-pink-500/20",
      borderColor: "border-fuchsia-500/30",
      textColor: "text-fuchsia-400",
      glow: "shadow-fuchsia-500/10"
    },
    {
      title: "Processing Time",
      value: `${timingMs}ms`,
      subtitle: "Full 8-stage pipeline",
      icon: Clock,
      accent: "from-teal-500/20 to-cyan-500/20",
      borderColor: "border-teal-500/30",
      textColor: "text-teal-400",
      glow: "shadow-teal-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`glass-panel rounded-2xl p-4.5 border ${card.borderColor} bg-gradient-to-br ${card.accent} shadow-lg ${card.glow} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-center justify-center ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight">
                {card.value}
              </span>
              {card.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {card.badge}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}

