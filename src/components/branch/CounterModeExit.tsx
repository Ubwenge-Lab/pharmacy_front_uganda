'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const STAFF_ROLES = ['PHARMACIST', 'CASHIER', 'NURSE'];

/**
 * Floating "Exit Counter" pill — staff-only, visible on counter pages
 * (POS, Rx Queue, Rx Upload). One-tap way back to the staff portal,
 * especially for touch devices where the sidebar is off-canvas.
 */
export default function CounterModeExit() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  if (!user || !STAFF_ROLES.includes(user.role)) return null;

  return (
    <button
      onClick={() => router.push('/staff/dashboard')}
      title={t('branch.exitCounter')}
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-navy text-white text-sm font-medium shadow-lg hover:bg-brand-navy-dark hover:scale-[1.03] active:scale-95 transition-all"
    >
      <ArrowLeftIcon className="w-4 h-4 shrink-0" />
      {t('branch.exitCounter')}
    </button>
  );
}
