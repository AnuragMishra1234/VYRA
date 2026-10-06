import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, MapPin } from 'lucide-react';

export default function MapView({ pathsData, telemetry }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polylinesRef = useRef({});

  // Layer visibility state
  const [layers, setLayers] = useState({
    gt: true,
    vyra: true,
    hybrid: true,
    gnss: false,
    dr: false,
  });

  const [autoFollow, setAutoFollow] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30.528, 114.356], // Default near Wuhan Urban dataset area
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tiles (open access, sleek dark theme for navigation research)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; OpenStreetMap contributors &copy; CARTO')
        .addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update polylines when pathsData arrives
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !pathsData || !pathsData.paths) return;

    // Clear existing polylines
    Object.values(polylinesRef.current).forEach((p) => p && map.removeLayer(p));
    polylinesRef.current = {};

    const p = pathsData.paths;

    // 1. Offline Reference Ground Truth
    if (p.offline_reference_gt && p.offline_reference_gt.length > 0) {
      polylinesRef.current.gt = L.polyline(p.offline_reference_gt, {
        color: '#e2e8f0', // bright slate/white
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 6',
      });
      if (layers.gt) polylinesRef.current.gt.addTo(map);

      // Fit map bounds to trajectory once on initial load
      map.fitBounds(polylinesRef.current.gt.getBounds(), { padding: [40, 40] });
    }

    // 2. VYRA Proposed Adaptive Filter
    if (p.vyra && p.vyra.length > 0) {
      polylinesRef.current.vyra = L.polyline(p.vyra, {
        color: '#818cf8', // indigo 400
        weight: 4,
        opacity: 0.95,
      });
      if (layers.vyra) polylinesRef.current.vyra.addTo(map);
    }

    // 3. Fixed HYBRID (Continuous EKF)
    if (p.hybrid && p.hybrid.length > 0) {
      polylinesRef.current.hybrid = L.polyline(p.hybrid, {
        color: '#10b981', // emerald 500
        weight: 2.5,
        opacity: 0.8,
      });
      if (layers.hybrid) polylinesRef.current.hybrid.addTo(map);
    }

    // 4. Raw GNSS Fix
    if (p.gnss && p.gnss.length > 0) {
      polylinesRef.current.gnss = L.polyline(p.gnss, {
        color: '#38bdf8', // sky blue
        weight: 2,
        opacity: 0.65,
      });
      if (layers.gnss) polylinesRef.current.gnss.addTo(map);
    }

    // 5. Pure DR (Inertial)
    if (p.dr && p.dr.length > 0) {
      polylinesRef.current.dr = L.polyline(p.dr, {
        color: '#f59e0b', // amber
        weight: 2,
        opacity: 0.65,
      });
      if (layers.dr) polylinesRef.current.dr.addTo(map);
    }
  }, [pathsData]);

  // Synchronize layer visibility toggles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.entries(layers).forEach(([key, isVisible]) => {
      const poly = polylinesRef.current[key];
      if (poly) {
        if (isVisible && !map.hasLayer(poly)) {
          poly.addTo(map);
        } else if (!isVisible && map.hasLayer(poly)) {
          map.removeLayer(poly);
        }
      }
    });
  }, [layers]);

  // Update current vehicle position marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !telemetry || !telemetry.vyra_coord) return;

    const lat = telemetry.vyra_coord.lat;
    const lon = telemetry.vyra_coord.lon;

    if (!markerRef.current) {
      const pulseHtml = `
        <div class="relative flex items-center justify-center w-6 h-6">
          <div class="absolute w-6 h-6 rounded-full bg-blue-500 opacity-60 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
        </div>
      `;
      const icon = L.divIcon({
        html: pulseHtml,
        className: 'custom-vehicle-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lon]);
    }

    if (autoFollow) {
      map.panTo([lat, lon], { animate: false });
    }
  }, [telemetry, autoFollow]);

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const recenter = () => {
    if (mapInstanceRef.current && telemetry?.vyra_coord) {
      mapInstanceRef.current.setView([telemetry.vyra_coord.lat, telemetry.vyra_coord.lon], 17, { animate: true });
      setAutoFollow(true);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Map Control Bar Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2.5 shadow-xl text-xs flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Trajectory Layers</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-slate-200 hover:text-white">
          <input
            type="checkbox"
            checked={layers.gt}
            onChange={() => toggleLayer('gt')}
            className="rounded bg-slate-800 border-slate-700 text-slate-200 focus:ring-0"
          />
          <span className="w-3 h-0.5 border-t border-dashed border-white inline-block"></span>
          <span className="font-semibold text-slate-100">Ground Truth (Offline Reference)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.vyra}
            onChange={() => toggleLayer('vyra')}
            className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0"
          />
          <span className="w-3 h-1 bg-indigo-400 rounded-full inline-block"></span>
          <span>VYRA Adaptive (Proposed)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={layers.hybrid}
            onChange={() => toggleLayer('hybrid')}
            className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
          />
          <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
          <span>Fixed HYBRID (Continuous EKF)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={layers.gnss}
            onChange={() => toggleLayer('gnss')}
            className="rounded bg-slate-800 border-slate-700 text-sky-400 focus:ring-0"
          />
          <span className="w-3 h-1 bg-sky-400 rounded-full inline-block"></span>
          <span>Raw GNSS Fix</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={layers.dr}
            onChange={() => toggleLayer('dr')}
            className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
          />
          <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span>
          <span>Pure Inertial DR</span>
        </label>
      </div>

      {/* Recenter & Follow Toggle Overlay */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        <button
          onClick={() => setAutoFollow(!autoFollow)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 backdrop-blur transition shadow-lg ${
            autoFollow
              ? 'bg-blue-600/80 border-blue-500 text-white'
              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle camera following vehicle position"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{autoFollow ? 'Tracking Vehicle' : 'Free Camera'}</span>
        </button>

        <button
          onClick={recenter}
          className="p-1.5 rounded-lg border bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 backdrop-blur transition shadow-lg"
          title="Recenter view on current vehicle position"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
