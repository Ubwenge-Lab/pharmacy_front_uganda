// frontend/src/app/super-admin/profile/page.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error(t('form.fieldRequired'));
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t('profile2.newPasswordsMismatch'));
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error(t('form.passwordTooShort'));
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword,
      });
      
      toast.success(t('form.passwordChanged'));
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 lg:p-8" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #f0f9ff 100%)' }}>
        <h1 className="text-3xl font-bold" style={{ color: '#1E3A5F' }}>{t('common.profile')}</h1>
        <p className="text-sm mt-1" style={{ color: '#4B7BAE' }}>{t('profile2.manageSettings')}</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-bold text-gray-500 mb-5 flex items-center gap-2 uppercase tracking-wide text-xs">
          <UserCircleIcon className="w-4 h-4" />
          {'Account Information'}
        </h2>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#2563EB' }}>
            MK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">{'Administrator Access'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">{t('form.role')}</p>
            <p className="font-semibold text-gray-900">{t('roles.superAdministrator')}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">{t('form.email')}</p>
            <p className="font-semibold text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <LockClosedIcon className="w-5 h-5" />
          {t('profile2.changePassword')}
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('common.currentPassword')}
            </label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {'New Password'}
            </label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {'Confirm New Password'}
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-400 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1E4D8C' }}
          >
            {changingPassword ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('profile2.changingPassword')}</span>
              </div>
            ) : (
              t('profile2.changePassword')
            )}
          </button>
        </form>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <ShieldCheckIcon className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">{'Security Recommendation'}</h3>
            <p className="text-sm text-blue-700">{'Use a strong password and avoid sharing your credentials.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}