import React, { useState, useEffect, useRef } from 'react';
import LandingPage from './components/landing/LandingPage';
import PrototypeView from './components/prototype/PrototypeView';
import {
  fetchPlaybackState,
  sendPlaybackControl,
  fetchTrajectoryPaths,
  createPlaybackWebSocket,
} from './services/api';
import { getFallbackTelemetry } from './services/fallbackData';

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

  // Sync hash with view state in both directions
  useEffect(() => {
    const handleHash = () => {
      const isProto = window.location.hash === '#prototype';
      setActiveView(isProto ? 'prototype' : 'landing');
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
        if (state) {
          setStatus(state.status || 'paused');
          setCurrentIndex(state.current_index || 0);
          setTotalEpochs(state.total_epochs || 24621);
          setSpeedMultiplier(state.speed_multiplier || 1.0);
          if (state.telemetry) {
            setTelemetry(state.telemetry);
            setHistory([state.telemetry]);
          }
        }

        // 2. Trajectory Paths for Map
        const paths = await fetchTrajectoryPaths('V-S3a', 25);
        if (paths) {
          setPathsData(paths);
        }
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
        // Suppress noisy logs
      }
    );

    wsRef.current = ws;

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Standalone offline replay ticker when backend is not connected
  useEffect(() => {
    if (isConnected || status !== 'playing') return;

    const intervalMs = Math.max(25, Math.round(100 / (speedMultiplier || 1.0)));
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= totalEpochs) {
          setStatus('paused');
          return prev;
        }
        const simTel = getFallbackTelemetry(next);
        setTelemetry(simTel);
        setHistory((h) => [...h.slice(-150), simTel]);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isConnected, status, speedMultiplier, totalEpochs]);

  // Control Handlers
  const handlePlay = async () => {
    setStatus('playing');
    if (isConnected) {
      try {
        const res = await sendPlaybackControl('play');
        if (res?.status) setStatus(res.status);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handlePause = async () => {
    setStatus('paused');
    if (isConnected) {
      try {
        const res = await sendPlaybackControl('pause');
        if (res?.status) setStatus(res.status);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleStepForward = async () => {
    if (!isConnected) {
      const next = Math.min(totalEpochs - 1, currentIndex + 1);
      setCurrentIndex(next);
      const tel = getFallbackTelemetry(next);
      setTelemetry(tel);
      setHistory((prev) => [...prev.slice(-150), tel]);
      return;
    }
    try {
      const res = await sendPlaybackControl('step');
      if (res?.current_index !== undefined) setCurrentIndex(res.current_index);
      if (res?.telemetry) {
        setTelemetry(res.telemetry);
        setHistory((prev) => [...prev.slice(-150), res.telemetry]);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleStepBack = async () => {
    if (!isConnected) {
      const prevIdx = Math.max(0, currentIndex - 1);
      setCurrentIndex(prevIdx);
      const tel = getFallbackTelemetry(prevIdx);
      setTelemetry(tel);
      setHistory((prev) => [...prev.slice(-150), tel]);
      return;
    }
    try {
      const res = await sendPlaybackControl('step_back');
      if (res?.current_index !== undefined) setCurrentIndex(res.current_index);
      if (res?.telemetry) {
        setTelemetry(res.telemetry);
        setHistory((prev) => [...prev.slice(-150), res.telemetry]);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleReset = async () => {
    setStatus('paused');
    setCurrentIndex(0);
    const tel = getFallbackTelemetry(0);
    setTelemetry(tel);
    setHistory([tel]);
    if (isConnected) {
      try {
        await sendPlaybackControl('reset');
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSeek = async (idx) => {
    setCurrentIndex(idx);
    const tel = getFallbackTelemetry(idx);
    setTelemetry(tel);
    setHistory((prev) => [...prev.slice(-150), tel]);
    if (isConnected) {
      try {
        await sendPlaybackControl('seek', idx);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSpeedChange = async (speed) => {
    setSpeedMultiplier(speed);
    if (isConnected) {
      try {
        await sendPlaybackControl(status === 'playing' ? 'play' : 'pause', null, speed);
      } catch (err) {
        console.warn(err);
      }
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
