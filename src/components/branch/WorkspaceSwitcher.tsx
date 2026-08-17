'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const STAFF_ROLES = ['PHARMACIST', 'CASHIER', 'NURSE'];

/**
 * Workspace switcher (Counter ⇄ Staff Portal) — staff roles only.
 * Rendered in BOTH the branch topbar and the staff topbar, so staff can
 * always see which workspace they are in and flip between them.
 *
 * Switch animation: clicking the other segment slides the teal pill across
 * first, then navigates — the user sees the switch happen.
 */
export default function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [pending, setPending] = useState<'counter' | 'portal' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending navigation timer on unmount
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (!user || !STAFF_ROLES.includes(user.role)) return null;

  const inCounter = (pathname ?? '').startsWith('/branch');
  const active: 'counter' | 'portal' = pending ?? (inCounter ? 'counter' : 'portal');

  const switchTo = (target: 'counter' | 'portal') => {
    if (target === active || pending) return;
    // Slide the pill first, then navigate once the animation is visible
    setPending(target);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.push(target === 'counter' ? '/branch/pos' : '/staff/dashboard');
    }, 300);
  };

  return (
    <div className="hidden sm:grid relative grid-cols-2 items-center rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
      {/* Sliding active-pill indicator */}
      <div
        className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-0.25rem)] rounded-md bg-brand-teal shadow-sm transition-transform duration-300 ease-in-out ${active === 'counter' ? 'translate-x-0' : 'translate-x-full'}`}
      />
      <button
        onClick={() => switchTo('counter')}
        className={`relative z-10 px-3 py-1.5 rounded-md transition-colors ${active === 'counter' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        {t('branch.counter')}
      </button>
      <button
        onClick={() => switchTo('portal')}
        className={`relative z-10 px-3 py-1.5 rounded-md transition-colors ${active === 'portal' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        {t('branch.staffPortal')}
      </button>
    </div>
  );
}
