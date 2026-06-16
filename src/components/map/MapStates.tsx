// src/components/map/MapStates.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { WifiIcon, MapPinIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';


/** Pulsing skeleton loader while map tiles load */
export function MapSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 animate-pulse flex flex-col">
      {/* Fake map toolbar */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 flex items-center px-4 gap-3">
        <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      {/* Fake map tiles grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-px">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700"
            style={{ opacity: 0.4 + (i % 5) * 0.12 }}
          />
        ))}
      </div>
      {/* Fake zoom buttons */}
      <div className="absolute right-4 top-16 flex flex-col gap-1">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
      <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-3">{t('map.loadingMap')}</p>
    </div>
  );
}

/** Shown when the user has no pharmacies near them */
export function NoPharmaciesState({ onReset }: { onReset?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-80 bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-inner">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-brand-navy/10">
        <MagnifyingGlassIcon className="w-10 h-10 text-brand-navy" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('map.noPharmaciesFound')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
        {t('map.noPharmaciesDesc')}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 bg-brand-teal"
        >
          {t('map.resetSearch')}
        </button>
      )}
    </div>
  );
}

/** Shown when the user denies location access */
export function LocationDeniedState({ onManual }: { onManual?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-80 bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-inner">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: '#FFF3CD' }}
      >
        <MapPinIcon className="w-10 h-10 text-yellow-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('map.locationDenied')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
        {t('map.locationDeniedDesc')}
      </p>
      {onManual && (
        <button
          onClick={onManual}
          className="px-6 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 bg-brand-navy"
        >
          {t('map.searchByName')}
        </button>
      )}
    </div>
  );
}

/** Shown when device is offline */
export function OfflineState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-80 bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-inner">
      <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
        <WifiIcon className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('map.offline')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
        {t('map.offlineDesc')}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 rounded-xl text-white font-semibold text-sm bg-red-500 hover:bg-red-600 transition-all"
      >
        {t('map.retry')}
      </button>
    </div>
  );
}

/** Generic map error fallback */
export function MapErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-80 bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-inner">
      <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('map.mapError')}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mb-6">
        {message ?? t('map.mapErrorDesc')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 bg-brand-navy"
        >
          {t('map.retry')}
        </button>
      )}
    </div>
  );
}

/** Shown when coordinates are missing/invalid */
export function MissingCoordsState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl p-8 text-center border border-yellow-200 dark:border-yellow-800">
      <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500 mb-3" />
      <p className="text-yellow-700 dark:text-yellow-300 font-semibold text-sm">
        Location coordinates are unavailable for this pharmacy.
      </p>
    </div>
  );
}
