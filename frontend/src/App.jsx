import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import TransportBar from './components/TransportBar';
import MapView from './components/MapView';
import CandidateForecastPanel from './components/CandidateForecastPanel';
import TelemetryMonitor from './components/TelemetryMonitor';
import PlotsView from './components/PlotsView';
import ResearchModal from './components/ResearchModal';
import {
  fetchPlaybackState,
  sendPlaybackControl,
  fetchTrajectoryPaths,
  createPlaybackWebSocket,
} from './services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [status, setStatus] = useState('paused');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(24621);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [pathsData, setPathsData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [apiError, setApiError] = useState(null);

  const wsRef = useRef(null);

  // Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        setApiError(null);
        // 1. Initial State
        const state = await fetchPlaybackState();
        setStatus(state.status);
        setCurrentIndex(state.current_index);
        setTotalEpochs(state.total_epochs);
        setSpeedMultiplier(state.speed_multiplier);
        if (state.telemetry) {
          setTelemetry(state.telemetry);
          setHistory([state.telemetry]);
        }

        // 2. Trajectory Paths for Map
        const paths = await fetchTrajectoryPaths('V-S3a', 25);
        setPathsData(paths);
      } catch (err) {
        console.error('Failed initial load', err);
        setApiError('Unable to connect to VYRA backend on port 8000. Ensure the FastAPI server is running.');
      }
    }

    init();

    // 3. Connect WebSocket for 10 Hz Telemetry Stream
    const ws = createPlaybackWebSocket(
      (data) => {
        // On Message
        if (data.status) setStatus(data.status);
        if (data.current_index !== undefined) setCurrentIndex(data.current_index);
        if (data.total_epochs !== undefined) setTotalEpochs(data.total_epochs);
        if (data.speed_multiplier !== undefined) setSpeedMultiplier(data.speed_multiplier);
        if (data.telemetry) {
          setTelemetry(data.telemetry);
          setHistory((prev) => [...prev.slice(-150), data.telemetry]);
        }
      },
      () => {
        // On Open
        setIsConnected(true);
        setApiError(null);
      },
      () => {
        // On Close
        setIsConnected(false);
      },
      (err) => {
        // On Error
        console.warn('WS error', err);
      }
    );

    wsRef.current = ws;

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Control Handlers
  const handlePlay = async () => {
    try {
      const res = await sendPlaybackControl('play');
      setStatus(res.status);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      const res = await sendPlaybackControl('pause');
      setStatus(res.status);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepForward = async () => {
    try {
      const res = await sendPlaybackControl('step');
      setCurrentIndex(res.current_index);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
        setHistory((prev) => [...prev.slice(-150), res.telemetry]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepBack = async () => {
    try {
      const res = await sendPlaybackControl('step_back');
      setCurrentIndex(res.current_index);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
        setHistory((prev) => [...prev.slice(-150), res.telemetry]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await sendPlaybackControl('reset');
      setCurrentIndex(res.current_index);
      setStatus(res.status);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
        setHistory([res.telemetry]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeek = async (idx) => {
    try {
      setCurrentIndex(idx);
      const res = await sendPlaybackControl('seek', idx);
      if (res.telemetry) {
        setTelemetry(res.telemetry);
        setHistory((prev) => [...prev.slice(-150), res.telemetry]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSpeedChange = async (speed) => {
    try {
      setSpeedMultiplier(speed);
      const res = await sendPlaybackControl(status === 'playing' ? 'play' : 'pause', null, speed);
      setSpeedMultiplier(res.speed_multiplier);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        onOpenResearchModal={() => setIsResearchModalOpen(true)}
      />

      {/* Playback Transport & Timeline Bar */}
      <TransportBar
        status={status}
        currentIndex={currentIndex}
        totalEpochs={totalEpochs}
        speedMultiplier={speedMultiplier}
        telemetry={telemetry}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
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
        {/* Left Column (7 cols): Map + Plotly Real-Time Error Plot */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Map View */}
          <div className="flex-1 min-h-[460px]">
            <MapView pathsData={pathsData} telemetry={telemetry} />
          </div>

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
              Scientific Provenance & Disclosures
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
        onClose={() => setIsResearchModalOpen(false)}
      />
    </div>
  );
}
