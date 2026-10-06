import React from 'react';
import { ArrowRight, AlertTriangle, ShieldCheck, Zap, Activity } from 'lucide-react';

export default function DifferentiatorSection() {
  return (
    <section className="py-24 bg-[#060911] border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Large Typography Headline */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 tracking-widest mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>The Core Research Differentiator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-mono leading-tight">
            Don&apos;t Just Detect Failure. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Forecast Its Consequences.
            </span>
          </h2>
        </div>

        {/* Side-by-Side Paradigm Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Column 1: Traditional Reactive Switching */}
          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-8 flex flex-col justify-between text-left">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
                <span className="text-xs font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Conventional Reactive Paradigm
                </span>
                <span className="text-[10px] font-mono text-slate-500">Threshold-Based</span>
              </div>

              <div className="text-lg font-mono font-bold text-slate-200 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                &ldquo;Is GNSS bad right now?&rdquo;
              </div>

              <ul className="space-y-3 text-xs text-slate-400 font-normal leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono font-bold">&times;</span>
                  <span>
                    <strong>Delayed Reaction:</strong> Switches only after Normalized Innovation Squared (NIS) spikes or loss-of-lock occurs.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono font-bold">&times;</span>
                  <span>
                    <strong>Filter Poisoning:</strong> Erroneous multipath pseudoranges infiltrate the EKF covariance before gating kicks in.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-mono font-bold">&times;</span>
                  <span>
                    <strong>Frequent Chattering:</strong> Switches rapidly between modes at boundary conditions, inducing transient state jumps.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
              Result: Max Error up to 21.26 m in urban tunnels
            </div>
          </div>

          {/* Column 2: VYRA Forecast-Driven Architecture */}
          <div className="bg-gradient-to-b from-[#0e172a] to-[#0a1224] border border-blue-500/40 rounded-2xl p-8 flex flex-col justify-between text-left shadow-2xl ring-1 ring-blue-500/20">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-blue-500/20 mb-6">
                <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> The VYRA Predictive Paradigm
                </span>
                <span className="text-[10px] font-mono text-blue-300">Action-Conditioned</span>
              </div>

              <div className="text-lg font-mono font-bold text-white mb-4 bg-slate-950/80 p-3 rounded-lg border border-blue-500/30">
                &ldquo;What is likely to happen over the next 3s under each action?&rdquo;
              </div>

              <ul className="space-y-3 text-xs text-slate-300 font-normal leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">&check;</span>
                  <span>
                    <strong>Anticipatory Execution:</strong> Evaluates counterfactual errors for GNSS, HYBRID, and DR before errors manifest.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">&check;</span>
                  <span>
                    <strong>Inertial Survivability:</strong> Guarantees DR is selected only when error drift is provably bounded (&lt; 5.0m).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono font-bold">&check;</span>
                  <span>
                    <strong>Hysteresis Regularization:</strong> Enforces minimum dwell times (&tau; = 3.0s) and hysteresis barrier (&epsilon; = 1.5m), cutting handovers by 70%.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-blue-500/20 text-[11px] font-mono text-cyan-300 font-semibold">
              Result: 0.399 m ATE &bull; Max Error bounded to 12.75 m &bull; 0.0% Chattering
            </div>
          </div>
        </div>

        {/* Action Decision Vector Flow */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-xl p-6 text-center">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-4">
            Counterfactual Evaluation Flow
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-slate-300">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-bold text-white">
              Current State s<sub>t</sub>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-sky-950/60 border border-sky-500/40 text-sky-400">
                GNSS &rarr; Future
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
                HYBRID &rarr; Future
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-400">
                DR &rarr; Future
              </span>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold">
              Select Min Risk Mode
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
