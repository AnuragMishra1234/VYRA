import React, { useState, useEffect } from 'react';
import { Table, Award, ExternalLink, FileText, CheckCircle2, TrendingDown, ShieldCheck } from 'lucide-react';
import { fetchMasterResults } from '../../services/api';
import { FALLBACK_MASTER_RESULTS } from '../../services/fallbackData';

const numFixed = (val, digits = 3) =>
  typeof val === 'number' && !isNaN(val) ? val.toFixed(digits) : val != null ? String(val) : '—';

export default function ValidatedResultsSection({ onOpenResearchModal }) {
  const [activeTable, setActiveTable] = useState('table1');
  const [masterResults, setMasterResults] = useState(FALLBACK_MASTER_RESULTS);

  useEffect(() => {
    async function loadResults() {
      try {
        const master = await fetchMasterResults();
        if (master) {
          setMasterResults(master);
        }
      } catch (e) {
        // Fallback already pre-set
      }
    }
    loadResults();
  }, []);

  const table1 = masterResults?.table1_navigation_comparison || FALLBACK_MASTER_RESULTS.table1_navigation_comparison;
  const table2 = masterResults?.table2_outage_duration_sweep || FALLBACK_MASTER_RESULTS.table2_outage_duration_sweep;
  const table5 = masterResults?.table5_ablation_study || FALLBACK_MASTER_RESULTS.table5_ablation_study;
  const table7 = masterResults?.table7_statistical_significance || FALLBACK_MASTER_RESULTS.table7_statistical_significance;

  return (
    <section id="results" className="py-24 bg-[#080d18] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 tracking-widest mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>Empirical Validation &amp; Statistical Significance</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Validated Results. <br />
            <span className="text-slate-400">Zero Synthetic Claims.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            Rigorous experimental benchmark on held-out test split <strong className="text-slate-200">V-S3a</strong> (24,621 epochs, 2,462.0 s drive)
            under 20 controlled software degradation sweeps (2.0s – 30.0s).
          </p>
        </div>

        {/* Highlighted Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#0b101d] border border-blue-500/40 rounded-xl p-4 text-left shadow-lg ring-1 ring-blue-500/20">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">VYRA ATE</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">0.399 m</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">vs 0.712 m Reactive (-44.0%)</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Peak Outage Error</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">12.75 m</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">vs 21.26 m Reactive (-40.0%)</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Chattering Rate</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">0.0 %</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">16 Stable Handovers</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Wilcoxon p-value</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">2.00e-06</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Effect Size dz = 0.91 (Large)</div>
          </div>
        </div>

        {/* Table Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[
            { id: 'table1', label: 'Table 1: Primary Navigation Comparison' },
            { id: 'table2', label: 'Table 2: Outage Duration Sweep (2s - 30s)' },
            { id: 'table5', label: 'Table 5: Component Ablation Study' },
            { id: 'table7', label: 'Table 7: Statistical Significance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTable(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                activeTable === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Primary Benchmark Container */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden mb-8">
          {activeTable === 'table1' && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-400" />
                  <h3 className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Table 1: Trajectory-Level Localization Performance (V-S3a, 24,621 Epochs)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Dual-Antenna RTK Reference Ground Truth
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Policy</th>
                      <th className="py-2.5 px-3">ATE (m)</th>
                      <th className="py-2.5 px-3">RMSE (m)</th>
                      <th className="py-2.5 px-3">Max Error (m)</th>
                      <th className="py-2.5 px-3">Violations &gt; 5m (%)</th>
                      <th className="py-2.5 px-3">Handovers</th>
                      <th className="py-2.5 px-3">Chattering (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {table1.map((row, idx) => {
                      const isVyra = row['Policy'] && row['Policy'].includes('VYRA');
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/40 transition ${
                            isVyra ? 'bg-blue-950/30 text-white font-bold border-l-2 border-blue-500' : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            {row['Policy']}{' '}
                            {isVyra && <span className="text-[9px] text-cyan-400 ml-1 font-semibold">(PROPOSED)</span>}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['ATE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['RMSE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Max Error (m)'], 2)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Violations > 5m (%)'], 2)}%</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row['Handovers'] ?? '—'}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Chattering Rate (%)'], 1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTable === 'table2' && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-amber-400" />
                  <h3 className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Table 2: Error Drift Scaling Across Outage Durations T (2.0s to 30.0s)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  20 Cyclic Outage Sweeps
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Duration T</th>
                      <th className="py-2.5 px-3">Policy</th>
                      <th className="py-2.5 px-3">Outage ATE (m)</th>
                      <th className="py-2.5 px-3">Outage RMSE (m)</th>
                      <th className="py-2.5 px-3">Peak Error (m)</th>
                      <th className="py-2.5 px-3">Violations &gt; 5m (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {table2.map((row, idx) => {
                      const isVyra = row['Policy'] && row['Policy'].includes('VYRA');
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/40 transition ${
                            isVyra ? 'bg-blue-950/30 text-white font-bold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap font-bold text-cyan-400">{row['Duration T (s)'] ?? row['Duration T'] ?? '—'}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row['Policy']}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Outage ATE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Outage RMSE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Peak Error (m)'], 2)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Violations > 5m (%)'], 1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTable === 'table5' && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-purple-400" />
                  <h3 className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Table 5: Systematic Component Ablation Study (7 Configurations)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Zero Synthetic Claims
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Configuration</th>
                      <th className="py-2.5 px-3">ATE (m)</th>
                      <th className="py-2.5 px-3">RMSE (m)</th>
                      <th className="py-2.5 px-3">Max Error (m)</th>
                      <th className="py-2.5 px-3">Violations &gt; 5m (%)</th>
                      <th className="py-2.5 px-3">Handovers</th>
                      <th className="py-2.5 px-3">Unnecessary Handovers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {table5.map((row, idx) => {
                      const isFull = row['Ablation Configuration'] && row['Ablation Configuration'].includes('Full VYRA');
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-800/40 transition ${
                            isFull ? 'bg-blue-950/30 text-white font-bold border-l-2 border-blue-500' : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap">{row['Ablation Configuration']}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['ATE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['RMSE (m)'], 3)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Max Error (m)'], 2)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Violations > 5m (%)'], 2)}%</td>
                          <td className="py-2 px-3 whitespace-nowrap">{row['Handovers'] ?? '—'}</td>
                          <td className="py-2 px-3 whitespace-nowrap font-bold text-amber-400">{row['Unnecessary Handovers'] ?? '0'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTable === 'table7' && (
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Table 7: Statistical Significance &amp; Standardized Effect Sizes
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Paired Non-Parametric Wilcoxon Signed-Rank Test (N = 20)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-400 bg-slate-950/80 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Baseline Comparison</th>
                      <th className="py-2.5 px-3">Mean Difference (m)</th>
                      <th className="py-2.5 px-3">95% Confidence Interval</th>
                      <th className="py-2.5 px-3">Wilcoxon p-value</th>
                      <th className="py-2.5 px-3">Cohen's d_z</th>
                      <th className="py-2.5 px-3">Significant (p &lt; 0.05)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {table7.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-200">{row['Baseline Comparison']}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-cyan-400">{numFixed(row['Mean Difference (m)'], 2)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{row['95% CI (m)']}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-bold text-emerald-400">{row['p-value (Wilcoxon)']}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{numFixed(row["Cohen's d_z"], 3)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row['Significant (p < 0.05)'] === 'Yes'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {row['Significant (p < 0.05)']}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Modal + Technical Document Link */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onOpenResearchModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition shadow-lg hover:border-slate-700"
          >
            <span>Inspect All 8 Research Tables &amp; 16 Figures</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <a
            href="/VYRA_COMPLETE_PROJECT_DETAILS.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 border border-blue-800/80 transition shadow-lg hover:border-blue-700"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Read 6-Page Technical Reference (.txt)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
