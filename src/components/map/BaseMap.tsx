'use client';

import { useEffect, useRef, useState } from 'react';
import { MapSkeleton } from './MapStates';
import { MARKER_CSS } from './PharmacyMarker';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  type: 'own' | 'competitor' | 'hq' | 'sibling';
  status?: string;
  meta?: Record<string, any>;
}

interface BaseMapProps {
  markers: MapMarker[];
  triangulate?: boolean;
  heatmapPoints?: [number, number, number][]; // [lat, lng, intensity]
  routes?: { points: [number, number][], color?: string, weight?: number, dashed?: boolean }[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
  className?: string;
}

const MARKER_COLORS: Record<MapMarker['type'], string> = {
  own:        '#2D9B8A',
  hq:         '#1E4D8C',
  sibling:    '#6366F1',
  competitor: '#EF4444',
};

const TYPE_LABELS: Record<MapMarker['type'], string> = {
  own:        'This branch',
  hq:         'HQ',
  sibling:    'Sibling branch',
  competitor: 'Competitor',
};

declare global {
  interface Window {
    L: any;
    _leafletLoaded: boolean;
  }
}

function loadLeaflet(): Promise<void> {
  if (window._leafletLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      // Load Leaflet Heat plugin
      const heatScript = document.createElement('script');
      heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      heatScript.onload = () => {
        window._leafletLoaded = true;
        resolve();
      };
      heatScript.onerror = () => {
        // Fallback resolve even if heat plugin fails
        window._leafletLoaded = true;
        resolve();
      };
      document.head.appendChild(heatScript);
    };
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}

function buildDivMarkerHtml(color: string): string {
  const size = 32;
  return `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:3px solid #1E4D8C;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        transition:all 0.25s ease;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-60%);
        width:${size * 0.35}px;height:${size * 0.35}px;
        background:#fff;
        border-radius:50%;
        box-shadow:inset 0 1px 2px rgba(0,0,0,0.2);
      "></div>
    </div>
  `;
}

export default function BaseMap({
  markers,
  triangulate = false,
  heatmapPoints,
  routes,
  centerLat,
  centerLng,
  zoom = 13,
  onMarkerClick,
  height = '500px',
  className = '',
}: BaseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const heatmapLayerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [popupMarker, setPopupMarker] = useState<MapMarker | null>(null);

  const validCoord = (v: any) => typeof v === 'number' && isFinite(v);

  // Load Leaflet + init map
  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current) return;

    loadLeaflet()
      .then(() => {
        if (!isMounted) return;
        const L = window.L;
        if (mapRef.current) return;

        const validMarkers = markers.filter(m => validCoord(m.lat) && validCoord(m.lng));
        const lat = centerLat ?? validMarkers[0]?.lat ?? -1.9441;
        const lng = centerLng ?? validMarkers[0]?.lng ?? 30.0619;

        const map = L.map(containerRef.current!, { center: [lat, lng], zoom, zoomControl: false });

        // Tile layer — Standard OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapRef.current = map;
        setReady(true);
      })
      .catch(() => {
        if (isMounted) setError(true);
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers + triangulation lines when data or ready state changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = window.L;
    const map = mapRef.current;

    const draw = () => {
      // Clear existing
      markersRef.current.forEach(m => m.remove());
      polylinesRef.current.forEach(p => p.remove());
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
      }
      markersRef.current = [];
      polylinesRef.current = [];
      heatmapLayerRef.current = null;

      // Add markers
      markers.forEach((m) => {
        if (!validCoord(m.lat) || !validCoord(m.lng)) return;

        const color = MARKER_COLORS[m.type] ?? '#2D9B8A';
        const icon = L.divIcon({
          html: buildDivMarkerHtml(color),
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const leafletMarker = L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .on('click', () => {
            setPopupMarker(m);
            onMarkerClick?.(m);
          });

        markersRef.current.push(leafletMarker);
      });

      // Triangulation lines
      if (triangulate && markers.length >= 2) {
        const valid = markers.filter(m => validCoord(m.lat) && validCoord(m.lng));
        for (let i = 0; i < valid.length; i++) {
          for (let j = i + 1; j < valid.length; j++) {
            try {
              const line = L.polyline(
                [[valid[i].lat, valid[i].lng], [valid[j].lat, valid[j].lng]],
                { color: '#1E4D8C', weight: 1.5, opacity: 0.35, dashArray: '6 6' }
              ).addTo(map);
              polylinesRef.current.push(line);
            } catch { }
          }
        }
      }

      // Custom Routes
      if (routes && routes.length > 0) {
        routes.forEach(r => {
          const line = L.polyline(r.points, {
            color: r.color ?? '#1E4D8C',
            weight: r.weight ?? 3,
            opacity: 0.8,
            dashArray: r.dashed ? '8 8' : undefined,
          }).addTo(map);
          polylinesRef.current.push(line);
        });
      }

      // Heatmap Layer
      if (heatmapPoints && heatmapPoints.length > 0 && L.heatLayer) {
        heatmapLayerRef.current = L.heatLayer(heatmapPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 14,
          gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
        }).addTo(map);
      }

      // Fit bounds to all markers safely
      const plotted = markers.filter(m => validCoord(m.lat) && validCoord(m.lng));
      if (plotted.length > 1) {
        try {
          const bounds = L.latLngBounds(plotted.map(m => [m.lat, m.lng]));
          if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
        } catch { }
      } else if (plotted.length === 1) {
        map.setView([plotted[0].lat, plotted[0].lng], zoom);
      }
    };

    map.invalidateSize();
    const t = setTimeout(draw, 50);
    return () => clearTimeout(t);
  }, [ready, markers, triangulate, heatmapPoints, routes, zoom]);

