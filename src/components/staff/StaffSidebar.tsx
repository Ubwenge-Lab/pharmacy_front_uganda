'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Squares2X2Icon, ClockIcon, LockClosedIcon, UserIcon, ArrowRightOnRectangleIcon, XMarkIcon, CubeIcon, ClipboardDocumentListIcon, ShieldExclamationIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { isPatientEnabled } from '@/lib/features';
import { useAuth } from '@/context/AuthContext';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';

interface StaffSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void; // kept for layout compat
}

export default function StaffSidebar({ open = false, onClose }: StaffSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { can } = useStaffPermissions();
  const isCashier = user?.role === 'CASHIER';

  const nav = [
    { href: '/staff/dashboard',       icon: Squares2X2Icon,            label: t('staff.dashboard'),      show: true },
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
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300 bg-brand-navy ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Header */}
      <div className="px-6 py-7 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <p className="text-white text-2xl font-bold tracking-tight">E-Vuze</p>
          <p className="text-white/60 text-sm mt-0.5">{t('staff.portal')}</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/10" aria-label="Close sidebar">
          <XMarkIcon className="w-[18px] h-[18px] text-white/70" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href + label} href={href} onClick={onClose}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'text-white shadow-md bg-brand-teal' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </div>
              {href === '/staff/prescriptions' && !isPatientEnabled() && (
                <ShieldExclamationIcon className="w-[14px] h-[14px] text-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium"
        >
          <ArrowRightOnRectangleIcon className="w-[18px] h-[18px]" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
