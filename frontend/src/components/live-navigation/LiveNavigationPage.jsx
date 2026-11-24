import React, { useState, useEffect } from 'react';
import {
  Compass,
  Activity,
  Satellite,
  Layers,
  Zap,
  Sliders,
  BarChart3,
  History,
  FileText,
  ArrowLeft,
  LayoutDashboard,
  Wifi,
  WifiOff,
  Menu,
  X,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import GpsSignalLossDemoTab from './tabs/GpsSignalLossDemoTab';
import OverviewTab from './tabs/OverviewTab';
import LiveSimulatorTab from './tabs/LiveSimulatorTab';
import WhatIfLabTab from './tabs/WhatIfLabTab';
import AlgorithmComparisonLabTab from './tabs/AlgorithmComparisonLabTab';
import ExperimentHistoryTab from './tabs/ExperimentHistoryTab';
import ReportGeneratorTab from './tabs/ReportGeneratorTab';
import EngineeringIntelligenceCoreTab from './intelligence/EngineeringIntelligenceCoreTab';
import VyraBot from './VyraBot';

const INITIAL_HISTORY = [
  {
    id: 'EXP-HIST-001',
    timestamp: '2026-11-20 14:32:10 UTC',
    scenario: 'Nominal Highway Drive (V-S3a)',
    mode: 'HYBRID',
    outageDuration: 0,
    error: 0.398,
    cost: 0.42,
  },
  {
    id: 'EXP-HIST-002',
    timestamp: '2026-11-21 09:15:44 UTC',
    scenario: 'Urban Canyon Multipath (5s Outage)',
    mode: 'HYBRID',
    outageDuration: 5.0,
    error: 0.745,
    cost: 1.12,
  },
  {
    id: 'EXP-HIST-003',
    timestamp: '2026-11-21 16:48:22 UTC',
    scenario: 'Tunnel RF Jamming (20s Outage)',
    mode: 'DR',
    outageDuration: 20.0,
    error: 1.842,
    cost: 2.35,
  },
];

export default function LiveNavigationPage({
  telemetry,
  pathsData,
  isConnected,
  onBackToLanding,
  onLaunchPrototype,
}) {
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' (default landing!), 'simulator', 'what-if', 'comparison', 'overview', 'history', 'reports'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeReportRun, setActiveReportRun] = useState(null);

  // Local storage history state
  const [historyList, setHistoryList] = useState(() => {
    try {
      const stored = localStorage.getItem('vyra_live_history');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY;
  });

  const saveHistory = (newHistory) => {
    setHistoryList(newHistory);
    try {
      localStorage.setItem('vyra_live_history', JSON.stringify(newHistory));
    } catch {
      // ignore
    }
  };

  const recordNewRun = (runData) => {
    const newRun = {
      id: `EXP-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      scenario: runData.scenario || 'Interactive Outage Stress',
      mode: runData.mode || 'HYBRID',
      outageDuration: runData.outageDuration || 0,
      error: runData.error || 0.42,
      cost: runData.cost,
    };
    saveHistory([newRun, ...historyList.slice(0, 49)]);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleGenerateReportFromRun = (run) => {
    setActiveReportRun(run);
    setActiveTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navTabs = [
    { id: 'demo', label: 'Live GPS Loss Demo', icon: ShieldAlert },
    { id: 'intelligence', label: 'Intelligence Core', icon: Cpu },
    { id: 'simulator', label: 'Advanced Simulator', icon: Zap },
    { id: 'what-if', label: 'What-If Scenario Lab', icon: Sliders },
    { id: 'comparison', label: 'Algorithm Comparison', icon: BarChart3 },
    { id: 'overview', label: 'Technical Regimes', icon: Layers },
    { id: 'history', label: 'Experiment History', icon: History },
    { id: 'reports', label: 'Report Generator', icon: FileText },
  ];

  const currentMode = telemetry?.selected_mode || 'HYBRID';

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Dedicated Live Navigation Header */}
      <header className="bg-[#080d1a]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-2xl">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Navigation Hop Buttons & Logo */}
          <div className="flex items-center gap-3 sm:gap-5">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                title="Return to 3D Overview"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">3D Overview</span>
              </button>
            )}

            {onLaunchPrototype && (
              <button
                onClick={onLaunchPrototype}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                title="Open 10 Hz Replay Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Replay Dashboard</span>
              </button>
            )}

            {/* Official Branding */}
            <div className="flex items-center gap-3 pl-1 sm:pl-3 sm:border-l sm:border-slate-800">
              <img
                src="/vyra-logo.png"
                alt="VYRA Logo"
                className="h-8 sm:h-9 w-auto object-contain filter drop-shadow"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold font-mono text-white tracking-tight">
                    LIVE NAVIGATION
                  </h1>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                    CONTROL CENTER
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono tracking-wider hidden sm:block">
                  Adaptive GNSS / Dead Reckoning Suite
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Mode Badge & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            {/* Real-time Active Mode Indicator */}
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-lg ${
                currentMode === 'DR'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                  : currentMode === 'GNSS'
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-sky-500/10'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
              }`}
            >
              {currentMode === 'DR' ? (
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              ) : currentMode === 'GNSS' ? (
                <Satellite className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>MODE: {currentMode}</span>
            </div>

            {/* Connection Status */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300">FastAPI Live</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-300">Stand-Alone</span>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 2. Horizontal Tab Navigation Bar (Desktop & Tablet) */}
        <div className="max-w-[1720px] mx-auto mt-3 hidden md:flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/80">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Tab Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 border-t border-slate-800/80 mt-3 grid grid-cols-2 gap-2">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <div className="col-span-2 pt-2 flex justify-between gap-2">
              <button
                onClick={onBackToLanding}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono border border-slate-800"
              >
                3D Overview
              </button>
              <button
                onClick={onLaunchPrototype}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-cyan-300 text-xs font-mono border border-slate-800"
              >
                Replay Dashboard
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 3. Main Demonstration View Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {activeTab === 'demo' && (
          <GpsSignalLossDemoTab
            globalTelemetry={telemetry}
            pathsData={pathsData}
            onRecordHistory={recordNewRun}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenIntelligence={() => setActiveTab('intelligence')}
          />
        )}
        {activeTab === 'intelligence' && (
          <EngineeringIntelligenceCoreTab
            globalTelemetry={telemetry}
            pathsData={pathsData}
            onRecordHistory={recordNewRun}
          />
        )}
        {activeTab === 'overview' && (
          <OverviewTab telemetry={telemetry} onSelectTab={(t) => setActiveTab(t)} />
        )}
        {activeTab === 'simulator' && (
          <LiveSimulatorTab
            globalTelemetry={telemetry}
            pathsData={pathsData}
            onRecordHistory={recordNewRun}
          />
        )}
        {activeTab === 'what-if' && (
          <WhatIfLabTab onRecordHistory={recordNewRun} />
        )}
        {activeTab === 'comparison' && (
          <AlgorithmComparisonLabTab />
        )}
        {activeTab === 'history' && (
          <ExperimentHistoryTab
            historyList={historyList}
            onClearHistory={handleClearHistory}
            onGenerateReportFromRun={handleGenerateReportFromRun}
          />
        )}
        {activeTab === 'reports' && (
          <ReportGeneratorTab activeExperiment={activeReportRun} />
        )}
      </main>

      {/* 4. Project-Aware Floating AI Chatbot (Accessible throughout Live Navigation) */}
      <VyraBot currentTelemetry={telemetry} activeScenario={activeTab.toUpperCase()} />
    </div>
  );
}
