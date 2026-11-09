import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  AlertCircle, 
  Sparkles, 
  Database,
  BarChart3,
  Radar,
  Lightbulb,
  FileSpreadsheet,
  Sliders,
  RotateCcw,
  Cpu
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import StatisticsCards from './components/StatisticsCards';
import LiquidUpload from './components/LiquidUpload';
import Visualizations from './components/Visualizations';
import AnomalyTable from './components/AnomalyTable';
import ExportPanel from './components/ExportPanel';
import ProfilingDrawer from './components/ProfilingDrawer';
import DataPreviewModal from './components/DataPreviewModal';
import SettingsModal from './components/SettingsModal';

import { uploadAndAnalyze, analyzeSample } from './services/api';

export default function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [currentSampleType, setCurrentSampleType] = useState(null);
  const [algorithm, setAlgorithm] = useState('auto');
  const [contamination, setContamination] = useState(0.05);

  const [activeTab, setActiveTab] = useState('overview');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfilingOpen, setIsProfilingOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Pipeline loading animation simulation
  useEffect(() => {
    let interval;
    if (isLoading) {
      setActiveStageIndex(0);
      interval = setInterval(() => {
        setActiveStageIndex((prev) => (prev < 7 ? prev + 1 : prev));
      }, 160);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const triggerAnalysis = async (fileObj, sampleName = null) => {
    setIsLoading(true);
    setError('');
    setAnalysisResult(null); // Reset previous analysis immediately

    try {
      let result;
      if (fileObj) {
        result = await uploadAndAnalyze(fileObj, algorithm, contamination);
      } else if (sampleName) {
        result = await analyzeSample(sampleName, algorithm, contamination);
      } else {
        throw new Error('No dataset provided for analysis.');
      }

      setAnalysisResult(result);
      
      // Celebrate analysis completion with elegant pastel confetti
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3987E8', '#6AA8F5', '#DCEBFF', '#45B88A', '#E9AC52']
        });
      } catch (e) {
        // Confetti fallback
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during data pipeline execution.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setCurrentFile(file);
    setCurrentSampleType(null);
    triggerAnalysis(file, null);
  };

  const handleLoadSample = (sampleType) => {
    setCurrentFile(null);
    setCurrentSampleType(sampleType);
    triggerAnalysis(null, sampleType);
  };

  const handleReset = () => {
    setCurrentFile(null);
    setCurrentSampleType(null);
    setAnalysisResult(null);
    setError('');
    setActiveTab('overview');
  };

  const handleApplySettings = () => {
    if (currentFile) {
      triggerAnalysis(currentFile, null);
    } else if (currentSampleType) {
      triggerAnalysis(null, currentSampleType);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#EAF3FF] text-[#26364D] selection:bg-[#DCEBFF] selection:text-[#3987E8] overflow-x-hidden font-sans pastel-pattern-bg">
      <div className="relative z-10 flex min-h-screen p-3 sm:p-4 gap-4">
        {/* Floating Pastel Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'settings') {
              setIsSettingsOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          metadata={analysisResult?.metadata}
          detection={analysisResult?.detection}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0 max-w-full">
          {/* Header */}
          <DashboardHeader
            metadata={analysisResult?.metadata}
            detection={analysisResult?.detection}
            isLoading={isLoading}
            onOpenPreview={() => setIsPreviewOpen(true)}
            onOpenProfiling={() => setIsProfilingOpen(true)}
            onMobileMenuToggle={() => setIsMobileOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-3xl bg-[#FFF0F2] border border-[#FED7DC] text-[#E87583] text-xs sm:text-sm flex items-start space-x-3.5 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-[#E87583] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-bold block text-[#E87583]">Pipeline Ingestion Notice</strong>
                  <p className="mt-0.5 leading-relaxed text-[#26364D]">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-[#E87583] hover:text-[#26364D] text-xs font-bold cursor-pointer"
                >
                  DISMISS
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Views */}
          <main className="flex-1 space-y-6 pb-12">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Hero / Upload zone if no dataset */}
                {!analysisResult && (
                  <div className="space-y-6">
                    {/* Soft Pastel Blue Hero Banner */}
                    <div className="bg-white rounded-[24px] p-8 sm:p-12 text-center relative overflow-hidden border border-[#E2EAF5] shadow-[0_12px_36px_rgba(57,135,232,0.07)]">
                      <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF3FF] border border-[#DCEBFF] text-xs font-bold text-[#3987E8] mb-4">
                        <Sparkles className="w-3.5 h-3.5 text-[#3987E8]" />
                        <span>Automated AI Data Pipeline & Outlier Detection</span>
                      </div>

                      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#26364D] max-w-3xl mx-auto leading-tight">
                        Intelligent Data. <span className="text-[#3987E8]">Detect the Unexpected.</span>
                      </h1>

                      <p className="text-sm sm:text-base text-[#7C8DA5] max-w-2xl mx-auto mt-4 leading-relaxed font-normal">
                        Universal schema-agnostic CSV platform. Profiles distributions, executes statistical and machine learning anomaly detectors, and explains every outlier with mathematical clarity.
                      </p>
                    </div>

                    {/* Prominent Upload Card */}
                    <LiquidUpload
                      onFileSelect={handleFileSelect}
                      onLoadSample={handleLoadSample}
                      onReset={handleReset}
                      currentFile={currentFile}
                      metadata={analysisResult?.metadata}
                      isLoading={isLoading}
                      stages={analysisResult?.pipeline_stages}
                      currentActiveStage={activeStageIndex}
                    />
                  </div>
                )}

                {/* Analysis Results View */}
                {analysisResult && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Recommendation Banner */}
                    {analysisResult.detection?.auto_reasons?.length > 0 && (
                      <div className="bg-white rounded-[20px] p-4.5 border border-[#E2EAF5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_16px_rgba(57,135,232,0.05)]">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-9 h-9 rounded-2xl bg-[#EAF3FF] border border-[#DCEBFF] flex items-center justify-center text-[#3987E8] shrink-0">
                            <Cpu className="w-4.5 h-4.5 text-[#3987E8]" />
                          </div>
                          <div>
                            <span className="font-bold text-[#26364D] text-xs block">
                              Autonomous Model Selection:{' '}
                              <span className="text-[#3987E8]">{analysisResult.detection.selected_method_name}</span>
                            </span>
                            <span className="text-[11px] text-[#7C8DA5] leading-snug">
                              {analysisResult.detection.auto_reasons.join(' ')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSettingsOpen(true)}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#F4F8FF] hover:bg-[#EAF3FF] border border-[#E2EAF5] text-xs font-bold text-[#3987E8] cursor-pointer shrink-0 transition"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#3987E8]" />
                          <span>Configure Model</span>
                        </button>
                      </div>
                    )}

                    {/* Statistics Cards */}
                    <StatisticsCards
                      metadata={analysisResult.metadata}
                      profiling={analysisResult.profiling}
                      detection={analysisResult.detection}
                    />

                    {/* Visual Analytics */}
                    <Visualizations
                      charts={analysisResult.charts}
                      comparison={analysisResult.detection?.comparison}
                    />

                    {/* Anomaly Results Table */}
                    <AnomalyTable anomalies={analysisResult.anomalies} />

                    {/* Export Station */}
                    <ExportPanel
                      sessionId={analysisResult.session_id}
                      filename={analysisResult.metadata?.filename || 'dataset.csv'}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: UPLOAD DATASET */}
            {activeTab === 'upload' && (
              <motion.div
                key="tab-upload"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                      <Database className="w-5 h-5 text-[#3987E8]" />
                      <span>Dataset Ingestion Station</span>
                    </h2>
                    <p className="text-xs text-[#7C8DA5] mt-0.5">
                      Stream any CSV dataset into the automated anomaly detection pipeline.
                    </p>
                  </div>
                  {analysisResult && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl bg-[#FFF0F2] hover:bg-[#FFE0E4] border border-[#FED7DC] text-[#E87583] text-xs font-bold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Dataset</span>
                    </button>
                  )}
                </div>

                <LiquidUpload
                  onFileSelect={handleFileSelect}
                  onLoadSample={handleLoadSample}
                  onReset={handleReset}
                  currentFile={currentFile}
                  metadata={analysisResult?.metadata}
                  isLoading={isLoading}
                  stages={analysisResult?.pipeline_stages}
                  currentActiveStage={activeStageIndex}
                />
              </motion.div>
            )}

            {/* TAB 3: DATA ANALYSIS */}
            {activeTab === 'analysis' && (
              <motion.div
                key="tab-analysis"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {analysisResult ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-[#3987E8]" />
                          <span>Statistical Data Profiling</span>
                        </h2>
                        <p className="text-xs text-[#7C8DA5] mt-0.5">
                          Automated type detection, distribution metrics, and feature summaries.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProfilingOpen(true)}
                        className="px-4 py-2 rounded-2xl bg-[#3987E8] text-white text-xs font-bold hover:bg-[#2E75D3] cursor-pointer shadow-xs transition"
                      >
                        Open Profiling Drawer
                      </button>
                    </div>

                    <StatisticsCards
                      metadata={analysisResult.metadata}
                      profiling={analysisResult.profiling}
                      detection={analysisResult.detection}
                    />

                    <Visualizations
                      charts={analysisResult.charts}
                      comparison={analysisResult.detection?.comparison}
                    />
                  </>
                ) : (
                  <div className="bg-white rounded-[24px] p-12 text-center border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
                    <BarChart3 className="w-12 h-12 text-[#7C8DA5] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#26364D]">No Dataset Ingested</h3>
                    <p className="text-xs text-[#7C8DA5] mt-1 max-w-sm mx-auto">
                      Upload a CSV file or select a benchmark dataset to inspect statistical profiling.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase cursor-pointer shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition"
                    >
                      Go to Upload
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 4: ANOMALY DETECTION */}
            {activeTab === 'detection' && (
              <motion.div
                key="tab-detection"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {analysisResult ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                          <Radar className="w-5 h-5 text-[#3987E8]" />
                          <span>Anomaly Detection Models</span>
                        </h2>
                        <p className="text-xs text-[#7C8DA5] mt-0.5">
                          Benchmark algorithms, view outlier coverage, and adjust model parameters.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 rounded-2xl bg-[#EAF3FF] hover:bg-[#DCEBFF] border border-[#DCEBFF] text-xs font-bold text-[#3987E8] cursor-pointer transition"
                      >
                        Model Settings
                      </button>
                    </div>

                    <Visualizations
                      charts={analysisResult.charts}
                      comparison={analysisResult.detection?.comparison}
                    />

                    <AnomalyTable anomalies={analysisResult.anomalies} />
                  </>
                ) : (
                  <div className="bg-white rounded-[24px] p-12 text-center border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
                    <Radar className="w-12 h-12 text-[#7C8DA5] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#26364D]">Detection Engine Standby</h3>
                    <p className="text-xs text-[#7C8DA5] mt-1 max-w-sm mx-auto">
                      Upload a dataset to run statistical and machine learning anomaly detection.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase cursor-pointer shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition"
                    >
                      Upload CSV
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 5: EXPLANATIONS */}
            {activeTab === 'explanations' && (
              <motion.div
                key="tab-explanations"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {analysisResult ? (
                  <>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-[#E9AC52]" />
                        <span>Deterministic Anomaly Explanations</span>
                      </h2>
                      <p className="text-xs text-[#7C8DA5] mt-0.5">
                        Statistically grounded natural language explanations generated for each outlier row.
                      </p>
                    </div>

                    <AnomalyTable anomalies={analysisResult.anomalies} />
                  </>
                ) : (
                  <div className="bg-white rounded-[24px] p-12 text-center border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
                    <Lightbulb className="w-12 h-12 text-[#7C8DA5] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#26364D]">No Explanations Available</h3>
                    <p className="text-xs text-[#7C8DA5] mt-1 max-w-sm mx-auto">
                      Upload a dataset to uncover and explain outlier records.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase cursor-pointer shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition"
                    >
                      Upload CSV
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 6: REPORTS */}
            {activeTab === 'reports' && (
              <motion.div
                key="tab-reports"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {analysisResult ? (
                  <>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#26364D] tracking-tight flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-[#45B88A]" />
                        <span>Audit Reports & Data Exports</span>
                      </h2>
                      <p className="text-xs text-[#7C8DA5] mt-0.5">
                        Download executive PDF reports and sanitized CSV datasets.
                      </p>
                    </div>

                    <ExportPanel
                      sessionId={analysisResult.session_id}
                      filename={analysisResult.metadata?.filename || 'dataset.csv'}
                    />
                  </>
                ) : (
                  <div className="bg-white rounded-[24px] p-12 text-center border border-[#E2EAF5] shadow-[0_8px_24px_rgba(57,135,232,0.06)]">
                    <FileSpreadsheet className="w-12 h-12 text-[#7C8DA5] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#26364D]">No Active Report Session</h3>
                    <p className="text-xs text-[#7C8DA5] mt-1 max-w-sm mx-auto">
                      Process a CSV file to generate an executive audit PDF and export data.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-6 py-2.5 rounded-2xl bg-[#3987E8] hover:bg-[#2E75D3] text-white font-bold text-xs uppercase cursor-pointer shadow-[0_4px_14px_rgba(57,135,232,0.3)] transition"
                    >
                      Upload CSV
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </main>

          {/* Clean Pastel Footer */}
          <footer className="mt-auto py-5 px-6 bg-white rounded-3xl border border-[#E2EAF5] shadow-[0_4px_16px_rgba(57,135,232,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7C8DA5] select-none">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#3987E8]" />
              <span className="text-[#26364D] font-bold">ANOMALY DETECTOR</span>
              <span>•</span>
              <span>Intelligent Data Analysis Workspace</span>
            </div>
            <div className="font-mono text-[11px] text-[#7C8DA5]">
              FastAPI • Scikit-learn • Pandas • React • Tailwind CSS
            </div>
          </footer>
        </div>
      </div>

      {/* Global Modals & Drawers */}
      <DataPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        rawPreview={analysisResult?.raw_preview || []}
        columns={analysisResult?.metadata?.columns || []}
        filename={analysisResult?.metadata?.filename || 'dataset.csv'}
      />

      <ProfilingDrawer
        isOpen={isProfilingOpen}
        onClose={() => setIsProfilingOpen(false)}
        profiling={analysisResult?.profiling}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
        contamination={contamination}
        setContamination={setContamination}
        onApply={handleApplySettings}
      />
    </div>
  );
}
