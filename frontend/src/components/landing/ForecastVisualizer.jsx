import React, { useState } from 'react';
import { LineChart, Play, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';

export default function ForecastVisualizer() {
  const [scenario, setScenario] = useState('multipath'); // multipath, outage, recovery

  const scenarios = {
    multipath: {
      name: 'Scenario A: Urban Canyon Multipath',
      desc: 'Satellite signals experience multipath reflections. Raw GNSS fluctuates violently. Fixed HYBRID filters out noisy innovations; DR is stable but HYBRID remains superior.',
      selectedMode: 'HYBRID',
      gnssPath: 'M 50 180 Q 150 140 250 80 T 450 30', // Spikes to top (high error)
      drPath: 'M 50 180 Q 200 170 350 150 T 450 130',   // Smooth drift
      hybridPath: 'M 50 180 Q 180 182 300 183 T 450 184', // Very low, flat error
      errorBoundY: 70, // 5.0m threshold
      gnssErrorEnd: '7.8m',
      drErrorEnd: '2.1m',
      hybridErrorEnd: '0.4m',
    },
    outage: {
      name: 'Scenario B: Sudden Tunnel Outage (10s)',
      desc: 'Instantaneous satellite dropout. Raw GNSS jumps uncontrollably. Pure DR maintains drift-free heading within its survivability envelope T_surv = 8.4s.',
      selectedMode: 'DR',
      gnssPath: 'M 50 180 Q 100 90 200 40 T 450 10',     // Catastrophic jump
      drPath: 'M 50 180 Q 180 175 320 160 T 450 145',   // Bounded quadratic drift
      hybridPath: 'M 50 180 Q 120 110 250 60 T 450 40',  // EKF drifts if corrupted
      errorBoundY: 70,
      gnssErrorEnd: '15.4m',
      drErrorEnd: '1.8m',
      hybridErrorEnd: '6.2m',
    },
    recovery: {
      name: 'Scenario C: Post-Outage Re-acquisition',
      desc: 'Vehicle emerges from tunnel. GNSS constellation re-acquired. Adaptive quality engine smoothly transitions filter back to HYBRID without transient jump.',
      selectedMode: 'HYBRID',
      gnssPath: 'M 50 80 Q 150 120 280 170 T 450 180',
      drPath: 'M 50 140 Q 200 120 320 100 T 450 80',
      hybridPath: 'M 50 150 Q 180 165 300 180 T 450 182',
      errorBoundY: 70,
      gnssErrorEnd: '0.6m',
      drErrorEnd: '4.8m',
      hybridErrorEnd: '0.3m',
    },
  };

  const current = scenarios[scenario];

  return (
    <section className="py-24 bg-[#080d18] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 tracking-widest mb-3">
            <LineChart className="w-3.5 h-3.5" />
            <span>Interactive Risk Modeling</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Forecast Visualization. <br />
            <span className="text-slate-400">Future Error Dynamics.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            Simulated demonstration of counterfactual error projections over lookahead horizon τ = 3.0s
            relative to the 5.0m operational safety envelope.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Test Regime:
          </span>
          {Object.entries(scenarios).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setScenario(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                scenario === key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {item.name.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Visualization Canvas Box */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Info Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6 text-xs font-mono">
            <div>
              <span className="font-bold text-white text-sm">{current.name}</span>
              <p className="text-slate-400 text-xs font-normal mt-1 max-w-xl">{current.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px] uppercase">VYRA Choice:</span>
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold border ${
                  current.selectedMode === 'HYBRID'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                }`}
              >
                {current.selectedMode} (OPTIMAL)
              </span>
            </div>
          </div>

          {/* SVG Research-Style Plot */}
          <div className="relative w-full h-[320px] bg-slate-950 rounded-xl border border-slate-800/80 p-4 overflow-hidden flex flex-col justify-between">
            {/* Legend & Watermark */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/60 pb-2 z-10">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block"></span> GNSS: {current.gnssErrorEnd}
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block"></span> DR: {current.drErrorEnd}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> HYBRID: {current.hybridErrorEnd}
                </span>
              </div>
              <span className="text-[10px] text-rose-400 flex items-center gap-1">
                <span className="w-3 h-0.5 border-t border-dashed border-rose-500 inline-block"></span>
                5.0 m Safety Threshold
              </span>
            </div>

            {/* SVG Plot Graphic */}
            <svg viewBox="0 0 500 240" className="w-full h-full flex-1 overflow-visible">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="50" y2="200" stroke="#1e293b" strokeWidth="1" />
              <line x1="50" y1="200" x2="480" y2="200" stroke="#1e293b" strokeWidth="1" />
              <line x1="50" y1="135" x2="480" y2="135" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="70" x2="480" y2="70" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* Y Axis Ticks */}
              <text x="40" y="203" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">0m</text>
              <text x="40" y="138" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">2.5m</text>
              <text x="40" y="73" fill="#ef4444" fontSize="10" textAnchor="end" fontFamily="monospace">5.0m</text>
              <text x="40" y="25" fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">8.0m</text>

              {/* X Axis Ticks */}
              <text x="50" y="218" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">t (Now)</text>
              <text x="180" y="218" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">+1.0s</text>
              <text x="310" y="218" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">+2.0s</text>
              <text x="450" y="218" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">+3.0s (Horizon)</text>

              {/* 5.0m Critical Threshold Line */}
              <line x1="50" y1="70" x2="480" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Candidate Path Curves */}
              {/* GNSS Curve */}
              <path
                d={current.gnssPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={current.selectedMode === 'GNSS' ? '3' : '1.5'}
                strokeDasharray={current.selectedMode === 'GNSS' ? 'none' : '3 3'}
                opacity={current.selectedMode === 'GNSS' ? '1' : '0.4'}
              />

              {/* DR Curve */}
              <path
                d={current.drPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={current.selectedMode === 'DR' ? '3' : '1.5'}
                strokeDasharray={current.selectedMode === 'DR' ? 'none' : '4 4'}
                opacity={current.selectedMode === 'DR' ? '1' : '0.5'}
              />

              {/* HYBRID Curve */}
              <path
                d={current.hybridPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={current.selectedMode === 'HYBRID' ? '3' : '1.5'}
                opacity={current.selectedMode === 'HYBRID' ? '1' : '0.5'}
              />

              {/* Origin Circle Marker at (t, now) */}
              <circle cx="50" cy="180" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
            </svg>

            {/* Scientific Transparency Watermark */}
            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between pt-2 border-t border-slate-900">
              <span>Labeled: CONCEPTUAL FORECAST MECHANISM</span>
              <span>Lookahead Horizon: &tau; = 3.0 s</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
