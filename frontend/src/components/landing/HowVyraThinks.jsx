import React, { useState } from 'react';
import { Cpu, Radio, ShieldAlert, Compass, Hourglass, Target, Scale, CheckCircle2, ChevronRight } from 'lucide-react';

export default function HowVyraThinks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      title: 'Current Sensor State',
      icon: Cpu,
      tag: 'Causal Ingestion',
      math: 'x_t, P_t, I_t, G_t',
      desc: 'Synchronizes 10 Hz IMU (accelerations, angular rates, wheel speed) with GNSS NMEA sentences without future leakage.',
    },
    {
      id: 1,
      title: 'GNSS Quality Engine',
      icon: Radio,
      tag: 'Quality Score',
      math: 'Q_t ∈ [0.0, 1.0]',
      desc: 'Computes composite satellite quality from DOP geometry, effective SV count, carrier-to-noise ratio, and kinematic innovation jitter.',
    },
    {
      id: 2,
      title: 'Degradation Predictor',
      icon: ShieldAlert,
      tag: 'Risk Forecasting',
      math: 'P(degradation | s_t)',
      desc: 'Calibrated XGBoost classifier predicts the forward probability of severe signal attenuation across lookahead horizons.',
    },
    {
      id: 3,
      title: 'DR Uncertainty Modeling',
      icon: Compass,
      tag: 'Covariance Propagation',
      math: 'P_k = F P_{k-1} F^T + Q_k',
      desc: 'Tracks error-state covariance growth in the loosely-coupled Extended Kalman Filter, extracting horizontal standard deviation 1σ.',
    },
    {
      id: 4,
      title: 'DR Survivability Envelope',
      icon: Hourglass,
      tag: 'Inertial Safety Margin',
      math: 'T_surv (E_thresh = 5.0m)',
      desc: 'Calculates the exact duration before inertial drift accumulation breaches the 5.0m operational threshold under current dynamics.',
    },
    {
      id: 5,
      title: 'Action-Conditioned Forecast',
      icon: Target,
      tag: 'Counterfactual Engine',
      math: 'ê_max(s_t, A, τ = 3.0s)',
      desc: 'Predicts the future maximum position error for candidate decisions {GNSS, HYBRID, DR} over a 3-second lookahead window.',
    },
    {
      id: 6,
      title: 'Adaptive Hysteresis Policy',
      icon: Scale,
      tag: 'Constrained Optimization',
      math: 'min J(A) s.t. τ_dwell, ε_hyst',
      desc: 'Minimizes multi-objective risk while enforcing a 3.0s minimum dwell time and 1.5m hysteresis barrier to eliminate chattering.',
    },
    {
      id: 7,
      title: 'Resilient Mode Execution',
      icon: CheckCircle2,
      tag: 'State & Pose Output',
      math: 'M_t ∈ {GNSS, HYBRID, DR}',
      desc: 'Transitions to the optimal navigation mode, ensuring smooth trajectory tracking through severe GNSS degradation and outages.',
    },
  ];

  return (
    <section id="mechanism" className="py-24 bg-[#080d18] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400 tracking-widest mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Causal Algorithmic Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            How VYRA Thinks. <br />
            <span className="text-slate-400">Step by Step.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-4 leading-relaxed font-normal">
            A strictly causal, 8-stage sequence that transforms raw inertial and satellite streams
            into robust, anticipatory mode-selection decisions.
          </p>
        </div>

        {/* Step-by-Step Flow Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-950/20 border-blue-500/60 ring-2 ring-blue-500/20 shadow-lg'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono">
                    <span className="text-slate-500 font-bold">0{idx + 1}</span>
                    <span className="text-[10px] uppercase text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {step.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-mono text-xs font-bold text-slate-200">{step.title}</h3>
                  </div>

                  <div className="text-[11px] font-mono text-blue-300 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/60 mb-2 truncate">
                    {step.math}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Focused Pipeline Summary Bar */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200 font-bold uppercase">
              Current Focus: Step 0{activeStep + 1} &mdash; {steps[activeStep].title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={activeStep === steps.length - 1}
              className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
