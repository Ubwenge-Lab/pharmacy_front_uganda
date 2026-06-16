'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getErrorMessage } from '@/lib/errorHandler';
import {
  ArrowLeftIcon,
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

const ROLE_COLORS: Record<string, string> = {
  PHARMACIST: 'bg-violet-100 text-violet-800',
  CASHIER:    'bg-blue-100 text-blue-800',
  NURSE:      'bg-pink-100 text-pink-800',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:     'bg-yellow-100 text-yellow-800',
  APPROVED:    'bg-blue-100 text-blue-800',
  CLOCKED_OUT: 'bg-orange-100 text-orange-800',
  COMPLETED:   'bg-green-100 text-green-800',
  REJECTED:    'bg-red-100 text-red-800',
};

const PERM_GROUP_KEY: Record<string, string> = {
  'Orders': 'permGroupOrders',
  'Inventory': 'permGroupInventory',
  'Payments': 'permGroupPayments',
  'Prescriptions': 'permGroupPrescriptions',
  'Analytics': 'permGroupAnalytics',
  'Customers': 'permGroupCustomers',
  'Staff & Settings': 'permGroupStaffSettings',
};

const PERMISSION_GROUPS = [
  {
    label: 'Orders',
    perms: ['VIEW_ORDERS', 'ACCEPT_ORDERS', 'UPDATE_ORDER_STATUS', 'CANCEL_ORDERS'],
  },
  {
    label: 'Inventory',
    perms: ['VIEW_INVENTORY', 'ADD_MEDICATION', 'EDIT_MEDICATION', 'DELETE_MEDICATION', 'MANAGE_STOCK_TRANSFERS'],
  },
  {
    label: 'Payments',
    perms: ['VIEW_PAYMENTS', 'PROCESS_PAYMENTS', 'ISSUE_REFUNDS'],
  },
  {
    label: 'Prescriptions',
    perms: ['VIEW_PRESCRIPTIONS', 'APPROVE_PRESCRIPTIONS', 'REJECT_PRESCRIPTIONS'],
  },
  {
    label: 'Analytics',
    perms: ['VIEW_ANALYTICS', 'VIEW_REPORTS', 'EXPORT_DATA'],
  },
  {
    label: 'Customers',
    perms: ['VIEW_CUSTOMERS', 'MANAGE_CUSTOMER_INFO'],
  },
  {
    label: 'Staff & Settings',
    perms: ['VIEW_STAFF', 'MANAGE_STAFF', 'MANAGE_BRANCH_SETTINGS'],
  },
];

interface StaffDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationalId?: string;
  gender?: string;
  dateOfBirth?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  user: { email: string; role: string };
  permissions?: { permissions: string[] };
  branch: { name: string };
}

interface AttendanceRecord {
  id: string;
  status: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  rejectionReason?: string;
  clockInApprover?: { firstName: string; lastName: string };
  clockOutApprover?: { firstName: string; lastName: string };
}

