import React from 'react';
import { Layers, ArrowRight, Radio, Compass, Cpu, Target, Scale, CheckCircle } from 'lucide-react';

export default function ArchitectureSection() {
  const blocks = [
    {
      group: '1. SENSOR OBSERVATIONS',
      color: 'border-sky-500/30 text-sky-400',
      items: [
        { label: 'GNSS Ephemeris', detail: 'NMEA / RTK Carrier Phase' },
        { label: 'Tactical IMU', detail: '3-Axis Accel & Gyroscope' },
        { label: 'Wheel Odometry', detail: 'Chassis Speed (10 Hz)' },
      ],
    },
    {
      group: '2. ESTIMATION & FUSION',
      color: 'border-emerald-500/30 text-emerald-400',
      items: [
        { label: 'Strapdown DR', detail: 'Drift & Kinematic Propagation' },
        { label: '6-State LC-EKF', detail: 'Adaptive R-Matrix Joseph Form' },
        { label: 'Covariance Trace', detail: 'P_k Uncertainty Ellipse (1σ)' },
      ],
    },
    {
      group: '3. PREDICTION & ENVELOPE',
      color: 'border-purple-500/30 text-purple-400',
      items: [
        { label: 'Quality Engine', detail: 'Qt Composite Reliability' },
        { label: 'Degradation ML', detail: 'XGBoost P(deg | st)' },
        { label: 'DR Survivability', detail: 'T_surv (< 5.0m Horizon)' },
      ],
    },
    {
      group: '4. FORECAST & DECISION',
      color: 'border-blue-500/30 text-blue-400',
      items: [
        { label: 'Forecast Engine', detail: 'Counterfactual ê(A, τ=3s)' },
        { label: 'Hysteresis Dwell', detail: 'τ_dwell = 3.0s, ε = 1.5m' },
        { label: 'Policy Selection', detail: 'Minimizes J(A) Risk Cost' },
      ],
    },
  ];

  return (
    <section id="architecture" className="py-24 bg-[#060911] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400 tracking-widest mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>End-to-End System Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            From Sensors to Decision. <br />
            <span className="text-slate-400">Complete Integration.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            How raw sensor records are processed through causal quality filtering, dead reckoning,
            action-conditioned error forecasting, and regularized policy arbitration.
          </p>
        </div>

        {/* 4-Column Architectural Schematic */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {blocks.map((b, idx) => (
            <div
              key={b.group}
              className="bg-[#0a0f1d] border border-slate-800 rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
                  <span>{b.group}</span>
                  <span className="text-slate-600">0{idx + 1}</span>
                </div>

                <div className="space-y-3">
                  {b.items.map((item) => (
                    <div
                      key={item.label}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono"
                    >
                      <div className="font-semibold text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Causal &amp; Leak-Free</span>
                <span className="text-slate-400">&rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* Output Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-white uppercase">
                Output: Resilient Localization Pose
              </div>
              <div className="text-xs text-slate-400 font-normal">
                Continuous local ENU pose (p_E, p_N) and state covariance P_k shielded from degradation spikes.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 font-bold bg-emerald-950/80 px-4 py-2 rounded-xl border border-emerald-500/40">
            <span>ATE: 0.399 m (Validated)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
