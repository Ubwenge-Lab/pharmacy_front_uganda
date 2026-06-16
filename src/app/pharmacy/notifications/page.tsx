// frontend/src/app/pharmacy/notifications/page.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ShoppingCartIcon, ExclamationTriangleIcon, BellIcon,
  CubeIcon, CheckCircleIcon, UserGroupIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { POLLING_INTERVAL_MS } from '@/lib/constants';


interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  orderId?: string;
}

export default function PharmacyNotificationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ORDERS' | 'INVENTORY' | 'OTHER'>('ALL');
  const pollTimerRef = useRef<number | null>(null);

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await api.get('/notifications?userType=pharmacy');

      const payload = res.data?.data ?? res.data;
      const rawNotifications = Array.isArray(payload) ? payload : [];

      const normalizedNotifications = rawNotifications.map((notif: any) => {
        const matchesOutOfStock = notif.title?.toLowerCase().includes('out of stock') ||
          notif.message?.toLowerCase().includes('out of stock');

          return {
            ...notif,
            type: matchesOutOfStock ? 'OUT_OF_STOCK' : notif.type,
            orderId: notif.orderId ?? undefined,
          };
        });

      setNotifications(normalizedNotifications);
      setLastUpdated(new Date());
    } catch {
      // Notifications stay stale on polling failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollTimerRef.current = window.setInterval(() => fetchNotifications(true), POLLING_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current !== null) window.clearInterval(pollTimerRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {
      // stale on failure is acceptable
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all?userType=pharmacy');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success(t('success.allNotificationsRead'));
    } catch {
      toast.error(t('success.notificationsReadFailed'));
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED': case 'ORDER_ACCEPTED': case 'ORDER_CANCELLED': return ShoppingCartIcon;
      case 'LOW_STOCK': case 'OUT_OF_STOCK':                              return ExclamationTriangleIcon;
      case 'INVENTORY_UPDATED':                                           return CubeIcon;
      case 'ORDER_COMPLETED':                                             return CheckCircleIcon;
      case 'NEW_CUSTOMER':                                                return UserGroupIcon;
      default:                                                            return BellIcon;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_PLACED':    return { bg: 'bg-blue-50',  icon: 'text-blue-600',  border: 'border-blue-500' };
      case 'LOW_STOCK': case 'OUT_OF_STOCK':
                              return { bg: 'bg-red-50',   icon: 'text-red-600',   border: 'border-red-500' };
      case 'ORDER_COMPLETED': return { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-500' };
      default:                return { bg: 'bg-gray-50',  icon: 'text-gray-600',  border: 'border-gray-300' };
    }
  };

  const getNotificationType = (type: string) => {
    if (['ORDER_PLACED', 'ORDER_ACCEPTED', 'ORDER_CANCELLED', 'ORDER_COMPLETED'].includes(type)) return 'order';
    if (['LOW_STOCK', 'OUT_OF_STOCK', 'INVENTORY_UPDATED'].includes(type))                       return 'inventory';
    return 'other';
  };

  const formatTime = (dateStr: string) => {
    const diffMs    = Date.now() - new Date(dateStr).getTime();
    const diffMins  = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);
    if (diffMins < 1)   return t('common.justNow');
    if (diffMins < 60)  return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // ─── Derived state ────────────────────────────────────────────────────────
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALL')       return true;
    const type = getNotificationType(n.type);
    if (filter === 'ORDERS')    return type === 'order';
    if (filter === 'INVENTORY') return type === 'inventory';
    if (filter === 'OTHER')     return type === 'other';
    return true;
  });

  const unreadCount     = notifications.filter(n => !n.isRead).length;
  const orderCount      = notifications.filter(n => getNotificationType(n.type) === 'order').length;
  const inventoryCount  = notifications.filter(n => getNotificationType(n.type) === 'inventory').length;
  const otherCount      = notifications.filter(n => getNotificationType(n.type) === 'other').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4080]">{t('notifications2.notifications')}</h1>
          <p className="mt-1 text-[#35BAF5]">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'You are all caught up'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live refresh indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
            <span>
              {refreshing
                ? 'Refreshing…'
                : lastUpdated
                  ? `Updated ${formatTime(lastUpdated.toISOString())}`
                  : ''}
            </span>
          </div>

          {/* <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Mark all as read
          </button> */}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-l-4 border-blue-500 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{orderCount}</p>
              <p className="text-sm text-gray-600 mt-1">{t('notifications2.orderNotifications')}</p>
            </div>
            <ShoppingCartIcon className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{inventoryCount}</p>
              <p className="text-sm text-gray-600 mt-1">{t('notifications2.stockAlerts')}</p>
            </div>
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white border-l-4 border-teal-500 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-gray-900">{unreadCount}</p>
              <p className="text-sm text-gray-600 mt-1">{t('notifications2.unread')}</p>
            </div>
            <BellIcon className="w-12 h-12 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
        {([
          { id: 'ALL',       label: 'All',                         icon: BellIcon,             count: notifications.length },
          { id: 'ORDERS',    label: t('common.orders'),            icon: ShoppingCartIcon,     count: orderCount },
          { id: 'INVENTORY', label: t('branch.inventory'),         icon: CubeIcon,             count: inventoryCount },
          { id: 'OTHER',     label: 'Other',                       icon: UserGroupIcon,        count: otherCount },
        ] as const).map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === id ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={filter === id ? { background: 'linear-gradient(90deg, #0284C7, #38BDF8)' } : {}}>
            <Icon className="w-4 h-4" />
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{t('notifications2.allNotifications')}</h2>

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-16 text-center">
            <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('notifications2.noNotificationsYet')}</p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const Icon   = getNotificationIcon(notif.type);
            const colors = getNotificationColor(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                  if (notif.orderId) router.push(`/pharmacy/orders/${notif.orderId}`);
                }}
                className={`${colors.bg} ${
                  !notif.isRead ? `border-l-4 ${colors.border}` : 'border border-gray-200'
                } rounded-lg p-6 hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                        {!notif.isRead && (
                          <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full font-bold">New</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{notif.message}</p>
                    <p className="text-sm text-gray-500">{formatTime(notif.createdAt)}</p>
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
