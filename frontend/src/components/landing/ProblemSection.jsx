import React, { useState } from 'react';
import { AlertTriangle, Clock, ArrowRight, ShieldX, CheckCircle, HelpCircle } from 'lucide-react';

export default function ProblemSection() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 0,
      title: 'GNSS NOMINAL',
      bars: '██████████',
      pct: '100%',
      desc: 'Clear open-sky line of sight. Pseudorange carrier noise is negligible. EKF innovations remain bounded.',
      color: 'text-cyan-400',
      border: 'border-cyan-500/40 bg-cyan-950/10',
      barColor: 'bg-cyan-400',
      width: 'w-full',
    },
    {
      id: 1,
      title: 'GNSS DEGRADING',
      bars: '███████░░░',
      pct: '65%',
      desc: 'Urban canyon or foliage. Non-line-of-sight multipath introduces covert pseudorange bias before gating triggers.',
      color: 'text-amber-400',
      border: 'border-amber-500/40 bg-amber-950/10',
      barColor: 'bg-amber-400',
      width: 'w-2/3',
    },
    {
      id: 2,
      title: 'GNSS UNAVAILABLE',
      bars: '░░░░░░░░░░',
      pct: '0%',
      desc: 'Underpass, tunnel, or severe RF attenuation. Raw receiver positioning fails completely.',
      color: 'text-rose-400',
      border: 'border-rose-500/40 bg-rose-950/10',
      barColor: 'bg-rose-500',
      width: 'w-0',
    },
  ];

  return (
    <section id="problem" className="py-24 bg-[#080d18] border-t border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-400 tracking-widest mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>The Temporal Vulnerability of Reactive Fusion</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            When GNSS Fails, <br />
            <span className="text-slate-400">Time Matters.</span>
          </h2>
        </div>

        {/* Cinematic Degradation Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition cursor-pointer ${
                step.border
              } ${activeStep === step.id ? 'ring-2 ring-blue-500/50' : 'opacity-80 hover:opacity-100'}`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-xs mb-4">
                  <span className="font-bold text-slate-300">{step.title}</span>
                  <span className={`font-bold ${step.color}`}>{step.pct}</span>
                </div>

                {/* Visual Bar Indicator */}
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800 mb-4">
                  <div className={`h-full rounded-full transition-all duration-500 ${step.barColor} ${step.width}`} />
                </div>

                <div className="font-mono text-sm tracking-wider text-slate-500 mb-3 select-none">
                  {step.bars}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Phase 0{step.id + 1}</span>
                <span className="text-slate-400">Degradation Evolution &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* The Conceptual Paradigm Shift */}
        <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <HelpCircle className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 max-w-4xl space-y-6 text-left">
            <p className="text-sm font-mono uppercase tracking-widest text-slate-400">
              The Reactive Bottleneck
            </p>

            <blockquote className="text-lg sm:text-2xl text-slate-200 font-medium leading-relaxed">
              Traditional navigation switching can react{' '}
              <span className="text-rose-400 underline decoration-rose-500/50 underline-offset-4">
                only after degradation becomes obvious
              </span>
              —after corrupt measurements have already contaminated filter state or after receiver loss-of-lock.
            </blockquote>

            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2">
                VYRA Asks a Fundamental Question:
              </p>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white bg-slate-950/70 p-4 rounded-xl border border-slate-800 shadow-inner">
                &ldquo;What happens next if I choose GNSS, HYBRID, or DR?&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
