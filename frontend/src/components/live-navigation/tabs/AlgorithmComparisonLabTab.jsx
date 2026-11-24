import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Play,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Layers,
  Award,
  Zap,
  Info,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { fetchAlgorithmComparison } from '../../../services/api';

export default function AlgorithmComparisonLabTab() {
  const [selectedDataset, setSelectedDataset] = useState('V-S3a');
  const [selectedScenario, setSelectedScenario] = useState('all_outages');
  const [outageDurationFilter, setOutageDurationFilter] = useState(null); // null = all, or 2.0, 5.0, 10.0, 20.0, 30.0
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [activeMetricTab, setActiveMetricTab] = useState('ate'); // 'ate', 'rmse', 'max_error', 'time_above_5m', 'handovers'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleRunComparison();
  }, [outageDurationFilter]);

  const handleRunComparison = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAlgorithmComparison(selectedDataset, selectedScenario, outageDurationFilter);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to fetch comparison', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!comparisonData) return;
    const summary = `VYRA Multi-Policy Benchmark Comparison (Dataset: ${comparisonData.dataset})\n` +
      comparisonData.policies
        .map((p) => `${p.policy}: ATE=${p.ate_m}m, RMSE=${p.rmse_m}m, MaxErr=${p.max_error_m}m, Handovers=${p.handovers}`)
        .join('\n');
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const policies = comparisonData?.policies || [];

  // Determine max value for active metric for scaling bars
  const getMetricValue = (p, metricKey) => {
    switch (metricKey) {
      case 'ate':
        return p.ate_m;
      case 'rmse':
        return p.rmse_m;
      case 'max_error':
        return p.max_error_m;
      case 'time_above_5m':
        return p.time_above_5m_s;
      case 'handovers':
        return p.handovers;
      default:
        return p.ate_m;
    }
  };

  const maxMetricVal = Math.max(
    ...policies.map((p) => getMetricValue(p, activeMetricTab)),
    1.0
  );

  return (
    <div className="space-y-8">
      {/* 1. Header Card */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Standardized Multi-Policy Benchmark</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Algorithm Comparison Laboratory
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Compare 5 standardized navigation policies evaluated synchronously across the identical 24,621 epochs
              of held-out vehicle test trajectory (V-S3a).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition"
              title="Copy Benchmark Table"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Run Controls */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Outage Duration:</span>
            {[
              { label: 'All Durations', val: null },
              { label: '2s Outage', val: 2.0 },
              { label: '5s Outage', val: 5.0 },
              { label: '10s Outage', val: 10.0 },
              { label: '20s Outage', val: 20.0 },
              { label: '30s Outage', val: 30.0 },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setOutageDurationFilter(item.val)}
                className={`px-3 py-1.5 rounded-xl border transition ${
                  outageDurationFilter === item.val
                    ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md shadow-blue-600/30'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunComparison}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-blue-600/30 transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isLoading ? 'Executing Benchmark...' : 'RUN COMPARISON'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Finding Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-blue-950/40 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xl">
        <Award className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm font-sans text-slate-200 leading-relaxed">
          <strong className="text-emerald-400 font-mono uppercase mr-1.5">EMPIRICAL RESULT:</strong>
          {comparisonData?.key_finding}
        </div>
      </div>

      {/* 3. Interactive Bar Chart Comparison Deck */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Comparative Performance Chart</span>
          </h3>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {[
              { id: 'ate', label: 'ATE (m)' },
              { id: 'rmse', label: 'RMSE (m)' },
              { id: 'max_error', label: 'Max Error (m)' },
              { id: 'time_above_5m', label: 'Time > 5m (s)' },
              { id: 'handovers', label: 'Handovers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMetricTab(tab.id)}
                className={`px-3 py-1 rounded-lg transition ${
                  activeMetricTab === tab.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="space-y-4 pt-2 font-mono text-xs">
          {policies.map((p) => {
            const val = getMetricValue(p, activeMetricTab);
            const isVyra = p.policy.includes('VYRA');
            // Logarithmic or proportional bar scale
            const pct = Math.min(100, Math.max(3, (val / maxMetricVal) * 100));

            return (
              <div key={p.policy} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isVyra ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                      {p.policy}
                    </span>
                    {isVyra && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-sans">
                        PROPOSED
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${isVyra ? 'text-emerald-400 text-sm' : 'text-white'}`}>
                    {val.toFixed(2)} {activeMetricTab === 'handovers' ? '' : activeMetricTab === 'time_above_5m' ? 's' : 'm'}
                  </span>
                </div>

                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isVyra
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-md shadow-cyan-500/40'
                        : p.policy.includes('Reactive')
                        ? 'bg-indigo-500'
                        : p.policy.includes('Fixed')
                        ? 'bg-blue-500'
                        : p.policy.includes('GNSS')
                        ? 'bg-sky-400'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Complete Publication Metrics Table */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Table 1: Verified Publication Navigation Benchmark</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Held-Out Test Split (V-S3a)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                <th className="py-3 px-3">Policy Candidate</th>
                <th className="py-3 px-3 text-right">ATE (m)</th>
                <th className="py-3 px-3 text-right">RMSE (m)</th>
                <th className="py-3 px-3 text-right">Max Err (m)</th>
                <th className="py-3 px-3 text-right">Time &gt; 5m</th>
                <th className="py-3 px-3 text-right">Handovers</th>
                <th className="py-3 px-3 text-right">Chattering %</th>
                <th className="py-3 px-3 text-right">Mean Dwell</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policies.map((p) => {
                const isVyra = p.policy.includes('VYRA');
                return (
                  <tr
                    key={p.policy}
                    className={`transition ${
                      isVyra ? 'bg-blue-950/30 hover:bg-blue-900/30 font-semibold' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3 px-3 text-white flex items-center gap-2">
                      {isVyra && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                      <span>{p.policy}</span>
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${isVyra ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {p.ate_m.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{p.rmse_m.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{p.max_error_m.toFixed(2)}</td>
                    <td className={`py-3 px-3 text-right ${isVyra ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {p.time_above_5m_s.toFixed(1)}s
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">{p.handovers}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{p.chattering_pct.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right text-slate-300">{p.mean_dwell_s.toFixed(1)}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
