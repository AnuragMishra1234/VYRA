import React from 'react';
import { Activity, ShieldAlert, Satellite, Compass, BookOpen, Wifi, WifiOff, ArrowLeft } from 'lucide-react';

export default function Header({
  telemetry,
  isConnected,
  onOpenResearchModal,
  onBackToLanding,
}) {
  const scenario = telemetry?.scenario || 'NORMAL';
  const selectedMode = telemetry?.selected_mode || 'HYBRID';
  const isOutage = telemetry?.is_outage || false;

  const getScenarioBadge = () => {
    switch (scenario) {
      case 'OUTAGE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/80 border border-red-500/80 text-red-300 animate-pulse shadow-sm shadow-red-950">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            OUTAGE (SOFTWARE-SIMULATED)
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 border border-amber-500/80 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            DEGRADED GNSS
          </span>
        );
      case 'RECOVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 border border-purple-500/80 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            RECOVERY FILTERING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/80 text-emerald-300">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            MODE: PURE DR (INERTIAL)
          </span>
        );
      case 'GNSS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/40">
            <Satellite className="w-3.5 h-3.5 text-sky-400" />
            MODE: GNSS-DIRECT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            MODE: HYBRID (CONTINUOUS EKF)
          </span>
        );
    }
  };

  return (
    <header className="bg-[#080d1a]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 sm:px-10 py-3.5 sticky top-0 z-30 shadow-2xl transition">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back button + Official Logo + Project Title */}
        <div className="flex items-center gap-4 sm:gap-6">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition"
              title="Return to 3D Overview"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">3D Overview</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            {/* Official Project Logo */}
            <img
              src="/vyra-logo.png"
              alt="VYRA Logo"
              className="h-9 sm:h-10 w-auto object-contain filter drop-shadow hover:scale-105 transition"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">
                  VYRA RESEARCH REPLAY
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  Split V-S3a
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Forecast-Driven Adaptive Navigation-Mode Selection for Resilient GNSS/Dead-Reckoning Localization
              </p>
            </div>
          </div>
        </div>

        {/* Right: Operational Status Badges + Action Buttons */}
        <div className="flex items-center gap-3">
          {getScenarioBadge()}
          {getModeBadge()}

          <button
            onClick={onOpenResearchModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 transition shadow hover:border-slate-700"
            title="Inspect validated publication tables and figures"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Research Tables</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 border border-slate-800/80 text-slate-400">
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
      </div>
    </header>
  );
}
