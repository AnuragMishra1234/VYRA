import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Sliders,
  RotateCcw,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Navigation,
} from 'lucide-react';
import DecisionIntelligencePanel from './DecisionIntelligencePanel';
import FaultInjectionLabPanel from './FaultInjectionLabPanel';
import DeterministicReplayPanel from './DeterministicReplayPanel';
import ValidationReliabilityPanel from './ValidationReliabilityPanel';
import EngineeringInsightsPanel from './EngineeringInsightsPanel';
import {
  fetchFaultCatalog,
  runFaultExperiment,
  replayFaultExperiment,
  fetchDecisionInspection,
} from '../../../services/api';

const WALKTHROUGH_STEPS = [
  { step: 1, title: 'Open Showcase', desc: 'Inspect current vehicle kinematics & active multi-sensor telemetry.' },
  { step: 2, title: 'Select Fault', desc: 'Choose one of 6 real degradation models (e.g. Multipath Jitter or GPS Loss).' },
  { step: 3, title: 'Inject Fault', desc: 'Click "Inject Fault" to run the genuine navigation & EKF/DR filter pipeline.' },
  { step: 4, title: 'Inspect Decision', desc: 'Click any epoch in the Decision Timeline to inspect J(A) candidate costs.' },
  { step: 5, title: 'Automated Audits', desc: 'Check the 8 automated system reliability & stability audit checks.' },
  { step: 6, title: 'Verify Determinism', desc: 'Click "Replay Experiment" to verify 100% bitwise concordance & Δ-ATE=0.0m.' },
  { step: 7, title: 'Review Insights', desc: 'Read the synthesized 5-part engineering report for technical defense.' },
];

