import React, { useRef, useEffect, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';

export default function DualPathDemoCanvas({
  telemetry,
  history = [],
  pathsData = null,
  isGpsLost = false,
  gpsLostCoord = null,
  useTechnicalTerms = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1.1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const w = containerRef.current.clientWidth || 960;
        const h = containerRef.current.clientHeight || 500;
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

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Determine Dynamic Reference Center (Current Vehicle Location)
    const currentCoord =
      telemetry?.vyra_coord ||
      telemetry?.gt_coord ||
      (history.length > 0
        ? history[history.length - 1]?.vyra_coord || history[history.length - 1]?.gt_coord
        : null) || { lat: 52.406254, lon: -1.481777 };

    const centerLat = currentCoord.lat;
    const centerLon = currentCoord.lon;

    // Metric projection factors (WGS-84 local tangent approximation)
    const mPerDegLat = 111320.0;
    const mPerDegLon = 111320.0 * Math.cos((centerLat * Math.PI) / 180);
    // 2.8 pixels per meter scale for crisp road visualization
    const pxPerMeter = 2.8 * zoom;

    const projectCoord = (lat, lon) => {
      const dx = (lon - centerLon) * mPerDegLon;
      const dy = (lat - centerLat) * mPerDegLat;
      const x = width / 2 + (dx * pxPerMeter + offset.x);
      const y = height / 2 - (dy * pxPerMeter - offset.y); // y inverted for canvas
      return { x, y };
    };

    // Clear & Canvas Background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // 2. Metric World Grid (50-Meter Major Squares)
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

    // 3. Extract Road Coordinates from pathsData (Supports array and object formats)
    const rawGt = pathsData?.paths?.offline_reference_gt || pathsData?.offline_reference_gt || [];
    const allGtPoints = rawGt
      .map((pt) => {
        if (Array.isArray(pt)) return { lat: pt[0], lon: pt[1] };
        if (pt && pt.lat !== undefined) return { lat: pt.lat, lon: pt.lon };
        return null;
      })
      .filter(Boolean);

    // Filter ground truth points within local visible tangent window (+/- 800m)
    const visibleGt = allGtPoints.filter((pt) => {
      const dLat = Math.abs(pt.lat - centerLat) * mPerDegLat;
      const dLon = Math.abs(pt.lon - centerLon) * mPerDegLon;
      return dLat < 800 && dLon < 800;
    });

    // 4. Render Road Surface & Centerline
    if (visibleGt.length > 1) {
      // Road Asphalt Surface
      ctx.strokeStyle = '#151f38';
      ctx.lineWidth = Math.max(16, 12 * pxPerMeter); // 12-meter wide 2-lane road
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      visibleGt.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Road Borders (curbs/shoulders)
      ctx.strokeStyle = '#223254';
      ctx.lineWidth = Math.max(18, 12.8 * pxPerMeter);
      ctx.beginPath();
      visibleGt.forEach((pt, i) => {
        const { x, y } = projectCoord(pt.lat, pt.lon);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Redraw inner asphalt
      ctx.strokeStyle = '#0e1629';
      ctx.lineWidth = Math.max(14, 11 * pxPerMeter);
      ctx.stroke();

      // Road Centerline (Dashed White/Yellow)
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
      // Fallback Road Surface if pathsData is still loading
      const heading = (telemetry?.heading_deg || 45) * (Math.PI / 180);
      const roadDirX = Math.sin(heading);
      const roadDirY = Math.cos(heading);
      const pA = {
        lat: centerLat - (roadDirY * 350) / mPerDegLat,
        lon: centerLon - (roadDirX * 350) / mPerDegLon,
      };
      const pB = {
        lat: centerLat + (roadDirY * 350) / mPerDegLat,
        lon: centerLon + (roadDirX * 350) / mPerDegLon,
      };
      const ptA = projectCoord(pA.lat, pA.lon);
      const ptB = projectCoord(pB.lat, pB.lon);

      // Asphalt
      ctx.strokeStyle = '#151f38';
      ctx.lineWidth = Math.max(16, 12 * pxPerMeter);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();

      // Centerline
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Render Historical Trajectory Breadcrumb Trail
    if (history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        const p0 = history[i - 1];
        const p1 = history[i];
        const c0 = p0.vyra_coord || p0.gt_coord;
        const c1 = p1.vyra_coord || p1.gt_coord;

        if (c0 && c1) {
          const pt0 = projectCoord(c0.lat, c0.lon);
          const pt1 = projectCoord(c1.lat, c1.lon);

          const mode = p1.selected_mode || 'HYBRID';
          if (mode === 'DR') {
            ctx.strokeStyle = '#f97316'; // Movement-based / Dead Reckoning (Amber)
          } else if (mode === 'GNSS') {
            ctx.strokeStyle = '#38bdf8'; // GPS-Direct (Sky Blue)
          } else {
            ctx.strokeStyle = '#10b981'; // Combined / EKF Hybrid (Emerald)
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

    // 6. GPS-Only Frozen / Divergence Visuals during Injected Outage
    if (isGpsLost && gpsLostCoord) {
      const lostPt = projectCoord(gpsLostCoord.lat, gpsLostCoord.lon);

      // Outer Red Pulsing Rings at Signal Loss Origin
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lostPt.x, lostPt.y, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lostPt.x, lostPt.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(lostPt.x, lostPt.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Pin Label: GPS LOST FIX (FROZEN)
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('GPS FIX FROZEN HERE', lostPt.x + 12, lostPt.y - 10);

      // Red Dashed Tether connecting Frozen GPS Fix to Moving VYRA Vehicle
      const currPt = projectCoord(currentCoord.lat, currentCoord.lon);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(lostPt.x, lostPt.y);
      ctx.lineTo(currPt.x, currPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dynamic Error Distance Measurement Pill along Tether
      const midX = (lostPt.x + currPt.x) / 2;
      const midY = (lostPt.y + currPt.y) / 2;
      const errorDistM = Math.sqrt(
        Math.pow((currentCoord.lat - gpsLostCoord.lat) * mPerDegLat, 2) +
          Math.pow((currentCoord.lon - gpsLostCoord.lon) * mPerDegLon, 2)
      );

      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - 55, midY - 14, 110, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`GPS Error: ${errorDistM.toFixed(1)}m`, midX, midY + 1);
      ctx.textAlign = 'left';
    }

    // 7. Active VYRA Vehicle Marker (Center of Screen with Heading Orientation)
    const vehPt = projectCoord(currentCoord.lat, currentCoord.lon);
    const mode = telemetry?.selected_mode || 'HYBRID';
    const auraColor =
      mode === 'DR'
        ? 'rgba(249, 115, 22, 0.25)'
        : mode === 'GNSS'
        ? 'rgba(56, 189, 248, 0.25)'
        : 'rgba(16, 185, 129, 0.25)';

    // Pulsing Aura Ring
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(vehPt.x, vehPt.y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Directional Arrow / Triangle Marker
    const headingDeg = telemetry?.heading_deg || 45;
    const rad = ((headingDeg - 90) * Math.PI) / 180;

    ctx.save();
    ctx.translate(vehPt.x, vehPt.y);
    ctx.rotate(rad);

    ctx.fillStyle = mode === 'DR' ? '#f97316' : mode === 'GNSS' ? '#38bdf8' : '#10b981';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Vehicle Badge Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('VYRA (TRACKING)', vehPt.x + 18, vehPt.y + 4);

    // 8. Metric Scale Bar (Bottom Left)
    const scaleBarM = 50;
    const scaleBarPx = scaleBarM * pxPerMeter;
    const scaleX = 20;
    const scaleY = height - 25;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleBarPx, scaleY);
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scaleBarPx, scaleY - 4);
    ctx.lineTo(scaleX + scaleBarPx, scaleY + 4);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('50 meters', scaleX + scaleBarPx / 2 - 25, scaleY - 6);
  }, [telemetry, history, pathsData, zoom, offset, isGpsLost, gpsLostCoord]);

  // Mouse Pan Handlers
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
    <div
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-[#060a14] select-none shadow-2xl"
    >
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
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/60 text-emerald-300 rounded-xl px-3.5 py-1.5 flex items-center gap-2 text-xs font-mono shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">GPS AVAILABLE</span>
            <span className="text-[10px] text-slate-400">(14 Satellites &bull; Q=0.94)</span>
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
      <div className="absolute top-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono shadow-xl max-w-[280px]">
        <div className="text-[10px] uppercase font-bold text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>Navigation Mode</span>
          <Compass className="w-3 h-3 text-cyan-400" />
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
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>GPS Fix Frozen (Diverging)</span>
          </div>
        )}
      </div>

      {/* Bottom Right: Pan/Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg">
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.25))}
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
