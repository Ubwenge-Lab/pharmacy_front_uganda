'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import { ClockIcon } from '@heroicons/react/24/outline';


interface AttendanceRecord {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'CLOCKED_OUT' | 'COMPLETED' | 'REJECTED';
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  notes?: string;
  rejectionReason?: string;
  clockInApprover?: { firstName: string; lastName: string };
  clockOutApprover?: { firstName: string; lastName: string };
}

const STATUS_KEYS: Record<string, string> = {
  PENDING: 'attendance.statusPending',
  APPROVED: 'attendance.statusApproved',
  CLOCKED_OUT: 'attendance.statusClockedOut',
  COMPLETED: 'attendance.statusCompleted',
  REJECTED: 'attendance.statusRejected',
};

export default function StaffAttendancePage() {
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => { fetchAttendance(); }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get('/attendance/my-attendance');
      setRecords(res.data);
      const hours = res.data.reduce((sum: number, r: AttendanceRecord) => sum + (r.totalHours || 0), 0);
      setTotalHours(hours);
    } catch {
      // Records stay empty on failure
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language || 'en', { weekday: 'short', month: 'short', day: 'numeric' });

  const completedCount = records.filter(r => r.status === 'COMPLETED').length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-6 lg:p-8 text-white bg-brand-navy">
        <h1 className="text-2xl lg:text-3xl font-bold">{t('attendance.myAttendance')}</h1>
        <p className="mt-1 text-white/70">{t('attendance.yourShiftHistory')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('staffMgmt.totalRecords'),    value: records.length,              dark: false },
          { label: t('staffMgmt.completedShifts'), value: completedCount,              dark: false },
          { label: t('staffMgmt.totalHours'),      value: `${totalHours.toFixed(1)}h`, dark: true },
        ].map(s => (
          <div
            key={s.label}
            className={`rounded-2xl p-5 text-center ${s.dark ? 'bg-brand-navy' : 'bg-brand-teal'}`}
          >
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <ClockIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">{t('attendance.noRecordsYet')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('attendance.firstShiftMessage')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(record.clockInTime)}</p>
                    <StatusBadge status={record.status} label={t(STATUS_KEYS[record.status] || 'attendance.statusPending')} />
                  </div>

                  <div className="flex gap-6 text-sm text-gray-600">
                    <div>
                      <span className="text-xs text-gray-400">{t('attendance.in')}</span> {formatTime(record.clockInTime)}
                      {record.clockInApprover && (
                        <span className="text-xs ml-1 text-brand-teal">
                          {record.clockInApprover.firstName}
                        </span>
                      )}
                    </div>
                    {record.clockOutTime && (
                      <div>
                        <span className="text-xs text-gray-400">{t('attendance.out')}</span> {formatTime(record.clockOutTime)}
                        {record.clockOutApprover && (
                          <span className="text-xs ml-1 text-brand-teal">
                            {record.clockOutApprover.firstName}
                          </span>
                        )}
                      </div>
                    )}
                    {record.totalHours && (
                      <div className="font-medium text-brand-navy">
                        {record.totalHours.toFixed(1)}h
                      </div>
                    )}
                  </div>

                  {record.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1">{t('attendance.rejectionLabel')} {record.rejectionReason}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
