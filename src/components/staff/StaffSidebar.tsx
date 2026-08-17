'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Squares2X2Icon, ClockIcon, LockClosedIcon, UserIcon, ArrowRightOnRectangleIcon, XMarkIcon, CubeIcon, ClipboardDocumentListIcon, ShieldExclamationIcon, CreditCardIcon, ShoppingCartIcon, DocumentArrowUpIcon, ClipboardDocumentCheckIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { isPatientEnabled } from '@/lib/features';
import { useAuth } from '@/context/AuthContext';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import Image from 'next/image';

interface StaffSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void; // kept for layout compat
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function StaffSidebar({ open = false, onClose, collapsed = false, onToggleCollapsed }: StaffSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { can } = useStaffPermissions();
  const isCashier = user?.role === 'CASHIER';

  const nav = [
    { href: '/staff/dashboard',       icon: Squares2X2Icon,            label: t('staff.dashboard'),      show: true },
    // Counter tools (client demands) live in the branch portal — surfaced here for staff roles
    { href: '/branch/pos',            icon: ShoppingCartIcon,          label: 'POS Sale',                 show: true },
    { href: '/branch/prescription-upload', icon: DocumentArrowUpIcon,  label: 'Upload Rx',               show: !isCashier },
    { href: '/branch/prescriptions',  icon: ClipboardDocumentCheckIcon,label: 'Rx Queue',                show: !isCashier },
    { href: '/staff/orders',          icon: CreditCardIcon,            label: t('cashier.paymentsNav'),  show: isCashier && (can('VIEW_PAYMENTS') || can('PROCESS_PAYMENTS')) },
    { href: '/staff/prescriptions',   icon: ClipboardDocumentListIcon, label: t('staff.prescriptions'),  show: !isCashier && can('VIEW_PRESCRIPTIONS') },
    { href: '/staff/inventory',       icon: CubeIcon,                  label: t('staff.inventory'),      show: can('VIEW_INVENTORY') },
    { href: '/staff/attendance',      icon: ClockIcon,                 label: t('staff.attendance'),     show: true },
    { href: '/staff/profile',         icon: UserIcon,                  label: t('staff.profile'),        show: true },
    { href: '/staff/change-password', icon: LockClosedIcon,            label: t('staff.changePassword'), show: true },
  ].filter(item => item.show);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 transition-all duration-300 bg-brand-navy ${collapsed ? 'lg:w-20' : ''} ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Header */}
      <div className={`py-7 border-b border-white/10 flex items-center justify-between shrink-0 ${collapsed ? 'lg:flex-col lg:gap-3 lg:px-0 lg:justify-center' : 'px-6'}`}>
        <div className={collapsed ? 'lg:hidden' : ''}>
          <p className="text-white text-2xl font-bold tracking-tight">E-Vuze</p>
          <p className="text-white/60 text-sm mt-0.5">{t('staff.portal')}</p>
        </div>
        {collapsed && (
          <div className="hidden lg:flex w-9 h-9 rounded-full bg-white shadow-md items-center justify-center overflow-hidden shrink-0">
            <Image src="/E-Vuze Logo.svg" alt="E-Vuze" width={28} height={28} className="object-contain" />
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10" aria-label="Close sidebar">
            <XMarkIcon className="w-[18px] h-[18px] text-white/70" />
          </button>
          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10"
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
      <nav className={`flex-1 py-5 space-y-1 ${collapsed ? 'lg:px-2.5' : 'px-4'}`}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href + label} href={href} onClick={onClose}
              title={collapsed ? label : undefined}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'text-white shadow-md bg-brand-teal' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
              </div>
              {href === '/staff/prescriptions' && !isPatientEnabled() && (
                <ShieldExclamationIcon className={`w-[14px] h-[14px] text-white/40 ${collapsed ? 'lg:hidden' : ''}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`pb-5 shrink-0 ${collapsed ? 'lg:px-2.5' : 'px-4'}`}>
        <button
          onClick={logout}
          title={collapsed ? t('common.logout') : undefined}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
        >
          <ArrowRightOnRectangleIcon className="w-[18px] h-[18px] shrink-0" />
          <span className={collapsed ? 'lg:hidden' : ''}>{t('common.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
