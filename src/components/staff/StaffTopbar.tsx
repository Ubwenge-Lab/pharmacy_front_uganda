'use client';

import { useTranslation } from 'react-i18next';

import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import WorkspaceSwitcher from '@/components/branch/WorkspaceSwitcher';
import UserAccountBlock from '@/components/shared/UserAccountBlock';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

interface StaffTopbarProps {
  onMenuClick?: () => void;
}

/**
 * Staff portal topbar. Structural twin of BranchTopbar (same h-16, same
 * sticky/padding/right-side composition) so switching workspaces never
 * changes the bar's size or position — only the workspace label differs.
 */
export default function StaffTopbar({ onMenuClick }: StaffTopbarProps) {
  const { t } = useTranslation();
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
          <h2 className="text-base font-semibold text-violet-700">{t('topbar.staffPortal')}</h2>
          <p className="text-xs text-gray-500 hidden sm:block">{t('topbar.eVuzeHealthcare')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <WorkspaceSwitcher />
        <LanguageSwitcher />
        <button className="relative p-2 rounded-full hover:bg-gray-100" aria-label="Notifications">
          <BellIcon className="w-[18px] h-[18px] text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          )}
        </button>
        <UserAccountBlock />
      </div>
    </header>
  );
}
