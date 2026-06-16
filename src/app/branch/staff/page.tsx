'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { PlusIcon, EyeIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '@/lib/errorHandler';

const ROLE_COLORS: Record<string, string> = {
  CASHIER:    'bg-blue-100 text-blue-700',
  PHARMACIST: 'bg-purple-100 text-purple-700',
  NURSE:      'bg-pink-100 text-pink-700',
};

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  user: { email: string; role: string };
  permissions?: { permissions: string[] };
}

export default function BranchStaffPage() {
  const { t }  = useTranslation();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async (signal: AbortSignal) => {
    const res = await api.get('/staff', { signal });
    return Array.isArray(res.data) ? res.data : [];
  }, []);

  const { data: staff, loading, error, refetch } = useFetch<StaffMember[]>(fetchStaff, []);

  useEffect(() => { if (error) toast.error(t('errors.failedToLoadStaff')); }, [error, t]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the branch?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/staff/${id}`);
      toast.success(`${name} removed`);
      refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const list = staff ?? [];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF] flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">{t('staffMgmt.staffManagement')}</h1>
          <p className="text-sm font-medium mt-1" style={{ color: '#29ABE2' }}>
            {list.length} {t('staffMgmt.membersInBranch')}
          </p>
        </div>
        <button
          onClick={() => router.push('/branch/staff/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#29ABE2' }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('staffMgmt.addStaff')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {list.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {t('staffMgmt.noStaffFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['NAME', 'ROLE', 'PHONE', 'PERMISSIONS', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-gray-500 tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.map(s => {
                  const permCount = s.permissions?.permissions?.length ?? 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Name + email */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.user.email}</p>
                      </td>

                      {/* Role badge */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${ROLE_COLORS[s.user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {s.user.role}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-gray-600">
                        {s.phone ?? '—'}
                      </td>

                      {/* Permissions count */}
                      <td className="px-6 py-4 text-gray-600">
                        {permCount} {t('staffMgmt.permissions')}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          s.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* View */}
                          <button
                            onClick={() => router.push(`/branch/staff/${s.id}`)}
                            className="p-1.5 rounded-lg border border-gray-200 text-[#29ABE2] hover:bg-blue-50 transition-colors"
                            title={t('common.view')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>

                          {/* Reset / reassign (placeholder — navigates to detail) */}
                          <button
                            onClick={() => router.push(`/branch/staff/${s.id}`)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            title={t('staffMgmt.resetPassword')}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(s.id, `${s.firstName} ${s.lastName}`)}
                            disabled={deletingId === s.id}
                            className="p-1.5 rounded-lg border border-gray-200 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title={t('staffMgmt.remove')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
