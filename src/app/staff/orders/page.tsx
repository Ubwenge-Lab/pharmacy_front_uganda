'use client';

import { formatCurrency } from '@/lib/currency';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api, { unwrapData } from '@/lib/api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorHandler';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  ShoppingCartIcon,
  ChevronDownIcon,
  ClockIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useStaffPermissions } from '@/hooks/useStaffPermissions';
import PermissionGate from '@/components/shared/PermissionGate';
import CashierOrdersView from '@/components/staff/CashierOrdersView';
import { Order, OrderStatus } from '@/types';
import { useFetch } from '@/hooks/useFetch';

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING:          ['ACCEPTED'],
  ACCEPTED:         ['PREPARING'],
  PREPARING:        ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
  READY_FOR_PICKUP: ['COMPLETED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['COMPLETED'],
};

function fmt(n: number) {
  return `UGX ${Number(n ?? 0).toLocaleString()}`;
}

export default function StaffOrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { can } = useStaffPermissions();
  const isCashier = user?.role === 'CASHIER';

  const [orders, setOrders]                   = useState<Order[]>([]);
  const [filter, setFilter]                   = useState('all');
  const [expanded, setExpanded]               = useState<string | null>(null);
  const [updatingId, setUpdatingId]           = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason]       = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data, loading, error } = useFetch<Order[]>(
    async (signal) => {
      const res = await api.get('/orders/pharmacy-orders', { signal });
      return unwrapData<Order>(res.data);
    },
    []
  );


  useEffect(() => {
    if (data) {
      setOrders(data);
    }
  }, [data]);
  useEffect(() => { if (error) toast.error(t('errors.failedToLoadOrders')); }, [error, t]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? ({ ...o, status: newStatus } as Order) : o));
      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ').toLowerCase()}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally { setUpdatingId(null); }
  };

  const handleRejectOrder = async () => {
    if (!rejectingOrderId) return;
    if (!rejectReason.trim()) { toast.error(t('form.provideReason')); return; }
    setUpdatingId(rejectingOrderId);
    try {
      await api.patch(`/orders/${rejectingOrderId}/status`, {
        status: 'CANCELLED',
        cancellationReason: rejectReason.trim(),
      });
      setOrders(prev => prev.map(o => o.id === rejectingOrderId ? ({ ...o, status: 'CANCELLED' } as Order) : o));
      toast.success(t('success.orderCancelled2'));
      setShowRejectModal(false);
      setRejectingOrderId(null);
      setRejectReason('');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally { setUpdatingId(null); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const statusFilters = ['all', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const activeCount = orders.filter(o =>
    ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;
  const completedCount = orders.filter(o => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;
  const pendingCount   = orders.filter(o => o.status === 'PENDING').length;

  if (isCashier) return <CashierOrdersView orders={orders} loading={loading} />;
  if (loading)   return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4 lg:p-6">

      {/* ── Hero ── */}
      <div
        className="rounded-2xl px-8 py-10"
        style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)' }}
      >
        <h1 className="text-3xl font-extrabold text-gray-900">{t('staffPages.orderOverview')}</h1>
        <p className="mt-1 text-gray-500 text-sm">{t('staffPages.orderOverviewSubtitle')}</p>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center border-b-4 border-b-blue-400">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 mb-2">
            <ShoppingCartIcon className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 font-medium">{t('orders2.orderTotal')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center border-b-4 border-b-orange-400">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 mb-2">
            <ClockIcon className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xs text-orange-500 font-medium">{t('orders2.orderPending')}</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{pendingCount}</p>
        </div>

        {/* Active */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center border-b-4 border-b-green-400">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 mb-2">
            <BoltIcon className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xs text-green-500 font-medium">{t('orders2.orderActive')}</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{activeCount}</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center border-b-4 border-b-purple-400">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xs text-purple-500 font-medium">{t('orders2.orderCompleted')}</p>
          <p className="text-3xl font-bold text-purple-500 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === s
                ? 'bg-brand-teal text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? t('orders2.orderAll') : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* ── Orders list ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <ShoppingCartIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('pharmacy.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const isExpanded  = expanded === order.id;
            const nextStatuses = NEXT_STATUSES[order.status] ?? [];
            const isUpdating  = updatingId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

                {/* Row header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order for ${order.patient.firstName} ${order.patient.lastName}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-blue-50">
                      <ShoppingCartIcon className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        {order.patient.firstName} {order.patient.lastName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(order.createdAt)} · {order.type} · {(order.orderItems ?? []).length} item{(order.orderItems ?? []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-bold text-gray-900 hidden sm:block">{formatCurrency(order.total)}</p>
                    <StatusBadge status={order.status} />
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">

                    {/* Items */}
                    <div>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                        {t('orders2.items')}
                      </p>
                      <div className="space-y-1.5">
                        {(order.orderItems ?? []).map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {item.medication.name}
                              <span className="text-gray-400 text-xs ml-1">x{item.quantity}</span>
                            </span>
                            <span className="text-gray-700 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-gray-100">
                        <span className="text-gray-700">{t('cart.total')}</span>
                        <span className="text-brand-teal">{formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    {/* Patient contact */}
                    {order.patient.phone && (
                      <div>
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                          {t('orders2.patientContact')}
                        </p>
                        <p className="text-sm text-gray-600">{order.patient.phone}</p>
                      </div>
                    )}

                    {/* Prescription */}
                    {order.prescription && (
                      <div className="px-3 py-2 rounded-lg bg-blue-50 text-sm text-blue-700">
                        {t('staffPages.prescriptionAttachedStatus')}{' '}
                        <span className="font-semibold">{order.prescription.status}</span>
                      </div>
                    )}

                    {/* Update status */}
                    {(nextStatuses.length > 0 || ['PENDING', 'ACCEPTED', 'PREPARING'].includes(order.status)) && (
                      <div>
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                          {t('orders2.updateStatus')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <PermissionGate permission="UPDATE_ORDER_STATUS" showLocked lockedMessage="No status update access">
                            <>
                              {nextStatuses.map((s, i) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusUpdate(order.id, s)}
                                  disabled={isUpdating}
                                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                                    i === 0
                                      ? 'text-white'
                                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                  style={i === 0 ? { background: 'linear-gradient(93.49deg, #0284C7 0%, #38BDF8 102.32%)' } : {}}
                                >
                                  {isUpdating
                                    ? t('orders2.updating')
                                    : `${t('orders2.markAs')} ${s.replace(/_/g, ' ').toLowerCase()}`}
                                </button>
                              ))}
                            </>
                          </PermissionGate>
                          {['PENDING', 'ACCEPTED', 'PREPARING'].includes(order.status) && (
                            <PermissionGate permission="CANCEL_ORDERS" showLocked lockedMessage="No cancel access">
                              <button
                                onClick={() => {
                                  setRejectingOrderId(order.id);
                                  setRejectReason('');
                                  setShowRejectModal(true);
                                }}
                                disabled={isUpdating}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                              >
                                {t('orders2.rejectOrder', 'Reject / Cancel Order')}
                              </button>
                            </PermissionGate>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reject modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3">{t('orders2.rejectOrder')}</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder={t('checkout2.rejectReasonPlaceholder')}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(false); setRejectingOrderId(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={!!updatingId || !rejectReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {t('staffPages.confirmRejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
