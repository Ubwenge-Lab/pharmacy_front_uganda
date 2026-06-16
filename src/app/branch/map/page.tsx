'use client';

/**
 * Branch Manager — Localized Map View
 * Route: /branch/map
 *
 * APIs used:
 *   GET /triangulation/manager     → { managerBranch, sisterBranches[] with distance }
 *   GET /triangulation/competitors → PharmacyLocationDto[] (within 3 km, competitor branches)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Navigation, GitBranch, RefreshCw,
  AlertCircle, Building2, Eye, EyeOff, Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import type { MapMarker } from '@/components/map/BaseMap';
import { MapSkeleton } from '@/components/map/MapStates';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';
const RED  = '#EF4444';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtKm(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Sister Branch Card ───────────────────────────────────────────────────────

function SisterCard({
  branch,
  active,
  onClick,
}: {
  branch: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3.5 border transition-all duration-150"
      style={{
        backgroundColor: active ? '#EEF2FF' : '#fff',
        borderColor:     active ? '#6366F1' : '#E5E7EB',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: active ? '#6366F133' : '#F3F4F6' }}
        >
          <GitBranch size={14} style={{ color: active ? '#6366F1' : '#9CA3AF' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm truncate">{branch.displayName}</p>
          <p className="text-xs text-gray-400 truncate">{branch.address || '—'}</p>
        </div>
        {branch.distance != null && (
          <span
            className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}
          >
            {fmtKm(branch.distance)}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Competitor Card ──────────────────────────────────────────────────────────

function CompetitorCard({
  branch,
  active,
  onClick,
}: {
  branch: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl p-3.5 border transition-all duration-150"
      style={{
        backgroundColor: active ? '#FEF2F2' : '#fff',
        borderColor:     active ? RED : '#E5E7EB',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: active ? '#FEE2E2' : '#FFF5F5' }}
        >
          <Building2 size={14} style={{ color: active ? RED : '#FCA5A5' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm truncate">{branch.name}</p>
          <p className="text-xs text-gray-400 truncate">{branch.address || '—'}</p>
        </div>
        {branch.distance != null && (
          <span
            className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
          >
            {fmtKm(branch.distance)}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Quick stat pill ──────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-100">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BranchMapPage() {
  const { t } = useTranslation();

  const [managerBranch, setManagerBranch]     = useState<any | null>(null);
  const [sisterBranches, setSisterBranches]   = useState<any[]>([]);
  const [competitors, setCompetitors]         = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(false);
  const [showSisters, setShowSisters]         = useState(true);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [selectedMarker, setSelectedMarker]   = useState<MapMarker | null>(null);
  const [activeCard, setActiveCard]           = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [triRes, compRes] = await Promise.allSettled([
        api.get('/triangulation/manager'),
        api.get('/triangulation/competitors'),
      ]);

      if (triRes.status === 'fulfilled') {
        const data = triRes.value.data;
        setManagerBranch(data?.managerBranch ?? null);
        setSisterBranches(Array.isArray(data?.sisterBranches) ? data.sisterBranches : []);
      }

      if (compRes.status === 'fulfilled') {
        const data = compRes.value.data;
        setCompetitors(Array.isArray(data) ? data : []);
      }

    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Build markers ──────────────────────────────────────────────────────────

  const markers: MapMarker[] = [];

  if (managerBranch?.latitude != null) {
    markers.push({
      id:       managerBranch.id ?? 'my-branch',
      lat:      managerBranch.latitude,
      lng:      managerBranch.longitude,
      label:    managerBranch.displayName ?? managerBranch.name ?? 'My Branch',
      sublabel: managerBranch.address,
      type:     'own',
      status:   'My Branch',
    });
  }

  if (showSisters) {
    sisterBranches
      .filter(b => b.latitude != null && b.longitude != null)
      .forEach(b =>
        markers.push({
          id:       b.id,
          lat:      b.latitude,
          lng:      b.longitude,
          label:    b.displayName ?? b.name,
          sublabel: b.address,
          type:     'sibling',
          status:   b.distance != null ? `Sister · ${fmtKm(b.distance)}` : 'Sister Branch',
          meta:     { distance: b.distance },
        })
      );
  }

  if (showCompetitors) {
    competitors
      .filter(c => c.latitude != null && c.longitude != null)
      .forEach(c =>
        markers.push({
          id:       c.id,
          lat:      c.latitude,
          lng:      c.longitude,
          label:    c.name,
          sublabel: c.address,
          type:     'competitor',
          status:   c.distance != null ? `Competitor · ${fmtKm(c.distance)}` : 'Competitor',
          meta:     { distance: c.distance, phone: c.phone, hours: c.hours },
        })
      );
  }

  // ── Derived counts ─────────────────────────────────────────────────────────

  const sistersWithCoords    = sisterBranches.filter(b => b.latitude != null);
  const sistersNoCoords      = sisterBranches.filter(b => b.latitude == null);
  const competitorsWithCoords = competitors.filter(c => c.latitude != null);

  // ── Triangulation: draw lines from managerBranch → each sister (star pattern) ──
  // We pass triangulate=true only when own + sisters are shown; BaseMap draws mesh.
  // The "star" feel comes naturally since managerBranch is always marker[0].
  const doTriangulate = showSisters && sistersWithCoords.length > 0 && managerBranch?.latitude != null;


  return (
    <div className="space-y-5">

      {/* Hero */}
      <div
        className="rounded-2xl p-6 bg-[#EBF4FF] flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Navigation size={18} className="text-[#29ABE2]" />
            <p className="text-[#29ABE2] text-sm font-medium">Branch Location</p>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[#1E3A5F]">Network Map</h1>
          <p className="mt-1 text-white/60 text-sm">
            Your branch, sister branches, and nearby competitors
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <StatPill label="Sister branches"  value={sisterBranches.length}      color="#6366F1" />
        <StatPill label="On map"           value={sistersWithCoords.length}    color={TEAL}    />
        <StatPill label="Competitors nearby" value={competitorsWithCoords.length} color={RED}  />
      </div>

      {error ? (
        <div className="flex items-center justify-center h-64 rounded-2xl border border-gray-100 bg-gray-50">
          <div className="text-center space-y-2">
            <AlertCircle size={28} className="mx-auto text-gray-300" />
            <p className="text-sm text-gray-400">Failed to load map data.</p>
            <button onClick={load} className="text-xs font-medium underline" style={{ color: TEAL }}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Map column */}
          <div className="lg:col-span-2 space-y-3">

            {/* Layer toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">Layers</span>

              {/* Sister branches */}
              <button
                onClick={() => setShowSisters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  showSisters
                    ? { backgroundColor: '#EEF2FF', borderColor: '#6366F1', color: '#6366F1' }
                    : { backgroundColor: '#fff',    borderColor: '#E5E7EB', color: '#9CA3AF' }
                }
              >
                {showSisters ? <Eye size={12} /> : <EyeOff size={12} />}
                Sister Branches
              </button>

              {/* Competitors — now live */}
              <button
                onClick={() => setShowCompetitors(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all"
                style={
                  showCompetitors
                    ? { backgroundColor: '#FEF2F2', borderColor: RED, color: RED }
                    : { backgroundColor: '#fff',    borderColor: '#E5E7EB', color: '#9CA3AF' }
                }
              >
                {showCompetitors ? <Eye size={12} /> : <EyeOff size={12} />}
                <Users size={12} />
                Competitors
                {competitorsWithCoords.length > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                  >
                    {competitorsWithCoords.length}
                  </span>
                )}
              </button>
            </div>

            {/* Map canvas */}
            {loading ? (
              <div style={{ height: '480px' }}><MapSkeleton /></div>
            ) : markers.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 gap-3"
                style={{ height: '480px' }}
              >
                <MapPin size={32} className="text-gray-200" />
                <p className="text-sm text-gray-400">No location data available.</p>
                <p className="text-xs text-gray-300 text-center max-w-xs">
                  Ask your Pharmacy Owner to add coordinates to this branch.
                </p>
              </div>
            ) : (
              <BaseMap
                markers={markers}
                triangulate={doTriangulate}
                height="480px"
                onMarkerClick={m => {
                  setSelectedMarker(m);
                  setActiveCard(m.id);
                }}
                className="shadow-sm"
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* My branch info */}
            {managerBranch && (
              <div
                className="rounded-2xl border p-4 space-y-3"
                style={{ borderColor: TEAL, backgroundColor: '#F0FAFA' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: TEAL }}
                  >
                    <Navigation size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{managerBranch.displayName ?? managerBranch.name}</p>
                    <p className="text-xs text-gray-400">My Branch</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Address</span>
                    <span className="text-gray-700 font-medium">{managerBranch.address || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-14 shrink-0">Coords</span>
                    <span className="font-mono text-[11px] text-gray-500">
                      {managerBranch.latitude != null
                        ? `${managerBranch.latitude.toFixed(4)}, ${managerBranch.longitude.toFixed(4)}`
                        : <span className="text-amber-500">Not set</span>
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sister branches list */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Sister Branches ({sisterBranches.length})
              </p>
              <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '240px' }}>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))
                ) : sisterBranches.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No sister branches found.</p>
                ) : (
                  sisterBranches.map(b => (
                    <SisterCard
                      key={b.id}
                      branch={b}
                      active={activeCard === b.id}
                      onClick={() => setActiveCard(prev => prev === b.id ? null : b.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Competitors list (only shown when layer is on) */}
            {showCompetitors && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Nearby Competitors ({competitors.length})
                </p>
                <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '200px' }}>
                  {competitors.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No competitor branches within 3 km.
                    </p>
                  ) : (
                    competitors.map(c => (
                      <CompetitorCard
                        key={c.id}
                        branch={c}
                        active={activeCard === c.id}
                        onClick={() => setActiveCard(prev => prev === c.id ? null : c.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Missing coords warning */}
            {sistersNoCoords.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">
                      {sistersNoCoords.length} branch{sistersNoCoords.length > 1 ? 'es' : ''} missing coordinates
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {sistersNoCoords.map(b => b.displayName ?? b.name).join(', ')} — ask the pharmacy owner to update them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected marker detail */}
            {selectedMarker && (
              <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Building2
                    size={14}
                    style={{
                      color: selectedMarker.type === 'competitor' ? RED
                           : selectedMarker.type === 'sibling'    ? '#6366F1'
                           : TEAL,
                    }}
                  />
                  <p className="font-bold text-gray-900 text-sm">{selectedMarker.label}</p>
                </div>
                {selectedMarker.sublabel && (
                  <p className="text-xs text-gray-500">{selectedMarker.sublabel}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={
                      selectedMarker.type === 'competitor'
                        ? { backgroundColor: '#FEE2E2', color: '#991B1B' }
                        : selectedMarker.type === 'sibling'
                        ? { backgroundColor: '#EEF2FF', color: '#4338CA' }
                        : { backgroundColor: `${TEAL}22`, color: TEAL }
                    }
                  >
                    {selectedMarker.status}
                  </span>
                </div>
                {selectedMarker.meta?.hours && (
                  <p className="text-[11px] text-gray-400">Hours: {selectedMarker.meta.hours}</p>
                )}
                {selectedMarker.meta?.phone && (
                  <p className="text-[11px] text-gray-400">Phone: {selectedMarker.meta.phone}</p>
                )}
                <p className="text-[11px] font-mono text-gray-300">
                  {selectedMarker.lat.toFixed(5)}, {selectedMarker.lng.toFixed(5)}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
