import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Compass, Eye, ShieldAlert, Satellite } from 'lucide-react';

export default function TrajectoryMapCanvas({
  telemetry,
  history = [],
  pathsData = null,
  isOutage = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const w = containerRef.current.clientWidth || 900;
        const h = containerRef.current.clientHeight || 520;
        if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Dynamic Center from Active Vehicle Coordinates
    const currentCoord =
      telemetry?.vyra_coord ||
      telemetry?.gt_coord ||
      (history.length > 0
        ? history[history.length - 1]?.vyra_coord || history[history.length - 1]?.gt_coord
        : null) || { lat: 52.406254, lon: -1.481777 };

    const centerLat = currentCoord.lat;
    const centerLon = currentCoord.lon;

    const mPerDegLat = 111320.0;
    const mPerDegLon = 111320.0 * Math.cos((centerLat * Math.PI) / 180);
    const pxPerMeter = 2.6 * zoom;

    const projectCoord = (lat, lon) => {
      const dx = (lon - centerLon) * mPerDegLon;
      const dy = (lat - centerLat) * mPerDegLat;
      const x = width / 2 + (dx * pxPerMeter + offset.x);
      const y = height / 2 - (dy * pxPerMeter - offset.y);
      return { x, y };
    };

    // Clear background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // 2. Metric Grid Lines (50 meters per square)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    const gridStepPx = 50 * pxPerMeter;
    if (gridStepPx > 10) {
      const startX = (((width / 2 + offset.x) % gridStepPx) + gridStepPx) % gridStepPx;
      for (let x = startX; x < width; x += gridStepPx) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      const startY = (((height / 2 - offset.y) % gridStepPx) + gridStepPx) % gridStepPx;
      for (let y = startY; y < height; y += gridStepPx) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 3. Ground truth reference road path
    const rawGt = pathsData?.paths?.offline_reference_gt || pathsData?.offline_reference_gt || [];
    const allGtPoints = rawGt
      .map((pt) => {
        if (Array.isArray(pt)) return { lat: pt[0], lon: pt[1] };
        if (pt && pt.lat !== undefined) return { lat: pt.lat, lon: pt.lon };
        return null;
      })
      .filter(Boolean);

    const visibleGt = allGtPoints.filter((pt) => {
      const dLat = Math.abs(pt.lat - centerLat) * mPerDegLat;
      const dLon = Math.abs(pt.lon - centerLon) * mPerDegLon;
      return dLat < 800 && dLon < 800;
    });

    if (visibleGt.length > 1) {
      // Road surface
      ctx.strokeStyle = '#151f38';
      ctx.lineWidth = Math.max(16, 12 * pxPerMeter);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      visibleGt.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dotted Centerline
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      visibleGt.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Fallback road corridor
      const heading = (telemetry?.heading_deg || 45) * (Math.PI / 180);
      const roadDirX = Math.sin(heading);
      const roadDirY = Math.cos(heading);
      const ptA = projectCoord(centerLat - (roadDirY * 350) / mPerDegLat, centerLon - (roadDirX * 350) / mPerDegLon);
      const ptB = projectCoord(centerLat + (roadDirY * 350) / mPerDegLat, centerLon + (roadDirX * 350) / mPerDegLon);

      ctx.strokeStyle = '#151f38';
      ctx.lineWidth = Math.max(16, 12 * pxPerMeter);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Historical breadcrumb trajectory
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const p0 = history[i - 1];
        const p1 = history[i];

        const coord0 = p0.vyra_coord || p0.gt_coord;
        const coord1 = p1.vyra_coord || p1.gt_coord;

        if (coord0 && coord1) {
          const pt0 = projectCoord(coord0.lat, coord0.lon);
          const pt1 = projectCoord(coord1.lat, coord1.lon);

          const mode = p1.selected_mode || 'HYBRID';
          if (mode === 'DR') {
            ctx.strokeStyle = '#f97316';
          } else if (mode === 'GNSS') {
            ctx.strokeStyle = '#38bdf8';
          } else {
            ctx.strokeStyle = '#10b981';
          }

          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }
      }
    }

    // 5. Draw GNSS Raw Measurement Position
    const gnssPt = telemetry?.gnss_coord;
    if (gnssPt && !isOutage) {
      const { x, y } = projectCoord(gnssPt.lat, gnssPt.lon);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Current Vehicle Position & Heading
    if (currentCoord) {
      const { x, y } = projectCoord(currentCoord.lat, currentCoord.lon);

      const mode = telemetry?.selected_mode || 'HYBRID';
      const ringColor =
        mode === 'DR'
          ? 'rgba(249, 115, 22, 0.25)'
          : mode === 'GNSS'
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(16, 185, 129, 0.25)';

      const errRadius = Math.max(12, Math.min(45, (telemetry?.current_error_m || 1.0) * 12 * zoom));
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

      ctx.fillStyle = mode === 'DR' ? '#f97316' : mode === 'GNSS' ? '#0ea5e9' : '#10b981';
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

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('VYRA (TRACKING)', x + 16, y + 4);
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
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060a14] select-none shadow-2xl"
    >
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
            {(telemetry?.vyra_coord?.lat || telemetry?.gt_coord?.lat || 52.406254).toFixed(6)}°
          </span>
        </div>
        <div>
          Lon:{' '}
          <span className="text-white">
            {(telemetry?.vyra_coord?.lon || telemetry?.gt_coord?.lon || -1.481777).toFixed(6)}°
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
