'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { POLLING_INTERVAL_MS } from '@/lib/constants';


type NotificationCategory = 'all' | 'orders' | 'prescriptions' | 'alerts';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  orderId?: string;
  prescriptionId?: string;
  createdAt: string;
}

const getCategory = (type: string): Omit<NotificationCategory, 'all'> => {
  if (type.startsWith('ORDER_'))        return 'orders';
  if (type.startsWith('PRESCRIPTION_')) return 'prescriptions';
  return 'alerts';
};

// Maps notification type → { icon background color, icon emoji, label }
const getTypeConfig = (type: string) => {
  switch (type) {
    case 'ORDER_PLACED':           return { bg: '#EEF2FF', color: '#4F46E5', emoji: '🛒',  label: 'ORDER UPDATE' };
    case 'ORDER_ACCEPTED':         return { bg: '#ECFDF5', color: '#059669', emoji: '✅',  label: 'ORDER UPDATE' };
    case 'ORDER_PREPARING':        return { bg: '#FFF7ED', color: '#EA580C', emoji: '⚗️',  label: 'ORDER UPDATE' };
    case 'ORDER_OUT_FOR_DELIVERY': return { bg: '#EFF6FF', color: '#2563EB', emoji: '🚚',  label: 'ORDER UPDATE' };
    case 'ORDER_READY_FOR_PICKUP': return { bg: '#F0FAFA', color: '#0D9488', emoji: '📦',  label: 'ORDER UPDATE' };
    case 'ORDER_DELIVERED':        return { bg: '#ECFDF5', color: '#16A34A', emoji: '🎉',  label: 'ORDER UPDATE' };
    case 'ORDER_CANCELLED':        return { bg: '#FEF2F2', color: '#DC2626', emoji: '❌',  label: 'ORDER UPDATE' };
    case 'PRESCRIPTION_APPROVED':  return { bg: '#FFF7ED', color: '#EA580C', emoji: '📋',  label: 'PRESCRIPTION' };
    case 'PRESCRIPTION_REJECTED':  return { bg: '#FEF2F2', color: '#DC2626', emoji: '🚫',  label: 'PRESCRIPTION' };
    default:                       return { bg: '#F3F4F6', color: '#6B7280', emoji: '🔔',  label: 'ALERT' };
  }
};

