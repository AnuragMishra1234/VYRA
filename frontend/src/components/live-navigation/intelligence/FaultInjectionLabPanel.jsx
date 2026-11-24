import React from 'react';
import {
  Zap,
  Sliders,
  Play,
  RotateCcw,
  ShieldAlert,
  Radio,
  Building,
  Gauge,
  WifiOff,
  Cpu,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function FaultInjectionLabPanel({
  faultCatalog = [],
  activeConfig,
  onChangeConfig,
  onRunExperiment,
  isRunning,
  experimentResult,
}) {
  const selectedFault = activeConfig?.fault_type || 'COMPLETE_GPS_LOSS';
  const severity = activeConfig?.severity || 'HIGH';
  const durationS = activeConfig?.duration_s || 8.0;
  const sliceCount = activeConfig?.slice_count || 140;
  const seed = activeConfig?.seed || 42;
  const enforceDwell = activeConfig?.enforce_dwell !== false;

  const getFaultIcon = (id) => {
    switch (id) {
      case 'COMPLETE_GPS_LOSS':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'GRADUAL_DEGRADATION':
        return <Radio className="w-5 h-5 text-amber-400" />;
      case 'MULTIPATH_JITTER':
        return <Building className="w-5 h-5 text-cyan-400" />;
      case 'EXTENDED_OUTAGE':
        return <Gauge className="w-5 h-5 text-red-400" />;
      case 'GYRO_NOISE_BIAS':
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'SENSOR_DROPOUT':
        return <WifiOff className="w-5 h-5 text-orange-400" />;
      default:
        return <Zap className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleSelectFault = (fault) => {
    onChangeConfig({
      ...activeConfig,
      fault_type: fault.id,
      severity: fault.default_severity || 'HIGH',
      duration_s: fault.default_duration_s || 8.0,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
              FEATURE B — FAULT INJECTION LABORATORY
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Controlled physical disturbance injection across 6 genuine degradation & failure models
          </p>
        </div>

        {/* Quick Summary Pill if experiment ready */}
        {experimentResult && (
          <div className="flex items-center gap-3 text-xs font-mono bg-slate-900 border border-slate-700/80 px-3.5 py-1.5 rounded-xl">
            <span className="text-slate-400">LAST RUN:</span>
            <span className="text-emerald-400 font-bold">
              {experimentResult.summary_metrics?.ate_reduction_vs_gps_pct}% ERROR REDUCTION
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-bold">{experimentResult.execution_duration_ms} ms</span>
          </div>
        )}
      </div>

      {/* 2. Fault Catalog Grid (6 Cards) */}
      <div>
        <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            SELECT FAULT MODEL ({faultCatalog.length} AUTHENTIC SCENARIOS)
          </span>
          <span className="text-[10px] text-slate-500">All models apply genuine sensor perturbations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {faultCatalog.map((fault) => {
            const isSelected = selectedFault === fault.id;

            return (
              <button
                key={fault.id}
                onClick={() => handleSelectFault(fault)}
                className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/50 shadow-xl scale-[1.01]'
                    : 'bg-[#0b1329] hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {getFaultIcon(fault.id)}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold font-mono text-white group-hover:text-blue-300 transition">
                        {fault.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">{fault.category}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[9px] font-bold shadow">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2 mb-2">
                  {fault.description}
                </p>

                <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Default: {fault.default_duration_s}s</span>
                  <span className="text-slate-400">{fault.physics_note?.slice(0, 32)}...</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Parameter Configuration Panel & Primary Action */}
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h4 className="text-xs font-mono font-bold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          FAULT INJECTION PARAMETERS & PIPELINE SUPERVISOR
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Severity Selector */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1.5">SEVERITY LEVEL</span>
            <div className="grid grid-cols-3 gap-1">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onChangeConfig({ ...activeConfig, severity: lvl })}
                  className={`py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                    severity === lvl
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Slider */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-mono text-slate-400">OUTAGE DURATION</span>
              <span className="text-xs font-mono font-bold text-cyan-300">{durationS.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="30.0"
              step="1.0"
              value={durationS}
              onChange={(e) => onChangeConfig({ ...activeConfig, duration_s: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>1.0s</span>
              <span>15.0s</span>
              <span>30.0s</span>
            </div>
          </div>

          {/* Random Seed (for determinism) */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">DETERMINISTIC SEED</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => onChangeConfig({ ...activeConfig, seed: parseInt(e.target.value, 10) || 42 })}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onChangeConfig({ ...activeConfig, seed: Math.floor(Math.random() * 900) + 100 })}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
                title="Randomize Seed"
              >
                RND
              </button>
            </div>
            <span className="text-[9px] font-mono text-slate-500 mt-1 block">Guarantees 100% reproducible bitwise run</span>
          </div>

          {/* Anti-Chattering Dwell Toggle */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">DWELL-TIME HYSTERESIS</span>
              <button
                onClick={() => onChangeConfig({ ...activeConfig, enforce_dwell: !enforceDwell })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  enforceDwell ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    enforceDwell ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-300 mt-1">
              {enforceDwell ? 'T_dwell >= 0.5s (Enforced)' : 'Free Toggling (Unenforced)'}
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-mono text-slate-400">
            <span className="text-slate-300 font-bold">READY TO EXECUTE:</span> Injects{' '}
            <span className="text-rose-400 font-bold">{selectedFault}</span> for{' '}
            <span className="text-white font-bold">{durationS}s</span> into genuine 10 Hz pipeline.
          </div>

          <button
            onClick={onRunExperiment}
            disabled={isRunning}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-2xl ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-600/30 active:scale-[0.98]'
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>EXECUTING NAVIGATION PIPELINE...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>INJECT FAULT & RUN PIPELINE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
