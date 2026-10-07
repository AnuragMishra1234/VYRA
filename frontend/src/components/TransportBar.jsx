import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward, Clock } from 'lucide-react';

export default function TransportBar({
  status,
  currentIndex,
  totalEpochs,
  speedMultiplier,
  telemetry,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSeek,
  onSpeedChange,
}) {
  const isPlaying = status === 'playing';
  const relativeTime =
    typeof telemetry?.relative_time_s === 'number' && !isNaN(telemetry.relative_time_s)
      ? telemetry.relative_time_s.toFixed(1)
      : ((currentIndex || 0) * 0.1).toFixed(1);
  const totalSeconds = totalEpochs > 1 ? ((totalEpochs - 1) * 0.1).toFixed(1) : '2462.0';
  const progressPct = totalEpochs > 1 ? ((Math.max(0, currentIndex) / (totalEpochs - 1)) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-[#0b101f]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl transition hover:border-slate-700/80">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Controls: Play/Pause, Step, Reset, Speed */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800 shadow-sm"
              title="Reset to start of trajectory (0.0s)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onStepBack}
              disabled={currentIndex <= 0}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition border border-slate-800 shadow-sm"
              title="Step backward 1 epoch (-0.1s)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {isPlaying ? (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 transition text-xs font-mono tracking-wider"
                title="Pause Replay"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition text-xs font-mono tracking-wider"
                title="Start 10 Hz Continuous Telemetry Replay"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY</span>
              </button>
            )}

            <button
              onClick={onStepForward}
              disabled={currentIndex >= totalEpochs - 1}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition border border-slate-800 shadow-sm"
              title="Step forward 1 epoch (+0.1s)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 text-xs">
            <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5 hidden sm:inline" />
            {[0.5, 1.0, 2.0, 5.0, 10.0].map((rate) => (
              <button
                key={rate}
                onClick={() => onSpeedChange(rate)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-medium transition ${
                  speedMultiplier === rate
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Progress Timeline Slider & Numeric Clock */}
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(1, totalEpochs - 1)}
              value={currentIndex}
              onChange={(e) => onSeek(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800 transition"
            />
          </div>

          {/* Readout */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300 justify-end min-w-[200px] bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white text-sm">+{relativeTime}s</span>
            <span className="text-slate-500 text-[11px]">/ {totalSeconds}s</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">({progressPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
