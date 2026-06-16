'use client';
// src/app/(pharmacy)/branches/page.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StatusBadge from '@/components/shared/StatusBadge';
import { api, unwrapData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/shared/LocationPicker'), { ssr: false });

export default function BranchManagementPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]          = useState({ name: '', address: '', phone: '', branchManagerEmail: '', latitude: undefined as number | undefined, longitude: undefined as number | undefined });
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError(false);
    try {
      const res = await api.get('/branches/my-branches');
      setBranches(unwrapData(res.data));
    } catch {
      setFetchError(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(false); }, []);

  const filtered = branches.filter(b =>
  !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    setCreateError('');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.branchManagerEmail)) {
      setCreateError(t('pharmacyOwner.enterValidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (user?.email && form.branchManagerEmail.toLowerCase() === user.email.toLowerCase()) {
      setCreateError(t('pharmacyOwner.sameAsOwnerEmail', 'Branch manager email cannot be the same as your own account email.'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/branches/create', form);
      const branchId = res.data?.id;

      setShowModal(false);
      setForm({ name: '', address: '', phone: '', branchManagerEmail: '', latitude: undefined, longitude: undefined });
      // Auto-send manager invite email
      if (branchId) {
        try {
          await api.post(`/branches/${branchId}/send-credentials`);
          setCreateSuccess(t('pharmacyOwner.branchCreatedInviteSent', 'Branch created and invite email sent to manager.'));
        } catch {
          setCreateSuccess(t('pharmacyOwner.branchCreatedInviteFailed', 'Branch created, but invite email could not be sent. Use "Send Credentials" from branch details.'));
        }
      } else {
        setCreateSuccess(t('pharmacyOwner.branchCreatedSuccess', 'Branch created successfully.'));
      }
      setTimeout(() => setCreateSuccess(''), 6000);
      load(true);
    } catch {
      setCreateError(t('pharmacyOwner.createError'));
    }
    setSubmitting(false);
  };

  const branchStatusLabel = (s: string) => {
    if (s === 'APPROVED') return 'Active';
    if (s === 'INVITED') return 'Pending Setup';
    if (s === 'PENDING') return 'Pending Approval';
    return s ?? '—';
  };

  return (
    <div className="space-y-6">
    {createSuccess && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium"
          style={createSuccess.includes('could not')
            ? { backgroundColor: '#FEF3C7', color: '#92400E' }
            : { backgroundColor: '#D1FAE5', color: '#065F46' }}
        >
          {createSuccess}
        </div>
    )}

      {/* Hero */}
      <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: '#E0F2FE' }}>
      <h1 className="text-3xl font-bold text-[#1E3A8A]">{t('pharmacyOwner.branchManagementTitle')}</h1>
      <p className="mt-1 text-[#35BAF5]">{t('pharmacyOwner.branchManagementSubtitle')}</p>
    </div>

    {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pharmacyOwner.searchBranches')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
      </div>
      <button
          onClick={() => { setShowModal(true); setCreateError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(to right, #0284C7, #38BDF8)' }}
        >
        <PlusIcon className="w-4 h-4" />
        {t('pharmacyOwner.addBranch')}
        </button>
    </div>

    {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {[
                t('pharmacyOwner.branchName'),
                t('pharmacyOwner.location'),
                t('pharmacyOwner.manager'),
                t('pharmacyOwner.monthlyRevenuCol'),
                t('common.status'),
                t('common.actions'),
              ].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
                </th>
            ))}
            </tr>
        </thead>
        <tbody>
          {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">{t('common.loading')}</td></tr>
          ) : fetchError ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">{t('errors.failedToLoadBranches')}</td></tr>
          ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400">{t('common.noData')}</td></tr>
          ) : (
              filtered.map((b: any) => {
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">{b.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{b.address}</td>
                  <td className="px-5 py-4 text-sm">
                    {b.manager?.email
                        ? <span className="font-medium text-brand-teal">{b.manager.email}</span>
                      : <span className="text-[#D3CC00] font-medium">{t('common.unassigned')}</span>
                    }
                    </td>
                  <td className="px-5 py-4 text-sm text-gray-400">—</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={b.branchStatus} label={branchStatusLabel(b.branchStatus)} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                        onClick={() => router.push(`/pharmacy/branches/${b.id}`)}
                        className="text-sm font-medium hover:underline text-brand-navy"
                      >
                      {t('common.viewDetails')}
                      </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
      </table>
    </div>

    {/* Add Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{t('pharmacyOwner.addBranch')}</h2>
            <button 
              onClick={() => setShowModal(false)} 
              className="text-gray-400 hover:text-gray-600"
              aria-label={t('common.close') || 'Close'}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pharmacyOwner.branchName')} *
                </label>
              <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pharmacyOwner.location')} *
                </label>
              <input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Email *
              </label>
              <input
                type="email"
                value={form.branchManagerEmail}
                onChange={e => setForm(f => ({ ...f, branchManagerEmail: e.target.value }))}
                placeholder="manager@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.phone')} *
              </label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. +250788000000"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
              required={true}
              label="Pin Branch Location"
              height="240px"
            />
          </div>
          {createError && (
              <p className="mt-4 text-sm" style={{ color: '#92400E' }}>{createError}</p>
          )}
            <div className="flex gap-3 mt-4">
            <button
                onClick={() => { setShowModal(false); setCreateError(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
              {t('common.cancel')}
              </button>
            <button
                onClick={handleAdd}
                disabled={submitting || !form.name || !form.address || !form.phone || !form.branchManagerEmail || form.latitude === undefined || form.longitude === undefined}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(to right, #0284C7, #38BDF8)' }}
              >
              {submitting ? t('common.saving') : t('common.add')}
              </button>
          </div>
        </div>
      </div>
    )}
    </div>
);
}