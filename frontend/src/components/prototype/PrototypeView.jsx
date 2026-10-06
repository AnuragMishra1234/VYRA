import React, { useState } from 'react';
import Header from '../Header';
import TransportBar from '../TransportBar';
import MapView from '../MapView';
import CandidateForecastPanel from '../CandidateForecastPanel';
import TelemetryMonitor from '../TelemetryMonitor';
import PlotsView from '../PlotsView';
import ModeTimeline from './ModeTimeline';
import ResearchModal from '../ResearchModal';
import { AlertTriangle, RefreshCw, Layers, Compass, Target, LineChart, LayoutGrid } from 'lucide-react';

export default function PrototypeView({
  telemetry,
  status,
  currentIndex,
  totalEpochs,
  speedMultiplier,
  pathsData,
  history,
  isConnected,
  isResearchModalOpen,
  apiError,
  onPlay,
  onPause,
  onStepForward,
  onStepBack,
  onReset,
  onSeek,
  onSpeedChange,
  onOpenResearchModal,
  onCloseResearchModal,
  onBackToLanding,
}) {
  // Workspace Layout Mode: 'panoramic', 'map', 'forecast', 'analytics'
  const [workspaceMode, setWorkspaceMode] = useState('panoramic');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 1. Unified Spacious Header */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        onOpenResearchModal={onOpenResearchModal}
        onBackToLanding={onBackToLanding}
      />

      {/* 2. Main Workspace Container with Generous Spacing */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 sm:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Backend API Error Banner if offline */}
        {apiError && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-6 py-3.5 rounded-2xl flex items-center justify-between text-xs font-mono shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 underline text-rose-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* 3. Floating Replay Transport Deck */}
        <TransportBar
          status={status}
          currentIndex={currentIndex}
          totalEpochs={totalEpochs}
          speedMultiplier={speedMultiplier}
          telemetry={telemetry}
          onPlay={onPlay}
          onPause={onPause}
          onStepForward={onStepForward}
          onStepBack={onStepBack}
          onReset={onReset}
          onSeek={onSeek}
          onSpeedChange={onSpeedChange}
        />

        {/* 4. Workspace View Filter Tabs (Giving user freedom to focus or view panoramic) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            {[
              { id: 'panoramic', label: 'Panoramic Workspace', icon: LayoutGrid },
              { id: 'map', label: 'Geodetic Map Focus', icon: Compass },
              { id: 'forecast', label: 'Risk Forecast Engine', icon: Target },
              { id: 'analytics', label: 'Performance Analytics', icon: LineChart },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = workspaceMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceMode(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Trajectory: <strong className="text-slate-300">V-S3a</strong> &bull; Total Drive: <strong className="text-slate-300">2,462.0 s</strong> &bull; Sampling: <strong className="text-slate-300">10 Hz</strong>
          </div>
        </div>

        {/* 5. Dynamic Workspace Content with High Breathing Room */}
        {workspaceMode === 'panoramic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Expansive Map, Mode Timeline, Plotly Analytics */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Expansive Map View */}
              <div className="h-[520px] sm:h-[580px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
                <MapView pathsData={pathsData} telemetry={telemetry} />
              </div>

              {/* Synchronized Mode Timeline */}
              <ModeTimeline
                currentIndex={currentIndex}
                totalEpochs={totalEpochs}
                selectedMode={telemetry?.selected_mode || 'HYBRID'}
              />

              {/* Real-time Tracking Error Plot */}
              <PlotsView history={history} />
            </div>

            {/* Right 5 Columns: Candidate Forecasts + Telemetry Monitor */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Action-Conditioned Forecasting Panel */}
              <CandidateForecastPanel telemetry={telemetry} />

              {/* Live Telemetry & Degradation Monitor */}
              <TelemetryMonitor telemetry={telemetry} />

              {/* Scientific Provenance Disclosure Card */}
              <div className="bg-[#0b101f]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 leading-relaxed font-sans space-y-2">
                <div className="font-mono text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                  Scientific Provenance &amp; Disclosures
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
                  <li>
                    <span className="text-slate-200 font-semibold">Offline Reference:</span> Reference trajectory is tactical-grade RTK GNSS/INS (<span className="text-white font-mono">OFFLINE REFERENCE</span>).
                  </li>
                  <li>
                    <span className="text-slate-200 font-semibold">Degradation Realism:</span> Outages are software-simulated sensor dropouts applied strictly after causal data windowing.
                  </li>
                  <li>
                    <span className="text-slate-200 font-semibold">Zero Synthetic Data:</span> Every metric, probability, and forecast originates directly from evaluated research models.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* View Mode: Geodetic Map Focus */}
        {workspaceMode === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9 h-[680px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
              <MapView pathsData={pathsData} telemetry={telemetry} />
            </div>
            <div className="lg:col-span-3 flex flex-col gap-6">
              <TelemetryMonitor telemetry={telemetry} />
              <ModeTimeline
                currentIndex={currentIndex}
                totalEpochs={totalEpochs}
                selectedMode={telemetry?.selected_mode || 'HYBRID'}
              />
            </div>
          </div>
        )}

        {/* View Mode: Risk Forecast Engine Focus */}
        {workspaceMode === 'forecast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <CandidateForecastPanel telemetry={telemetry} />
              <ModeTimeline
                currentIndex={currentIndex}
                totalEpochs={totalEpochs}
                selectedMode={telemetry?.selected_mode || 'HYBRID'}
              />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-6">
              <TelemetryMonitor telemetry={telemetry} />
              <PlotsView history={history} />
            </div>
          </div>
        )}

        {/* View Mode: Performance Analytics Focus */}
        {workspaceMode === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlotsView history={history} />
              <ModeTimeline
                currentIndex={currentIndex}
                totalEpochs={totalEpochs}
                selectedMode={telemetry?.selected_mode || 'HYBRID'}
              />
            </div>
            <div className="h-[460px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
              <MapView pathsData={pathsData} telemetry={telemetry} />
            </div>
          </div>
        )}
      </main>

      {/* Research Results & Publication Evidence Modal */}
      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={onCloseResearchModal}
      />
    </div>
  );
}
