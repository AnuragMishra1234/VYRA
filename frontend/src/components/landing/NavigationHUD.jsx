import React from 'react';
import { Activity, Radio, ShieldAlert, Compass, Hourglass, Cpu } from 'lucide-react';

export default function NavigationHUD({ phase = 'NORMAL' }) {
  // Demo simulation telemetry corresponding to current 3D phase
  const getDemoData = () => {
    switch (phase) {
      case 'DEGRADED':
        return {
          quality: '48%',
          qualityVal: 0.48,
          qualityColor: 'text-amber-400',
          risk: '72%',
          riskColor: 'text-amber-400',
          drUncertainty: '1.4 m',
          survivability: '9.8 s',
          mode: 'HYBRID',
          modeBadge: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
          status: 'Multipath Detected',
        };
      case 'OUTAGE':
      case 'BRANCHING':
        return {
          quality: '0%',
          qualityVal: 0.0,
          qualityColor: 'text-rose-400',
          risk: '99%',
          riskColor: 'text-rose-400',
          drUncertainty: '2.8 m',
          survivability: '5.2 s',
          mode: 'DR (PREEMPTIVE)',
          modeBadge: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
          status: 'Complete Signal Dropout',
        };
      case 'DECISION':
        return {
          quality: '12%',
          qualityVal: 0.12,
          qualityColor: 'text-rose-400',
          risk: '89%',
          riskColor: 'text-rose-400',
          drUncertainty: '1.9 m',
          survivability: '7.5 s',
          mode: 'DR SELECTED',
          modeBadge: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
          status: 'Candidate Evaluated',
        };
      default: // NORMAL
        return {
          quality: '96%',
          qualityVal: 0.96,
          qualityColor: 'text-cyan-400',
          risk: '4%',
          riskColor: 'text-slate-400',
          drUncertainty: '0.8 m',
          survivability: '14.2 s',
          mode: 'HYBRID',
          modeBadge: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
          status: 'Nominal Satellite Fix',
        };
    }
  };

  const data = getDemoData();

  return (
    <div className="bg-[#0b0f19]/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3.5 shadow-2xl text-xs font-mono max-w-xs w-full pointer-events-auto">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nav State HUD</span>
        </div>
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono">
          Demo Sim
        </span>
      </div>

      {/* Grid of indicators */}
      <div className="space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400" /> GNSS Quality
          </span>
          <span className={`font-bold ${data.qualityColor}`}>{data.quality}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3 text-purple-400" /> Degradation Risk
          </span>
          <span className={`font-bold ${data.riskColor}`}>{data.risk}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-amber-400" /> DR Uncertainty
          </span>
          <span className="text-slate-200 font-bold">{data.drUncertainty}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Hourglass className="w-3 h-3 text-blue-400" /> Survivability
          </span>
          <span className="text-slate-200 font-bold">{data.survivability}</span>
        </div>

        {/* Selected Mode */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider">Mode</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${data.modeBadge}`}>
            {data.mode}
          </span>
        </div>
      </div>

      {/* Scientific Disclosure Disclaimer */}
      <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-500 text-center uppercase tracking-wider">
        Conceptual Visualization • Not Experimental Data
      </div>
    </div>
  );
}
