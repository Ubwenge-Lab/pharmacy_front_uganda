'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import {
  Squares2X2Icon,
  ShieldCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

interface SystemAdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function SystemAdminSidebar({ open = false, onClose, collapsed = false, onToggleCollapsed }: SystemAdminSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard',  href: '/system-admin/dashboard',       icon: Squares2X2Icon },
    { name: 'Audit Logs', href: '/system-admin/audit-logs',      icon: ShieldCheckIcon },
    { name: 'User Management', href: '/system-admin/users',      icon: UsersIcon },
    { name: 'Settings',   href: '/system-admin/settings',        icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col
        transition-all duration-300
        ${collapsed ? 'lg:w-20' : ''}
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0 lg:min-h-screen lg:sticky lg:top-0 lg:self-start
      `}
      style={{ backgroundColor: '#0F172A', color: '#CBD5E1' }}
    >
      {/* Brand header */}
      <div className={`shrink-0 ${collapsed ? 'lg:p-3' : 'p-6'}`}>
        <div className={`flex items-center justify-between mb-8 ${collapsed ? 'lg:flex-col lg:gap-3 lg:justify-center lg:mb-4' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <Image
                src="/E-Vuze Logo.svg"
                alt="E-Vuze"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <h1 className="text-xl font-bold text-white">E-Vuze</h1>
              <p className="text-xs" style={{ color: '#94A3B8' }}>Engineer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label="Close sidebar"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapsed}
              className="hidden lg:flex p-1.5 rounded-lg transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronDoubleRightIcon className="w-[18px] h-[18px]" />
              ) : (
                <ChevronDoubleLeftIcon className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} onClick={onClose} title={collapsed ? item.name : undefined}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
                  style={isActive
                    ? { background: 'linear-gradient(135deg, #10B981, #34D399)', color: '#FFFFFF' }
                    : { color: '#94A3B8' }
                  }
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.color = '#FFFFFF'; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLDivElement).style.backgroundColor = ''; (e.currentTarget as HTMLDivElement).style.color = '#94A3B8'; } }}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className={`font-medium text-sm ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer — Logout */}
      <div className={`mt-auto shrink-0 ${collapsed ? 'lg:p-3' : 'p-6'}`}>
        <button
          onClick={handleLogout}
          title={collapsed ? t('common.logout') : undefined}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          style={{ color: '#F87171' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''; }}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
          <span className={`font-medium text-sm ${collapsed ? 'lg:hidden' : ''}`}>{t('common.logout')}</span>
        </button>
      </div>
    </div>
  );
}
