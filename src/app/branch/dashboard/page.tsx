'use client';

import { useFetch } from '@/hooks/useFetch';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AttendanceSummary {
  total: number; pending: number; approved: number;
  completed: number; rejected: number; totalHoursWorked: number;
}
interface PendingAttendance {
  id: string; status: string; clockInTime: string; clockOutTime?: string;
  staff: { firstName: string; lastName: string; user: { email: string; role: string } };
}

export default function BranchDashboardPage() {
  const { t } = useTranslation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (signal: AbortSignal) => {
    const [summaryRes, clockInsRes, clockOutsRes, staffRes] = await Promise.all([
      api.get('/attendance/summary',          { signal }),
      api.get('/attendance/pending-clock-ins',  { signal }),
      api.get('/attendance/pending-clock-outs', { signal }),
      api.get('/staff',                        { signal }),
    ]);
    return {
      summary:         summaryRes.data,
      pendingClockIns:  clockInsRes.data,
      pendingClockOuts: clockOutsRes.data,
      staffCount: Array.isArray(staffRes.data) ? staffRes.data.length : 0,
    };
  }, []);

  const { data, loading, error, refetch } = useFetch<{
    summary: AttendanceSummary | null;
    pendingClockIns: PendingAttendance[];
    pendingClockOuts: PendingAttendance[];
    staffCount: number;
  }>(fetchDashboardData, []);

  const summary         = data?.summary ?? null;
  const pendingClockIns  = data?.pendingClockIns  ?? [];
  const pendingClockOuts = data?.pendingClockOuts ?? [];
  const staffCount      = data?.staffCount ?? 0;

  useEffect(() => { if (error) toast.error(t('errors.failedToLoadDashboard')); }, [error, t]);

  const approveClockIn = async (id: string) => {
    setActionLoading(id);
    try { await api.put(`/attendance/${id}/approve-clock-in`, {}); toast.success(t('success.clockInApproved')); await refetch(); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); } finally { setActionLoading(null); }
  };
  const rejectClockIn = async (id: string) => {
    setActionLoading(id + '-reject');
    try { await api.put(`/attendance/${id}/reject-clock-in`, { reason: t('dashboard.rejectedByManager') }); toast.success(t('success.clockInRejected')); await refetch(); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); } finally { setActionLoading(null); }
  };
  const approveClockOut = async (id: string) => {
    setActionLoading(id + '-out');
    try { await api.put(`/attendance/${id}/approve-clock-out`, {}); toast.success(t('success.clockOutApproved')); await refetch(); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); } finally { setActionLoading(null); }
  };
  const rejectClockOut = async (id: string) => {
    setActionLoading(id + '-out-reject');
    try { await api.put(`/attendance/${id}/reject-clock-out`, { reason: t('dashboard.rejectedByManager') }); toast.success(t('success.clockOutRejected')); await refetch(); }
    catch (e: unknown) { toast.error(getErrorMessage(e)); } finally { setActionLoading(null); }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const statCards = [
    { label: t('dashboard.totalStaff'),       value: staffCount,                                        icon: UserGroupIcon,              accent: '#29ABE2' },
    { label: t('dashboard.pendingApprovals'), value: pendingClockIns.length + pendingClockOuts.length,  icon: ClockIcon,                  accent: '#F59E0B' },
    { label: t('dashboard.activeToday'),      value: summary?.approved ?? 0,                            icon: ClipboardDocumentCheckIcon, accent: '#10B981' },
    { label: t('dashboard.hoursWorked'),      value: `${(summary?.totalHoursWorked ?? 0).toFixed(1)}h`, icon: CheckCircleIcon,            accent: '#6366F1' },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF]">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{t('dashboard.branchDashboard')}</h1>
        <p className="text-sm font-medium text-[#29ABE2] mt-1">{t('dashboard.todayOverview')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.accent + '18' }}>
                <Icon className="w-5 h-5" style={{ color: s.accent }} />
              </div>
              <p className="text-2xl font-bold text-[#1E3A5F]">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending tables */}
      <div className="grid lg:grid-cols-2 gap-4">
        {[
          { title: t('dashboard.pendingClockIns'),  records: pendingClockIns,  timeKey: 'clockInTime',  approveAct: approveClockIn,  rejectAct: rejectClockIn  },
          { title: t('dashboard.pendingClockOuts'), records: pendingClockOuts, timeKey: 'clockOutTime', approveAct: approveClockOut, rejectAct: rejectClockOut },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-sm">{section.title}</h2>
              <span className="w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#29ABE2' }}>
                {section.records.length}
              </span>
            </div>
            {section.records.length === 0 ? (
              <p className="px-5 py-10 text-center text-gray-400 text-sm">No pending requests</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/60">
                    <tr>
                      {[t('common.name'), t('form.role'), 'Time', t('common.actions')].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {section.records.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900 text-xs">{r.staff.firstName} {r.staff.lastName}</td>
                        <td className="px-5 py-3 text-xs text-gray-400 capitalize">{r.staff.user.role.toLowerCase()}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{formatTime(r.clockInTime)}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => section.approveAct(r.id)} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => section.rejectAct(r.id)} disabled={!!actionLoading}
                              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
