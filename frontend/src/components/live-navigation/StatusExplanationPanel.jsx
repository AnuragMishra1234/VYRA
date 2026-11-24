import React from 'react';
import {
  Activity,
  Compass,
  Satellite,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';

export default function StatusExplanationPanel({
  telemetry,
  lastTransitionTime = '00:00:00',
  previousMode = 'HYBRID',
}) {
  const selectedMode = telemetry?.selected_mode || 'HYBRID';
  const scenario = telemetry?.scenario || 'NORMAL';
  const gnssQuality = telemetry?.gnss_quality !== undefined ? telemetry.gnss_quality : 0.95;
  const isOutage = telemetry?.is_outage || false;
  const currentError = telemetry?.current_error_m !== undefined ? telemetry.current_error_m : 0.42;
  const decisionReason = telemetry?.decision_reason || 'Nominal multi-sensor tracking operating within safe bounds.';
  const survivability = telemetry?.dr_survivability_s !== undefined ? telemetry.dr_survivability_s : 14.8;

  const getModeTheme = () => {
    switch (selectedMode) {
      case 'GNSS':
        return {
          color: 'sky',
          title: 'GNSS-DIRECT POSITIONING',
          badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
          icon: Satellite,
          glow: 'shadow-sky-500/20',
        };
      case 'DR':
        return {
          color: 'amber',
          title: 'PURE DEAD RECKONING (INERTIAL)',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          icon: Compass,
          glow: 'shadow-amber-500/20',
        };
      default:
        return {
          color: 'emerald',
          title: 'HYBRID FUSION (CONTINUOUS EKF)',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          icon: Activity,
          glow: 'shadow-emerald-500/20',
        };
    }
  };

  const theme = getModeTheme();
  const ModeIcon = theme.icon;

  return (
    <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl transition-all">
      {/* Top Banner: Mode Indicator & Integrity State */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${theme.badgeClass} shadow-lg ${theme.glow}`}>
            <ModeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Active Arbitration Mode
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
              <span>{theme.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${theme.badgeClass}`}>
                {selectedMode}
              </span>
            </div>
          </div>
        </div>

        {/* Signal Condition Badge */}
        <div className="flex items-center gap-3">
          {isOutage ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-300 text-xs font-mono animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>OUTAGE DETECTED</span>
            </div>
          ) : gnssQuality < 0.5 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>DEGRADED GNSS</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>HEALTHY GNSS</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid: Decision Explanation + Telemetry Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Left: Scientific Decision Reason */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Policy Decision Explanation</span>
          </div>

          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed font-sans">
            <p className="text-slate-300">
              <strong className="text-white font-mono uppercase tracking-wide mr-1.5">
                REASON:
              </strong>
              {decisionReason}
            </p>
          </div>

          {/* Mode Handover Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Previous Mode: <strong className="text-white">{previousMode}</strong></span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <span>Transition Timestamp: <strong className="text-white">{lastTransitionTime}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Key Decision Parameters */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-3">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            State Estimation Telemetry
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">GNSS Quality (Q_t):</span>
              <span className={`font-bold ${gnssQuality >= 0.7 ? 'text-emerald-400' : gnssQuality >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                {gnssQuality.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Current Position Error:</span>
              <span className="text-cyan-300 font-bold">
                {currentError !== null ? `${currentError.toFixed(3)} m` : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Forecast Horizon (H):</span>
              <span className="text-indigo-300 font-bold">3.0 s (XGBoost)</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">DR Survivability Bound:</span>
              <span className="text-amber-300 font-bold">{survivability.toFixed(1)} s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
