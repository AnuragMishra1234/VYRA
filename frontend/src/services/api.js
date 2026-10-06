/**
 * VYRA Research Dashboard API & WebSocket Client.
 * Connects directly to FastAPI backend endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.__VYRA_API_URL__) || '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPlaybackState() {
  const res = await fetch(`${API_BASE}/api/playback/state`);
  if (!res.ok) throw new Error(`Fetch playback state failed: ${res.statusText}`);
  return res.json();
}

export async function sendPlaybackControl(action, targetIndex = null, speedMultiplier = null) {
  const payload = { action };
  if (targetIndex !== null) payload.target_index = targetIndex;
  if (speedMultiplier !== null) payload.speed_multiplier = speedMultiplier;

  const res = await fetch(`${API_BASE}/api/playback/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Control command failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTrajectoryPaths(trajectoryId = 'V-S3a', stride = 25) {
  const res = await fetch(`${API_BASE}/api/trajectories/${trajectoryId}/paths?stride=${stride}`);
  if (!res.ok) throw new Error(`Fetch trajectory paths failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMasterResults() {
  const res = await fetch(`${API_BASE}/api/results/master`);
  if (!res.ok) throw new Error(`Fetch master results failed: ${res.statusText}`);
  return res.json();
}

export async function fetchFiguresCatalog() {
  const res = await fetch(`${API_BASE}/api/results/figures`);
  if (!res.ok) throw new Error(`Fetch figures catalog failed: ${res.statusText}`);
  const data = await res.json();
  return data.map((fig) => ({
    ...fig,
    url: API_BASE && fig.url && fig.url.startsWith('/') ? `${API_BASE}${fig.url}` : fig.url,
  }));
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

  function connect() {
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (onOpen) onOpen();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (e) {
          console.error('Failed to parse WS payload', e);
        }
      };

      socket.onclose = (event) => {
        if (onClose) onClose(event);
        if (!isClosedIntentionally) {
          setTimeout(connect, 2000); // Attempt auto-reconnect
        }
      };

      socket.onerror = (err) => {
        if (onError) onError(err);
      };
    } catch (err) {
      if (onError) onError(err);
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
      if (socket) socket.close();
    },
  };
}
