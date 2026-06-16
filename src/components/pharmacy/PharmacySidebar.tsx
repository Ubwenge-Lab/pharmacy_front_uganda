'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Squares2X2Icon, ClipboardDocumentListIcon, BuildingOffice2Icon, UsersIcon, UserIcon,
  ArrowRightOnRectangleIcon, ChartBarIcon, CubeIcon, BellIcon, XMarkIcon, LockClosedIcon, MapIcon,
} from '@heroicons/react/24/outline';
import { isPatientEnabled } from '@/lib/features';
import { useAuth } from '@/context/AuthContext';

interface PharmacySidebarProps {
  onOpenSupport?: () => void; // kept for layout compat
  open?: boolean;
  onClose?: () => void;
}

export default function PharmacySidebar({ open = false, onClose }: PharmacySidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout } = useAuth();

  const nav = [
    { href: '/pharmacy/dashboard',     icon: Squares2X2Icon,            label: t('pharmacyOwner.dashboard') },
    { href: '/pharmacy/orders',        icon: ClipboardDocumentListIcon, label: t('pharmacyOwner.orderOverview') },
    { href: '/pharmacy/branches',      icon: BuildingOffice2Icon,       label: t('pharmacyOwner.branchManagement') },
    { href: '/pharmacy/map',           icon: MapIcon,                   label: 'Branch Map' },
    { href: '/pharmacy/inventory',     icon: CubeIcon,                  label: t('pharmacyOwner.inventory') },
    { href: '/pharmacy/patients',      icon: UsersIcon,                 label: t('pharmacyOwner.patients') + (isPatientEnabled() ? '' : ' (Soon)') },
    { href: '/pharmacy/analytics',     icon: ChartBarIcon,              label: t('pharmacyOwner.analytics') },
    { href: '/pharmacy/notifications', icon: BellIcon,                  label: t('pharmacyOwner.notifications') },
    { href: '/pharmacy/profile',       icon: UserIcon,                  label: t('pharmacyOwner.profile') },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 transition-transform duration-300 bg-brand-navy ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Header */}
      <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <p className="text-white text-2xl font-bold tracking-tight">E-Vuze</p>
          <p className="text-white/60 text-sm mt-0.5">{t('pharmacyOwner.portal')}</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close sidebar">
          <XMarkIcon className="w-[18px] h-[18px] text-white/70" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={onClose}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              style={active ? { background: 'linear-gradient(135deg, #3BAAEF 0%, #1B72C8 100%)' } : {}}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </div>
              {href === '/pharmacy/patients' && !isPatientEnabled() && (
                <LockClosedIcon className="w-[14px] h-[14px] text-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 pb-6 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: '#F26B6B' }}
        >
          <ArrowRightOnRectangleIcon className="w-[17px] h-[17px]" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
