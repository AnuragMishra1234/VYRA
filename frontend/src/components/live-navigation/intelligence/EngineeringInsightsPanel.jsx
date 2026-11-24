import React from 'react';
import {
  FileText,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function EngineeringInsightsPanel({ insights, summaryMetrics }) {
  if (!insights) {
    return (
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-mono text-sm">
        Run an experiment to synthesize engineering diagnostics.
      </div>
    );
  }

  const cards = [
    {
      id: 'what_happened',
      title: '1. WHAT HAPPENED (OPERATIONAL SCENARIO)',
      subtitle: 'Physical Run Environment & Injected Disturbance',
      content: insights.what_happened,
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      borderColor: 'border-blue-500/40',
      bgColor: 'bg-blue-950/15',
    },
    {
      id: 'why_it_happened',
      title: '2. WHY IT HAPPENED (ROOT CAUSE ANALYSIS)',
      subtitle: 'Sensor Dynamics & Measurement Channel Degradation',
      content: insights.why_it_happened,
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
      borderColor: 'border-amber-500/40',
      bgColor: 'bg-amber-950/15',
    },
    {
      id: 'system_response',
      title: '3. SYSTEM RESPONSE (POLICY EXECUTION)',
      subtitle: 'Causal Risk Forecasting, Mode Transition & Dwell Stability',
      content: insights.system_response,
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      borderColor: 'border-purple-500/40',
      bgColor: 'bg-purple-950/15',
    },
    {
      id: 'what_worked_well',
      title: '4. WHAT WORKED WELL (QUANTITATIVE VALIDATION)',
      subtitle: 'Validated Error Reduction & Critical Containment',
      content: insights.what_worked_well,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      borderColor: 'border-emerald-500/40',
      bgColor: 'bg-emerald-950/15',
    },
    {
      id: 'improvement_scope',
      title: '5. SCOPE FOR IMPROVEMENT & ENGINEERING ROADMAP',
      subtitle: 'Pragmatic Limitations, Inertial Drift & Future Sensors',
      content: insights.improvement_scope,
      icon: <Lightbulb className="w-5 h-5 text-cyan-400" />,
      borderColor: 'border-cyan-500/40',
      bgColor: 'bg-cyan-950/15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
              FEATURE E — POST-EXPERIMENT ENGINEERING DIAGNOSTICS & SYNTHESIS
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Objective scientific evaluation covering operational triggers, filter response, and roadmap limitations
          </p>
        </div>

        {summaryMetrics && (
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-900 border border-slate-700/80 px-3.5 py-1.5 rounded-xl">
            <span className="text-slate-400">ACHIEVED ATE:</span>
            <span className="text-emerald-400 font-bold">{summaryMetrics.vyra_ate_m} m</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-bold">
              {summaryMetrics.safety_containment_pct}% SAFE
            </span>
          </div>
        )}
      </div>

      {/* 5 Structured Diagnostic Cards */}
      <div className="space-y-4">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl border p-5 shadow-lg font-mono transition-all ${c.borderColor} ${c.bgColor}`}
          >
            <div className="flex items-start gap-3.5 mb-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex-shrink-0">
                {c.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  {c.title}
                </h4>
                <span className="text-[10px] text-slate-400">{c.subtitle}</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 font-sans leading-relaxed pl-12">
              {c.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
