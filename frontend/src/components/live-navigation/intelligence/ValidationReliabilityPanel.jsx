import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Cpu,
  Clock,
  Activity,
  Layers,
  Filter,
} from 'lucide-react';

export default function ValidationReliabilityPanel({ validationSuite }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL', 'PASS', 'WARNING', 'FAIL'

  const checks = validationSuite?.checks || [];
  const overallStatus = validationSuite?.overall_status || 'PASS';
  const healthScore = validationSuite?.health_score_pct || 100.0;
  const passedCount = validationSuite?.passed_checks || checks.length;
  const warningCount = validationSuite?.warning_checks || 0;
  const failedCount = validationSuite?.failed_checks || 0;

  const filteredChecks = checks.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Hero */}
      <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                FEATURE D — SYSTEM RELIABILITY & AUTOMATED AUDIT SUITE
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live automated assertions across 8 core engineering dimensions for every execution run
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-xs">
              <span className="text-slate-400 block text-[10px]">HEALTH SCORE</span>
              <span className="text-2xl font-bold text-emerald-400">{healthScore}%</span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border shadow-lg ${
                overallStatus === 'PASS'
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
              }`}
            >
              {overallStatus === 'PASS' ? 'SYSTEM HEALTHY' : 'AUDIT WARNING'}
            </div>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 font-mono text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-slate-400">TOTAL CHECKS:</span>
            <span className="text-white font-bold">{checks.length}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> PASSED:
            </span>
            <span className="text-emerald-400 font-bold">{passedCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> WARNINGS:
            </span>
            <span className="text-amber-400 font-bold">{warningCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
            <span className="text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> FAILED:
            </span>
            <span className="text-rose-400 font-bold">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1.5 font-bold">
          <FileCheck className="w-4 h-4 text-blue-400" />
          DETAILED AUDIT LOG ({filteredChecks.length} CHECKS DISPLAYED)
        </span>

        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {['ALL', 'PASS', 'WARNING', 'FAIL'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
                filter === lvl
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Audit Checks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChecks.map((chk) => {
          const isPass = chk.status === 'PASS';
          const isWarn = chk.status === 'WARNING';

          return (
            <div
              key={chk.id}
              className={`bg-[#0b1329] border rounded-2xl p-4.5 font-mono text-xs transition-all shadow-md ${
                isPass
                  ? 'border-slate-800/80 hover:border-slate-700'
                  : isWarn
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-rose-500/60 bg-rose-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    {chk.category} &bull; {chk.id}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{chk.title}</h4>
                </div>

                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                    isPass
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : isWarn
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  }`}
                >
                  {isPass ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {chk.status}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl space-y-1 mb-2.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">MEASURED METRIC:</span>
                  <span className="text-white font-bold">{chk.metric}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                  <span>THRESHOLD LIMIT:</span>
                  <span>{chk.threshold}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                {chk.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
