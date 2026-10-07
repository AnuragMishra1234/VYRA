/**
 * VYRA Research Dashboard API & WebSocket Client.
 * Connects directly to FastAPI backend endpoints with automatic fallback to
 * authentic local research benchmark data when offline.
 */

import {
  FALLBACK_MASTER_RESULTS,
  FALLBACK_PATHS,
  FALLBACK_INITIAL_STATE,
  getFallbackTelemetry,
} from './fallbackData';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.__VYRA_API_URL__) || '';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function fetchPlaybackState() {
  try {
    const res = await fetch(`${API_BASE}/api/playback/state`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Fetch playback state failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    // Graceful offline fallback
    return FALLBACK_INITIAL_STATE;
  }
}

export async function sendPlaybackControl(action, targetIndex = null, speedMultiplier = null) {
  const payload = { action };
  if (targetIndex !== null) payload.target_index = targetIndex;
  if (speedMultiplier !== null) payload.speed_multiplier = speedMultiplier;

  try {
    const res = await fetch(`${API_BASE}/api/playback/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Control command failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    // If backend offline, return simulated response for standalone playback
    return {
      status: action === 'play' ? 'playing' : action === 'pause' ? 'paused' : 'paused',
      current_index: targetIndex ?? 0,
      speed_multiplier: speedMultiplier ?? 1.0,
      telemetry: getFallbackTelemetry(targetIndex ?? 0),
      is_fallback: true,
    };
  }
}

export async function fetchTrajectoryPaths(trajectoryId = 'V-S3a', stride = 25) {
  try {
    const res = await fetch(`${API_BASE}/api/trajectories/${trajectoryId}/paths?stride=${stride}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Fetch trajectory paths failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    return FALLBACK_PATHS;
  }
}

export async function fetchMasterResults() {
  try {
    const res = await fetch(`${API_BASE}/api/results/master`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Fetch master results failed: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    return FALLBACK_MASTER_RESULTS;
  }
}

export async function fetchFiguresCatalog() {
  try {
    const res = await fetch(`${API_BASE}/api/results/figures`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`Fetch figures catalog failed: ${res.statusText}`);
    const data = await res.json();
    return data.map((fig) => ({
      ...fig,
      url: API_BASE && fig.url && fig.url.startsWith('/') ? `${API_BASE}${fig.url}` : fig.url,
    }));
  } catch (err) {
    return [];
  }
}

export function createPlaybackWebSocket(onMessage, onOpen, onClose, onError) {
  const customWsUrl = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' && window.__VYRA_WS_URL__);
  let wsUrl;
  if (customWsUrl) {
    wsUrl = customWsUrl.endsWith('/stream') ? customWsUrl : `${customWsUrl.replace(/\/+$/, '')}/api/playback/stream`;
  } else if (API_BASE) {
    const wsProto = API_BASE.startsWith('https:') ? 'wss:' : 'ws:';
    const hostPart = API_BASE.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    wsUrl = `${wsProto}//${hostPart}/api/playback/stream`;
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}/api/playback/stream`;
  }

  let socket = null;
  let isClosedIntentionally = false;
  let retryDelay = 2500;
  const maxRetryDelay = 15000;
  let retryTimer = null;

  function connect() {
    if (isClosedIntentionally) return;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        retryDelay = 2500;
        if (onOpen) onOpen();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch {
          // ignore parsing error
        }
      };

      socket.onclose = (event) => {
        if (onClose) onClose(event);
        if (!isClosedIntentionally) {
          retryTimer = setTimeout(connect, retryDelay);
          retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
        }
      };

      socket.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (err) {
      if (onError) onError(err);
      if (!isClosedIntentionally) {
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
      }
    }
  }

  connect();

  return {
    send: (payload) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
      }
    },
    close: () => {
      isClosedIntentionally = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) socket.close();
    },
  };
}
