'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  Squares2X2Icon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  XMarkIcon,
  MapPinIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface SuperAdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void;
}

export default function SuperAdminSidebar({ open = false, onClose }: SuperAdminSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navigation = [
    { name: t('superAdmin.dashboard'),  href: '/super-admin/dashboard',       icon: Squares2X2Icon },
    { name: t('superAdmin.pharmacies'), href: '/super-admin/pharmacies',      icon: BuildingStorefrontIcon },
    { name: t('superAdmin.patients'),   href: '/super-admin/patients',        icon: UserGroupIcon },
    { name: t('superAdmin.analytics'),  href: '/super-admin/analytics',       icon: ChartBarIcon },
    { name: t('superAdmin.pharmacyMap'),href: '/super-admin/map',             icon: MapPinIcon },
    { name: t('common.notifications'),  href: '/super-admin/notifications',   icon: BellIcon },
    { name: t('common.profile'),        href: '/super-admin/profile',         icon: UserCircleIcon },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0 lg:min-h-screen lg:sticky lg:top-0 lg:self-start
      `}
      style={{ backgroundColor: '#1E3A5F', color: '#CBD5E1' }}
    >
      {/* Brand header */}
      <div className="p-6 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src="/E-Vuze Logo.svg"
                alt="E-Vuze"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">E-Vuze</h1>
              <p className="text-xs" style={{ color: '#94A3B8' }}>{t('superAdmin.portal')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} onClick={onClose}>
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={isActive
                    ? { background: 'linear-gradient(135deg, #0284C7, #38BDF8)', color: '#FFFFFF' }
                    : { color: '#94A3B8' }
                  }
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.color = '#FFFFFF'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.backgroundColor = ''; (e.currentTarget as HTMLDivElement).style.color = '#94A3B8'; } }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer — Logout */}
      <div className="mt-auto p-6 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200"
          style={{ color: '#F87171' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; }}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );
}
