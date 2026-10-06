import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/landing/LandingPage';
import PrototypeView from './components/prototype/PrototypeView';
import {
  fetchPlaybackState,
  sendPlaybackControl,
  fetchTrajectoryPaths,
  createPlaybackWebSocket,
} from './services/api';

export default function App() {
  // View mode: 'landing' (cinematic 3D presentation) or 'prototype' (interactive replay dashboard)
  const [activeView, setActiveView] = useState(() => {
    return window.location.hash === '#prototype' ? 'prototype' : 'landing';
  });

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

  // Sync hash with view state
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#prototype') {
        setActiveView('prototype');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

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
        console.warn('Initial load warning: Backend may still be spinning up.', err);
      }
    }

    init();

    // 3. Connect WebSocket for 10 Hz Telemetry Stream
    const ws = createPlaybackWebSocket(
      (data) => {
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
        setIsConnected(true);
        setApiError(null);
      },
      () => {
        setIsConnected(false);
      },
      (err) => {
        console.warn('WS info', err);
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

  const launchPrototype = () => {
    setActiveView('prototype');
    window.location.hash = '#prototype';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToLanding = () => {
    setActiveView('landing');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {activeView === 'landing' ? (
        <LandingPage
          onLaunchPrototype={launchPrototype}
          isResearchModalOpen={isResearchModalOpen}
          onOpenResearchModal={() => setIsResearchModalOpen(true)}
          onCloseResearchModal={() => setIsResearchModalOpen(false)}
        />
      ) : (
        <PrototypeView
          telemetry={telemetry}
          status={status}
          currentIndex={currentIndex}
          totalEpochs={totalEpochs}
          speedMultiplier={speedMultiplier}
          pathsData={pathsData}
          history={history}
          isConnected={isConnected}
          isResearchModalOpen={isResearchModalOpen}
          apiError={apiError}
          onPlay={handlePlay}
          onPause={handlePause}
          onStepForward={handleStepForward}
          onStepBack={handleStepBack}
          onReset={handleReset}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
          onOpenResearchModal={() => setIsResearchModalOpen(true)}
          onCloseResearchModal={() => setIsResearchModalOpen(false)}
          onBackToLanding={backToLanding}
        />
      )}
    </>
  );
}
