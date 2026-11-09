import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  Scatter
} from 'recharts';
import { 
  PieChart as PieIcon, 
  BarChart2, 
  Activity, 
  GitCompare, 
  Layers, 
  Sparkles
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-2xl border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.12)] text-xs">
        {label && <p className="font-bold text-[#26364D] mb-1.5 text-[11px]">{label}</p>}
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-3">
              <span className="flex items-center space-x-1.5 text-[#7C8DA5]">
                <span 
                  className="w-2 h-2 rounded-full shadow-xs"
                  style={{ backgroundColor: entry.color || entry.fill || '#3987E8' }}
                />
                <span className="capitalize">{entry.name}:</span>
              </span>
              <span className="font-bold text-[#26364D]">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function Visualizations({ charts, comparison }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!charts) return null;

  const {
    pie_data = [],
    by_column = [],
    severity_dist = [],
    scatter_points = [],
    primary_num_col,
    before_after = []
  } = charts;

  // Refined Pastel Palette
  const pieColors = {
    "Normal Records": "#3987E8",
    "Anomalous Records": "#E87583"
  };

  const compData = comparison
    ? Object.entries(comparison).map(([key, data]) => ({
        algorithm: data.name.replace(/ \(.*\)/, ''),
        anomalies: data.anomaly_count,
        percentage: data.percentage
      }))
    : [];

  const tabs = [
    { id: 'overview', label: 'Overview & Severity', icon: PieIcon },
    { id: 'columns', label: 'Anomalies By Column', icon: BarChart2 },
    { id: 'distribution', label: 'Feature Distributions', icon: Activity },
    { id: 'algorithms', label: 'Algorithm Comparison', icon: GitCompare },
    { id: 'cleaning', label: 'Before / After Cleaning', icon: Layers }
  ];

  return (
    <div className="w-full bg-white rounded-[24px] p-6 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)] select-none">
      {/* Top Header & Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-[#E2EAF5]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shadow-xs">
              <Sparkles className="w-4 h-4 text-[#3987E8]" />
            </div>
            <h3 className="text-base font-extrabold text-[#26364D] tracking-tight">
              Data Analytics & Distribution Visualizations
            </h3>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] border border-[#DCEBFF] text-[#3987E8]">
              Interactive Recharts
            </span>
          </div>
          <p className="text-xs text-[#7C8DA5] mt-1">
            Visual inspection of normal vs anomalous records, column frequencies, and model benchmarks.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] max-w-full overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[#3987E8]'
                    : 'text-[#7C8DA5] hover:text-[#26364D] hover:bg-[#EAF3FF]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeChartTabPastel"
                    className="absolute inset-0 rounded-xl bg-white border border-[#E2EAF5] shadow-xs"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-[#3987E8]' : 'text-[#7C8DA5]'}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Definitions for soft pastel gradients */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="pastelBlueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3987E8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#DCEBFF" stopOpacity={0.05} />
          </linearGradient>
        </defs>
      </svg>

      {/* Chart Content Area */}
      <div className="pt-6 min-h-[350px]">
        <AnimatePresence mode="wait">
          {/* Tab 1: Overview & Severity */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Donut Chart: Normal vs Anomalous */}
              <div className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                    Normal vs Anomalous Records
                  </h4>
                  <span className="text-[10px] font-semibold text-[#3987E8] bg-[#EAF3FF] px-2 py-0.5 rounded-md border border-[#DCEBFF]">
                    AUDITED
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pie_data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                      >
                        {pie_data.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={pieColors[entry.name] || entry.color || '#3987E8'} 
                            stroke="#FFFFFF" 
                            strokeWidth={3} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-[#26364D] font-medium">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Severity Distribution */}
              <div className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                    Anomaly Severity Distribution
                  </h4>
                  <span className="text-[10px] font-semibold text-[#E87583] bg-[#FFF0F2] px-2 py-0.5 rounded-md border border-[#FED7DC]">
                    SEVERITY
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severity_dist} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF5" />
                      <XAxis dataKey="severity" stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                      <YAxis stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {severity_dist.map((entry, index) => {
                          const fill = 
                            entry.severity === 'Critical' ? '#D9384B' :
                            entry.severity === 'High' ? '#F36B38' :
                            entry.severity === 'Medium' ? '#E9AC52' : '#3987E8';
                          return <Cell key={`cell-sev-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Anomalies By Column */}
          {activeTab === 'columns' && (
            <motion.div
              key="columns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                  Anomalies by Column
                </h4>
                <span className="text-[10px] font-semibold text-[#3987E8] bg-[#EAF3FF] px-2 py-0.5 rounded-md border border-[#DCEBFF]">
                  {by_column.length} Columns Impacted
                </span>
              </div>
              <p className="text-xs text-[#7C8DA5] mb-4">
                Identifies which dataset columns exhibit the highest outlier frequency.
              </p>
              <div className="h-72">
                {by_column.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={by_column} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF5" />
                      <XAxis type="number" stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                      <YAxis dataKey="column" type="category" stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {by_column.map((entry, index) => (
                          <Cell 
                            key={`cell-col-${index}`} 
                            fill={index === 0 ? '#E87583' : index === 1 ? '#6AA8F5' : '#3987E8'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#7C8DA5] text-sm">
                    No column-level outliers detected.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 3: Numerical Feature Distributions */}
          {activeTab === 'distribution' && (
            <motion.div
              key="distribution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                  Numerical Feature Distributions & Outliers ({primary_num_col || 'Feature Sequence'})
                </h4>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center space-x-1 text-[#3987E8]">
                    <span className="w-2 h-2 rounded-full bg-[#3987E8]" />
                    <span>Normal Curve</span>
                  </span>
                  <span className="flex items-center space-x-1 text-[#E87583]">
                    <span className="w-2 h-2 rounded-full bg-[#E87583]" />
                    <span>Detected Outlier</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#7C8DA5] mb-4">
                Sequential values curve with highlighted anomalous deviations.
              </p>
              <div className="h-72">
                {scatter_points.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scatter_points} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF5" />
                      <XAxis 
                        dataKey="index" 
                        stroke="#7C8DA5" 
                        tick={{ fontSize: 11, fill: '#7C8DA5' }} 
                        label={{ value: 'Record Index', position: 'insideBottom', offset: -5, fill: '#7C8DA5', fontSize: 10 }} 
                      />
                      <YAxis stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3987E8" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#pastelBlueGrad)" 
                      />
                      <Scatter
                        data={scatter_points.filter((p) => p.is_anomaly)}
                        fill="#E87583"
                        line={false}
                        shape="circle"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#7C8DA5] text-sm">
                    No numerical columns available for continuous distribution plotting.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 4: Algorithm Comparison */}
          {activeTab === 'algorithms' && (
            <motion.div
              key="algorithms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                  Anomaly Detection Comparison Across Algorithms
                </h4>
                <span className="text-[10px] font-semibold text-[#3987E8] bg-[#EAF3FF] px-2 py-0.5 rounded-md border border-[#DCEBFF]">
                  MULTI-MODEL
                </span>
              </div>
              <p className="text-xs text-[#7C8DA5] mb-4">
                Comparison of detected anomaly count and coverage percentage across IQR, Z-Score, Isolation Forest, and LOF.
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF5" />
                    <XAxis dataKey="algorithm" stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                    <YAxis stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="anomalies" name="Anomaly Count" fill="#3987E8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="percentage" name="Anomaly Impact %" fill="#6AA8F5" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Tab 5: Before / After Cleaning */}
          {activeTab === 'cleaning' && (
            <motion.div
              key="cleaning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-[#F4F8FF]/60 rounded-2xl p-5 border border-[#E2EAF5]"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                  Dataset Quality: Before vs After Data Cleaning
                </h4>
                <span className="text-[10px] font-semibold text-[#45B88A] bg-[#EAF9F3] px-2 py-0.5 rounded-md border border-[#C3EFDF]">
                  CLEANED
                </span>
              </div>
              <p className="text-xs text-[#7C8DA5] mb-4">
                Measures data quality improvements across missing cells, duplicate records, and isolated anomalies.
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={before_after} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2EAF5" />
                    <XAxis dataKey="stage" stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                    <YAxis stroke="#7C8DA5" tick={{ fontSize: 11, fill: '#7C8DA5' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} />
                    <Bar dataKey="before" name="Before Cleansing (Raw Dataset)" fill="#E87583" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="after" name="After Cleansing (Export Ready)" fill="#45B88A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
