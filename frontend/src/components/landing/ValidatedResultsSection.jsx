import React, { useState, useEffect } from 'react';
import { Table, Award, ExternalLink } from 'lucide-react';
import { fetchMasterResults } from '../../services/api';

const numFixed = (val, digits = 3) =>
  typeof val === 'number' && !isNaN(val) ? val.toFixed(digits) : val != null ? String(val) : '—';

export default function ValidatedResultsSection({ onOpenResearchModal }) {
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const master = await fetchMasterResults();
        if (master && master.table1_navigation_comparison) {
          setTableData(master.table1_navigation_comparison);
        }
      } catch (e) {
        console.warn('Could not load master results', e);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

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
            Rigorous experimental benchmark on test split <strong className="text-slate-200">V-S3a</strong> (24,621 epochs, 2,462.0 s drive)
            under systematic software degradation sweeps (2.0s – 30.0s).
          </p>
        </div>

        {/* Highlighted Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#0b101d] border border-blue-500/40 rounded-xl p-4 text-left shadow-lg ring-1 ring-blue-500/20">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">VYRA ATE</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">0.399 m</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">vs 0.712 m Reactive (-44%)</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Peak Outage Error</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">12.75 m</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">vs 21.26 m Reactive</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Chattering Rate</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 mt-1">0.0 %</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">16 Stable Handovers</div>
          </div>

          <div className="bg-[#0b101d] border border-slate-800 rounded-xl p-4 text-left shadow-lg">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Wilcoxon p-value</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">2.47e-24</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Effect Size dz = 0.54</div>
          </div>
        </div>

        {/* Primary Benchmark Table (Table 1) */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-400" />
              <h3 className="font-mono text-xs font-bold text-slate-200 uppercase">
                Table 1: Trajectory-Level Localization Performance (V-S3a)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Offline Reference Ground Truth
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-slate-500">Loading validated results...</div>
          ) : tableData ? (
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
                  {tableData.map((row, idx) => {
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
                        <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Violations > 5m (%)'], 1)}%</td>
                        <td className="py-2 px-3 whitespace-nowrap">{row['Handovers'] ?? '—'}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{numFixed(row['Chattering Rate (%)'], 1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs font-mono text-slate-500">Results will be loaded when backend is online.</div>
          )}
        </div>

        {/* View Full Research Modal Button */}
        <div className="flex justify-center">
          <button
            onClick={onOpenResearchModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition shadow-lg hover:border-slate-700"
          >
            <span>Inspect All 8 Research Tables &amp; 16 Publication Figures</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      </div>
    </section>
  );
}
