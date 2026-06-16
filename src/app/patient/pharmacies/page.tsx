// frontend/src/app/patient/pharmacies/page.tsx

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MapPinIcon, PhoneIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  _count?: { medications: number };
}

export default function BrowsePharmaciesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchPharmacies(); }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pharmacies');
      setPharmacies(res.data);
    } catch {
      // Pharmacy list stays empty on failure
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = useMemo(
    () => pharmacies.filter((pharmacy) =>
      pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [pharmacies, searchQuery]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
        <div className="bg-[#EBF5FF] rounded-2xl p-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-[#1E3A5F]">
           {t('patient.browsePharmacies')}
          </h1>
        <p className="text-gray-500 text-lg">{t('patient.findPharmaciesNearYou')}</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t('patient.searchPharmacies')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
          <button className="px-6 py-3 rounded-xl border-2 border-gray-800 text-gray-800 font-semibold bg-white hover:bg-gray-50 transition-colors">
            {t('common.search')}
          </button>
        </div>
      </div>

      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {filteredPharmacies.length} {t('patient.pharmaciesFound')}
        </div>

      {filteredPharmacies.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BuildingStorefrontIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">
            {searchQuery ? t('patient.noPharmaciesMatch') : t('patient.noPharmaciesAvailable')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              onClick={() => router.push(`/patient/pharmacies/${pharmacy.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer p-5"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-base mb-1">{pharmacy.name}</h3>
                  <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-0.5">
                    <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{pharmacy.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <PhoneIcon className="w-4 h-4 shrink-0" />
                    <span>{pharmacy.phone}</span>
                  </div>
                </div>

                {/* Right: badge + button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-green-500 text-green-600 text-xs font-semibold uppercase tracking-wide">
                    {pharmacy.status || 'APPROVED'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/patient/pharmacies/${pharmacy.id}`); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E3A5F] text-[#1E3A5F] text-sm font-medium hover:bg-blue-50 transition-colors"
                  >
                    {t('patient.viewDetails')}
                    <span className="text-xs font-bold">&lt;&gt;</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
  </div>
);
}