export default function PatientNotificationsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    try {
      const res = await api.get('/notifications?userType=patient');
      setNotifications(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      setLastUpdated(new Date());
    } catch {
      // Notifications stay stale on polling failure
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

  const handleMarkAsRead = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      } catch { /* silent */ }
    }
    if (n.orderId) router.push(`/patient/orders/${n.orderId}`);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all?userType=patient');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success(t('success.allNotificationsRead'));
    } catch {
      toast.error(t('success.notificationsReadFailed'));
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // optimistic: remove anyway for UX
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const filteredNotifications = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => getCategory(n.type) === activeCategory);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryCount = (cat: NotificationCategory) =>
    cat === 'all'
      ? notifications.length
      : notifications.filter(n => getCategory(n.type) === cat).length;

  const formatTime = (dateStr: string) => {
    const diffMs    = Date.now() - new Date(dateStr).getTime();
    const diffMins  = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);
    if (diffMins < 1)   return t('common.justNow');
    if (diffMins < 60)  return `${diffMins} ${t('notifications2.minAgo')}`;
    if (diffHours < 24) return `${diffHours} ${diffHours > 1 ? t('notifications2.hoursAgo') : t('notifications2.hourAgo')}`;
    return `${diffDays} ${diffDays > 1 ? t('notifications2.daysAgo') : t('notifications2.dayAgo')}`;
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const TABS: { id: NotificationCategory; label: string }[] = [
    { id: 'all',           label: `All (${getCategoryCount('all')})` },
    { id: 'orders',        label: `Orders (${getCategoryCount('orders')})` },
    { id: 'prescriptions', label: `Prescriptions (${getCategoryCount('prescriptions')})` },
    { id: 'alerts',        label: `Alerts (${getCategoryCount('alerts')})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-3xl font-bold text-brand-navy">
              {t('notifications2.notifications')}
            </h1>
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-navy text-brand-navy text-sm font-medium transition-colors hover:bg-gray-50"
            >
              {/* checkmark icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('notifications2.markAllAsRead')}
            </button>
          </div>

          {unreadCount > 0 && (
            <p className="text-sm font-medium mb-5 text-brand-teal">
              {t('notifications2.youHave')} {unreadCount} {unreadCount === 1
                ? t('notifications2.unreadNotification')
                : t('notifications2.unreadNotifications')}
            </p>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCategory === tab.id ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {/* tab icon */}
                {tab.id === 'all'           && <span>🔔</span>}
                {tab.id === 'orders'        && <span>🛒</span>}
                {tab.id === 'prescriptions' && <span>📋</span>}
                {tab.id === 'alerts'        && <span>⚠️</span>}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh indicator */}
          {refreshing && (
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t('notifications2.refreshing')}
            </p>
          )}
        </div>

        {/* ── Notification section header ───────────────────────────────── */}
        <h2 className="text-xl font-bold px-1 text-brand-navy">
          {activeCategory === 'all'           ? t('notifications2.allNotifications')
          : activeCategory === 'orders'        ? t('notifications2.ordersNotifications')
          : activeCategory === 'prescriptions' ? t('notifications2.prescriptionsNotifications')
          :                                      t('notifications2.alertsNotifications')}
        </h2>

        {/* ── Notification cards ────────────────────────────────────────── */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <p className="text-5xl mb-4">🔔</p>
            <p className="text-gray-400 font-medium">
              {notifications.length === 0
                ? t('notifications2.noNotificationsYet')
                : t('notifications2.noNotificationsInCategory')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(n => {
              const cfg = getTypeConfig(n.type);
              const isOrder        = n.type.startsWith('ORDER_');
              const isOutForDelivery = n.type === 'ORDER_OUT_FOR_DELIVERY';
              const isPrescription = n.type.startsWith('PRESCRIPTION_');

              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n)}
                  className="bg-white rounded-2xl p-5 shadow-sm cursor-pointer transition-shadow hover:shadow-md relative"
                >
                  {/* Unread blue dot */}
                  {!n.isRead && (
                    <span
                      className="absolute top-5 right-12 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#3B82F6' }}
                    />
                  )}

                  {/* Delete / more button */}
                  <button
                    onClick={e => handleDelete(e, n.id)}
                    className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                    title="Delete notification"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="flex gap-4">
                    {/* Icon badge */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      {cfg.emoji}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      {/* Type label + timestamp */}
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold tracking-wide"
                          style={{ color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-xs text-gray-400">{formatTime(n.createdAt)}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 mb-1 leading-snug">
                        {n.title}
                      </h3>

                      {/* Message — bold drug names if present */}
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">
                        {n.message}
                      </p>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {isOutForDelivery && (
                          <button
                            onClick={e => { e.stopPropagation(); if (n.orderId) router.push(`/patient/orders/${n.orderId}`); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 bg-brand-navy"
                          >
                            Track Courier
                          </button>
                        )}
                        {isOrder && n.orderId && (
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/patient/orders/${n.orderId}`); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50"
                            style={{ borderColor: '#D1D5DB', color: '#374151' }}
                          >
                            View Order
                          </button>
                        )}
                        {isPrescription && n.prescriptionId && (
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/patient/prescriptions/${n.prescriptionId}`); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 bg-brand-navy"
                          >
                            View Prescription
                          </button>
                        )}
                        {isPrescription && (
                          <button
                            onClick={e => { e.stopPropagation(); router.push('/patient/search'); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50"
                            style={{ borderColor: '#D1D5DB', color: '#374151' }}
                          >
                            Find Pharmacy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
