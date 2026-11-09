import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  UploadCloud, 
  BarChart3, 
  Radar, 
  Lightbulb, 
  FileSpreadsheet, 
  Settings, 
  Database,
  ChevronLeft,
  ChevronRight,
  X,
  ScanEye
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Dataset', icon: UploadCloud },
  { id: 'analysis', label: 'Data Analysis', icon: BarChart3 },
  { id: 'detection', label: 'Anomaly Detection', icon: Radar },
  { id: 'explanations', label: 'Explanations', icon: Lightbulb },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  metadata,
  detection,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen = () => {}
}) {
  const hasData = !!metadata;

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const navContent = (collapsed = false) => (
    <>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-[#E2EAF5]">
        <div className="flex items-center space-x-3 overflow-hidden">
          {/* Minimal blue AI/data detection logo icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] text-[#3987E8] shadow-sm shrink-0">
            <ScanEye className="w-5 h-5 text-[#3987E8]" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-sm font-extrabold tracking-wide text-[#26364D]">
                ANOMALY <span className="text-[#3987E8]">DETECTOR</span>
              </span>
              <span className="text-[11px] text-[#7C8DA5] font-medium tracking-tight">
                Intelligent Data Analysis
              </span>
            </motion.div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#7C8DA5] hover:text-[#3987E8] transition cursor-pointer border border-[#E2EAF5]"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] text-[#7C8DA5] hover:text-[#3987E8] transition cursor-pointer border border-[#E2EAF5]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'px-3.5'
              } py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer group ${
                isActive
                  ? 'text-[#3987E8]'
                  : 'text-[#7C8DA5] hover:text-[#26364D] hover:bg-[#F4F8FF]'
              }`}
            >
              {/* Soft Blue Active Navigation Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeSidebarPillPastel"
                  className="absolute inset-0 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}

              <span className="relative z-10 flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-[#3987E8]' : 'text-[#7C8DA5] group-hover:text-[#3987E8]'
                  }`}
                />
                {!collapsed && (
                  <span className="tracking-normal font-semibold">{item.label}</span>
                )}
              </span>

              {/* Blue Active Dot indicator */}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeDotPastel"
                  className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#3987E8]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Dataset Status Widget */}
      <div className="pt-3 border-t border-[#E2EAF5] mt-auto">
        {!collapsed ? (
          <div className="p-3 rounded-2xl bg-[#F4F8FF] border border-[#E2EAF5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8DA5] flex items-center space-x-1">
                <Database className="w-3 h-3 text-[#3987E8]" />
                <span>Dataset Status</span>
              </span>
              <span className="flex items-center space-x-1 text-[10px] font-semibold text-[#45B88A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#45B88A] animate-pulse" />
                <span>{hasData ? 'SYNCED' : 'READY'}</span>
              </span>
            </div>

            {hasData ? (
              <div>
                <p className="text-xs font-bold text-[#26364D] truncate" title={metadata.filename}>
                  {metadata.filename}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#7C8DA5] mt-0.5">
                  <span>{metadata.total_rows.toLocaleString()} records</span>
                  <span className="text-[#3987E8] font-bold">{detection?.total_anomalies || 0} outliers</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#7C8DA5] italic">
                Awaiting CSV upload
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-2" title={hasData ? metadata.filename : "No dataset"}>
            <span className={`w-2.5 h-2.5 rounded-full ${hasData ? 'bg-[#3987E8] shadow-sm shadow-[#3987E8]' : 'bg-[#DCEBFF]'}`} />
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Floating Pastel Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isCollapsed ? 80 : 260 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col h-[calc(100vh-2rem)] sticky top-4 bg-white/95 rounded-3xl p-4 z-40 border border-[#E2EAF5] shadow-[0_10px_30px_rgba(57,135,232,0.08)] select-none transition-all duration-300"
      >
        {navContent(isCollapsed)}
      </motion.aside>

      {/* Mobile Slide-Over Pastel Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Soft Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-[#26364D]/20 backdrop-blur-sm"
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-72 max-w-[85vw] h-full bg-white border-r border-[#E2EAF5] p-4 flex flex-col z-10 shadow-2xl"
            >
              {navContent(false)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
