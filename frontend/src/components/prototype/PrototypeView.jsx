import React from 'react';
import Header from '../Header';
import TransportBar from '../TransportBar';
import MapView from '../MapView';
import CandidateForecastPanel from '../CandidateForecastPanel';
import TelemetryMonitor from '../TelemetryMonitor';
import PlotsView from '../PlotsView';
import ModeTimeline from './ModeTimeline';
import ResearchModal from '../ResearchModal';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

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
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Return to Landing Bar */}
      <div className="bg-[#060911] border-b border-slate-800/80 px-6 py-1.5 flex items-center justify-between text-xs font-mono">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
          <span>&larr; Return to 3D Overview &amp; Research Landing</span>
        </button>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">
          Interactive Research Replay Protocol
        </span>
      </div>

      {/* Top Header */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        onOpenResearchModal={onOpenResearchModal}
      />

      {/* Playback Transport & Timeline Bar */}
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

      {/* Backend API Error Banner */}
      {apiError && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 underline text-rose-300 hover:text-white"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Main Research Workspace Grid */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1700px] w-full mx-auto">
        {/* Left Column (7 cols): Map + Mode Timeline + Plotly Real-Time Error Plot */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Map View */}
          <div className="flex-1 min-h-[460px]">
            <MapView pathsData={pathsData} telemetry={telemetry} />
          </div>

          {/* Mode Timeline */}
          <ModeTimeline
            currentIndex={currentIndex}
            totalEpochs={totalEpochs}
            selectedMode={telemetry?.selected_mode || 'HYBRID'}
          />

          {/* Plotly Chart: Localization Error vs Time */}
          <PlotsView history={history} />
        </div>

        {/* Right Column (5 cols): Candidate Forecasts + Telemetry Monitor */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Action-Conditioned Forecasting Panel */}
          <CandidateForecastPanel telemetry={telemetry} />

          {/* Real-Time Telemetry & Sensor Uncertainty Monitor */}
          <TelemetryMonitor telemetry={telemetry} />

          {/* Ground Truth & Methodology Scientific Disclosure Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-400 leading-relaxed flex flex-col gap-2">
            <div className="font-bold uppercase tracking-wider text-slate-300 text-[10px]">
              Scientific Provenance &amp; Disclosures
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>
                <span className="text-slate-200 font-semibold">Offline Reference:</span> Reference trajectory is recorded tactical-grade RTK GNSS/INS truth (<span className="text-white font-mono">OFFLINE REFERENCE</span>).
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Degradation Realism:</span> Outages are software-simulated sensor dropouts applied strictly after causal data windowing.
              </li>
              <li>
                <span className="text-slate-200 font-semibold">Zero Synthetic Data:</span> All metrics and candidate cards originate from the Phase 4/5 XGBoost forecast pipeline.
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Research Results Modal */}
      <ResearchModal
        isOpen={isResearchModalOpen}
        onClose={onCloseResearchModal}
      />
    </div>
  );
}
