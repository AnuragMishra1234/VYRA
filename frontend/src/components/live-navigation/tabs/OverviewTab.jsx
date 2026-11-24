import React from 'react';
import {
  Compass,
  Activity,
  Satellite,
  Target,
  FlaskConical,
  BarChart3,
  FileText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Cpu,
  Layers,
} from 'lucide-react';
import StatusExplanationPanel from '../StatusExplanationPanel';

export default function OverviewTab({ telemetry, onSelectTab }) {
  const modes = [
    {
      id: 'GNSS',
      title: 'GNSS-Direct Mode',
      color: 'sky',
      badge: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
      description:
        'Uses raw global satellite measurements directly when signal conditions are pristine (high C/N0, low HDOP, >8 satellites). Requires zero inertial compute.',
      advantages: 'Zero drift over long durations; accurate global geodetic frame.',
      vulnerabilities: 'Vulnerable to multipath blunders, RF interference, and total signal dropout in urban canyons.',
      icon: Satellite,
    },
    {
      id: 'HYBRID',
      title: 'Hybrid EKF Fusion',
      color: 'emerald',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
      description:
        '6-state loosely coupled Extended Kalman Filter fusing GNSS positions with wheel odometry and gyroscope. Dynamic measurement covariance R(Q_t) and online gyro bias calibration.',
      advantages: 'Optimal state smoothing, continuous sub-meter tracking, and blunder rejection via NIS gating.',
      vulnerabilities: 'Filter divergence if heavily contaminated GNSS positions are ingested before outage detection.',
      icon: Activity,
    },
    {
      id: 'DR',
      title: 'Pure Dead Reckoning',
      color: 'amber',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      description:
        'Propagates pose strictly using vehicle wheel odometry speeds and strapdown gyroscope yaw rate integration. Zero external RF dependence.',
      advantages: '100% immune to GNSS jamming, multipath reflections, and satellite outages.',
      vulnerabilities: 'Unbounded quadratic error growth over time due to sensor bias and odometric slip (ATE ~720m in 41 min).',
      icon: Compass,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Navigation Control Center</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
            VYRA Live Navigation & Demonstration Suite
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
            Welcome to the live research demonstration environment. VYRA pioneers{' '}
            <strong className="text-white">forecast-driven adaptive mode selection</strong> to overcome the fatal flaw
            of reactive navigation switching: by predicting the localization error consequences of candidate navigation
            actions over short horizons (1s–10s), the system proactively switches before filter contamination occurs.
          </p>
        </div>

        {/* Ambient Decorative Background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. Navigation Status & Explanation Panel (Feature Six) */}
      <StatusExplanationPanel telemetry={telemetry} />

      {/* 3. Three Navigation Modes Architecture & Legend */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Candidate Navigation Modes & Operational Regimes</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Strict Tri-Mode Taxonomy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.id}
                className="bg-[#0a0f1d]/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${m.badge}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${m.badge}`}>
                    {m.id}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold font-mono text-white">{m.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">{m.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs font-sans">
                  <div>
                    <span className="text-emerald-400 font-semibold font-mono text-[11px] block">ADVANTAGE:</span>
                    <span className="text-slate-300">{m.advantages}</span>
                  </div>
                  <div>
                    <span className="text-amber-400 font-semibold font-mono text-[11px] block">VULNERABILITY:</span>
                    <span className="text-slate-300">{m.vulnerabilities}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Action Demonstration Modules */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Interactive Demonstration Laboratories</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onSelectTab('simulator')}
            className="text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-5 space-y-3 group transition shadow-lg"
          >
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 w-fit group-hover:scale-105 transition">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition">
              Live Outage Simulator
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Inject 5s–30s GNSS outages onto the live vehicle trajectory and witness real-time predictive arbitration.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 pt-1">
              <span>Open Simulator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => onSelectTab('what-if')}
            className="text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 space-y-3 group transition shadow-lg"
          >
            <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 w-fit group-hover:scale-105 transition">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-emerald-300 transition">
              What-If Scenario Lab
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Tune satellite counts, outage durations, vehicle speeds, and error bounds to evaluate multi-objective risk J(A).
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 pt-1">
              <span>Configure Scenario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => onSelectTab('comparison')}
            className="text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 space-y-3 group transition shadow-lg"
          >
            <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 w-fit group-hover:scale-105 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-indigo-300 transition">
              Algorithm Benchmark
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Head-to-head comparison of GNSS-Only, Pure DR, Fixed HYBRID, Reactive Switching, and VYRA Adaptive across ATE & RMSE.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 pt-1">
              <span>View Benchmark</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className="text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl p-5 space-y-3 group transition shadow-lg"
          >
            <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400 w-fit group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold font-mono text-white group-hover:text-purple-300 transition">
              Experiment Reports
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Export downloadable, publication-grade PDF documentation containing full methodology and verified metrics.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-mono text-purple-400 pt-1">
              <span>Generate PDF</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
