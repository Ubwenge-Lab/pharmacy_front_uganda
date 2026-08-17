'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  Squares2X2Icon, UsersIcon, ClockIcon, ChartBarIcon, CubeIcon, 
  ArrowsRightLeftIcon, MapIcon, LockClosedIcon, XMarkIcon, ArrowRightOnRectangleIcon,
  ShoppingCartIcon, DocumentArrowUpIcon, ClipboardDocumentCheckIcon,
  ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface BranchSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSupport?: () => void; // kept for layout compat, no longer renders a button
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function BranchSidebar({ open = false, onClose, collapsed = false, onToggleCollapsed }: BranchSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const role = user?.role;
  const isManager = role === 'BRANCH_MANAGER';
  const isStaff = role === 'PHARMACIST' || role === 'CASHIER' || role === 'NURSE';

  const nav = [
    // Dashboard first
    { href: '/branch/dashboard',           icon: Squares2X2Icon,         label: t('branch.dashboard'), show: isManager },
    // Counter tools — the whole branch team (CTO decision)
    { href: '/branch/pos',                 icon: ShoppingCartIcon,       label: 'POS Sale',            show: true },
    { href: '/branch/prescription-upload', icon: DocumentArrowUpIcon,    label: 'Upload Rx',           show: true },
    { href: '/branch/prescriptions',       icon: ClipboardDocumentCheckIcon, label: 'Rx Queue',       show: true },
    // Branch-manager-only administration
    { href: '/branch/staff',               icon: UsersIcon,              label: t('branch.staff'),     show: isManager },
    { href: '/branch/attendance',          icon: ClockIcon,              label: t('branch.attendance'), show: isManager },
    { href: '/branch/analytics',           icon: ChartBarIcon,           label: t('branch.analytics'), show: isManager },
    { href: '/branch/inventory',           icon: CubeIcon,               label: t('branch.inventory'), show: isManager },
    { href: '/branch/transfers',           icon: ArrowsRightLeftIcon,    label: t('branch.transfers'), show: isManager },
    { href: '/branch/map',                 icon: MapIcon,                label: t('branch.networkMap'), show: isManager },
    // Account
    { href: '/branch/change-password',     icon: LockClosedIcon,         label: t('branch.changePassword'), show: true },
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
          <p className="text-white/60 text-sm mt-0.5">{isStaff ? t('branch.counter') : t('branch.portal')}</p>
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

      {/* Nav — no overflow-y-auto so sidebar never scrolls */}
      <nav className={`flex-1 py-5 space-y-1 ${collapsed ? 'lg:px-2.5' : 'px-4'}`}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={onClose}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'text-white shadow-md bg-brand-teal' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — staff: exit counter mode back to the staff portal; logout for everyone */}
      <div className={`pb-5 shrink-0 space-y-1 ${collapsed ? 'lg:px-2.5' : 'px-4'}`}>
        {isStaff && (
          <Link
            href="/staff/dashboard"
            onClick={onClose}
            title={collapsed ? t('branch.exitCounter') : undefined}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-all ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <Squares2X2Icon className="w-[18px] h-[18px] shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>{t('branch.exitCounter')}</span>
          </Link>
        )}
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