export default function EngineeringIntelligenceCoreTab({
  globalTelemetry,
  pathsData,
  onRecordHistory,
}) {
  const [activeSubTab, setActiveSubTab] = useState('decision'); // 'decision', 'lab', 'replay', 'validation', 'insights'
  const [faultCatalog, setFaultCatalog] = useState([]);
  const [experimentConfig, setExperimentConfig] = useState({
    fault_type: 'COMPLETE_GPS_LOSS',
    severity: 'CRITICAL',
    duration_s: 8.0,
    start_epoch: 30,
    slice_count: 140,
    seed: 42,
    error_threshold_m: 5.0,
    prediction_horizon_s: 3.0,
    enforce_dwell: true,
  });
  const [experimentResult, setExperimentResult] = useState(null);
  const [replayResult, setReplayResult] = useState(null);
  const [selectedEpochIndex, setSelectedEpochIndex] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Load catalog on mount & run initial baseline experiment
  useEffect(() => {
    let mounted = true;
    async function init() {
      const cat = await fetchFaultCatalog();
      if (mounted && cat?.faults) {
        setFaultCatalog(cat.faults);
      }
      // Run initial baseline
      const res = await runFaultExperiment(experimentConfig);
      if (mounted && res && !res.error) {
        setExperimentResult(res);
        if (res.epochs?.length > 25) {
          setSelectedEpochIndex(25);
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Run experiment handler
  const handleRunExperiment = async () => {
    setIsRunning(true);
    setReplayResult(null); // Clear previous replay
    try {
      const res = await runFaultExperiment(experimentConfig);
      if (res && !res.error) {
        setExperimentResult(res);
        // Find first fault epoch to inspect
        const faultIdx = res.epochs?.findIndex((e) => e.is_fault_active);
        setSelectedEpochIndex(faultIdx !== -1 ? faultIdx : 20);

        if (onRecordHistory) {
          onRecordHistory({
            scenario: `Intelligence Core: ${experimentConfig.fault_type}`,
            mode: res.summary_metrics?.mode_distribution?.DR_epochs > 0 ? 'DR' : 'HYBRID',
            outageDuration: experimentConfig.duration_s,
            error: res.summary_metrics?.vyra_ate_m,
            cost: res.summary_metrics?.ate_reduction_vs_gps_pct,
          });
        }
      }
    } catch (err) {
      console.error('Failed to run experiment:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Replay experiment handler
  const handleReplayExperiment = async () => {
    if (!experimentResult) return;
    setIsReplaying(true);
    try {
      const res = await replayFaultExperiment(
        experimentResult.experiment_id,
        experimentResult.config
      );
      if (res && res.status === 'SUCCESS') {
        setReplayResult(res);
      }
    } catch (err) {
      console.error('Failed to replay experiment:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const summary = experimentResult?.summary_metrics || {};
  const activeEpoch = experimentResult?.epochs?.[selectedEpochIndex] || null;
  const currentMode = activeEpoch?.selected_mode || 'HYBRID';

  const subTabs = [
    { id: 'decision', label: '1. Decision Intelligence', icon: Activity, tag: 'FEATURE A' },
    { id: 'lab', label: '2. Fault Injection Lab', icon: Zap, tag: 'FEATURE B' },
    { id: 'replay', label: '3. Deterministic Replay', icon: RotateCcw, tag: 'FEATURE C' },
    { id: 'validation', label: '4. System Validation (8 Checks)', icon: ShieldCheck, tag: 'FEATURE D' },
    { id: 'insights', label: '5. Engineering Insights', icon: FileText, tag: 'FEATURE E' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Signature Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1328] via-[#080d1e] to-[#040814] border border-blue-500/30 p-6 sm:p-8 shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                SIGNATURE ENGINEERING SHOWCASE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800">
                10 Hz Real-Time Execution
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-800">
                IEEE 754 Deterministic
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-mono tracking-tight text-white">
              VYRA ENGINEERING INTELLIGENCE CORE
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-sans">
              A real-time systems engineering laboratory revealing how VYRA evaluates candidate risks{' '}
              <span className="font-mono text-cyan-300">$J(A)$</span>, detects sensor failures, executes
              anti-chattering mode handovers, and verifies future forecast fidelity against ground truth.
            </p>
          </div>

          {/* Quick Action Walkthrough Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setWalkthroughOpen(!walkthroughOpen)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 transition shadow-lg"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>3-MIN EXAMINER DEMO FLOW</span>
            </button>

            <button
              onClick={handleRunExperiment}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/30"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'RUNNING...' : 'INJECT & RUN'}</span>
            </button>
          </div>
        </div>

        {/* Walkthrough Drawer if toggled */}
        {walkthroughOpen && (
          <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 bg-slate-950/60 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                3-MINUTE LIVE EXAMINER WALKTHROUGH CHECKLIST
              </span>
              <button
                onClick={() => setWalkthroughOpen(false)}
                className="text-[11px] font-mono text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono text-xs">
              {WALKTHROUGH_STEPS.map((s) => (
                <div key={s.step} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-[10px] text-cyan-400 font-bold mb-0.5">STEP {s.step}</div>
                  <div className="font-bold text-white text-[11px] mb-1">{s.title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Top Summary Metric Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 font-mono text-xs">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">CURRENT MODE</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentMode === 'DR'
                    ? 'bg-amber-400 animate-pulse'
                    : currentMode === 'GNSS'
                    ? 'bg-sky-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="text-base font-bold text-white">{currentMode}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">VYRA ATE</span>
            <span className="text-base font-bold text-emerald-400 mt-1 block">
              {summary.vyra_ate_m !== undefined ? `${summary.vyra_ate_m} m` : '--'}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">ERROR REDUCTION VS GPS</span>
            <span className="text-base font-bold text-cyan-300 mt-1 block">
              {summary.ate_reduction_vs_gps_pct !== undefined ? `${summary.ate_reduction_vs_gps_pct}%` : '--'}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">PREDICTION ACCURACY</span>
            <span className="text-base font-bold text-white mt-1 block">
              {summary.mean_prediction_fidelity_pct !== undefined ? `${summary.mean_prediction_fidelity_pct}%` : '--'}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">AUDIT HEALTH</span>
            <span className="text-base font-bold text-emerald-400 mt-1 block">
              {experimentResult?.validation_suite?.health_score_pct !== undefined
                ? `${experimentResult.validation_suite.health_score_pct}% PASS`
                : '--'}
            </span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 block">DETERMINISM</span>
            <span className="text-base font-bold text-cyan-300 mt-1 block">
              {replayResult?.determinism_certified ? '100% VERIFIED' : 'READY TO AUDIT'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Segmented Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                  : 'bg-[#0b1329] text-slate-400 hover:text-white hover:bg-slate-900 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Active Sub-View Body */}
      <div>
        {activeSubTab === 'decision' && (
          <DecisionIntelligencePanel
            experimentData={experimentResult}
            selectedEpochIndex={selectedEpochIndex}
            onSelectEpoch={(idx) => setSelectedEpochIndex(idx)}
          />
        )}

        {activeSubTab === 'lab' && (
          <FaultInjectionLabPanel
            faultCatalog={faultCatalog}
            activeConfig={experimentConfig}
            onChangeConfig={(cfg) => setExperimentConfig(cfg)}
            onRunExperiment={handleRunExperiment}
            isRunning={isRunning}
            experimentResult={experimentResult}
          />
        )}

        {activeSubTab === 'replay' && (
          <DeterministicReplayPanel
            experimentResult={experimentResult}
            onReplay={handleReplayExperiment}
            isReplaying={isReplaying}
            replayResult={replayResult}
          />
        )}

        {activeSubTab === 'validation' && (
          <ValidationReliabilityPanel
            validationSuite={experimentResult?.validation_suite}
          />
        )}

        {activeSubTab === 'insights' && (
          <EngineeringInsightsPanel
            insights={experimentResult?.engineering_insights}
            summaryMetrics={summary}
          />
        )}
      </div>
    </div>
  );
}
