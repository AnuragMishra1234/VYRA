import React from 'react';
import { Target, CheckCircle2, ShieldX, Cpu } from 'lucide-react';

const numVal = (val, def = 0) => (typeof val === 'number' && !isNaN(val) ? val : def);
const fmt = (val, digits = 3) => numVal(val).toFixed(digits);

export default function CandidateForecastPanel({ telemetry }) {
  if (!telemetry) {
    return (
      <div className="bg-[#0b101f]/80 border border-slate-800 rounded-2xl p-6 text-slate-500 font-mono text-xs text-center">
        Awaiting telemetry stream...
      </div>
    );
  }

  const {
    forecast_gnss = 0,
    forecast_hybrid = 0,
    forecast_dr = 0,
    selected_mode = 'HYBRID',
    decision_reason = 'NORMAL_EVALUATION',
    is_outage = false,
    gnss_quality = 1.0,
    dr_survivability_s = 10.0,
  } = telemetry;

  const candidates = [
    {
      action: 'GNSS',
      title: 'GNSS-Direct',
      error: numVal(forecast_gnss),
      isDisqualified: is_outage || numVal(gnss_quality) < 0.2,
      disqualifyReason: is_outage ? 'Outage Active (Qt = 0.00)' : 'Severely Degraded (Qt < 0.20)',
      color: 'sky',
      description: 'Raw satellite pseudorange solution',
    },
    {
      action: 'HYBRID',
      title: 'Fixed HYBRID',
      error: numVal(forecast_hybrid),
      isDisqualified: false,
      color: 'emerald',
      description: 'Continuous loosely-coupled EKF fusion',
    },
    {
      action: 'DR',
      title: 'Pure DR',
      error: numVal(forecast_dr),
      isDisqualified: numVal(dr_survivability_s) < 3.0 && is_outage === false,
      disqualifyReason: 'T_surv < 3.0s drift bound',
      color: 'amber',
      description: 'Strapdown IMU inertial dead-reckoning',
    },
  ];

  const getBorderColor = (c) => {
    if (selected_mode === c.action) {
      if (c.action === 'DR') return 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-950/20';
      if (c.action === 'GNSS') return 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-950/20';
      return 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/20';
    }
    return 'border-slate-800 bg-slate-900/60 hover:border-slate-700';
  };

  const getRiskPercentage = (err) => {
    return Math.min(100, Math.max(0, (numVal(err) / 5.0) * 100));
  };

  return (
    <div className="bg-[#0b101f]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
            Action-Conditioned Risk Forecasting
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span>Lookahead Horizon: τ = 3.0 s</span>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {candidates.map((c) => {
          const isSelected = selected_mode === c.action;
          const riskPct = getRiskPercentage(c.error);

          return (
            <div
              key={c.action}
              className={`rounded-lg border p-3 flex flex-col justify-between transition relative overflow-hidden ${getBorderColor(
                c
              )}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-blue-600 text-[9px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-bl">
                  SELECTED
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs tracking-wider text-slate-200">
                    A = {c.action}
                  </span>
                  <span className="text-[10px] text-slate-400">{c.title}</span>
                </div>

                {/* Predicted Error */}
                <div className="my-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Forecasted Max Error
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-xl font-mono font-bold ${
                        c.error > 5.0 ? 'text-rose-400' : 'text-slate-100'
                      }`}
                    >
                      {fmt(c.error, 3)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">m</span>
                  </div>
                </div>

                {/* Risk Bar relative to 5.0m threshold */}
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Safety Margin</span>
                    <span>{(5.0 - c.error).toFixed(2)}m left</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        riskPct >= 90
                          ? 'bg-rose-500'
                          : riskPct >= 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${riskPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status / Eligibility */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px]">
                {c.isDisqualified ? (
                  <div className="flex items-center gap-1 text-rose-400 font-mono">
                    <ShieldX className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{c.disqualifyReason}</span>
                  </div>
                ) : isSelected ? (
                  <div className="flex items-center gap-1 text-blue-400 font-semibold font-mono">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>Optimal Policy Choice</span>
                  </div>
                ) : (
                  <div className="text-slate-500 truncate">Feasible Candidate</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Rationale Box */}
      <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800 flex items-start gap-2.5">
        <Target className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <div className="font-semibold text-slate-300">Policy Rationale &amp; Hysteresis Rule:</div>
          <div className="font-mono text-[11px] text-blue-300 mt-0.5 break-all">
            {decision_reason || 'NORMAL_EVALUATION'}
          </div>
        </div>
      </div>
    </div>
  );
}
