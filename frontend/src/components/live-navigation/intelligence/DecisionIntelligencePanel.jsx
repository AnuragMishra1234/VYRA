import React from 'react';
import {
  Compass,
  Satellite,
  Activity,
  ArrowRight,
  Clock,
  Target,
  Shield,
  Zap,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Info,
} from 'lucide-react';

export default function DecisionIntelligencePanel({
  experimentData,
  selectedEpochIndex,
  onSelectEpoch,
}) {
  const epochs = experimentData?.epochs || [];
  const timelineEvents = experimentData?.timeline_events || [];

  if (epochs.length === 0) {
    return (
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Info className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-pulse" />
        <p className="font-mono text-sm">No experiment run active. Click "Inject Fault" to initiate the decision pipeline.</p>
      </div>
    );
  }

  // Find active epoch
  const activeEpoch = epochs[selectedEpochIndex] || epochs[0];
  const obs = activeEpoch?.observation || {};
  const candidates = activeEpoch?.candidates || {};
  const res = activeEpoch?.result || {};
  const selectedMode = activeEpoch?.selected_mode || 'HYBRID';
  const prevMode = activeEpoch?.previous_mode || selectedMode;

  return (
    <div className="space-y-6">
      {/* 1. Header & Timeline Navigation */}
      <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                FEATURE A — DECISION INTELLIGENCE / WHY VYRA CHOSE THIS MODE
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live causal state evaluation, candidate multi-objective cost optimization J(A), and prediction verification
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/90 border border-slate-700/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">EPOCH:</span>
            <span className="text-white font-bold">{activeEpoch.index}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-bold">{activeEpoch.relative_time_s}s</span>
          </div>
        </div>

        {/* Visual Clickable Decision Timeline */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              INTERACTIVE DECISION TIMELINE (Click any epoch to inspect)
            </span>
            <span className="text-[10px] text-slate-500">
              {timelineEvents.length} KEY TRANSITIONS RECORDED
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {timelineEvents.map((evt, idx) => {
              const isSelected = evt.epoch_index === activeEpoch.index;
              const modeColor =
                evt.selected_mode === 'DR'
                  ? 'border-amber-500/80 bg-amber-500/15 text-amber-300'
                  : evt.selected_mode === 'GNSS'
                  ? 'border-sky-500/80 bg-sky-500/15 text-sky-300'
                  : 'border-emerald-500/80 bg-emerald-500/15 text-emerald-300';

              return (
                <button
                  key={idx}
                  onClick={() => onSelectEpoch(evt.epoch_index)}
                  className={`flex-shrink-0 text-left px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-400 bg-blue-950/80 shadow-lg scale-105 z-10'
                      : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                    <span>{evt.time_s}s</span>
                    <span
                      className={`px-1 rounded text-[9px] font-bold ${
                        evt.event_type === 'FAULT_ONSET'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : evt.event_type === 'MODE_SWITCH'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {evt.event_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${modeColor.split(' ')[1]}`} />
                    <span className="font-bold text-white text-[11px]">{evt.selected_mode}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                    Err: {evt.current_error_m}m
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. The 5-Point Core Decision Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): 1. Observation & 3. Decision + 4. Reason */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 1: OBSERVATION */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                1. OBSERVATION
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">CURRENT SENSOR ENVIRONMENT</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">GNSS QUALITY SCORE</span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-base font-bold ${
                      obs.gnss_quality > 0.7
                        ? 'text-emerald-400'
                        : obs.gnss_quality > 0.3
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {obs.gnss_quality !== undefined ? obs.gnss_quality.toFixed(2) : '--'}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        obs.gnss_quality > 0.7
                          ? 'bg-emerald-400'
                          : obs.gnss_quality > 0.3
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${(obs.gnss_quality || 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">TRACKED SATELLITES</span>
                <div className="flex items-center gap-2 mt-1">
                  <Satellite className="w-4 h-4 text-cyan-400" />
                  <span className="text-base font-bold text-white">{obs.satellites ?? 0}</span>
                  <span className="text-[10px] text-slate-500">svs</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">VEHICLE VELOCITY</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {obs.speed_mps !== undefined ? obs.speed_mps.toFixed(1) : '12.0'} m/s
                </span>
                <span className="text-[10px] text-slate-500">
                  ({((obs.speed_mps || 12.0) * 3.6).toFixed(1)} km/h)
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">IMU YAW RATE</span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {obs.yaw_rate_rads !== undefined ? obs.yaw_rate_rads.toFixed(3) : '0.000'} rad/s
                </span>
                <span className="text-[10px] text-slate-500">CAN Gyro Stream</span>
              </div>
            </div>

            {/* Injected Fault Status */}
            <div
              className={`mt-3 p-2.5 rounded-xl text-xs font-mono border flex items-start gap-2 ${
                activeEpoch.is_fault_active
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                  : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              }`}
            >
              {activeEpoch.is_fault_active ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <span className="font-bold block text-[11px]">
                  {activeEpoch.is_fault_active ? 'ACTIVE FAULT INJECTION DETECTED' : 'NOMINAL ENVIRONMENT'}
                </span>
                <span className="text-[10px] opacity-90">{activeEpoch.fault_note}</span>
              </div>
            </div>
          </div>

          {/* Section 3: DECISION & Section 4: REASON */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                3. DECISION & 4. REASON
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">POLICY SELECTION</span>
            </div>

            {/* Winning Mode Hero Badge */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">SELECTED NAVIGATION MODE</span>
                <div className="flex items-center gap-2 mt-1">
                  {selectedMode === 'DR' ? (
                    <Compass className="w-5 h-5 text-amber-400" />
                  ) : selectedMode === 'GNSS' ? (
                    <Satellite className="w-5 h-5 text-sky-400" />
                  ) : (
                    <Activity className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="text-xl font-bold font-mono text-white tracking-wider">
                    {selectedMode}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">TRANSITION STATUS</span>
                {prevMode !== selectedMode ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-300 font-bold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                    {prevMode} <ArrowRight className="w-3 h-3" /> {selectedMode}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    HELD IN {selectedMode}
                  </span>
                )}
              </div>
            </div>

            {/* Natural Language Reason */}
            <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider block mb-1">
                ENGINEERING REASONING
              </span>
              <p className="text-xs text-slate-200 font-sans leading-relaxed">
                "{activeEpoch.decision_reason}"
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): 2. CANDIDATE EVALUATION & 5. RESULT */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 2: CANDIDATE EVALUATION */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  2. CANDIDATE EVALUATION
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">ACTION-CONDITIONED RISK COMPARISON</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Cost: J(A) = ê + β·E_thresh·P̂ + λ·I + Π_DR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['GNSS', 'HYBRID', 'DR'].map((mode) => {
                const c = candidates[mode] || {};
                const isWinner = selectedMode === mode;
                const isGated = c.is_gated || c.total_cost_J >= 900;

                return (
                  <div
                    key={mode}
                    className={`rounded-xl border p-3 font-mono transition-all relative ${
                      isWinner
                        ? 'bg-blue-950/50 border-blue-500/80 shadow-lg ring-1 ring-blue-500/40'
                        : isGated
                        ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    {isWinner && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-blue-600 text-[9px] font-bold text-white shadow">
                        SELECTED (MIN COST)
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                      <span>{mode}</span>
                      <span
                        className={`text-sm ${
                          isGated ? 'text-rose-400' : isWinner ? 'text-emerald-400' : 'text-slate-300'
                        }`}
                      >
                        J = {isGated ? 'INF' : c.total_cost_J}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] border-t border-slate-800/80 pt-2 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pred. Error (ê):</span>
                        <span className="font-bold text-white">{c.e_hat_m?.toFixed(2) || '--'}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">P(Viol &gt; 5m):</span>
                        <span className={c.p_viol > 0.5 ? 'text-rose-400' : 'text-emerald-400'}>
                          {(c.p_viol * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Switch Penalty:</span>
                        <span>+{c.switch_cost?.toFixed(2)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DR Penalty:</span>
                        <span>+{c.dr_penalty?.toFixed(2)}m</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] text-slate-400 bg-slate-950/70 p-1.5 rounded border border-slate-800/80 truncate">
                      {c.formula}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: RESULT / PREDICTION FIDELITY */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                5. RESULT & PREDICTION FIDELITY
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">
                FORECAST (t) VS GROUND TRUTH AT HORIZON (t + H)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs mb-3">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">PREDICTED ERROR (ê)</span>
                <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                  {res.predicted_error_m?.toFixed(3) || '--'}m
                </span>
                <span className="text-[9px] text-slate-500">Model Forecast</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">ACTUAL ERROR @ t+H</span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  {res.actual_future_error_m?.toFixed(3) || '--'}m
                </span>
                <span className="text-[9px] text-slate-500">Pristine Ground Truth</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">FORECAST DELTA (|ê - e|)</span>
                <span className="text-base font-bold text-amber-300 mt-0.5 block">
                  {res.prediction_delta_m?.toFixed(3) || '--'}m
                </span>
                <span className="text-[9px] text-slate-500">Estimation Residual</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block">PREDICTION ACCURACY</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  {res.fidelity_pct?.toFixed(1) || '--'}%
                </span>
                <span className="text-[9px] text-slate-500">Fidelity Score</span>
              </div>
            </div>

            {/* Safety Bounds Check */}
            <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">CRITICAL SAFETY ENVELOPE (Threshold: 5.0m):</span>
              </div>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  res.is_safe
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {res.is_safe ? 'PASS (CONTAINED)' : 'SAFETY BREACH'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
