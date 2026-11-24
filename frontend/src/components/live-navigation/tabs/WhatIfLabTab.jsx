import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Target,
  Activity,
  Compass,
  Satellite,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  BookmarkPlus,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { runWhatIfScenario } from '../../../services/api';

export default function WhatIfLabTab({ onRecordHistory }) {
  // Input parameters state
  const [params, setParams] = useState({
    gnss_quality: 0.85,
    satellite_count: 12,
    outage_duration_s: 0.0,
    vehicle_speed_mps: 12.5,
    prediction_horizon_s: 3.0,
    error_threshold_m: 5.0,
    initial_mode: 'HYBRID',
    degradation_level: 'NONE',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initial calculation on mount
  React.useEffect(() => {
    handleRunScenario();
  }, []);

  const handleRunScenario = async () => {
    setIsLoading(true);
    setSavedSuccess(false);
    try {
      const res = await runWhatIfScenario(params);
      if (currentResult) {
        setPreviousResult(currentResult);
      }
      setCurrentResult(res);
    } catch (err) {
      console.error('Failed to run scenario', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInputs = () => {
    setParams({
      gnss_quality: 0.85,
      satellite_count: 12,
      outage_duration_s: 0.0,
      vehicle_speed_mps: 12.5,
      prediction_horizon_s: 3.0,
      error_threshold_m: 5.0,
      initial_mode: 'HYBRID',
      degradation_level: 'NONE',
    });
  };

  const handleSaveToHistory = () => {
    if (!currentResult || !onRecordHistory) return;
    onRecordHistory({
      scenario: `What-If: ${params.degradation_level} (${params.outage_duration_s}s Outage)`,
      outageDuration: params.outage_duration_s,
      mode: currentResult.selected_mode,
      error: currentResult.forecasts?.[currentResult.selected_mode] || 0.45,
      cost: currentResult.costs?.[currentResult.selected_mode],
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Sliders className="w-3.5 h-3.5" />
            <span>Multi-Objective Scenario Laboratory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
            What-If Counterfactual Navigation Lab
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Tune vehicle kinematics, GNSS dilution, and outage durations to observe the exact multi-objective
            cost function $J(A)$ and short-horizon error bounds computed by VYRA's decision supervisor.
          </p>
        </div>
      </div>

      {/* 2. Main Two-Column Layout: Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Interactive Controls (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Input Parameters</span>
            </h3>
            <button
              onClick={handleResetInputs}
              className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* GNSS Quality Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">GNSS Signal Quality (Q_t):</span>
                <span className="text-cyan-400 font-bold">{params.gnss_quality.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={params.gnss_quality}
                onChange={(e) => setParams({ ...params, gnss_quality: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>0.0 (Masked / Jammed)</span>
                <span>1.0 (Pristine)</span>
              </div>
            </div>

            {/* Satellite Count */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">Tracked Satellites (SVs):</span>
                <span className="text-indigo-400 font-bold">{params.satellite_count} SVs</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={params.satellite_count}
                onChange={(e) => setParams({ ...params, satellite_count: parseInt(e.target.value) })}
                className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>0 SVs</span>
                <span>12 SVs (Nominal)</span>
                <span>24 SVs</span>
              </div>
            </div>

            {/* Injected Outage Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">Outage Duration:</span>
                <span className="text-rose-400 font-bold">{params.outage_duration_s.toFixed(1)} s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="30.0"
                step="1.0"
                value={params.outage_duration_s}
                onChange={(e) => setParams({ ...params, outage_duration_s: parseFloat(e.target.value) })}
                className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                <span>0s (Continuous)</span>
                <span>10s</span>
                <span>30s (Severe)</span>
              </div>
            </div>

            {/* Vehicle Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">Vehicle Speed:</span>
                <span className="text-emerald-400 font-bold">
                  {params.vehicle_speed_mps.toFixed(1)} m/s ({(params.vehicle_speed_mps * 3.6).toFixed(0)} km/h)
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="35.0"
                step="0.5"
                value={params.vehicle_speed_mps}
                onChange={(e) => setParams({ ...params, vehicle_speed_mps: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Prediction Horizon */}
            <div className="space-y-1.5">
              <label className="text-slate-300 block">Forecasting Horizon (H):</label>
              <div className="grid grid-cols-4 gap-2">
                {[1.0, 3.0, 5.0, 10.0].map((h) => (
                  <button
                    key={h}
                    onClick={() => setParams({ ...params, prediction_horizon_s: h })}
                    className={`py-1.5 rounded-lg border text-center transition ${
                      params.prediction_horizon_s === h
                        ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {h}s
                  </button>
                ))}
              </div>
            </div>

            {/* Degradation Level */}
            <div className="space-y-1.5">
              <label className="text-slate-300 block">Degradation Regime:</label>
              <select
                value={params.degradation_level}
                onChange={(e) => setParams({ ...params, degradation_level: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="NONE">NONE (Nominal Open Sky)</option>
                <option value="MINOR">MINOR (Tree Canopy / Foliage)</option>
                <option value="MULTIPATH">MULTIPATH (Urban Canyon Reflection)</option>
                <option value="SEVERE">SEVERE (Jamming / Complete Loss)</option>
              </select>
            </div>

            {/* Error Safety Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300">Safety Error Threshold (E_thresh):</span>
                <span className="text-amber-400 font-bold">{params.error_threshold_m.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="15.0"
                step="0.5"
                value={params.error_threshold_m}
                onChange={(e) => setParams({ ...params, error_threshold_m: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Initial Pre-Switch Mode */}
            <div className="space-y-1.5">
              <label className="text-slate-300 block">Initial Operating Mode:</label>
              <div className="grid grid-cols-3 gap-2">
                {['GNSS', 'HYBRID', 'DR'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setParams({ ...params, initial_mode: m })}
                    className={`py-1.5 rounded-lg border text-center transition ${
                      params.initial_mode === m
                        ? 'bg-slate-800 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RUN SCENARIO Button */}
          <button
            onClick={handleRunScenario}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono font-bold text-xs tracking-wider uppercase shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Computing Decision Costs J(A)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>RUN SCENARIO</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Scenario Evaluation Results (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {currentResult ? (
            <>
              {/* Primary Selected Mode Card */}
              <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl border ${
                        currentResult.selected_mode === 'DR'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : currentResult.selected_mode === 'GNSS'
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                          : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {currentResult.selected_mode === 'DR' ? (
                        <Compass className="w-6 h-6" />
                      ) : currentResult.selected_mode === 'GNSS' ? (
                        <Satellite className="w-6 h-6" />
                      ) : (
                        <Activity className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                        Arbitrated Optimal Mode
                      </div>
                      <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                        <span>{currentResult.selected_mode}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                          MIN RISK J(A)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Save to History Button */}
                  <button
                    onClick={handleSaveToHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{savedSuccess ? 'Saved to History!' : 'Save Scenario'}</span>
                  </button>
                </div>

                {/* Decision Reason */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white font-mono uppercase mr-1.5">POLICY REASON:</strong>
                  {currentResult.decision_reason}
                </div>

                {/* Candidate Action Costs Comparison Grid */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Candidate Action Risk Breakdown J(A)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    {['GNSS', 'HYBRID', 'DR'].map((act) => {
                      const cost = currentResult.costs?.[act];
                      const forecast = currentResult.forecasts?.[act];
                      const isSelected = currentResult.selected_mode === act;
                      const isGated = cost >= 999;

                      return (
                        <div
                          key={act}
                          className={`rounded-xl p-3.5 border transition ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/20'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-bold text-white">{act}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-600 text-white font-sans">
                                SELECTED
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Total Cost J:</span>
                              <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                                {isGated ? 'GATED (∞)' : cost}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Forecast Error:</span>
                              <span className="text-white">
                                {isGated ? 'N/A' : `${forecast?.toFixed(2)}m`}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>P(Viol &gt; {params.error_threshold_m}m):</span>
                              <span className="text-amber-400">
                                {isGated ? '1.00' : currentResult.violation_probabilities?.[act]?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Head-to-Head Comparison with Previous Scenario */}
              {previousResult && (
                <div className="bg-[#0a0f1d]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Delta Comparison vs Previous Run</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Prev Mode</div>
                      <div className="text-sm font-bold text-slate-300">{previousResult.selected_mode}</div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">Now: {currentResult.selected_mode}</div>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">HYBRID Forecast</div>
                      <div className="text-sm font-bold text-slate-300">
                        {previousResult.forecasts?.HYBRID?.toFixed(2)}m
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        Now: {currentResult.forecasts?.HYBRID?.toFixed(2)}m
                      </div>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">DR Forecast</div>
                      <div className="text-sm font-bold text-slate-300">
                        {previousResult.forecasts?.DR?.toFixed(2)}m
                      </div>
                      <div className="text-[10px] text-amber-400 mt-0.5">
                        Now: {currentResult.forecasts?.DR?.toFixed(2)}m
                      </div>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">Outage Duration</div>
                      <div className="text-sm font-bold text-slate-300">
                        {previousResult.inputs?.outage_duration_s}s
                      </div>
                      <div className="text-[10px] text-rose-400 mt-0.5">
                        Now: {currentResult.inputs?.outage_duration_s}s
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
              Select parameters and click <strong>RUN SCENARIO</strong> to evaluate decision costs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
