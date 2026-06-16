'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { POLLING_INTERVAL_MS } from '@/lib/constants';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  ServerStackIcon,
  ShieldExclamationIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';

type SeverityTab = 'all' | 'unread' | 'critical' | 'warning';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  category?: string;
}

const getSeverity = (type: string): 'critical' | 'warning' | 'success' | 'info' => {
  const t = type.toUpperCase();
  if (t.includes('CRITICAL') || t.includes('UNAUTHORIZED') || t.includes('REJECTED') || t.includes('ALERT'))
    return 'critical';
  if (t.includes('WARNING') || t.includes('PENDING') || t.includes('LOW') || t.includes('EXPIRE'))
    return 'warning';
  if (t.includes('COMPLETE') || t.includes('APPROVED') || t.includes('BACKUP') || t.includes('SUCCESS'))
    return 'success';
  return 'info';
};

const SEVERITY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  warning:  { bg: '#FEF9C3', color: '#B45309', label: 'Warning'  },
  success:  { bg: '#DCFCE7', color: '#16A34A', label: 'Success'  },
  info:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Info'     },
};

const ICON_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#DC2626' },
  warning:  { bg: '#FEF9C3', color: '#B45309' },
  success:  { bg: '#DCFCE7', color: '#16A34A' },
  info:     { bg: '#DBEAFE', color: '#2563EB' },
};

const getNotifIcon = (type: string): React.ElementType => {
  const t = type.toUpperCase();
  if (t.includes('UNAUTHORIZED') || t.includes('SECURITY')) return ShieldExclamationIcon;
  if (t.includes('CPU') || t.includes('SERVER') || t.includes('INFRA')) return ServerStackIcon;
  if (t.includes('DATABASE') || t.includes('DB') || t.includes('BACKUP')) return CircleStackIcon;
  if (t.includes('COMPLETE') || t.includes('SUCCESS') || t.includes('APPROVED')) return CheckCircleIcon;
  if (t.includes('WARNING') || t.includes('LOW')) return ExclamationTriangleIcon;
  return BellIcon;
};

const getCategory = (type: string): string => {
  const t = type.toUpperCase();
  if (t.includes('CPU') || t.includes('SERVER') || t.includes('INFRA')) return 'Infrastructure';
  if (t.includes('UNAUTHORIZED') || t.includes('SECURITY'))             return 'Security';
  if (t.includes('BACKUP') || t.includes('DATABASE') || t.includes('DB')) return 'Backup';
  if (t.includes('PHARMACY'))  return 'Pharmacy';
  if (t.includes('ORDER'))     return 'Orders';
  if (t.includes('PATIENT'))   return 'Patients';
  return 'System';
};

const formatTime = (dateStr: string): string => {
  const diffMs   = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)   return 'Just now';
  if (diffMins < 60)  return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function SuperAdminNotificationsPage() {
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [activeTab, setActiveTab]         = useState<SeverityTab>('all');
  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const res = await api.get('/notifications?userType=admin');
      setNotifications(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch {
      // Keep stale on poll failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(false);
    intervalRef.current = setInterval(() => fetchNotifications(true), POLLING_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all?userType=admin');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(t('success.allNotificationsRead'));
    } catch {
      toast.error(t('success.notificationsReadFailed'));
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try { await api.delete(`/notifications/${id}`); } catch { /* best effort */ }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setOpenMenuId(null);
  };

  const unreadCount   = notifications.filter(n => !n.isRead).length;
  const warningCount  = notifications.filter(n => getSeverity(n.type) === 'warning').length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread')   return !n.isRead;
    if (activeTab === 'critical') return getSeverity(n.type) === 'critical';
    if (activeTab === 'warning')  return getSeverity(n.type) === 'warning';
    return true;
  });

  const tabs: { key: SeverityTab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'all',      label: 'All',      icon: BellIcon,                count: notifications.length },
    { key: 'unread',   label: 'Unread',   icon: InboxIcon,               count: unreadCount },
    { key: 'critical', label: 'Critical', icon: ShieldExclamationIcon },
    { key: 'warning',  label: 'Warning',  icon: ExclamationTriangleIcon, count: warningCount },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div
        className="rounded-2xl p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #f0f9ff 100%)' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1E3A5F' }}>
              {t('notifications2.notifications')}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#4B7BAE' }}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All notifications are read'
              }
            </p>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-sm font-semibold border border-gray-200 hover:shadow-sm transition-all"
            style={{ color: '#1E3A5F' }}
          >
            <CheckCircleIcon className="w-4 h-4" />
            {t('notifications2.markAllAsRead')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-5">
          {tabs.map(tab => {
            const Icon   = tab.icon;
            const active = activeTab === tab.key;
            const label  = tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={active
                  ? { background: 'linear-gradient(135deg, #0284C7, #38BDF8)', color: '#fff', borderColor: 'transparent' }
                  : { backgroundColor: '#fff', color: '#374151', borderColor: '#E5E7EB' }
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">All Notifications</h2>
          {refreshing && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-sky-500 rounded-full animate-spin" />
              Refreshing…
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <BellIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications in this category</p>
          </div>
        ) : (
          filtered.map(n => {
            const severity = getSeverity(n.type);
            const badge    = SEVERITY_BADGE[severity];
            const IconComp = getNotifIcon(n.type);
            const iconClr  = ICON_COLORS[severity] ?? ICON_COLORS.info;
            const category = n.category ?? getCategory(n.type);

            return (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
                className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: iconClr.bg }}
                  >
                    <IconComp className="w-5 h-5" style={{ color: iconClr.color }} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-gray-400">{formatTime(n.createdAt)}</span>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</span>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 shrink-0" />
                    )}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === n.id ? null : n.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                        aria-label="More options"
                      >
                        <EllipsisHorizontalIcon className="w-4 h-4" />
                      </button>
                      {openMenuId === n.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 w-36">
                          {!n.isRead && (
                            <button
                              onClick={() => { handleMarkRead(n.id); setOpenMenuId(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={e => handleDelete(e, n.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
