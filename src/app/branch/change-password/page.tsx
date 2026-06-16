// frontend/src/app/branch/change-password/page.tsx

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

export default function BranchChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [form, setForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const toggle = (field: keyof typeof showPass) =>
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error(t('form.passwordsDoNotMatch'));
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error(t('form.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/branch/change-password', {
        tempPassword: form.tempPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      updateUser({ requiresPasswordChange: false });
      toast.success(t('form.passwordChanged'));
      router.push('/branch/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-80px)] bg-gray-50 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-10 mt-8">

        {/* Security Setup badge */}
        <div className="mb-5">
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#2D9B8A] text-[#2D9B8A] text-xs font-semibold tracking-wide uppercase">
            Security Setup
          </span>
        </div>

        {/* Heading */}
        <span className="inline-block px-3 py-1 text-xs font-bold text-[#29ABE2] bg-[#EBF4FF] rounded-full mb-4 tracking-wider uppercase">Security Setup</span>
        <h1 className="text-4xl font-extrabold text-[#1E3A5F] mb-3">
          Change Password
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Please update your password to secure your branch manager account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPass.current ? 'text' : 'password'}
                required
                value={form.tempPassword}
                onChange={e =>
                  setForm(p => ({ ...p, tempPassword: e.target.value }))
                }
                placeholder="Enter current password"
                className="w-full px-4 py-3.5 pr-11 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition"
              />
              <button
                type="button"
                onClick={() => toggle('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPass.current ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPass.new ? 'text' : 'password'}
                required
                minLength={8}
                value={form.newPassword}
                onChange={e =>
                  setForm(p => ({ ...p, newPassword: e.target.value }))
                }
                placeholder="At least 8 characters"
                className="w-full px-4 py-3.5 pr-11 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition"
              />
              <button
                type="button"
                onClick={() => toggle('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPass.new ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-semibold text-[#1E3A5F] mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPass.confirm ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e =>
                  setForm(p => ({ ...p, confirmPassword: e.target.value }))
                }
                placeholder="Confirm your new password"
                className="w-full px-4 py-3.5 pr-11 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/30 focus:border-[#1E3A5F] transition"
              />
              <button
                type="button"
                onClick={() => toggle('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPass.confirm ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#29ABE2] hover:bg-[#1a9ad0] disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('branch.saving')}
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
