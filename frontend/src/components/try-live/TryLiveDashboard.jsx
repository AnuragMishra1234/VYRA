import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import L from 'leaflet';
import {
  Compass,
  Smartphone,
  QrCode,
  Wifi,
  Activity,
  Satellite,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  ExternalLink,
  ShieldAlert,
  Play,
  Pause,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronRight,
  Clock,
  Battery,
  MapPin,
  Crosshair,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  createTryLiveSession,
  fetchTryLiveStatus,
  sendTryLiveControl,
  createTryLiveWebSocket,
} from '../../services/api';

export default function TryLiveDashboard({
  onBackToLanding,
  onLaunchPrototype,
  onLaunchLiveNavigation,
}) {
  // Session & Connection State
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [selectedHost, setSelectedHost] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Live Telemetry & Decisions
  const [telemetry, setTelemetry] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('WAITING_FOR_PHONE'); // WAITING_FOR_PHONE, CONNECTED, STREAMING, PAUSED, STOPPED
  const [gpsStatus, setGpsStatus] = useState('UNAVAILABLE');
  const [motionStatus, setMotionStatus] = useState('IDLE');
  const [motionActivity, setMotionActivity] = useState('UNKNOWN');
  const [decision, setDecision] = useState(null);
  const [packetRate, setPacketRate] = useState(0);
  const [packetCount, setPacketCount] = useState(0);
  const [historyTrail, setHistoryTrail] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAdvancedInspector, setShowAdvancedInspector] = useState(false);

  // Map State
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const breadcrumbPolylineRef = useRef(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const [baseMapStyle, setBaseMapStyle] = useState('dark'); // 'dark', 'osm', 'satellite'
  const baseTileLayerRef = useRef(null);

  // 1. Initialize Tracking Session on Mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      const port = window.location.port ? parseInt(window.location.port, 10) : 8000;
      const res = await createTryLiveSession(port);
      if (isMounted && res) {
        setSession(res);
        setSessionId(res.session_id);

        const primary = res.local_ips && res.local_ips.length > 0 ? res.local_ips[0] : '127.0.0.1';
        setSelectedHost(primary);
        generateQr(primary, port, res.session_id);
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Generate QR Code when Host or Session changes
  const generateQr = async (host, port, sid) => {
    if (!sid) return;
    const targetPort = port || (window.location.port ? parseInt(window.location.port, 10) : 8000);
    const mobileUrl = `http://${host}:${targetPort}/try-live/mobile?session=${sid}`;
    try {
      const url = await QRCode.toDataURL(mobileUrl, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#030712',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.warn('QR code generation error:', err);
    }
  };

  const handleHostChange = (newHost) => {
    setSelectedHost(newHost);
    const port = window.location.port ? parseInt(window.location.port, 10) : 8000;
    generateQr(newHost, port, sessionId);
  };

  const handleCustomHostSubmit = (e) => {
    e.preventDefault();
    if (!customHost.trim()) return;
    setSelectedHost(customHost.trim());
    const port = window.location.port ? parseInt(window.location.port, 10) : 8000;
    generateQr(customHost.trim(), port, sessionId);
  };

  const activeMobileUrl = sessionId && selectedHost
    ? `http://${selectedHost}:${window.location.port || 8000}/try-live/mobile?session=${sessionId}`
    : '';

  const handleCopyLink = () => {
    if (!activeMobileUrl) return;
    navigator.clipboard.writeText(activeMobileUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // 3. Connect Laptop WebSocket Stream
  useEffect(() => {
    if (!sessionId) return;

    const ws = createTryLiveWebSocket(
      sessionId,
      'laptop',
      (data) => {
        // Ingest SessionStatusResponse frame
        if (data.status) setSessionStatus(data.status);
        if (data.gps_status) setGpsStatus(data.gps_status);
        if (data.motion_status) setMotionStatus(data.motion_status);
        if (data.packet_rate_hz !== undefined) setPacketRate(data.packet_rate_hz);
        if (data.packet_count !== undefined) setPacketCount(data.packet_count);
        if (data.decision) setDecision(data.decision);
        if (data.decision?.motion_activity) setMotionActivity(data.decision.motion_activity);

        if (data.latest_telemetry) {
          setTelemetry(data.latest_telemetry);
          if (data.latest_telemetry.coord) {
            setHistoryTrail((prev) => [
              ...prev.slice(-300),
              {
                ...data.latest_telemetry.coord,
                mode: data.latest_telemetry.selected_mode || 'HYBRID',
                accuracy_m: data.latest_telemetry.accuracy_m,
                timestamp: data.latest_telemetry.timestamp,
              },
            ]);
          }
        }

        if (data.recent_events && data.recent_events.length > 0) {
          setEvents(data.recent_events);
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false),
      () => setWsConnected(false)
    );

    return () => {
      if (ws) ws.close();
    };
  }, [sessionId]);

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        mapContainerRef.current._leaflet_id = null;
      }
      try {
        const map = L.map(mapContainerRef.current, {
          center: [52.40625, -1.48177],
          zoom: 17,
          zoomControl: false,
          attributionControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Leaflet initialization warning:', err);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch {}
      }
    };
  }, []);

  // 5. Update Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let tileUrl;
    let options;

    if (baseMapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      options = { maxZoom: 19, attribution: 'Tiles &copy; Esri' };
    } else if (baseMapStyle === 'osm') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = { maxZoom: 19, attribution: '&copy; OpenStreetMap' };
    } else {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = {
        maxZoom: 19,
        className: 'dark-tiles',
        attribution: '&copy; OpenStreetMap',
      };
    }

    baseTileLayerRef.current = L.tileLayer(tileUrl, options).addTo(map);
    baseTileLayerRef.current.bringToBack();
  }, [baseMapStyle]);

  // 6. Update Real-Time Phone Location Marker, Accuracy Circle, and Trail
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !telemetry?.coord) return;

    const { lat, lon } = telemetry.coord;
    const accuracy = telemetry.accuracy_m || 8.0;
    const mode = telemetry.selected_mode || 'HYBRID';
    const heading = telemetry.gps?.heading_deg || null;

    // A. Phone Location Marker with Directional Heading
    const markerColor =
      mode === 'DR' ? '#f97316' : mode === 'GNSS' ? '#38bdf8' : '#10b981';

    const iconHtml = `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${markerColor}33; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: ${markerColor}; border: 3px solid #ffffff; box-shadow: 0 0 12px ${markerColor}; display: flex; align-items: center; justify-content: center; transform: rotate(${heading ? heading : 0}deg);">
          ${heading !== null ? '<div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 8px solid #ffffff; margin-bottom: 2px;"></div>' : ''}
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'vyra-phone-marker',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    }

    // B. Accuracy Radius Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lon]);
      accuracyCircleRef.current.setRadius(accuracy);
    } else {
      accuracyCircleRef.current = L.circle([lat, lon], {
        radius: accuracy,
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(map);
    }

    // C. Polyline Breadcrumb Trail
    if (historyTrail.length > 1) {
      const latlngs = historyTrail.map((p) => [p.lat, p.lon]);
      if (breadcrumbPolylineRef.current) {
        breadcrumbPolylineRef.current.setLatLngs(latlngs);
      } else {
        breadcrumbPolylineRef.current = L.polyline(latlngs, {
          color: '#38bdf8',
          weight: 4,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);
      }
    }

    // D. Auto Follow
    if (autoFollow) {
      map.panTo([lat, lon], { animate: true, duration: 0.5 });
    }
  }, [telemetry, autoFollow, historyTrail]);

  // Controls
  const handleClearTrail = async () => {
    setHistoryTrail([]);
    if (breadcrumbPolylineRef.current) {
      breadcrumbPolylineRef.current.setLatLngs([]);
    }
    await sendTryLiveControl(sessionId, 'clear_trail');
  };

  const handleSimulateOutage = async () => {
    // Allows examiner to demonstrate VYRA mode handover even without walking outside
    await sendTryLiveControl(sessionId, 'simulate_gps_outage');
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#060911]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-3 text-left group"
          >
            <img
              src="/vyra-logo.png"
              alt="VYRA Logo"
              className="h-9 w-auto object-contain filter drop-shadow group-hover:scale-105 transition"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white group-hover:text-cyan-400 transition font-mono">
                  VYRA
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
                  TRY-LIVE
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-mono">
                Real-Time Mobile Sensor Demonstration
              </span>
            </div>
          </button>
        </div>

        {/* Center / Session Info */}
        <div className="hidden md:flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">SESSION:</span>
            <span className="font-bold text-cyan-400">{sessionId || 'INITIALIZING'}</span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
              sessionStatus === 'STREAMING'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : sessionStatus === 'CONNECTED'
                ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="font-bold">
              {sessionStatus === 'STREAMING'
                ? 'PHONE STREAMING'
                : sessionStatus === 'CONNECTED'
                ? 'PHONE PAIRED'
                : 'WAITING FOR PHONE'}
            </span>
            {packetRate > 0 && <span className="text-[10px]">({packetRate} Hz)</span>}
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLaunchLiveNavigation}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Navigation</span>
          </button>

          <button
            onClick={onLaunchPrototype}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition"
          >
            <span>Research Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content Area */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1720px] mx-auto w-full">
        {/* Left Column (5 Cols on LG): Phone Connection & Sensor Intelligence */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">
          {/* Card 1: Phone Connection QR Code & Local Network Pairing */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  1. Smartphone QR Pairing
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Local Wi-Fi / Hotspot
              </span>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* QR Code Canvas */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-inner">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan with phone"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-slate-800 font-mono text-xs animate-pulse">
                    Generating QR...
                  </div>
                )}
                <span className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">
                  SCAN WITH ANDROID
                </span>
              </div>

              {/* Connection Guidance & Host Selector */}
              <div className="sm:col-span-7 space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Open your camera or QR scanner on your Android phone while connected to the same Wi-Fi.
                </p>

                {/* Detected LAN IP Selector */}
                {session?.local_ips && session.local_ips.length > 0 && (
                  <div className="space-y-1.5 font-mono text-xs">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      Host IP Address:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {session.local_ips.map((ip) => (
                        <button
                          key={ip}
                          onClick={() => handleHostChange(ip)}
                          className={`px-2.5 py-1 rounded text-[11px] transition ${
                            selectedHost === ip
                              ? 'bg-cyan-600 text-white font-bold border border-cyan-400'
                              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {ip}
                        </button>
                      ))}
                      <button
                        onClick={() => handleHostChange('localhost')}
                        className={`px-2.5 py-1 rounded text-[11px] transition ${
                          selectedHost === 'localhost'
                            ? 'bg-cyan-600 text-white font-bold border border-cyan-400'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        localhost
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Links */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{copyFeedback ? 'Copied URL!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={activeMobileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 transition"
                    title="Open mobile client directly in another tab for instant testing"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Phone Tab</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: VYRA Sensor Intelligence & GPS Observation Panel */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  2. Sensor Intelligence
                </span>
              </div>

              {/* Status Pill */}
              <span
                className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold ${
                  gpsStatus === 'AVAILABLE'
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : gpsStatus === 'UPDATE_DELAYED'
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
                    : gpsStatus === 'WEAK'
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                }`}
              >
                {gpsStatus === 'AVAILABLE'
                  ? 'GPS AVAILABLE'
                  : gpsStatus === 'UPDATE_DELAYED'
                  ? 'GPS UPDATE DELAYED'
                  : gpsStatus === 'WEAK'
                  ? 'GPS WEAK (ACCURACY LOW)'
                  : 'GPS UNAVAILABLE'}
              </span>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold">LATITUDE</span>
                <span className="font-bold text-cyan-300 text-sm">
                  {telemetry?.coord ? `${telemetry.coord.lat.toFixed(6)}` : '--'}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold">LONGITUDE</span>
                <span className="font-bold text-cyan-300 text-sm">
                  {telemetry?.coord ? `${telemetry.coord.lon.toFixed(6)}` : '--'}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold">ACCURACY</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {telemetry?.accuracy_m ? `±${telemetry.accuracy_m}m` : '--'}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-semibold">SPEED</span>
                <span className="font-bold text-slate-200 text-sm">
                  {telemetry?.gps?.speed_mps !== null && telemetry?.gps?.speed_mps !== undefined
                    ? `${(telemetry.gps.speed_mps * 3.6).toFixed(1)} km/h`
                    : '0.0 km/h'}
                </span>
              </div>
            </div>

            {/* Motion Sensor Readings */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>PHONE MOTION SENSORS</span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                  {motionActivity}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">ACCEL X</span>
                  <span className="font-bold text-amber-300">
                    {telemetry?.motion?.accel_x !== null && telemetry?.motion?.accel_x !== undefined
                      ? `${telemetry.motion.accel_x} m/s²`
                      : '--'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">ACCEL Y</span>
                  <span className="font-bold text-amber-300">
                    {telemetry?.motion?.accel_y !== null && telemetry?.motion?.accel_y !== undefined
                      ? `${telemetry.motion.accel_y} m/s²`
                      : '--'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-400 block">ACCEL Z</span>
                  <span className="font-bold text-amber-300">
                    {telemetry?.motion?.accel_z !== null && telemetry?.motion?.accel_z !== undefined
                      ? `${telemetry.motion.accel_z} m/s²`
                      : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Real GPS Degradation & VYRA Response (The Core Showcase) */}
          <div className="bg-gradient-to-br from-[#0c1222] to-[#080d19] border border-cyan-900/40 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                  3. VYRA Decision Response
                </span>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-blue-300">
                ADAPTIVE PIPELINE
              </span>
            </div>

            {/* Plain-Language Explanation */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                  Active Mode:
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    decision?.selected_mode === 'DR'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600'
                      : decision?.selected_mode === 'GNSS'
                      ? 'bg-sky-950 text-sky-300 border border-sky-600'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  }`}
                >
                  {decision?.selected_mode === 'DR'
                    ? 'MOVEMENT-BASED (DEAD RECKONING)'
                    : decision?.selected_mode === 'GNSS'
                    ? 'GPS DIRECT'
                    : 'COMBINED (EKF FUSION)'}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {decision?.plain_explanation ||
                  'Pair your phone and walk with it to observe live GPS and automatic mode selection.'}
              </p>
            </div>

            {/* Technical Candidate Cost Comparison (Examiner View) */}
            {decision?.costs && (
              <div className="space-y-2 font-mono text-xs pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>VYRA Multi-Objective Cost J(A):</span>
                  <span>Lower is better</span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between text-[10px] pb-0.5">
                      <span className="text-emerald-300">J(Combined / Hybrid)</span>
                      <span className="font-bold text-slate-200">{decision.costs.hybrid.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, decision.costs.hybrid * 5)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] pb-0.5">
                      <span className="text-sky-300">J(GPS Direct)</span>
                      <span className="font-bold text-slate-200">
                        {decision.costs.gnss > 500 ? 'INF (LOST)' : decision.costs.gnss.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${decision.costs.gnss > 500 ? 100 : Math.min(100, decision.costs.gnss * 5)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] pb-0.5">
                      <span className="text-amber-300">J(Movement / DR)</span>
                      <span className="font-bold text-slate-200">{decision.costs.dr.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, decision.costs.dr * 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols on LG): Live Map, Timeline & Examiner Inspector */}
        <div className="lg:col-span-7 space-y-5 flex flex-col">
          {/* Main Leaflet Map Card */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[500px]">
            {/* Map Header Toolbar */}
            <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">LIVE PHONE NAVIGATION MAP</span>
                {historyTrail.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    ({historyTrail.length} breadcrumb fixes)
                  </span>
                )}
              </div>

              {/* Map Layer & Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoFollow(!autoFollow)}
                  className={`px-2.5 py-1 rounded text-[11px] border flex items-center gap-1.5 transition ${
                    autoFollow
                      ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                  title="Auto follow vehicle marker"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{autoFollow ? 'Tracking' : 'Free Pan'}</span>
                </button>

                <button
                  onClick={handleClearTrail}
                  className="px-2.5 py-1 rounded text-[11px] bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                  title="Clear historical polyline breadcrumb path"
                >
                  Clear Trail
                </button>

                {/* Map Style Selector */}
                <select
                  value={baseMapStyle}
                  onChange={(e) => setBaseMapStyle(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="dark">Dark Map</option>
                  <option value="satellite">Satellite</option>
                  <option value="osm">Standard OSM</option>
                </select>
              </div>
            </div>

            {/* Map Canvas Container */}
            <div className="relative flex-1 min-h-[460px] w-full bg-[#060a14]">
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

              {/* Live Overlay: Current Fix Pill */}
              <div className="absolute top-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-xs font-mono shadow-xl space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      telemetry?.coord ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span>
                    {telemetry?.coord
                      ? `${telemetry.coord.lat.toFixed(5)}°, ${telemetry.coord.lon.toFixed(5)}°`
                      : 'Waiting for GPS fix...'}
                  </span>
                </div>
                {telemetry?.accuracy_m && (
                  <div className="text-[10px] text-slate-400">
                    Precision radius: &plusmn;{telemetry.accuracy_m} meters
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decision Timeline Card */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  Live Decision Timeline
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Auditable event ledger
              </span>
            </div>

            {events.length > 0 ? (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {events
                  .slice()
                  .reverse()
                  .map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition ${
                        selectedEvent?.id === evt.id
                          ? 'bg-slate-900 border-cyan-500 shadow-md'
                          : 'bg-slate-950/70 border-slate-800/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] pb-1">
                        <span className="text-slate-400">{evt.timestamp_iso}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            evt.level === 'success'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : evt.level === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : evt.level === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {evt.category}
                        </span>
                      </div>
                      <div className="font-bold text-slate-200 text-xs">{evt.title}</div>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-snug">
                        {evt.description}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 font-mono">
                No events recorded yet. Connect a phone to begin tracking timeline.
              </div>
            )}
          </div>

          {/* Examiner Advanced Inspector (Collapsible) */}
          <div className="bg-[#0b101e] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => setShowAdvancedInspector(!showAdvancedInspector)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  Examiner Telemetry Inspector
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showAdvancedInspector ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showAdvancedInspector && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950 font-mono text-xs space-y-3">
                <div className="flex justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span>Packet Rate: <strong className="text-cyan-300">{packetRate} Hz</strong></span>
                  <span>Total Packets: <strong className="text-slate-200">{packetCount}</strong></span>
                  <span>WebSocket: <strong className="text-emerald-400">{wsConnected ? 'OPEN' : 'CLOSED'}</strong></span>
                </div>

                <div className="bg-[#060911] p-3 rounded-lg border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto max-h-48">
                  <pre>{JSON.stringify(telemetry || { note: 'No packet received yet' }, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
