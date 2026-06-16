// src/app/patient/search/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  MapIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import NearbyPharmacyList from '@/components/map/NearbyPharmacyList';
import MapLayout from '@/components/map/MapLayout';
import { LocationDeniedState, OfflineState, MapSkeleton } from '@/components/map/MapStates';
import { fetchNearbyPharmacies, fetchPharmacyLocations } from '@/services/pharmacies';
import { PharmacyLocation, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/features/map/pharmacyData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Medication } from '@/types';

// Leaflet must never touch SSR – dynamic import is mandatory
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function SearchPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState<'pharmacies' | 'medications'>('pharmacies');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Map state
  const [allPharmacies, setAllPharmacies] = useState<PharmacyLocation[]>([]);
  const [mapPharmacies, setMapPharmacies] = useState<PharmacyLocation[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);

  const { status: geoStatus, coords, requestLocation } = useGeolocation();

  // Load all pharmacies on mount
  useEffect(() => {
    if (activeTab === 'pharmacies') loadPharmacies();
  }, [activeTab]);

  const loadPharmacies = async () => {
    setMapLoading(true);
    try {
      const data = await fetchPharmacyLocations();
      setAllPharmacies(data ?? []);
      setMapPharmacies(data ?? []);
    } catch {
      toast.error('Failed to load pharmacies.');
    } finally {
      setMapLoading(false);
    }
  };

  // Reload nearby when location granted
  useEffect(() => {
    if (geoStatus === 'success' && coords) {
      setMapCenter(coords);
      (async () => {
        setMapLoading(true);
        const nearby = await fetchNearbyPharmacies(coords[0], coords[1]);
        setMapPharmacies(nearby ?? []);
        setMapLoading(false);
      })();
    }
  }, [geoStatus, coords]);

  // Compute routes from user to the 3 nearest pharmacies
  const routes = (geoStatus === 'success' && coords && mapPharmacies.length > 0)
    ? mapPharmacies.slice(0, 3).filter(p => p.latitude && p.longitude).map(p => ({
        points: [coords, [p.latitude!, p.longitude!]] as [number, number][],
        color: '#1E4D8C',
        weight: 3,
        dashed: true
      }))
    : [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (activeTab === 'pharmacies') {
      const filtered = allPharmacies.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.address.toLowerCase().includes(q.toLowerCase())
      );
      setMapPharmacies(filtered.length ? filtered : allPharmacies);
      if (!filtered.length) toast('No pharmacies matched.', { icon: '🔍' });
      return;
    }

    setMedLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/medications/search?query=${q}`);
      setMedications(res.data);
      if (!res.data.length) toast.error(t('errors.noMedicationsFound'));
    } catch {
      toast.error(t('errors.searchFailed'));
    } finally {
      setMedLoading(false);
    }
  };

  const handleSelectPharmacy = useCallback((p: PharmacyLocation) => {
    setSelectedId(p.id);
  }, []);

  const handleViewDetails = useCallback(
    (id: string) => router.push(`/patient/pharmacies/${id}`),
    [router]
  );

  const handleAddToCart = (med: Medication) => {
    addToCart({
      medicationId: med.id,
      name: med.name,
      price: med.price,
      quantity: 1,
      pharmacyId: med.pharmacyId || med.pharmacy?.id || '',
      branchId: med.branchId || med.branch?.id || '',
      pharmacyName: med.pharmacy?.name || '',
      requiresPrescription: med.requiresPrescription,
      imageUrl: med.imageUrl,
    });
    toast.success(`${med.name} added to cart!`);
  };

  // ── Header slot for MapLayout ──
  const mapHeader = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
        {geoStatus === 'success' ? t('search.pharmaciesNearYou') : t('search.allPharmacies')}
        <span
          className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy"
        >
          {mapPharmacies.length}
        </span>
      </h3>
      {/* Map / List toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('map')}
          title="Map view"
          className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-500'}`}
        >
          <MapIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          title="List view"
          className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-500'}`}
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div
        className="rounded-2xl shadow-xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-navy-dark))' }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('patient.findPharmacyAndMedicine')}</h1>
        <p className="text-blue-100 text-lg">{t('search.searchNearby')}</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'pharmacies'
                  ? t('search.searchPharmaciesPlaceholder')
                  : t('search.searchPlaceholder')
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': '#2D9B8A' } as React.CSSProperties}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:opacity-90 whitespace-nowrap bg-brand-teal"
          >
            {t('common.search')}
          </button>
        </div>
      </form>

      {/* Tab bar */}
      <div className="flex gap-3 flex-wrap">
        {(['pharmacies', 'medications'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab ? 'bg-brand-navy text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab === 'pharmacies' ? t('pharmacies.pharmacies') : t('medications.medications')}
          </button>
        ))}
      </div>

      {/* ── PHARMACIES TAB ── */}
      {activeTab === 'pharmacies' && (
        <>
          {/* State banners */}
          {geoStatus === 'denied' && (
            <LocationDeniedState onManual={() => setViewMode('list')} />
          )}
          {typeof navigator !== 'undefined' && !navigator.onLine && <OfflineState />}

          {/* "Find Near Me" prompt */}
          {geoStatus !== 'success' && geoStatus !== 'denied' && (
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white"
              style={{ background: 'linear-gradient(135deg, var(--color-brand-teal), #207a6c)' }}
            >
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-8 h-8 shrink-0" />
                <div>
                  <p className="font-bold text-lg">{t('search.findNearMe')}</p>
                  <p className="text-sm opacity-90">
                    {t('search.locationAccessDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={requestLocation}
                disabled={geoStatus === 'loading'}
                className="shrink-0 px-6 py-2.5 bg-white font-bold text-sm rounded-xl transition-all hover:bg-gray-50 disabled:opacity-60 text-brand-teal"
              >
                {geoStatus === 'loading' ? t('search.locating') : t('search.useMyLocation')}
              </button>
            </div>
          )}

          {/* MAP view – uses MapLayout for responsive breakpoints */}
          {viewMode === 'map' && (
            <MapLayout
              header={mapHeader}
              mapHeightMobile={320}
              mapHeightTablet={420}
              mapHeightDesktop={520}
              map={
                <MapView
                  pharmacies={mapPharmacies}
                  center={mapCenter}
                  zoom={14}
                  selectedId={selectedId}
                  routes={routes}
                  onSelectPharmacy={handleSelectPharmacy}
                  onViewDetails={handleViewDetails}
                  userLocation={coords}
                  className="h-full"
                />
              }
              sidebar={
                <NearbyPharmacyList
                  pharmacies={mapPharmacies}
                  selectedId={selectedId}
                  onSelect={handleSelectPharmacy}
                  onViewDetails={handleViewDetails}
                  loading={mapLoading}
                />
              }
            />
          )}

          {/* LIST-ONLY view */}
          {viewMode === 'list' && (
            <div>
              {mapHeader}
              <div className="mt-4">
                <NearbyPharmacyList
                  pharmacies={mapPharmacies}
                  selectedId={selectedId}
                  onSelect={handleSelectPharmacy}
                  onViewDetails={handleViewDetails}
                  loading={mapLoading}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MEDICATIONS TAB ── */}
      {activeTab === 'medications' && (
        <>
          {medLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}
          {!medLoading && searched && medications.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medications.map((med) => (
                <div key={med.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-1">{med.name}</h3>
                      <p className="text-sm text-gray-500">{t('search.availableAt')} {med.pharmacy?.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-brand-navy">
                        UGX {med.price?.toLocaleString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${med.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {med.quantity > 0 ? `${t('inventory.inStock')} (${med.quantity})` : t('inventory.outOfStock')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(med)}
                      disabled={med.quantity === 0}
                      className="w-full py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-40 bg-brand-teal"
                    >
                      {t('medications.addToCart')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!medLoading && searched && medications.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow">
              <p className="text-5xl mb-3">💊</p>
              <p className="text-gray-500 text-lg">{t('search.noMedicationsFound')}</p>
            </div>
          )}
          {!searched && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-gray-500 text-lg">{t('search.enterMedicationName')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
