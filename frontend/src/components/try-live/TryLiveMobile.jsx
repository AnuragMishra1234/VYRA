import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Navigation,
  Satellite,
  Activity,
  Play,
  Pause,
  Square,
  ShieldCheck,
  AlertTriangle,
  Battery,
  Wifi,
  Smartphone,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import {
  createTryLiveWebSocket,
  postTryLiveTelemetry,
  sendTryLiveControl,
} from '../../services/api';

export default function TryLiveMobile() {
  const [sessionId, setSessionId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [packetCount, setPacketCount] = useState(0);
  const [packetRate, setPacketRate] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('IDLE'); // IDLE, ACQUIRING, GRANTED, DENIED, ERROR
  const [motionStatus, setMotionStatus] = useState('IDLE'); // IDLE, ACTIVE, DENIED, UNSUPPORTED
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Latest Sensor Data
  const [coords, setCoords] = useState(null);
  const [motion, setMotion] = useState({
    ax: null,
    ay: null,
    az: null,
    gx: null,
    gy: null,
    gz: null,
    alpha: null,
    beta: null,
    gamma: null,
  });

  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  const packetTimestampsRef = useRef([]);
  const latestMotionRef = useRef(motion);
  const latestCoordsRef = useRef(coords);
  const isStreamingRef = useRef(false);

  // Sync refs for event listeners
  useEffect(() => {
    latestMotionRef.current = motion;
  }, [motion]);
  useEffect(() => {
    latestCoordsRef.current = coords;
  }, [coords]);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Extract session ID from URL query param (?session=SES-XXXXXX)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('session') || window.location.hash.replace('#session=', '') || 'SES-MOBILE';
      setSessionId(sid);
    }
  }, []);

  // Battery Status API (where supported)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Initialize WebSocket Relay
  useEffect(() => {
    if (!sessionId) return;

    const ws = createTryLiveWebSocket(
      sessionId,
      'phone',
      (data) => {
        // Handle incoming commands from laptop (e.g. pause/stop/ack)
        if (data.action === 'stop') {
          handleStop();
        } else if (data.action === 'pause') {
          handlePause();
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false),
      () => setWsConnected(false)
    );

    wsRef.current = ws;

    return () => {
      if (ws) ws.close();
    };
  }, [sessionId]);

  // Calculate Rolling Transmission Rate (Hz)
  const recordPacketTransmission = () => {
    const now = Date.now();
    packetTimestampsRef.current.push(now);
    if (packetTimestampsRef.current.length > 20) {
      packetTimestampsRef.current.shift();
    }
    if (packetTimestampsRef.current.length >= 2) {
      const elapsed = (now - packetTimestampsRef.current[0]) / 1000;
      if (elapsed > 0) {
        setPacketRate(parseFloat(((packetTimestampsRef.current.length - 1) / elapsed).toFixed(1)));
      }
    }
    setPacketCount((p) => p + 1);
  };

  // Transmit Telemetry Frame (WebSocket with HTTP fallback)
  const transmitPayload = (gpsData, motionData) => {
    if (!sessionId || !isStreamingRef.current) return;

    const payload = {
      session_id: sessionId,
      type: 'telemetry',
      timestamp_ms: Date.now(),
      gps: gpsData
        ? {
            latitude: gpsData.latitude,
            longitude: gpsData.longitude,
            accuracy_m: gpsData.accuracy,
            altitude_m: gpsData.altitude,
            speed_mps: gpsData.speed,
            heading_deg: gpsData.heading,
            timestamp_ms: gpsData.timestamp || Date.now(),
          }
        : null,
      motion: motionData
        ? {
            accel_x: motionData.ax,
            accel_y: motionData.ay,
            accel_z: motionData.az,
            gyro_x: motionData.gx,
            gyro_y: motionData.gy,
            gyro_z: motionData.gz,
            alpha: motionData.alpha,
            beta: motionData.beta,
            gamma: motionData.gamma,
          }
        : null,
      device: {
        battery_level: batteryLevel !== null ? batteryLevel / 100 : null,
        user_agent: navigator.userAgent,
      },
    };

    let sent = false;
    if (wsRef.current) {
      sent = wsRef.current.send(payload);
    }

    if (!sent) {
      // HTTP POST fallback
      postTryLiveTelemetry(sessionId, payload);
    }

    recordPacketTransmission();
  };

  // Motion Sensor Listeners
  const startMotionSensors = async () => {
    if (typeof window === 'undefined') return;

    // Handle iOS/iPadOS explicit permission request
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const resp = await DeviceMotionEvent.requestPermission();
        if (resp !== 'granted') {
          setMotionStatus('DENIED');
          return;
        }
      } catch (err) {
        console.warn('Motion permission request error:', err);
      }
    }

    if ('ondevicemotion' in window) {
      setMotionStatus('ACTIVE');
      window.addEventListener('devicemotion', handleDeviceMotion);
    } else {
      setMotionStatus('UNSUPPORTED');
    }

    if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  };

  const stopMotionSensors = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    }
  };

  const handleDeviceMotion = (e) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    const rot = e.rotationRate;
    const newMotion = {
      ...latestMotionRef.current,
      ax: acc?.x ? parseFloat(acc.x.toFixed(3)) : latestMotionRef.current.ax,
      ay: acc?.y ? parseFloat(acc.y.toFixed(3)) : latestMotionRef.current.ay,
      az: acc?.z ? parseFloat(acc.z.toFixed(3)) : latestMotionRef.current.az,
      gx: rot?.alpha ? parseFloat(rot.alpha.toFixed(3)) : latestMotionRef.current.gx,
      gy: rot?.beta ? parseFloat(rot.beta.toFixed(3)) : latestMotionRef.current.gy,
      gz: rot?.gamma ? parseFloat(rot.gamma.toFixed(3)) : latestMotionRef.current.gz,
    };
    setMotion(newMotion);
  };

  const handleDeviceOrientation = (e) => {
    setMotion((prev) => ({
      ...prev,
      alpha: e.alpha ? parseFloat(e.alpha.toFixed(1)) : prev.alpha,
      beta: e.beta ? parseFloat(e.beta.toFixed(1)) : prev.beta,
      gamma: e.gamma ? parseFloat(e.gamma.toFixed(1)) : prev.gamma,
    }));
  };

  // Geolocation Watcher
  const startGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('UNAVAILABLE');
      setErrorMessage('Geolocation is not supported by your mobile browser.');
      return;
    }

    setGpsStatus('ACQUIRING');
    setErrorMessage(null);

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 6000,
    };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsStatus('GRANTED');
        const c = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ? parseFloat(pos.coords.accuracy.toFixed(1)) : 5.0,
          altitude: pos.coords.altitude ? parseFloat(pos.coords.altitude.toFixed(1)) : null,
          speed: pos.coords.speed !== null && pos.coords.speed !== undefined
            ? parseFloat(pos.coords.speed.toFixed(2))
            : null,
          heading: pos.coords.heading ? parseFloat(pos.coords.heading.toFixed(1)) : null,
          timestamp: pos.timestamp,
        };
        setCoords(c);
        transmitPayload(c, latestMotionRef.current);
      },
      (err) => {
        console.warn('Geolocation watch error:', err.code, err.message);
        if (err.code === 1) {
          setGpsStatus('DENIED');
          setErrorMessage('Location permission denied. Please allow location access in your browser settings.');
        } else if (err.code === 2) {
          setGpsStatus('UNAVAILABLE');
          setErrorMessage('Position unavailable. Check that GPS / Location Services are turned on.');
        } else if (err.code === 3) {
          // Timeout - normal in weak areas
          setGpsStatus('ACQUIRING');
        }
      },
      options
    );

    watchIdRef.current = id;
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Periodic motion-only transmission ticker (when GPS hasn't updated recently, send motion at 5 Hz)
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      // If motion is active, broadcast latest motion snapshot
      if (latestMotionRef.current.ax !== null) {
        transmitPayload(latestCoordsRef.current, latestMotionRef.current);
      }
    }, 200); // 5 Hz motion broadcast

    return () => clearInterval(timer);
  }, [isStreaming, sessionId]);

  // Controls
  const handleStart = async () => {
    setIsStreaming(true);
    setErrorMessage(null);
    await startMotionSensors();
    startGpsTracking();
    sendTryLiveControl(sessionId, 'start');
  };

  const handlePause = () => {
    setIsStreaming(false);
    stopGpsTracking();
    stopMotionSensors();
    sendTryLiveControl(sessionId, 'pause');
  };

  const handleStop = () => {
    setIsStreaming(false);
    stopGpsTracking();
    stopMotionSensors();
    sendTryLiveControl(sessionId, 'stop');
  };

  const isSecureContextCheck = typeof window !== 'undefined' ? window.isSecureContext : true;

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-30 bg-[#090d1a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white font-mono">VYRA TRY-LIVE</span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                SENSOR NODE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Session: <strong className="text-cyan-400">{sessionId}</strong>
            </span>
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2">
          {batteryLevel !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
              <Battery className="w-3 h-3 text-emerald-400" />
              <span>{batteryLevel}%</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border ${
              wsConnected
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            <Wifi className="w-3 h-3" />
            <span>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* Main Mobile Content Area */}
      <main className="flex-1 px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        {/* Connection Notice / Insecure Origin Warning if needed */}
        {!isSecureContextCheck && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
          <div className="bg-amber-950/80 border border-amber-500/80 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mobile Browser Security Notice</span>
            </div>
            <p className="text-amber-200/90 text-[11px] leading-relaxed">
              Android Chrome requires HTTPS for GPS on local IPs (e.g. 192.168.x.x). If GPS permission is blocked:
            </p>
            <button
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="text-cyan-300 underline font-mono text-[11px] block text-left"
            >
              {showTroubleshooting ? 'Hide Chrome setup instructions' : 'View quick 1-minute Chrome flag fix'}
            </button>
            {showTroubleshooting && (
              <div className="p-2.5 bg-slate-950/80 rounded-lg text-[10px] font-mono text-slate-300 space-y-1.5 mt-2 border border-slate-800">
                <p>1. In mobile Chrome, open <strong className="text-cyan-300">chrome://flags</strong></p>
                <p>2. Search for <strong className="text-cyan-300">unsafely-treat-insecure-origin-as-secure</strong></p>
                <p>3. Enable it and add: <strong className="text-emerald-400">{window.location.origin}</strong></p>
                <p>4. Tap <strong>Relaunch</strong>.</p>
              </div>
            )}
          </div>
        )}

        {/* Streaming State Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0c1222] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                {isStreaming ? 'STREAMING ACTIVE' : 'STREAMING PAUSED'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-cyan-400 font-bold">
                {packetRate} Hz
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">
                {packetCount} frames sent
              </span>
            </div>
          </div>

          {/* Touch Action Controls */}
          <div className="pt-4 grid grid-cols-1 gap-2.5">
            {!isStreaming ? (
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-xl font-bold font-mono text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START LIVE TRACKING</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePause}
                  className="py-3.5 rounded-xl font-bold font-mono text-xs text-amber-200 bg-amber-950/90 border border-amber-600/60 shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </button>
                <button
                  onClick={handleStop}
                  className="py-3.5 rounded-xl font-bold font-mono text-xs text-rose-200 bg-rose-950/90 border border-rose-600/60 shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP SESSION</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-300 block">Location Access Issue</span>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* GPS Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                Phone GPS Observation
              </span>
            </div>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                gpsStatus === 'GRANTED'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : gpsStatus === 'ACQUIRING'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {gpsStatus === 'GRANTED'
                ? 'FIX ACQUIRED'
                : gpsStatus === 'ACQUIRING'
                ? 'ACQUIRING FIX'
                : gpsStatus}
            </span>
          </div>

          {coords ? (
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">LATITUDE</span>
                  <span className="font-bold text-cyan-300">{coords.latitude.toFixed(6)}&deg;</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">LONGITUDE</span>
                  <span className="font-bold text-cyan-300">{coords.longitude.toFixed(6)}&deg;</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">ACCURACY</span>
                  <span className="font-bold text-emerald-400">&plusmn;{coords.accuracy}m</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">SPEED</span>
                  <span className="font-bold text-slate-200">
                    {coords.speed !== null ? `${(coords.speed * 3.6).toFixed(1)} km/h` : '0.0 km/h'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">HEADING</span>
                  <span className="font-bold text-slate-200">
                    {coords.heading !== null ? `${Math.round(coords.heading)}&deg;` : '--'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400 font-mono">
              {isStreaming ? 'Waiting for first satellite GPS coordinate fix...' : 'Tap START to request phone location'}
            </div>
          )}
        </div>

        {/* Motion Sensor Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                Smartphone Motion Sensors
              </span>
            </div>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                motionStatus === 'ACTIVE'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              {motionStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block">ACCEL X</span>
              <span className="font-bold text-amber-300">
                {motion.ax !== null ? `${motion.ax} m/s&sup2;` : '--'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block">ACCEL Y</span>
              <span className="font-bold text-amber-300">
                {motion.ay !== null ? `${motion.ay} m/s&sup2;` : '--'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block">ACCEL Z</span>
              <span className="font-bold text-amber-300">
                {motion.az !== null ? `${motion.az} m/s&sup2;` : '--'}
              </span>
            </div>
          </div>

          {/* Gyroscope / Orientation */}
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[9px]">ALPHA (&alpha;)</span>
              <span className="text-slate-200 font-bold">{motion.alpha !== null ? `${motion.alpha}&deg;` : '--'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">BETA (&beta;)</span>
              <span className="text-slate-200 font-bold">{motion.beta !== null ? `${motion.beta}&deg;` : '--'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px]">GAMMA (&gamma;)</span>
              <span className="text-slate-200 font-bold">{motion.gamma !== null ? `${motion.gamma}&deg;` : '--'}</span>
            </div>
          </div>
        </div>

        {/* Privacy & Demonstrator Assurance Banner */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Location telemetry is streamed in real time to your active laptop session. No data is shared with external servers or persisted after the demonstration.
          </p>
        </div>
      </main>
    </div>
  );
}