  const validMarkers = markers.filter(
    m => typeof m.lat === 'number' && isFinite(m.lat) && typeof m.lng === 'number' && isFinite(m.lng)
  );

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-gray-400">Map could not be loaded</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-100 ${className}`} style={{ height }}>
      {/* Leaflet container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Marker animation CSS */}
      <style>{MARKER_CSS}{`
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          border: 1px solid #E5E7EB !important;
          color: #374151 !important;
          font-weight: 600 !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
      `}</style>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 z-10">
          <MapSkeleton />
        </div>
      )}

      {/* Count badge */}
      {ready && validMarkers.length > 0 && (
        <div
          className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-lg pointer-events-none bg-brand-navy"
        >
          {validMarkers.length} {validMarkers.length === 1 ? 'Location' : 'Locations'}
        </div>
      )}

      {/* Legend */}
      {ready && markers.length > 0 && (
        <div className="absolute bottom-10 left-3 z-1000 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm px-3 py-2 space-y-1.5">
          {(Object.keys(MARKER_COLORS) as MapMarker['type'][]).map((type) => {
            if (!markers.some(m => m.type === type)) return null;
            return (
              <div key={type} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MARKER_COLORS[type] }} />
                <span className="text-xs text-gray-600">{TYPE_LABELS[type]}</span>
              </div>
            );
          })}
          {triangulate && (
            <div className="flex items-center gap-2 pt-0.5 border-t border-gray-100 mt-0.5">
              <span className="w-5 border-t border-dashed shrink-0 border-brand-navy opacity-50" />
              <span className="text-xs text-gray-500">Triangulation</span>
            </div>
          )}
        </div>
      )}

      {/* Popup overlay */}
      {popupMarker && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-64">
            {/* Header — gradient with icon */}
            <div
              className="px-4 py-3 flex items-center justify-between text-white"
              style={{ background: `linear-gradient(135deg, ${MARKER_COLORS[popupMarker.type] ?? '#2D9B8A'}, var(--color-brand-navy))` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{popupMarker.label}</p>
                  <p className="text-white/60 text-xs">{TYPE_LABELS[popupMarker.type]}</p>
                </div>
              </div>
              <button
                onClick={() => setPopupMarker(null)}
                className="text-white/70 hover:text-white text-xl leading-none ml-2 shrink-0"
              >
                &times;
              </button>
            </div>
            {/* Body */}
            <div className="p-3 space-y-2">
              {popupMarker.sublabel && (
                <div className="flex items-start gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <p className="text-xs text-gray-500">{popupMarker.sublabel}</p>
                </div>
              )}
              {popupMarker.status && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    background: `${MARKER_COLORS[popupMarker.type] ?? '#2D9B8A'}22`,
                    color: MARKER_COLORS[popupMarker.type] ?? '#2D9B8A',
                  }}
                >
                  {popupMarker.status}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
