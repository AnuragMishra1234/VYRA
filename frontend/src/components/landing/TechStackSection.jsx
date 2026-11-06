import React from 'react';
import { Layers, Terminal, Cpu, Database, Globe, Play, Activity } from 'lucide-react';

export default function TechStackSection() {
  const stack = [
    {
      category: 'Perception & Fusion Core',
      techs: [
        { name: 'Python 3.11', desc: 'Core scientific computing runtime' },
        { name: '6-State EKF', desc: 'Joseph-form discrete error-state covariance' },
        { name: 'NumPy / SciPy', desc: 'Vectorized kinematic Jacobian derivations' },
        { name: 'WGS84 / ENU', desc: 'Geodetic-to-local plane projection engine' },
      ],
      icon: Cpu,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
    {
      category: 'Machine Learning & Forecasting',
      techs: [
        { name: 'XGBoost', desc: '150-estimator gradient boosted tree ensemble' },
        { name: 'Scikit-Learn', desc: 'Platt scaling probability calibration & ECE' },
        { name: 'Huber Loss', desc: 'Robust regression outlier resilience (δ=1.0m)' },
        { name: 'Causal Windows', desc: '5.0s historical buffer (21 & 34 features)' },
      ],
      icon: Terminal,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    {
      category: 'High-Rate Backend Services',
      techs: [
        { name: 'FastAPI', desc: 'Asynchronous microservice architecture' },
        { name: 'WebSockets (10 Hz)', desc: 'Real-time synchronous state broadcasting' },
        { name: 'Apache Parquet', desc: 'Columnar compressed replay streaming' },
        { name: 'Uvicorn ASGI', desc: 'High-throughput concurrency layer' },
      ],
      icon: Database,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    {
      category: 'Interactive Visualization Frontend',
      techs: [
        { name: 'React 18 & Vite', desc: 'Zero-latency dynamic client architecture' },
        { name: 'Three.js (WebGL)', desc: '3D spatial kinematics & trajectory projection' },
        { name: 'Leaflet GIS', desc: 'Interactive geodetic trajectory mapping' },
        { name: 'Plotly.js', desc: 'Real-time telemetry and error charting' },
      ],
      icon: Globe,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
    },
  ];

  return (
    <section id="stack" className="py-24 bg-[#060911] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 tracking-widest mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Production Architecture &amp; Stack</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            Engineering Rigor. <br />
            <span className="text-slate-400">From Math to Production.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            A cohesive stack engineered for sub-2ms inference latency, zero data leakage,
            and 10 Hz real-time synchronized vehicle state estimation.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stack.map((group, idx) => {
            const Icon = group.icon;
            return (
              <div
                key={idx}
                className="bg-[#0b101e] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${group.color}`} />
                      {group.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">0{idx + 1}</span>
                  </div>

                  <div className="space-y-3">
                    {group.techs.map((t) => (
                      <div
                        key={t.name}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono"
                      >
                        <div className="font-bold text-slate-200">{t.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Latency: ~1.8 ms</span>
                  <span className="text-emerald-400 font-semibold">100% Real-Time</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
