'use client';
import { useTranslation } from 'react-i18next';
import { BellIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAuth } from '@/context/AuthContext';
import WorkspaceSwitcher from '@/components/branch/WorkspaceSwitcher';
import UserAccountBlock from '@/components/shared/UserAccountBlock';

interface Props {
  branchName?: string;
  pharmacyName?: string;
  onMenuClick?: () => void;
}

const STAFF_ROLES = ['PHARMACIST', 'CASHIER', 'NURSE'];

export default function BranchTopbar({ branchName = 'Branch', pharmacyName = 'E-Vuze Pharmacy', onMenuClick }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);
  const { unreadCount } = useUnreadNotifications('branch');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="w-[18px] h-[18px] text-gray-600" />
        </button>
        <div>
          <p className="text-base font-semibold text-brand-teal">{pharmacyName}</p>
          <p className="text-xs text-gray-500 hidden sm:block">{isStaff ? t('branch.counter') : t('branch.portal')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Workspace switcher — staff can flip Counter ⇄ Staff Portal; visible in both topbars */}
        <WorkspaceSwitcher />

        <LanguageSwitcher />

        <button className="relative p-2 rounded-full hover:bg-gray-100" aria-label="Notifications">
          <BellIcon className="w-[18px] h-[18px] text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          )}
        </button>

        {/* Staff see the same account block as in the staff portal (role badge + email) */}
        {isStaff ? (
          <UserAccountBlock />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm bg-brand-navy">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800">{branchName}</p>
              <p className="text-xs text-gray-500">{t('topbar.branchManager')}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
