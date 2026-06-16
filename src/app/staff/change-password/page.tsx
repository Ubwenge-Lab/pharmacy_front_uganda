'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

export default function StaffChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ temp: false, new: false, confirm: false });
  const [form, setForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
      await api.put('/staff/profile/change-password', {
        tempPassword: form.tempPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      updateUser({ requiresPasswordChange: false });
      toast.success(t('form.passwordChangedWelcome'));
      router.push('/staff/dashboard');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field: keyof typeof showPass) =>
    setShowPass(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-navy">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-brand-teal-light">
              <ShieldCheckIcon className="w-7 h-7 text-brand-teal" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('staff.welcomeTitle')}</h1>
            <p className="text-sm text-gray-500 mt-2">
              {t('staff.permanentPasswordDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'temp' as const,    label: t('staff.tempPassword'),    key: 'tempPassword',    placeholder: t('staff.tempPasswordPlaceholder') },
              { field: 'new' as const,     label: t('staff.newPassword'),     key: 'newPassword',     placeholder: t('staff.newPasswordPlaceholder') },
              { field: 'confirm' as const, label: t('staff.confirmPassword'), key: 'confirmPassword', placeholder: t('staff.confirmPasswordPlaceholder') },
            ].map(({ field, label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass[field] ? 'text' : 'password'}
                    required
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-teal"
                  />
                  <button type="button" onClick={() => toggle(field)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPass[field] ? t('common.hidePassword') || 'Hide password' : t('common.showPassword') || 'Show password'}
                  >
                    {showPass[field] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 bg-brand-teal"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('branch.saving')}</>
              ) : (
                t('branch.setPasswordAndContinue')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
