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
  const relativeTime = telemetry ? telemetry.relative_time_s.toFixed(1) : '0.0';
  const totalSeconds = totalEpochs > 0 ? ((totalEpochs - 1) * 0.1).toFixed(1) : '0.0';

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Controls: Play/Pause, Step, Reset, Speed */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700/60"
          title="Reset to trajectory start"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBack}
          disabled={currentIndex <= 0}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition border border-slate-700/60"
          title="Step back 1 epoch (0.1 s)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md shadow-amber-600/30 transition text-sm"
            title="Pause Replay"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30 transition text-sm"
            title="Start Continuous Replay"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play</span>
          </button>
        )}

        <button
          onClick={onStepForward}
          disabled={currentIndex >= totalEpochs - 1}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition border border-slate-700/60"
          title="Step forward 1 epoch (0.1 s)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 ml-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <FastForward className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {[0.5, 1.0, 2.0, 5.0, 10.0].map((rate) => (
            <button
              key={rate}
              onClick={() => onSpeedChange(rate)}
              className={`px-2 py-1 rounded font-mono font-medium transition ${
                speedMultiplier === rate
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress timeline slider */}
      <div className="flex-1 w-full max-w-2xl flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(1, totalEpochs - 1)}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition"
        />

        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 min-w-[170px] justify-end">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-blue-400">+{relativeTime}s</span>
          <span className="text-slate-500">/ {totalSeconds}s</span>
          <span className="text-slate-500 text-[10px]">({currentIndex}/{totalEpochs})</span>
        </div>
      </div>
    </div>
  );
}
