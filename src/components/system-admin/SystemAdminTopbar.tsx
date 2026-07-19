'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

interface SystemAdminTopbarProps {
  onMenuClick?: () => void;
}

export default function SystemAdminTopbar({ onMenuClick }: SystemAdminTopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount } = useUnreadNotifications('admin'); // Reusing admin notifs for now

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-40">
    <div className="flex items-center justify-between">
      {/* Left: Title */}
        <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h2 className="text-base lg:text-xl font-bold text-gray-900">
            E-Vuze Platform Health
          </h2>
          <p className="text-xs text-gray-500 hidden sm:block">
            Engineer God's Eye Control
          </p>
        </div>
      </div>

      {/* Right: Actions */}
        <div className="flex items-center gap-4">
        {/* Language Switcher */}
          <LanguageSwitcher />

        {/* Notifications */}
          <div className="relative" ref={notifRef}>
          <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Notifications"
            >
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
            )}
            </button>

          {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">
                  {t('common.notifications')}
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${notif.isRead ? 'opacity-60' : ''}`}
                      >
                      <p className="text-sm text-gray-900 font-medium">
                        {notif.title || notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.message && notif.title ? notif.message : (notif.time || new Date(notif.createdAt).toLocaleDateString())}
                      </p>
                    </div>
                  ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                    <p className="text-gray-500">
                      {t('common.noNotifications')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

        {/* Profile */}
          <div className="relative" ref={profileRef}>
          <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">
                System Admin
              </p>
              <p className="text-xs text-gray-500">
                Engineer
              </p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#10B981' }}>
              SA
            </div>
          </button>

          {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="font-bold text-gray-900">System Admin</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <div className="border-t border-gray-200 mt-2 pt-2">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                  >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          )}
          </div>
      </div>
    </div>
  </div>
);
}
