import React from 'react';
import { Gauge, Radio, Shield, Hourglass, AlertOctagon, Navigation } from 'lucide-react';

const numVal = (val, def = 0) => (typeof val === 'number' && !isNaN(val) ? val : def);
const fmt = (val, digits = 3) => numVal(val).toFixed(digits);

export default function TelemetryMonitor({ telemetry }) {
  if (!telemetry) {
    return (
      <div className="bg-[#0b101f]/80 border border-slate-800 rounded-2xl p-6 text-slate-500 font-mono text-xs text-center">
        Telemetry loading...
      </div>
    );
  }

  const gnss_quality = numVal(telemetry.gnss_quality, 1.0);
  const degradation_prob = numVal(telemetry.degradation_prob, 0.0);
  const dr_uncertainty_std_m = numVal(telemetry.dr_uncertainty_std_m, 0.5);
  const dr_survivability_s = numVal(telemetry.dr_survivability_s, 10.0);
  const current_error_m = numVal(telemetry.current_error_m, 0.0);
  const is_outage = Boolean(telemetry.is_outage);
  const is_degraded = Boolean(telemetry.is_degraded);

  const getQualityColor = (q) => {
    if (q >= 0.7) return 'text-emerald-400';
    if (q >= 0.3) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getQualityBg = (q) => {
    if (q >= 0.7) return 'bg-emerald-500';
    if (q >= 0.3) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-[#0b101f]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
            Live Telemetry &amp; Diagnostics
          </h2>
        </div>
        {is_outage ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/80">
            <AlertOctagon className="w-3 h-3" />
            OUTAGE ACTIVE
          </span>
        ) : is_degraded ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
            DEGRADED SIGNAL
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
            NOMINAL TRACKING
          </span>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Metric 1: GNSS Quality Score */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-sky-400" />
              GNSS Quality Q<sub>t</sub>
            </span>
            <span className={`font-mono font-bold ${getQualityColor(gnss_quality)}`}>
              {(gnss_quality * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 mt-1">
            {fmt(gnss_quality, 3)}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${getQualityBg(gnss_quality)}`}
              style={{ width: `${Math.min(100, Math.max(0, gnss_quality * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Degradation Probability */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" />
              P(Degradation)
            </span>
            <span className="font-mono text-slate-300">
              {(degradation_prob * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 mt-1">
            {fmt(degradation_prob, 3)}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full ${
                degradation_prob > 0.5 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, degradation_prob * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 3: DR Uncertainty 1-sigma */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>DR Uncertainty 1σ</span>
            <span className="font-mono text-slate-400 text-[10px]">Strapdown</span>
          </div>
          <div className="text-lg font-mono font-bold text-amber-400 mt-1">
            {fmt(dr_uncertainty_std_m, 3)} <span className="text-xs text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            3σ Covariance: {(dr_uncertainty_std_m * 3.0).toFixed(2)}m
          </div>
        </div>

        {/* Metric 4: DR Survivability Duration */}
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Hourglass className="w-3 h-3 text-amber-400" />
              T<sub>surv</sub> (&lt; 5.0m)
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Safety Window</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 mt-1">
            {fmt(dr_survivability_s, 1)} <span className="text-xs text-slate-400">s</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            {dr_survivability_s >= 3.0 ? 'Adequate for 3s Horizon' : 'Warning: High Inertial Drift'}
          </div>
        </div>
      </div>

      {/* True Tracking Error vs Ground Truth */}
      <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Tracking Error e<sub>t</sub>
            </div>
            <div className="text-[10px] text-slate-500">
              Versus Offline Reference RTK
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={`text-xl font-mono font-bold ${
              current_error_m > 5.0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {fmt(current_error_m, 3)} <span className="text-xs text-slate-400">m</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {current_error_m <= 5.0 ? 'Within Safety Envelope (<5m)' : 'SAFETY BREACH (>5m)'}
          </div>
        </div>
      </div>
    </div>
  );
}
