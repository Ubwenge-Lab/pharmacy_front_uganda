// src/components/map/MapView.tsx
// Core reusable map component using Leaflet via dynamic import (SSR-safe)
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PharmacyLocation, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/features/map/pharmacyData';
import { MapSkeleton, MapErrorState, MissingCoordsState } from './MapStates';
import PharmacyPopup from './PharmacyPopup';
import {
  buildMarkerHtml,
  getMarkerSize,
  getMarkerAnchor,
  MARKER_CSS,
} from './PharmacyMarker';


interface MapViewProps {
  pharmacies: PharmacyLocation[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
  onSelectPharmacy?: (pharmacy: PharmacyLocation) => void;
  onViewDetails?: (id: string) => void;
  userLocation?: [number, number] | null;
  routes?: { points: [number, number][]; color?: string; weight?: number; dashed?: boolean }[];
  heatmapPoints?: [number, number, number][];
  className?: string;
  showZoomControls?: boolean;
}

declare global {
  interface Window { L: any; }
}

export default function MapView({
  pharmacies,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  selectedId,
  onSelectPharmacy,
  onViewDetails,
  userLocation,
  routes,
  heatmapPoints,
  className = '',
  showZoomControls = true,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<any>(null);
  const polylinesRef = useRef<any[]>([]);
  const heatmapLayerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [popupPharmacy, setPopupPharmacy] = useState<PharmacyLocation | null>(null);

  // Check for pharmacies missing coordinates
  const validPharmacies = pharmacies.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );
  const hasMissingCoords = validPharmacies.length < pharmacies.length;

  // Load Leaflet CSS + JS from CDN (SSR-safe, no npm install needed)
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }

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
      heatScript.onload = () => setLeafletLoaded(true);
      document.head.appendChild(heatScript);
    };
    script.onerror = () => setError('Failed to load map library. Check your connection.');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const isMounted = true;
    if (!leafletLoaded || !mapContainerRef.current || leafletMap.current) return;
    const L = window.L;

    // Safety: check if the container already has an internal Leaflet ID (prevents "Map container already initialized" error)
    // @ts-ignore
    if (mapContainerRef.current._leaflet_id) return;

    try {
      if (!isMounted) return;
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: showZoomControls,
        attributionControl: true,
      });

      // Position zoom controls bottom-right to avoid overlapping our badge
      if (showZoomControls) {
        map.zoomControl.setPosition('bottomright');
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
      setLoading(false);
    } catch {
      setError('Failed to initialize map.');
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [leafletLoaded]);

  // Render/update pharmacy markers whenever pharmacies or selectedId changes
  useEffect(() => {
    if (!leafletMap.current || loading) return;
    const L = window.L;
    const map = leafletMap.current;

    // Remove stale markers and polylines
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    polylinesRef.current.forEach(p => p.remove());
    if (heatmapLayerRef.current) map.removeLayer(heatmapLayerRef.current);
    markersRef.current = {};
    polylinesRef.current = [];
    heatmapLayerRef.current = null;

    validPharmacies.forEach((pharmacy) => {
      const isSelected = pharmacy.id === selectedId;
      const size = getMarkerSize(isSelected);
      const anchor = getMarkerAnchor(isSelected);

      const icon = L.divIcon({
        html: buildMarkerHtml({
          status: pharmacy.status,
          selected: isSelected,
          isActive: pharmacy.isActive,
        }),
        className: '',
        iconSize: size,
        iconAnchor: anchor,
      });

      const marker = L.marker([pharmacy.latitude, pharmacy.longitude], { icon })
        .addTo(map)
        .on('click', () => {
          setPopupPharmacy(pharmacy);
          onSelectPharmacy?.(pharmacy);
        });

      markersRef.current[pharmacy.id] = marker;
    });

    // Draw routes if any
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

    // Draw Heatmap Layer
    if (heatmapPoints && heatmapPoints.length > 0 && L.heatLayer) {
      heatmapLayerRef.current = L.heatLayer(heatmapPoints, {
        radius: 20,
        blur: 15,
        maxZoom: 12,
        gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red' }
      }).addTo(map);
    }
  }, [validPharmacies, loading, selectedId, routes, heatmapPoints]);

  // Pan to selected marker
  useEffect(() => {
    if (!leafletMap.current || loading || !selectedId) return;
    const pharmacy = validPharmacies.find((p) => p.id === selectedId);
    if (pharmacy) {
      leafletMap.current.panTo([pharmacy.latitude, pharmacy.longitude], { animate: true, duration: 0.5 });
    }
  }, [selectedId, loading]);

  // User location blue dot
  useEffect(() => {
    if (!leafletMap.current || loading || !userLocation) return;
    const L = window.L;
    if (userMarkerRef.current) userMarkerRef.current.remove();

    const pulseHtml = `
      <div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:#1E4D8C;opacity:0.2;animation:userPulse 1.8s infinite;"></div>
        <div style="position:absolute;inset:4px;border-radius:50%;background:#1E4D8C;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    userMarkerRef.current = L.marker(userLocation, {
      icon: L.divIcon({ html: pulseHtml, className: '', iconSize: [20, 20], iconAnchor: [10, 10] }),
      zIndexOffset: 1000,
    })
      .addTo(leafletMap.current)
      .bindTooltip('📍 You are here', { permanent: false, direction: 'top', offset: [0, -12] });
  }, [userLocation, loading]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    setLeafletLoaded(false);
  }, []);

  if (error) return <MapErrorState message={error} onRetry={handleRetry} />;

  return (
    <div className={`relative w-full ${className}`} style={{ minHeight: 350 }}>
      {loading && (
        <div className="absolute inset-0 z-10">
          <MapSkeleton />
        </div>
      )}

      {/* Inject marker animation CSS */}
      <style>{MARKER_CSS}{`
        @keyframes userPulse {
          0%,100%{transform:scale(1);opacity:0.2}
          50%{transform:scale(3);opacity:0}
        }
      `}</style>

      {/* Pharmacy count badge */}
      {!loading && validPharmacies.length > 0 && (
        <div
          className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-lg pointer-events-none bg-brand-navy"
        >
          {validPharmacies.length} {validPharmacies.length === 1 ? 'Pharmacy' : 'Pharmacies'}
        </div>
      )}

      {/* Missing coordinates notice */}
      {hasMissingCoords && !loading && (
        <div className="absolute top-3 right-3 z-20 max-w-[200px]">
          <MissingCoordsState />
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: 350 }}
      />

      {/* Inline popup overlay */}
      {popupPharmacy && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <PharmacyPopup
            pharmacy={popupPharmacy}
            onViewDetails={onViewDetails}
            onClose={() => setPopupPharmacy(null)}
          />
        </div>
      )}
    </div>
  );
}
