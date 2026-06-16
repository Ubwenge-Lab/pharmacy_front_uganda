'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'CLOCKED_OUT' | 'COMPLETED' | 'REJECTED';
  clockInTime: string; clockOutTime?: string;
  totalHours?: number; notes?: string; rejectionReason?: string;
  staff: { firstName: string; lastName: string; user: { email: string; role: string } };
  clockInApprover?: { firstName: string; lastName: string };
  clockOutApprover?: { firstName: string; lastName: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-yellow-100 text-yellow-700',
  APPROVED:    'bg-blue-100   text-blue-700',
  CLOCKED_OUT: 'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  REJECTED:    'bg-red-100    text-red-700',
};

export default function BranchAttendancePage() {
  const { t } = useTranslation();
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<string>('all');

  const fetchAttendanceData = useCallback(async (signal: AbortSignal) => {
    const res = await api.get('/attendance/branch', { signal });
    return res.data;
  }, []);

  const { data, loading, error, refetch } = useFetch<AttendanceRecord[]>(fetchAttendanceData, []);
  const records = data ?? [];

  useEffect(() => { if (error) toast.error(t('errors.failedToLoadAttendance')); }, [error, t]);

  const handleAction = async (
    id: string,
    action: 'approve-clock-in' | 'reject-clock-in' | 'approve-clock-out' | 'reject-clock-out',
  ) => {
    const isReject = action.includes('reject');
    const reason   = isReject ? prompt('Reason for rejection (optional):') ?? '' : '';
    setActionId(id + '-' + action);
    try {
      await api.put(`/attendance/${id}/${action}`, isReject ? { reason } : {});
      toast.success(isReject ? t('attendance.rejected') : t('attendance.approved'));
      await refetch();
    } catch (e: unknown) { toast.error(getErrorMessage(e)); }
    finally { setActionId(null); }
  };

  const formatTime = (d?: string) =>
    d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);
  const statuses = ['all', 'PENDING', 'APPROVED', 'CLOCKED_OUT', 'COMPLETED', 'REJECTED'];

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF]">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{t('attendance.attendance')}</h1>
        <p className="text-sm font-medium text-[#29ABE2] mt-1">{records.length} {t('staffMgmt.records')}</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === s ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={filter === s ? { backgroundColor: '#29ABE2' } : {}}>
            {s === 'all' ? t('attendance.all') : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-sm">
          {t('attendance.noRecordsFound')}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/60 border-b border-gray-100">
                <tr>
                  {['Staff', 'Date', 'Clock In', 'Clock Out', 'Hours', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{r.staff.firstName} {r.staff.lastName}</p>
                      <p className="text-xs text-gray-400">{r.staff.user.role}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{formatDate(r.clockInTime)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatTime(r.clockInTime)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{formatTime(r.clockOutTime)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.totalHours ? `${r.totalHours.toFixed(1)}h` : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {r.status === 'PENDING' && <>
                          <button onClick={() => handleAction(r.id, 'approve-clock-in')} disabled={!!actionId}
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject-clock-in')} disabled={!!actionId}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>}
                        {r.status === 'CLOCKED_OUT' && <>
                          <button onClick={() => handleAction(r.id, 'approve-clock-out')} disabled={!!actionId}
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject-clock-out')} disabled={!!actionId}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>}
                        {['APPROVED', 'COMPLETED', 'REJECTED'].includes(r.status) && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
