import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Activity,
  Compass,
  Satellite,
  Clock,
  Gauge,
  AlertTriangle,
  History,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import TrajectoryMapCanvas from '../TrajectoryMapCanvas';
import StatusExplanationPanel from '../StatusExplanationPanel';
import { fetchSimulationSlice } from '../../../services/api';

export default function LiveSimulatorTab({
  globalTelemetry,
  pathsData,
  onRecordHistory,
}) {
  // Local simulator state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1500); // Start near interesting drive segment
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [currentTel, setCurrentTel] = useState(globalTelemetry);
  const [localHistory, setLocalHistory] = useState([]);
  const [transitionHistory, setTransitionHistory] = useState([
    {
      id: 1,
      step: 1420,
      timestamp: '00:02:22',
      from: 'GNSS',
      to: 'HYBRID',
      reason: 'Elevated HDOP detected; engaged EKF continuous fusion.',
    },
  ]);

  // Outage injection state
  const [injectedOutageDuration, setInjectedOutageDuration] = useState(0); // 0 = none, 5, 10, 20, 30
  const [outageStartEpoch, setOutageStartEpoch] = useState(null);
  const [outageRemaining, setOutageRemaining] = useState(0);

  const prevModeRef = useRef('HYBRID');

  // Simulation step timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(30, Math.round(100 / simSpeed));
    const timer = setInterval(async () => {
      setCurrentIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= 24621) {
          setIsPlaying(false);
          return prevIdx;
        }

        // Outage countdown
        if (outageStartEpoch !== null && injectedOutageDuration > 0) {
          const elapsedSec = (nextIdx - outageStartEpoch) * 0.1;
          const rem = Math.max(0, injectedOutageDuration - elapsedSec);
          setOutageRemaining(rem);
          if (rem <= 0) {
            setOutageStartEpoch(null);
            setInjectedOutageDuration(0);
          }
        }

        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, outageStartEpoch, injectedOutageDuration]);

  // Fetch telemetry slice for current index
  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      const slice = await fetchSimulationSlice(
        currentIndex,
        1,
        outageStartEpoch,
        injectedOutageDuration
      );
      if (isMounted && slice?.epochs && slice.epochs.length > 0) {
        const tel = slice.epochs[0];
        setCurrentTel(tel);
        setLocalHistory((prev) => [...prev.slice(-180), tel]);

        // Detect mode transition
        if (tel.selected_mode !== prevModeRef.current) {
          const newTransition = {
            id: Date.now(),
            step: tel.index,
            timestamp: formatTime(tel.relative_time_s),
            from: prevModeRef.current,
            to: tel.selected_mode,
            reason: tel.decision_reason,
          };
          setTransitionHistory((th) => [newTransition, ...th.slice(0, 19)]);
          prevModeRef.current = tel.selected_mode;

          // Record in experiment history if outage was active
          if (injectedOutageDuration > 0 && onRecordHistory) {
            onRecordHistory({
              scenario: `Outage Stress (${injectedOutageDuration}s)`,
              outageDuration: injectedOutageDuration,
              mode: tel.selected_mode,
              error: tel.current_error_m,
            });
          }
        }
      }
    }
    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, [currentIndex, outageStartEpoch, injectedOutageDuration]);

  // Outage injection trigger
  const handleInjectOutage = (durationSeconds) => {
    setInjectedOutageDuration(durationSeconds);
    setOutageStartEpoch(currentIndex);
    setOutageRemaining(durationSeconds);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(1500);
    setInjectedOutageDuration(0);
    setOutageStartEpoch(null);
    setOutageRemaining(0);
    setLocalHistory([]);
  };

  const formatTime = (seconds) => {
    const s = Math.floor(seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOutageActive = outageRemaining > 0 || currentTel?.is_outage;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Control & Outage Injection Deck */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                onClick={() => setIsPlaying(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>START SIMULATION</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPlaying(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs shadow-lg shadow-amber-600/30 transition"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>PAUSE</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono transition"
              title="Reset to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-mono">
              {[1.0, 2.0, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    simSpeed === s
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Time & Epoch Status */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Time:</span>
              <span className="text-white font-bold">
                {formatTime(currentTel?.relative_time_s || currentIndex * 0.1)}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Epoch:</span>
              <span className="text-white font-bold">{currentIndex} / 24,621</span>
            </div>
          </div>
        </div>

        {/* 2. GNSS Outage Injection Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
              INJECT GNSS OUTAGE:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 20, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => handleInjectOutage(sec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition border ${
                  injectedOutageDuration === sec && outageRemaining > 0
                    ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 animate-pulse'
                    : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-900/60 hover:border-rose-500'
                }`}
              >
                {sec}s Outage
              </button>
            ))}
          </div>

          {outageRemaining > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs font-mono animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>OUTAGE REMAINING: {outageRemaining.toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* Timeline Slider */}
        <div className="pt-1">
          <input
            type="range"
            min={0}
            max={24620}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* 2. Live Geodetic Map Visualizer */}
      <TrajectoryMapCanvas
        telemetry={currentTel}
        history={localHistory}
        pathsData={pathsData}
        isOutage={isOutageActive}
      />

      {/* 3. Live Gauges & State Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Mode */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">Navigation Mode</div>
          <div className="text-base font-bold font-mono text-white flex items-center gap-1.5">
            {currentTel?.selected_mode === 'DR' ? (
              <Compass className="w-4 h-4 text-amber-400" />
            ) : currentTel?.selected_mode === 'GNSS' ? (
              <Satellite className="w-4 h-4 text-sky-400" />
            ) : (
              <Activity className="w-4 h-4 text-emerald-400" />
            )}
            <span
              className={
                currentTel?.selected_mode === 'DR'
                  ? 'text-amber-400'
                  : currentTel?.selected_mode === 'GNSS'
                  ? 'text-sky-400'
                  : 'text-emerald-400'
              }
            >
              {currentTel?.selected_mode || 'HYBRID'}
            </span>
          </div>
        </div>

        {/* GNSS Quality */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">GNSS Quality (Q_t)</div>
          <div className="text-base font-bold font-mono flex items-center gap-2">
            <span
              className={
                (currentTel?.gnss_quality || 0) < 0.3
                  ? 'text-rose-400'
                  : (currentTel?.gnss_quality || 0) < 0.7
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              {(currentTel?.gnss_quality || 0.95).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">/ 1.0</span>
          </div>
        </div>

        {/* Satellites */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">Satellites Tracked</div>
          <div className="text-base font-bold font-mono text-white">
            {isOutageActive ? '0 (MASKED)' : '14 SVs'}
          </div>
        </div>

        {/* Actual Localization Error */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">Actual Error (GT)</div>
          <div className="text-base font-bold font-mono text-cyan-300">
            {currentTel?.current_error_m !== undefined
              ? `${currentTel.current_error_m.toFixed(3)} m`
              : '0.412 m'}
          </div>
        </div>

        {/* Predicted Error (XGBoost) */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">Predicted (H=3s)</div>
          <div className="text-base font-bold font-mono text-indigo-300">
            {(currentTel?.forecast_hybrid || 0.38).toFixed(3)} m
          </div>
        </div>

        {/* DR Survivability */}
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">DR Survivability</div>
          <div className="text-base font-bold font-mono text-amber-300">
            {(currentTel?.dr_survivability_s || 14.5).toFixed(1)} s
          </div>
        </div>
      </div>

      {/* 4. Navigation Status & Decision Explanation (Feature Six) */}
      <StatusExplanationPanel
        telemetry={currentTel}
        lastTransitionTime={transitionHistory[0]?.timestamp || '00:02:22'}
        previousMode={transitionHistory[0]?.from || 'HYBRID'}
      />

      {/* 5. Mode Transition History Table */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Mode Transition Log & Handover Memory</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Anti-Chattering tau_dwell = 2.0s
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                <th className="py-2.5 px-3">Epoch</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Transition</th>
                <th className="py-2.5 px-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transitionHistory.map((th) => (
                <tr key={th.id} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 text-slate-300 font-mono">#{th.step}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{th.timestamp}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-slate-400">{th.from}</span>
                      <span className="text-cyan-400">→</span>
                      <span className="font-bold text-white">{th.to}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans">{th.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
