import React from 'react';
import { Activity, ShieldAlert, Satellite, Compass, BookOpen, Wifi, WifiOff } from 'lucide-react';

export default function Header({
  telemetry,
  isConnected,
  onOpenResearchModal,
}) {
  const scenario = telemetry?.scenario || 'NORMAL';
  const selectedMode = telemetry?.selected_mode || 'HYBRID';
  const isOutage = telemetry?.is_outage || false;

  const getScenarioBadge = () => {
    switch (scenario) {
      case 'OUTAGE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 border border-red-500 text-red-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            OUTAGE (SOFTWARE-SIMULATED)
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            DEGRADED GNSS
          </span>
        );
      case 'RECOVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            RECOVERY FILTERING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            NORMAL REGIME
          </span>
        );
    }
  };

  const getModeBadge = () => {
    switch (selectedMode) {
      case 'DR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Compass className="w-3.5 h-3.5" />
            MODE: PURE DR (INERTIAL)
          </span>
        );
      case 'GNSS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/40">
            <Satellite className="w-3.5 h-3.5" />
            MODE: GNSS-DIRECT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Activity className="w-3.5 h-3.5" />
            MODE: HYBRID (CONTINUOUS EKF)
          </span>
        );
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/30">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">VYRA RESEARCH REPLAY</h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Test Split V-S3a
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getScenarioBadge()}
        {getModeBadge()}

        <button
          onClick={onOpenResearchModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:border-slate-600"
          title="Open experimental validation results, publication tables and figures"
        >
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span>Research Evidence & Tables</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] bg-slate-950/60 border border-slate-800 text-slate-400">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-mono">10 Hz LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span className="text-rose-400 font-mono">RECONNECTING</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
