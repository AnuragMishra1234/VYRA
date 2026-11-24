import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Compass, Eye, ShieldAlert, Satellite } from 'lucide-react';

export default function TrajectoryMapCanvas({
  telemetry,
  history = [],
  pathsData = null,
  isOutage = false,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Fallback bounds if pathsData is not ready
  const minLat = 52.368;
  const maxLat = 52.378;
  const minLon = -1.265;
  const maxLon = -1.250;

  // Convert geodetic (lat, lon) to canvas (x, y)
  const projectCoord = (lat, lon, width, height) => {
    const padding = 50;
    const normX = (lon - minLon) / (maxLon - minLon);
    const normY = 1.0 - (lat - minLat) / (maxLat - minLat); // Invert Y for canvas

    const rawX = padding + normX * (width - 2 * padding);
    const rawY = padding + normY * (height - 2 * padding);

    // Apply zoom and offset around center
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

    // Clear background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw subtle grid lines
    ctx.strokeStyle = '#111928';
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

    // 2. Draw ground truth reference path if available
    const gtPath = pathsData?.offline_reference_gt || [];
    if (gtPath.length > 1) {
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 2.5;
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

    // 3. Draw historical breadcrumb trajectory colored by navigation mode
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const p0 = history[i - 1];
        const p1 = history[i];

        const coord0 = p0.vyra_coord || p0.gt_coord;
        const coord1 = p1.vyra_coord || p1.gt_coord;

        if (coord0 && coord1) {
          const pt0 = projectCoord(coord0.lat, coord0.lon, width, height);
          const pt1 = projectCoord(coord1.lat, coord1.lon, width, height);

          // Color by active mode: GNSS -> Blue, HYBRID -> Green, DR -> Orange
          const mode = p1.selected_mode || 'HYBRID';
          if (mode === 'DR') {
            ctx.strokeStyle = '#f97316'; // Orange
          } else if (mode === 'GNSS') {
            ctx.strokeStyle = '#38bdf8'; // Blue
          } else {
            ctx.strokeStyle = '#10b981'; // Green
          }

          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }
      }
    }

    // 4. Draw GNSS Raw Measurement Position (with jitter/divergence during outage)
    const gnssPt = telemetry?.gnss_coord;
    if (gnssPt && !isOutage) {
      const { x, y } = projectCoord(gnssPt.lat, gnssPt.lon, width, height);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw Current Vehicle Position & Heading
    const currentCoord = telemetry?.vyra_coord || telemetry?.gt_coord;
    if (currentCoord) {
      const { x, y } = projectCoord(currentCoord.lat, currentCoord.lon, width, height);

      // Uncertainty covariance ellipse ring
      const mode = telemetry?.selected_mode || 'HYBRID';
      const ringColor =
        mode === 'DR'
          ? 'rgba(249, 115, 22, 0.3)'
          : mode === 'GNSS'
          ? 'rgba(56, 189, 248, 0.3)'
          : 'rgba(16, 185, 129, 0.3)';

      const errRadius = Math.max(8, Math.min(40, (telemetry?.current_error_m || 1.0) * 8 * zoom));
      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.arc(x, y, errRadius, 0, Math.PI * 2);
      ctx.fill();

      // Heading arrow / vehicle cursor
      const headingDeg = telemetry?.heading_deg || 45;
      const rad = ((headingDeg - 90) * Math.PI) / 180;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rad);

      // Vehicle triangle marker
      ctx.fillStyle = mode === 'DR' ? '#f97316' : mode === 'GNSS' ? '#0ea5e9' : '#10b981';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }, [telemetry, history, pathsData, zoom, offset, isOutage]);

  // Mouse pan interaction
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060a14] select-none">
      <canvas
        ref={canvasRef}
        width={900}
        height={520}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Canvas HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">Live 2D Trajectory View</span>
        </div>

        {isOutage && (
          <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500 text-rose-300 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>OUTAGE ACTIVE: GNSS MASKED</span>
          </div>
        )}
      </div>

      {/* Mode Color Legend (Top Right) */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-sky-400" />
          <span className="text-sky-300">GNSS-Direct</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-300">Hybrid (EKF)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 rounded-full bg-amber-400" />
          <span className="text-amber-300">Dead Reckoning</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
          <span className="text-slate-400">Ground Truth</span>
        </div>
      </div>

      {/* Coordinates HUD (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 space-y-0.5 hidden sm:block">
        <div>
          Lat:{' '}
          <span className="text-white">
            {(telemetry?.vyra_coord?.lat || telemetry?.gt_coord?.lat || 52.3708).toFixed(6)}°
          </span>
        </div>
        <div>
          Lon:{' '}
          <span className="text-white">
            {(telemetry?.vyra_coord?.lon || telemetry?.gt_coord?.lon || -1.2543).toFixed(6)}°
          </span>
        </div>
      </div>

      {/* Zoom / Pan Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1">
        <button
          onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
