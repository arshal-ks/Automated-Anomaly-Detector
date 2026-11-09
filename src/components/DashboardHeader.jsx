import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Eye, 
  BarChart3, 
  Menu, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  User, 
  Database
} from 'lucide-react';

export default function DashboardHeader({
  metadata,
  detection,
  isLoading,
  onOpenPreview,
  onOpenProfiling,
  onMobileMenuToggle,
  onOpenSettings
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const hasData = !!metadata;

  const notifications = hasData
    ? [
        {
          id: 1,
          type: 'success',
          title: 'Dataset Ingestion Complete',
          desc: `Ingested ${metadata.filename} with ${metadata.total_rows.toLocaleString()} records across ${metadata.total_columns} columns.`,
          time: 'Just now'
        },
        {
          id: 2,
          type: 'info',
          title: `Detection Model: ${detection?.selected_method_name || 'Ensemble'}`,
          desc: `Identified ${detection?.total_anomalies || 0} anomalies (${detection?.anomaly_percentage || 0}%).`,
          time: '1m ago'
        }
      ]
    : [
        {
          id: 0,
          type: 'info',
          title: 'Workspace Ready',
          desc: 'Upload any valid CSV file to profile data and detect anomalies.',
          time: 'Active'
        }
      ];

  return (
    <header className="sticky top-4 z-30 w-full mb-6 select-none">
      <div className="bg-white/95 rounded-3xl px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
        {/* Left: Mobile Toggle & Welcome Message */}
        <div className="flex items-center space-x-3.5">
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#26364D] transition cursor-pointer border border-[#E2EAF5]"
          >
            <Menu className="w-5 h-5 text-[#3987E8]" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-[#26364D] tracking-tight">
                Welcome to Anomaly Detector
              </h2>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3FF] border border-[#DCEBFF] text-[#3987E8]">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-[#3987E8]" /> AI Workspace
              </span>
            </div>
            <p className="text-[12px] text-[#7C8DA5] font-medium">
              Your intelligent data analysis workspace.
            </p>
          </div>
        </div>

        {/* Center: Current Dataset & Status Pill */}
        <div className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5]">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLoading ? 'bg-[#E9AC52]' : hasData ? 'bg-[#45B88A]' : 'bg-[#7C8DA5]'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isLoading ? 'bg-[#E9AC52]' : hasData ? 'bg-[#45B88A]' : 'bg-[#7C8DA5]'
              }`} />
            </span>
            <span className="text-[11px] font-semibold text-[#26364D]">
              {isLoading ? (
                <span className="text-[#E9AC52] font-bold">ANALYZING DATASET...</span>
              ) : hasData ? (
                <span className="text-[#26364D]">
                  DATASET: <strong className="text-[#3987E8]">{metadata.filename}</strong>
                </span>
              ) : (
                <span className="text-[#7C8DA5]">STATUS: READY FOR UPLOAD</span>
              )}
            </span>
          </div>

          {hasData && (
            <>
              <span className="text-[#E2EAF5]">|</span>
              <span className="text-[11px] text-[#3987E8] font-bold">
                {detection?.total_anomalies || 0} OUTLIERS
              </span>
            </>
          )}
        </div>

        {/* Right: Quick Actions, Notifications & Profile */}
        <div className="flex items-center space-x-2.5">
          {hasData && (
            <>
              <button
                type="button"
                onClick={onOpenPreview}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[#26364D] hover:text-[#3987E8] text-xs font-semibold transition cursor-pointer"
                title="Preview Raw Dataset"
              >
                <Eye className="w-3.5 h-3.5 text-[#3987E8]" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={onOpenProfiling}
                className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[#26364D] hover:text-[#3987E8] text-xs font-semibold transition cursor-pointer"
                title="Column Statistics & Profiling"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#3987E8]" />
                <span>Profiling</span>
              </button>
            </>
          )}

          {/* Notifications Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-2xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-[#26364D] hover:text-[#3987E8] transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#7C8DA5] hover:text-[#3987E8]" />
              {hasData && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#3987E8]" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-3xl p-4 border border-[#E2EAF5] shadow-[0_16px_36px_rgba(57,135,232,0.12)] z-50"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E2EAF5]">
                    <span className="text-xs font-bold text-[#26364D] uppercase tracking-wider">
                      Activity Updates
                    </span>
                    <span className="text-[11px] text-[#3987E8] font-bold">Live</span>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#26364D]">{n.title}</span>
                          <span className="text-[10px] text-[#7C8DA5]">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-[#7C8DA5] leading-snug">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2.5 pl-1.5 sm:border-l sm:border-[#E2EAF5]">
            <div className="w-8 h-8 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-xs font-bold text-[#3987E8] shadow-sm cursor-pointer">
              <User className="w-4 h-4 text-[#3987E8]" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-[#26364D] leading-tight">Data Analyst</p>
              <p className="text-[10px] text-[#7C8DA5] leading-tight">Active User</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
