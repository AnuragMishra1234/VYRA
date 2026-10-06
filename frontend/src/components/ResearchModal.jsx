import React, { useState, useEffect } from 'react';
import { X, Table, Image, CheckCircle, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { fetchMasterResults, fetchFiguresCatalog } from '../services/api';

export default function ResearchModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('table1');
  const [masterResults, setMasterResults] = useState(null);
  const [figures, setFigures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFigure, setSelectedFigure] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [resultsData, figuresData] = await Promise.all([
          fetchMasterResults(),
          fetchFiguresCatalog(),
        ]);
        setMasterResults(resultsData);
        setFigures(figuresData);
      } catch (err) {
        console.error('Failed to load research data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const renderTable = (rows, columns) => {
    if (!rows || rows.length === 0) {
      return <div className="text-slate-500 py-6 text-center">No data available for this table.</div>;
    }

    return (
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-xs text-left text-slate-300">
          <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/90 border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 font-semibold tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {rows.map((row, idx) => {
              const isVyra = row['Policy'] === 'VYRA Adaptive (Proposed)' || row['Policy'] === 'VYRA (Proposed)' || row['Ablation Configuration'] === 'Full VYRA Adaptive';
              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 transition ${
                    isVyra ? 'bg-blue-950/20 font-semibold text-blue-200' : ''
                  }`}
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    const formatted = typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 4 }) : val;
                    return (
                      <td key={col.key} className="px-3 py-2 whitespace-nowrap">
                        {formatted}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                VYRA Research Evidence & Experimental Tables
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative precomputed results from Phase 5 benchmark on test split V-S3a
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs">
          {[
            { id: 'table1', label: 'Table 1: Main Benchmark' },
            { id: 'table2', label: 'Table 2: Outage Durations' },
            { id: 'table5', label: 'Table 5: Ablation Study' },
            { id: 'table7', label: 'Table 7: Statistical Significance' },
            { id: 'table8', label: 'Table 8: Failure Cases' },
            { id: 'figures', label: 'Publication Figures (16)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedFigure(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="py-20 text-center text-slate-400">Loading experimental results...</div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Failed to load results: {error}</span>
            </div>
          )}

          {!loading && !error && masterResults && (
            <>
              {/* Tab 1: Navigation Comparison */}
              {activeTab === 'table1' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200">
                      Table 1: Trajectory-Level Localization Performance & Stability Metrics
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Dataset Split: V-S3a</span>
                  </div>
                  {renderTable(masterResults.table1_navigation_comparison, [
                    { key: 'Policy', label: 'Navigation Policy' },
                    { key: 'ATE (m)', label: 'ATE (m)' },
                    { key: 'RTE (m)', label: 'RTE (m)' },
                    { key: 'RMSE (m)', label: 'RMSE (m)' },
                    { key: 'Max Error (m)', label: 'Max Error (m)' },
                    { key: 'Violations > 5m (%)', label: 'Violations > 5m (%)' },
                    { key: 'Handovers', label: 'Handovers' },
                    { key: 'Chattering Rate (%)', label: 'Chattering (%)' },
                    { key: 'Unnecessary Handovers', label: 'Unnecessary' },
                    { key: 'Mean Dwell (s)', label: 'Mean Dwell (s)' },
                  ])}
                  <div className="text-[11px] text-slate-500 italic mt-1">
                    Note: Ground truth trajectory serves as offline reference. Peak error across all policies is rigorously bounded.
                  </div>
                </div>
              )}

              {/* Tab 2: Outage Duration Sweep */}
              {activeTab === 'table2' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-200">
                    Table 2: Performance Stratified by Outage Duration (2s – 30s)
                  </h3>
                  {renderTable(masterResults.table2_outage_duration_sweep, [
                    { key: 'Outage Duration (s)', label: 'Duration (s)' },
                    { key: 'Policy', label: 'Policy' },
                    { key: 'Outage ATE (m)', label: 'Outage ATE (m)' },
                    { key: 'Outage RMSE (m)', label: 'Outage RMSE (m)' },
                    { key: 'Peak Error (m)', label: 'Peak Error (m)' },
                    { key: 'Violation Rate (%)', label: 'Violation Rate (%)' },
                  ])}
                </div>
              )}

              {/* Tab 5: Ablation Study */}
              {activeTab === 'table5' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-200">
                    Table 5: Component Ablation Study of VYRA Architecture
                  </h3>
                  {renderTable(masterResults.table5_ablation_study, [
                    { key: 'Ablation Configuration', label: 'Configuration' },
                    { key: 'ATE (m)', label: 'ATE (m)' },
                    { key: 'RMSE (m)', label: 'RMSE (m)' },
                    { key: 'Max Error (m)', label: 'Max Error (m)' },
                    { key: 'Violations > 5m (%)', label: 'Violations > 5m (%)' },
                    { key: 'Handovers', label: 'Handovers' },
                    { key: 'Chattering Rate (%)', label: 'Chattering (%)' },
                    { key: 'Unnecessary Handovers', label: 'Unnecessary' },
                  ])}
                </div>
              )}

              {/* Tab 7: Statistical Significance */}
              {activeTab === 'table7' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-200">
                    Table 7: Statistical Significance Tests & Effect Sizes vs Baselines
                  </h3>
                  {renderTable(masterResults.table7_statistical_significance, [
                    { key: 'Baseline Comparison', label: 'Baseline Comparison' },
                    { key: 'Sample Size N', label: 'N' },
                    { key: 'Mean Difference (m)', label: 'Mean Diff (m)' },
                    { key: '95% CI (m)', label: '95% CI (m)' },
                    { key: 'Wilcoxon W', label: 'Wilcoxon W' },
                    { key: 'p-value (Wilcoxon)', label: 'p-value' },
                    { key: "Cohen's d_z", label: "Cohen's d_z" },
                    { key: "Hedges' g", label: "Hedges' g" },
                    { key: 'Relative Improvement (%)', label: 'Rel. Improvement (%)' },
                    { key: 'Significant (p < 0.05)', label: 'Significant' },
                  ])}
                </div>
              )}

              {/* Tab 8: Failure Cases */}
              {activeTab === 'table8' && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-200">
                    Table 8: Documented Edge Cases & Root Cause Diagnostics (FAIL-01 to FAIL-05)
                  </h3>
                  {renderTable(masterResults.table8_failure_cases, [
                    { key: 'Failure Case ID', label: 'Case ID' },
                    { key: 'Timestamp (s)', label: 'Time (s)' },
                    { key: 'Scenario Phase', label: 'Scenario' },
                    { key: 'Selected Mode', label: 'Mode' },
                    { key: 'VYRA Error (m)', label: 'VYRA Err (m)' },
                    { key: 'Hybrid Error (m)', label: 'Hybrid Err (m)' },
                    { key: 'Forecasted DR Error (m)', label: 'FC DR (m)' },
                    { key: 'Forecasted HYBRID Error (m)', label: 'FC Hybrid (m)' },
                    { key: 'Root Cause Analysis', label: 'Root Cause Analysis' },
                  ])}
                </div>
              )}

              {/* Publication Figures Gallery */}
              {activeTab === 'figures' && (
                <div className="flex flex-col gap-4">
                  {selectedFigure ? (
                    <div className="flex flex-col gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-200">{selectedFigure.title}</h4>
                        <button
                          onClick={() => setSelectedFigure(null)}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          &larr; Back to Gallery
                        </button>
                      </div>
                      <div className="flex justify-center bg-black/60 rounded-lg p-2 border border-slate-800">
                        <img
                          src={selectedFigure.url}
                          alt={selectedFigure.title}
                          className="max-h-[600px] object-contain rounded"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {figures.map((fig) => (
                        <div
                          key={fig.id}
                          onClick={() => setSelectedFigure(fig)}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2 hover:border-blue-500 cursor-pointer transition flex flex-col gap-2 group"
                        >
                          <div className="h-32 bg-slate-900 rounded overflow-hidden flex items-center justify-center">
                            <img
                              src={fig.url}
                              alt={fig.title}
                              className="max-h-full max-w-full object-cover group-hover:scale-105 transition"
                            />
                          </div>
                          <div className="text-[11px] font-medium text-slate-300 truncate">
                            {fig.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
