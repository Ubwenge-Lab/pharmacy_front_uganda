'use client';
// src/app/(pharmacy)/branches/[id]/page.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, CurrencyDollarIcon, UsersIcon, EnvelopeIcon, CubeIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import type { BranchDetail } from '@/types';
import { getErrorMessage } from '@/lib/errorHandler';
import StatusBadge from '@/components/shared/StatusBadge';

export default function BranchDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sendingCreds, setSendingCreds] = useState(false);
  const [resendingCreds, setResendingCreds] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api.get(`/branches/${id}`, { signal: controller.signal })
      .then(r => setBranch(r.data?.data ?? r.data))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        const status = err?.response?.status;
        if (status === 404) setFetchError('Branch not found.');
        else if (status === 401 || status === 403) setFetchError('Session expired. Please log in again.');
        else setFetchError('Could not load branch details. Try again shortly.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const showMsg = (text: string, ok: boolean) => {
    setActionMsg({ text, ok });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleSendCredentials = async () => {
    setSendingCreds(true);
    try {
      await api.post(`/branches/${id}/send-credentials`);
      showMsg(t('pharmacyOwner.credentialsSent'), true);
      // Refresh so manager field updates
      const r = await api.get(`/branches/${id}`);
      setBranch(r.data?.data ?? r.data);
    } catch (error: unknown) {
      showMsg(getErrorMessage(error), false);
    } finally {
      setSendingCreds(false);
    }
  };

  const handleResend = async () => {
    setResendingCreds(true);
    try {
      await api.post(`/branches/${id}/resend`);
      showMsg(t('pharmacyOwner.credentialsResent'), true);
    } catch (error: unknown) {
      showMsg(getErrorMessage(error), false);
    } finally {
      setResendingCreds(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
      {t('common.loading')}
      </div>
  );
  }

  if (fetchError || !branch) {
    return (
      <div className="space-y-4">
      <button
          onClick={() => router.push('/pharmacy/branches')}
          className="flex items-center gap-2 text-sm font-medium hover:underline text-brand-navy"
        >
        <ArrowLeftIcon className="w-4 h-4" />
        {t('pharmacyOwner.backToBranches')}
        </button>
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        {fetchError ?? t('common.noData')}
        </div>
    </div>
  );
  }

  const managerEmail = branch.manager?.email ?? null;
  const hasManager  = !!branch.manager;
  const isApproved  = branch.branchStatus === 'APPROVED';
  const staffList   = branch.staff ?? [];

  const stats = [
    {
      icon: CurrencyDollarIcon,
      label: t('common.monthly_revenue'),
      value: `UGX ${(branch.monthlyRevenue ?? 0).toLocaleString()}`,
    },
    {
      icon: UsersIcon,
      label: t('pharmacyOwner.staffMembers'),
      value: staffList.length,
    },
    {
      icon: EnvelopeIcon,
      label: t('pharmacyOwner.manager'),
      value: managerEmail ?? t('common.unassigned'),
    },
    {
      icon: CubeIcon,
      label: 'Medications',
      value: `${branch.medicationCount ?? 0} SKUs`,
    },
  ];

  const branchStatusLabel = (s: string) => {
    if (s === 'APPROVED') return 'Active';
    if (s === 'INVITED') return 'Pending Setup';
    if (s === 'PENDING') return 'Pending Approval';
    return s ?? '—';
  };

  return (
    <div className="space-y-6">
    {/* Back */}
      <button
        onClick={() => router.push('/pharmacy/branches')}
        className="flex items-center gap-2 text-sm font-medium hover:underline text-brand-navy"
      >
      <ArrowLeftIcon className="w-4 h-4" />
      {t('pharmacyOwner.backToBranches')}
      </button>

    {/* Hero */}
      <div className="rounded-2xl p-8 text-white flex items-start justify-between bg-brand-navy">
      <div>
        <h1 className="text-3xl font-bold">{branch.name}</h1>
        <p className="mt-1 text-white/70">{branch.address}</p>
        {branch.phone && <p className="mt-0.5 text-white/50 text-sm">{branch.phone}</p>}
        </div>
      <StatusBadge status={branch.branchStatus} label={branchStatusLabel(branch.branchStatus)} />
    </div>

    {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-brand-teal-light">
              <Icon className="w-[18px] h-[18px] text-brand-teal" />
            </div>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-sm font-bold text-gray-900 truncate">{s.value}</p>
          </div>
        );
        })}
      </div>

    {/* Staff list */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4">{t('pharmacyOwner.staffMembers')}</h3>
      {staffList.length === 0 ? (
          <p className="text-gray-400 text-sm">{t('common.noData')}</p>
      ) : (
          <div className="space-y-3">
          {staffList.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500">{s.user?.email}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
          </div>
      )}
      </div>

    {/* Actions */}
      <div className="space-y-3">
      {actionMsg && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: actionMsg.ok ? '#D1FAE5' : '#FEF3C7',
              color: actionMsg.ok ? '#065F46' : '#92400E',
            }}
          >
          {actionMsg.text}
          </div>
      )}

        {/* Credentials context */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-1">{t('superAdminPages.managerAccount')}</h3>
        <p className="text-xs text-gray-400 mb-4">
          {hasManager
              ? `Account created for ${managerEmail}. Use Resend if they need a new password.`
              : `No account yet for ${branch.branchManagerEmail ?? '—'}. Send credentials to create their login.`}
          </p>
        <div className="flex flex-wrap gap-3">
          <button
              onClick={handleSendCredentials}
              disabled={sendingCreds || hasManager}
              title={hasManager ? 'Manager account already exists' : undefined}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed bg-brand-teal"
            >
            {sendingCreds ? t('common.saving') : t('pharmacyOwner.sendCredentials')}
            </button>
          <button
              onClick={handleResend}
              disabled={resendingCreds || !hasManager || isApproved}
              title={!hasManager ? 'Send credentials first' : isApproved ? 'Branch is already approved' : undefined}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
            {resendingCreds ? t('common.saving') : t('pharmacyOwner.resendCredentials')}
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
            disabled
            title={t('common.inactive')}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed"
          >
          {t('pharmacyOwner.reassignManager')}
          </button>
        <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
          >
          <NoSymbolIcon className="w-4 h-4" />
          {t('pharmacyOwner.disableBranch')}
          </button>
      </div>
    </div>
  </div>
);
}
