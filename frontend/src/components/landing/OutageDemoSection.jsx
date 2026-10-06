import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle, Navigation, Radio, Compass, Hourglass } from 'lucide-react';

export default function OutageDemoSection() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const demoPhases = [
    {
      phase: 'NORMAL',
      title: 'Phase 1: Nominal Open-Sky Driving',
      badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
      gnssQuality: '0.98',
      degradationProb: '0.02',
      drUncertainty: '0.62 m',
      survivability: '14.8 s',
      currentError: '0.24 m',
      forecastGnss: '0.31 m',
      forecastHybrid: '0.28 m',
      forecastDr: '1.45 m',
      selectedMode: 'HYBRID',
      policyReason: 'NORMAL: Continuous loosely-coupled EKF provides optimal accuracy.',
      visualState: 'Satellite signals strong. Loosely-coupled EKF tightly bounds vehicle trajectory.',
    },
    {
      phase: 'DEGRADATION',
      title: 'Phase 2: Urban Canyon Multi-Path',
      badge: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
      gnssQuality: '0.41',
      degradationProb: '0.68',
      drUncertainty: '1.24 m',
      survivability: '9.4 s',
      currentError: '0.68 m',
      forecastGnss: '4.82 m',
      forecastHybrid: '0.74 m',
      forecastDr: '1.92 m',
      selectedMode: 'HYBRID',
      policyReason: 'PREEMPTIVE_WARNING: Adaptive R-matrix inflation attenuates degraded satellites.',
      visualState: 'Multipath reflections detected. Policy attenuates satellite weights before contamination.',
    },
    {
      phase: 'OUTAGE',
      title: 'Phase 3: Total Signal Dropout (Tunnel Entrance)',
      badge: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
      gnssQuality: '0.00',
      degradationProb: '1.00',
      drUncertainty: '2.45 m',
      survivability: '6.2 s',
      currentError: '1.42 m',
      forecastGnss: '18.90 m (DISQUALIFIED)',
      forecastHybrid: '5.40 m',
      forecastDr: '2.10 m',
      selectedMode: 'DR',
      policyReason: 'OUTAGE_TRIGGER: GNSS disqualified. Selected DR within safe survivability T_surv envelope.',
      visualState: 'Complete GNSS outage. System seamlessly hands over to pure dead reckoning.',
    },
    {
      phase: 'RECOVERY',
      title: 'Phase 4: Post-Outage Re-Acquisition',
      badge: 'bg-purple-950/80 text-purple-400 border-purple-500/40',
      gnssQuality: '0.86',
      degradationProb: '0.12',
      drUncertainty: '0.75 m',
      survivability: '12.0 s',
      currentError: '0.38 m',
      forecastGnss: '0.52 m',
      forecastHybrid: '0.39 m',
      forecastDr: '3.80 m',
      selectedMode: 'HYBRID',
      policyReason: 'RECOVERY_COMPLETED: Stable constellation confirmed. Hysteresis barrier safely cleared.',
      visualState: 'Satellites re-acquired. EKF smoothly re-converges without transient coordinate jump.',
    },
  ];

  const current = demoPhases[phaseIndex];

  return (
    <section id="demo" className="py-24 bg-[#060911] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-purple-400 tracking-widest mb-3">
            <Play className="w-3.5 h-3.5" />
            <span>Cinematic Scenario Stepper</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Outage Lifecycle Demo. <br />
            <span className="text-slate-400">Watch VYRA Adapt.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            Step through a typical degradation sequence: from nominal driving, through multi-path noise,
            sudden total tunnel outage, and post-outage filter re-convergence.
          </p>
        </div>

        {/* Phase Stepper Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {demoPhases.map((p, idx) => (
            <button
              key={p.phase}
              onClick={() => setPhaseIndex(idx)}
              className={`p-3.5 rounded-xl border text-left transition font-mono ${
                phaseIndex === idx
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>STAGE 0{idx + 1}</span>
                {phaseIndex === idx && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
              </div>
              <div className="text-xs font-bold text-slate-200">{p.phase}</div>
            </button>
          ))}
        </div>

        {/* Live Scenario Board */}
        <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
            <div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${current.badge}`}>
                {current.phase} STATE
              </span>
              <h3 className="text-base font-mono font-bold text-white mt-1.5">{current.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhaseIndex((prev) => (prev + 1) % demoPhases.length)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <span>Next Stage &rarr;</span>
              </button>
            </div>
          </div>

          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">GNSS Quality (Qt)</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">{current.gnssQuality}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">P(Degradation)</div>
              <div className="text-lg font-bold text-purple-400 mt-1">{current.degradationProb}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">DR Uncertainty 1σ</div>
              <div className="text-lg font-bold text-amber-400 mt-1">{current.drUncertainty}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">Survivability T_surv</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">{current.survivability}</div>
            </div>
          </div>

          {/* Candidate Forecasts in this Phase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 font-mono text-xs">
            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">Forecast: GNSS</div>
              <div className="text-slate-200 font-bold mt-1">{current.forecastGnss}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">Forecast: HYBRID</div>
              <div className="text-slate-200 font-bold mt-1">{current.forecastHybrid}</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500 text-[10px] uppercase">Forecast: DR</div>
              <div className="text-slate-200 font-bold mt-1">{current.forecastDr}</div>
            </div>
          </div>

          {/* Decision Rationale Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Selected Mode: {current.selectedMode}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">{current.policyReason}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
