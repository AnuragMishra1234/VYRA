import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, AlertTriangle, CheckCircle2, Navigation } from 'lucide-react';

export default function DualPathDemoCanvas({
  telemetry,
  history = [],
  pathsData = null,
  isGpsLost = false,
  gpsLostCoord = null,
  useTechnicalTerms = false,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Bounding box for V-S3a segment
  const minLat = 52.368;
  const maxLat = 52.378;
  const minLon = -1.265;
  const maxLon = -1.250;

  const projectCoord = (lat, lon, width, height) => {
    const padding = 60;
    const normX = (lon - minLon) / (maxLon - minLon);
    const normY = 1.0 - (lat - minLat) / (maxLat - minLat);

    const rawX = padding + normX * (width - 2 * padding);
    const rawY = padding + normY * (height - 2 * padding);

    const centerX = width / 2;
    const centerY = height / 2;

    const x = centerX + (rawX - centerX + offset.x) * zoom;
    const y = centerY + (rawY - centerY + offset.y) * zoom;

    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // 1. Grid
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const gridSize = 40 * zoom;
    for (let x = (offset.x * zoom) % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = (offset.y * zoom) % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Road Reference Ground Truth (Dark Slate)
    const gtPath = pathsData?.offline_reference_gt || [];
    if (gtPath.length > 1) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 6 * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      gtPath.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon, width, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Road Centerline
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      gtPath.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon, width, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. VYRA Navigated Path (Continuous, Colored by Method)
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const p0 = history[i - 1];
        const p1 = history[i];
        const c0 = p0.vyra_coord || p0.gt_coord;
        const c1 = p1.vyra_coord || p1.gt_coord;

        if (c0 && c1) {
          const pt0 = projectCoord(c0.lat, c0.lon, width, height);
          const pt1 = projectCoord(c1.lat, c1.lon, width, height);

          const mode = p1.selected_mode || 'HYBRID';
          if (mode === 'DR') {
            ctx.strokeStyle = '#f97316'; // Movement-based (Amber)
          } else if (mode === 'GNSS') {
            ctx.strokeStyle = '#38bdf8'; // GPS-Direct (Sky Blue)
          } else {
            ctx.strokeStyle = '#10b981'; // Combined (Emerald)
          }

          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }
      }
    }

    // 4. GPS-Only Frozen or Divergent Indicator
    if (isGpsLost && gpsLostCoord) {
      const lostPt = projectCoord(gpsLostCoord.lat, gpsLostCoord.lon, width, height);

      // Red Pulsing Ring around GPS Loss Point
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lostPt.x, lostPt.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lostPt.x, lostPt.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label: "GPS FROZEN HERE"
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('GPS LOST FIX (FROZEN)', lostPt.x + 12, lostPt.y - 10);

      // Red dashed line showing the massive tracking error gap between frozen GPS and current vehicle
      const currentCoord = telemetry?.vyra_coord || telemetry?.gt_coord;
      if (currentCoord) {
        const currPt = projectCoord(currentCoord.lat, currentCoord.lon, width, height);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lostPt.x, lostPt.y);
        ctx.lineTo(currPt.x, currPt.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Error distance text along the gap
        const midX = (lostPt.x + currPt.x) / 2;
        const midY = (lostPt.y + currPt.y) / 2;
        const errorDist = Math.max(
          12.5,
          Math.sqrt(
            Math.pow((currentCoord.lat - gpsLostCoord.lat) * 111000, 2) +
            Math.pow((currentCoord.lon - gpsLostCoord.lon) * 68000, 2)
          )
        );
        ctx.fillStyle = '#f87171';
        ctx.font = '10px monospace';
        ctx.fillText(`GPS Error: ${errorDist.toFixed(1)}m`, midX + 8, midY - 6);
      }
    }

    // 5. Active VYRA Vehicle Marker (Heading arrow + pulsing aura)
    const currentCoord = telemetry?.vyra_coord || telemetry?.gt_coord;
    if (currentCoord) {
      const { x, y } = projectCoord(currentCoord.lat, currentCoord.lon, width, height);

      const mode = telemetry?.selected_mode || 'HYBRID';
      const auraColor =
        mode === 'DR'
          ? 'rgba(249, 115, 22, 0.25)'
          : mode === 'GNSS'
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(16, 185, 129, 0.25)';

      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow
      const headingDeg = telemetry?.heading_deg || 45;
      const rad = ((headingDeg - 90) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rad);

      // Vehicle triangle marker
      ctx.fillStyle = mode === 'DR' ? '#f97316' : mode === 'GNSS' ? '#38bdf8' : '#10b981';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-9, -8);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-9, 8);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Label: "VYRA (TRACKING)"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('VYRA (TRACKING)', x + 16, y + 4);
    }
  }, [telemetry, history, pathsData, zoom, offset, isGpsLost, gpsLostCoord]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-[440px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060a14] select-none shadow-2xl">
      <canvas
        ref={canvasRef}
        width={960}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left: Live Status Pill */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {!isGpsLost ? (
          <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">GPS AVAILABLE</span>
            <span className="text-[10px] text-slate-400">(14 Satellites)</span>
          </div>
        ) : (
          <div className="bg-rose-950/95 backdrop-blur-md border border-rose-500 text-rose-200 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono animate-pulse shadow-lg shadow-rose-950/60">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="font-bold uppercase">GPS SIGNAL LOST</span>
            <span className="text-[10px] text-rose-300">(Simulated Outage)</span>
          </div>
        )}
      </div>

      {/* Top Right: Method Legend (Plain Language & Optional Tech Name) */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono shadow-xl max-w-[260px]">
        <div className="text-[10px] uppercase font-bold text-slate-400 pb-1 border-b border-slate-800">
          Navigation Methods
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-300 font-semibold">
            {useTechnicalTerms ? 'Combined (EKF Fusion)' : 'Combined Navigation'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-amber-400" />
          <span className="text-amber-300 font-semibold">
            {useTechnicalTerms ? 'Movement-Based (Dead Reckoning)' : 'Movement-Based Navigation'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-sky-400" />
          <span className="text-sky-300 font-semibold">
            {useTechnicalTerms ? 'GPS-Direct (Raw Fix)' : 'GPS Direct'}
          </span>
        </div>

        {isGpsLost && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold">GPS-Only (Lost Fix)</span>
          </div>
        )}
      </div>

      {/* Bottom Right: Pan/Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1">
        <button
          onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1.1);
            setOffset({ x: 0, y: 0 });
          }}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
