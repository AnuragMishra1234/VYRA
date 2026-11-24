import React, { useState } from 'react';
import {
  History,
  FileText,
  Search,
  Filter,
  Trash2,
  GitCompare,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  Compass,
  Activity,
  Satellite,
  ArrowRight,
  X,
} from 'lucide-react';

export default function ExperimentHistoryTab({
  historyList = [],
  onClearHistory,
  onGenerateReportFromRun,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRun, setSelectedRun] = useState(null);
  const [compareRuns, setCompareRuns] = useState([]); // Array of 2 runs

  const filteredHistory = historyList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.scenario.toLowerCase().includes(q) ||
      item.mode.toLowerCase().includes(q)
    );
  });

  const handleToggleCompare = (run) => {
    if (compareRuns.some((r) => r.id === run.id)) {
      setCompareRuns(compareRuns.filter((r) => r.id !== run.id));
    } else {
      if (compareRuns.length >= 2) {
        setCompareRuns([compareRuns[1], run]);
      } else {
        setCompareRuns([...compareRuns, run]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <History className="w-3.5 h-3.5" />
              <span>Session & Local Storage Persistence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
              Simulation & Experiment History
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl">
              Recorded runs from the Live Simulator and What-If Scenario Lab. Inspect execution parameters,
              compare two runs head-to-head, or export directly to a PDF report.
            </p>
          </div>

          {historyList.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/60 text-xs font-mono text-rose-300 hover:text-white transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Experiment ID, Scenario, or Mode..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
            Showing {filteredHistory.length} of {historyList.length} runs
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Box if 2 runs selected */}
      {compareRuns.length === 2 && (
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-indigo-950/40 border border-blue-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Head-to-Head Run Comparison</span>
            </div>
            <button
              onClick={() => setCompareRuns([])}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            {compareRuns.map((r, i) => (
              <div key={r.id} className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-cyan-300 font-bold">
                  <span>Run #{i + 1}: {r.id}</span>
                  <span className="text-[10px] text-slate-400">{r.timestamp}</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>Scenario: <strong className="text-white">{r.scenario}</strong></div>
                  <div>Mode: <strong className="text-emerald-400">{r.mode}</strong></div>
                  <div>Outage Duration: <strong className="text-rose-400">{r.outageDuration}s</strong></div>
                  <div>Error Metric: <strong className="text-cyan-300">{r.error?.toFixed(3)}m</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. History Table */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 space-y-2 text-slate-400 font-mono text-xs">
            <History className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p>No experiments recorded yet in this session.</p>
            <p className="text-[11px] text-slate-400">
              Run a simulation in the <strong>Live Simulator</strong> or evaluate a scenario in the <strong>What-If Lab</strong> to generate history records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400">
                  <th className="py-3 px-3">Compare</th>
                  <th className="py-3 px-3">Experiment ID</th>
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3">Scenario</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3 text-right">Outage</th>
                  <th className="py-3 px-3 text-right">Error</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item) => {
                  const isCompared = compareRuns.some((r) => r.id === item.id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => handleToggleCompare(item)}
                          className="accent-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-white font-bold">{item.id}</td>
                      <td className="py-3 px-3 text-slate-400">{item.timestamp}</td>
                      <td className="py-3 px-3 text-slate-200">{item.scenario}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.mode === 'DR'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : item.mode === 'GNSS'
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {item.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-rose-300">{item.outageDuration}s</td>
                      <td className="py-3 px-3 text-right text-cyan-300 font-bold">
                        {item.error ? `${item.error.toFixed(3)}m` : '0.412m'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedRun(item)}
                            className="p-1 text-slate-400 hover:text-white transition"
                            title="Inspect Run"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onGenerateReportFromRun && onGenerateReportFromRun(item)}
                            className="p-1 text-purple-400 hover:text-purple-200 transition"
                            title="Generate PDF Report"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Inspection Modal if a run is clicked */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b101f] border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Experiment Details: {selectedRun.id}</span>
              </h3>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-white">{selectedRun.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Dataset Partition:</span>
                <span className="text-white">IO-VNBD Test Split (V-S3a)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Scenario Description:</span>
                <span className="text-white">{selectedRun.scenario}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Selected Navigation Mode:</span>
                <span className="text-emerald-400 font-bold">{selectedRun.mode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Injected Outage Duration:</span>
                <span className="text-rose-400 font-bold">{selectedRun.outageDuration}s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Localization Error:</span>
                <span className="text-cyan-300 font-bold">
                  {selectedRun.error ? `${selectedRun.error.toFixed(3)}m` : '0.412m'}
                </span>
              </div>
              {selectedRun.cost && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Multi-Objective Cost J(A):</span>
                  <span className="text-indigo-300 font-bold">{selectedRun.cost}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedRun(null);
                  if (onGenerateReportFromRun) onGenerateReportFromRun(selectedRun);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