export default function StaffDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const staffId = params.id as string;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      await api.put(`/staff/${staffId}`, {
        permissions: selectedPermissions,
      });
      toast.success(t('success.permissionsUpdated') || 'Permissions updated successfully');
      setStaff(prev => prev ? {
        ...prev,
        permissions: { permissions: selectedPermissions }
      } : null);
      setIsEditingPermissions(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPermissions(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get(`/staff/${staffId}`, { signal: controller.signal }),
      api.get(`/attendance/branch?staffId=${staffId}`, { signal: controller.signal }),
    ])
      .then(([staffRes, attendanceRes]) => {
        setStaff(staffRes.data);
        setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      })
      .catch(err => {
        if (err?.code === 'ERR_CANCELED') return;
        toast.error(t('errors.failedToLoad'));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [staffId]);

  const handleDeactivate = async () => {
    if (!staff) return;
    const name = `${staff.firstName} ${staff.lastName}`;
    if (!confirm(`Remove ${name} from the branch? This cannot be undone.`)) return;
    setDeactivating(true);
    try {
      await api.delete(`/staff/${staffId}`);
      toast.success(`${name} has been removed`);
      router.push('/branch/staff');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally { setDeactivating(false); }
  };

  const formatTime = (d?: string) =>
    d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const totalHours = attendance.reduce((sum, r) => sum + (r.totalHours ?? 0), 0);
  const completedShifts = attendance.filter(r => r.status === 'COMPLETED').length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  if (!staff) return (
    <div className="space-y-4">
      <button onClick={() => router.push('/branch/staff')}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: NAVY }}>
        <ArrowLeftIcon className="w-4 h-4" /> {t('staffMgmt.backToStaff')}
      </button>
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        {t('staffMgmt.staffNotFound')}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.push('/branch/staff')}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: NAVY }}>
        <ArrowLeftIcon className="w-4 h-4" /> {t('staffMgmt.backToStaff')}
      </button>

      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <UserCircleIcon className="w-8 h-8 text-[#29ABE2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">{staff.firstName} {staff.lastName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white`}>
                {staff.user.role}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${staff.status === 'ACTIVE' ? 'bg-green-400/30 text-green-100' : 'bg-gray-400/30 text-gray-200'}`}>
                {staff.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleDeactivate}
          disabled={deactivating}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-all self-start sm:self-center"
        >
          {deactivating ? t('staffMgmt.removing') : t('staffMgmt.removeFromBranch')}
        </button>
      </div>

      {/* Attendance summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('staffMgmt.totalShifts'),      value: attendance.length },
          { label: t('staffMgmt.completedShifts'),  value: completedShifts   },
          { label: t('staffMgmt.totalHours'),       value: `${totalHours.toFixed(1)}h` },
        ].map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: '#F0F7F6' }}>
              <ClockIcon className="w-5 h-5" style={{ color: TEAL }} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">{t('staffMgmt.profileInformation')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: EnvelopeIcon,      label: t('form.email'),       value: staff.user.email },
            { icon: PhoneIcon,         label: t('form.phone'),       value: staff.phone || '—' },
            { icon: IdentificationIcon,label: t('form.nationalId'),  value: staff.nationalId || '—' },
            { icon: UserCircleIcon,    label: t('form.gender'),      value: staff.gender || '—' },
            { icon: ClockIcon,         label: t('form.dateOfBirth'), value: staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : '—' },
            { icon: ClockIcon,         label: t('staffMgmt.memberSince'), value: formatDate(staff.createdAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: '#F0F7F6' }}>
                <Icon className="w-4 h-4" style={{ color: TEAL }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Permissions */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">{t('staffMgmt.permissions')}</p>
            <button
              onClick={() => {
                setSelectedPermissions(staff.permissions?.permissions ?? []);
                setIsEditingPermissions(true);
              }}
              className="text-xs font-semibold text-[#29ABE2] hover:underline"
            >
              {t('staffMgmt.editPermissions') || 'Edit Permissions'}
            </button>
          </div>
          {staff.permissions && staff.permissions.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {staff.permissions.permissions.map(p => (
                <span key={p} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No permissions assigned.</p>
          )}
        </div>
      </div>

      {/* Attendance history */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{t('staffMgmt.attendanceHistory')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{attendance.length} {t('staffMgmt.records')}</p>
        </div>

        {attendance.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            <ClockIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            {t('staffMgmt.noAttendanceRecords')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t('attendance.date'),
                    t('attendance.clockIn'),
                    t('attendance.clockOut'),
                    t('attendance.hours'),
                    t('attendance.status'),
                  ].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendance.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(record.clockInTime)}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {formatTime(record.clockInTime)}
                      {record.clockInApprover && (
                        <span className="text-xs text-gray-400 ml-1">
                          · {record.clockInApprover.firstName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {formatTime(record.clockOutTime)}
                      {record.clockOutApprover && (
                        <span className="text-xs text-gray-400 ml-1">
                          · {record.clockOutApprover.firstName}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[record.status] || 'bg-gray-100 text-gray-600'}`}>
                        {record.status.replace(/_/g, ' ')}
                      </span>
                      {record.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">{record.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Permissions Modal */}
      {isEditingPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('staffMgmt.editPermissions') || 'Edit Permissions'}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Assign or remove permissions for {staff.firstName} {staff.lastName} ({staff.user.role})
                </p>
              </div>
              <button
                onClick={() => setIsEditingPermissions(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t(`staffMgmt.${PERM_GROUP_KEY[group.label]}`) || group.label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.perms.map(perm => {
                      const isSelected = selectedPermissions.includes(perm);
                      return (
                        <button
                          type="button"
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                          }`}
                        >
                          {perm.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsEditingPermissions(false)}
                disabled={savingPermissions}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPermissions}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm hover:opacity-90 transition-all flex items-center gap-2 bg-brand-teal"
              >
                {savingPermissions ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('common.saving') || 'Saving...'}</>
                ) : (
                  t('common.save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
