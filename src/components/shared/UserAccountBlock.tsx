'use client';

import { useTranslation } from 'react-i18next';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

const ROLE_COLORS: Record<string, string> = {
  PHARMACIST: 'bg-violet-100 text-violet-800',
  CASHIER:    'bg-blue-100 text-blue-800',
  NURSE:      'bg-pink-100 text-pink-800',
};

/**
 * Shared account block (role badge + email + avatar) used by BOTH the staff
 * portal topbar and the counter (branch) topbar — so the bar stays identical
 * for staff across workspaces, with only the workspace label/switcher changing.
 */
export default function UserAccountBlock() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role || '';
  const roleLabel = role
    ? t(`roles.${role.toLowerCase()}`, { defaultValue: t('roles.staff') })
    : t('roles.staff');
  const roleColor = ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 text-xs font-semibold rounded-full hidden sm:inline-flex ${roleColor}`}>
        {roleLabel}
      </span>
      <div className="text-right hidden md:block">
        <p className="text-sm font-semibold text-gray-900">{user.email || 'Staff'}</p>
        <p className="text-xs text-gray-500">{roleLabel}</p>
      </div>
      <UserCircleIcon className="w-9 h-9 text-gray-500" />
    </div>
  );
}
