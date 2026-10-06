import React from 'react';
import { Compass, Radio, Activity } from 'lucide-react';

export default function ModeTimeline({ currentIndex = 0, totalEpochs = 24621, selectedMode = 'HYBRID' }) {
  const progressPct = totalEpochs > 0 ? (currentIndex / (totalEpochs - 1)) * 100 : 0;

  const modes = [
    { id: 'GNSS', label: 'GNSS-Direct', color: 'bg-sky-400', textColor: 'text-sky-400', icon: Radio },
    { id: 'HYBRID', label: 'Fixed HYBRID (EKF)', color: 'bg-emerald-400', textColor: 'text-emerald-400', icon: Activity },
    { id: 'DR', label: 'Pure Inertial (DR)', color: 'bg-amber-400', textColor: 'text-amber-400', icon: Compass },
  ];

  return (
    <div className="bg-[#0b101f]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px] text-slate-400">
        <span className="uppercase font-bold tracking-wider text-slate-300">
          Playback Mode Timeline Synchronization
        </span>
        <div className="flex items-center gap-3">
          <span>Active: <strong className="text-white">{selectedMode}</strong></span>
          <span>{progressPct.toFixed(1)}% Completed</span>
        </div>
      </div>

      {/* Lanes */}
      <div className="space-y-1.5 relative py-1">
        {modes.map((m) => {
          const isCurrentActive = selectedMode === m.id;
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span className={`w-28 text-[10px] font-semibold truncate ${isCurrentActive ? m.textColor : 'text-slate-500'}`}>
                {m.id}
              </span>

              {/* Lane track */}
              <div className="flex-1 h-3 bg-slate-950 rounded-full relative overflow-hidden border border-slate-800/80">
                {/* Simulated segments representing regime availability */}
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCurrentActive ? `${m.color} opacity-80` : 'bg-slate-800/40 opacity-30'
                  }`}
                  style={{ width: `${Math.max(2, progressPct)}%` }}
                />
              </div>

              {isCurrentActive ? (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              ) : (
                <span className="w-2 h-2"></span>
              )}
            </div>
          );
        })}

        {/* Vertical Playhead Cursor */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none transition-all duration-100 z-10"
          style={{ left: `calc(7rem + (100% - 7.5rem) * ${progressPct / 100})` }}
        />
      </div>
    </div>
  );
}
