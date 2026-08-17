'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  HomeIcon, MagnifyingGlassIcon, ShoppingCartIcon,
  ClipboardDocumentListIcon, BellIcon, UserCircleIcon,
  ArrowRightOnRectangleIcon, BuildingStorefrontIcon, XMarkIcon,
  ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const menuItems = [
  { id: 'dashboard', nameKey: 'patient.dashboard', href: '/patient/dashboard', icon: HomeIcon },
  { id: 'search', nameKey: 'patient.findPharmacyAndMedicine', href: '/patient/search', icon: MagnifyingGlassIcon },
  // { id: 'pharmacies-map', nameKey: 'Pharmacy Map', href: '/patient/search', icon: MapPinIcon },
  // commenting out for now since it's the same as search, but can be added back with a different href if needed
  { id: 'cart', nameKey: 'cart.title', href: '/patient/cart', icon: ShoppingCartIcon },
  { id: 'orders', nameKey: 'patient.myOrders', href: '/patient/orders', icon: ClipboardDocumentListIcon },
  { id: 'notifications', nameKey: 'common.notifications', href: '/patient/notifications', icon: BellIcon },
  { id: 'profile', nameKey: 'patient.myProfile', href: '/patient/profile', icon: UserCircleIcon },
];

interface PatientSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void; // kept for layout compat
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function PatientSidebar({ open = false, onClose, collapsed = false, onToggleCollapsed }: PatientSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className={`
      w-64 bg-linear-to-b from-brand-navy via-brand-navy-dark to-[#0f2444] text-white
      fixed left-0 top-0 bottom-0 shadow-2xl z-40 flex flex-col
      transition-all duration-300
      ${collapsed ? 'lg:w-20' : ''}
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Header */}
      <div className={`p-6 border-b border-white/10 flex items-center justify-between shrink-0 ${collapsed ? 'lg:flex-col lg:gap-3 lg:p-4 lg:justify-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'lg:hidden' : ''}`}>
          <BuildingStorefrontIcon className="w-10 h-10 text-white shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-white">Evuze</h1>
            <p className="text-xs text-blue-200">{t('auth.healthcarePlatform')}</p>
          </div>
        </div>
        {collapsed && (
          <div className="hidden lg:flex w-9 h-9 rounded-full bg-white shadow-md items-center justify-center overflow-hidden shrink-0">
            <Image src="/E-Vuze Logo.svg" alt="E-Vuze" width={28} height={28} className="object-contain" />
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close sidebar">
            <XMarkIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronDoubleRightIcon className="w-[18px] h-[18px] text-white/70" />
            ) : (
              <ChevronDoubleLeftIcon className="w-[18px] h-[18px] text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className={`space-y-2 flex-1 ${collapsed ? 'lg:px-2.5' : 'p-4'}`}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.id} href={item.href} onClick={onClose}
              title={collapsed ? t(item.nameKey) : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
                isActive ? 'bg-brand-teal text-white font-semibold shadow-lg' : 'hover:bg-white/10 hover:translate-x-1'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`text-sm ${collapsed ? 'lg:hidden' : ''}`}>{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/10 shrink-0 space-y-2 ${collapsed ? 'lg:px-2.5' : 'p-4'}`}>
        <button onClick={handleLogout}
          title={collapsed ? t('common.logout') : undefined}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 w-full text-left ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          <span className={`text-sm ${collapsed ? 'lg:hidden' : ''}`}>{t('common.logout')}</span>
        </button>
        <p className={`text-xs text-blue-200 text-center ${collapsed ? 'lg:hidden' : ''}`}>{t('landing.copyrightShort')}</p>
      </div>
    </aside>
  );
}
