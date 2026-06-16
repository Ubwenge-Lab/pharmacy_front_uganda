// frontend/src/app/patient/orders/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import Link from 'next/link';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  CubeIcon,
  BanknotesIcon,
  TruckIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'CANCELLED';

type FilterType = 'all' | 'pending' | 'completed';

const COMPLETED_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];
const PENDING_STATUSES: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'READY_FOR_PICKUP',
];

function getStatusMeta(status: OrderStatus, t: (key: string) => string) {
  switch (status) {
    case 'PENDING':          return { label: t('orders2.statusPending'),         sideBarClass: 'bg-amber-500'   };
    case 'ACCEPTED':         return { label: t('orders2.statusAccepted'),        sideBarClass: 'bg-blue-500'    };
    case 'PREPARING':        return { label: t('orders2.statusPreparing'),       sideBarClass: 'bg-purple-500'  };
    case 'OUT_FOR_DELIVERY': return { label: t('orders2.statusOutForDelivery'),  sideBarClass: 'bg-cyan-500'    };
    case 'READY_FOR_PICKUP': return { label: t('orders2.statusReadyForPickup'),  sideBarClass: 'bg-emerald-500' };
    case 'DELIVERED':        return { label: t('orders2.statusDelivered'),       sideBarClass: 'bg-emerald-500' };
    case 'CANCELLED':        return { label: t('orders2.statusCancelled'),       sideBarClass: 'bg-red-500'     };
    default:                 return { label: status,                             sideBarClass: 'bg-gray-500'    };
  }
}

/* ─── Order Detail Dialog ─── */
function OrderDetailDialog({ order, onClose }: { order: any; onClose: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const statusMeta = getStatusMeta(order.status as OrderStatus, t);
  const orderDate = new Date(order.createdAt);

  const statusSteps: OrderStatus[] =
    order.type === 'DELIVERY'
      ? ['PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']
      : ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED'];

  const currentStepIndex = statusSteps.indexOf(order.status as OrderStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="relative bg-linear-to-r from-brand-navy to-brand-teal p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>

          <div className="pr-10">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">{t('orders.orderDetails')}</p>
            <h2 className="text-2xl font-bold mb-1">
              #{order.orderNumber || order.id?.slice(0, 8)}
            </h2>
            <p className="text-sm text-blue-100">
              {orderDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-white/20 text-white">
              <span className="w-2 h-2 rounded-full bg-white inline-block" />
              {statusMeta.label}
            </span>
            {order.type && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {order.type === 'DELIVERY' ? <TruckIcon className="w-3.5 h-3.5" /> : <BuildingStorefrontIcon className="w-3.5 h-3.5" />}
                {order.type === 'DELIVERY' ? t('orders2.typeDelivery') : t('orders2.typePickup')}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">

          {/* Progress tracker */}
          {order.status !== 'CANCELLED' && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('orders.orderProgress')}</h3>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
                <div
                  className="absolute top-4 left-4 h-0.5 bg-linear-to-r from-brand-navy to-brand-teal transition-all duration-700"
                  style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (statusSteps.length - 1)) * (100 - 8)}%` : '0%' }}
                />
                <div className="relative flex justify-between">
                  {statusSteps.map((step, i) => {
                    const meta = getStatusMeta(step, t);
                    const done = i <= currentStepIndex;
                    const current = i === currentStepIndex;
                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            done
                              ? 'bg-linear-to-br from-brand-navy to-brand-teal border-transparent'
                              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
                          } ${current ? 'ring-4 ring-brand-teal/30 scale-110' : ''}`}
                        >
                          {done ? (
                            <CheckCircleSolid className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs text-gray-400 font-bold">{i + 1}</span>
                          )}
                        </div>
                        <p
                          className={`text-center mt-2 leading-tight ${done ? 'text-brand-navy dark:text-blue-400 font-semibold' : 'text-gray-400'}`}
                          style={{ fontSize: '9px', maxWidth: '56px' }}
                        >
                          {meta.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {order.status === 'CANCELLED' && order.cancellationReason && (
            <div className="px-6 py-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">{t('orders.cancellationReason')}</p>
                <p className="text-sm text-red-700 dark:text-red-300">{order.cancellationReason}</p>
              </div>
            </div>
          )}

          {/* Pharmacy */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('form.pharmacy')}</h3>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-linear-to-br from-brand-navy to-brand-teal rounded-2xl flex items-center justify-center shrink-0">
                <BuildingStorefrontIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-base">{order.pharmacy?.name}</p>
                {order.pharmacy?.address && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1.5 mt-1">
                    <MapPinIcon className="w-4 h-4 shrink-0 mt-0.5 text-brand-teal" />
                    {order.pharmacy.address}
                  </p>
                )}
                {order.pharmacy?.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                    <PhoneIcon className="w-4 h-4 text-brand-teal" />
                    {order.pharmacy.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              {t('orders.medications')} ({order.orderItems?.length || 0} {t('orders2.items').toLowerCase()})
            </h3>
            <div className="space-y-3">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3.5">
                  <div className="w-10 h-10 bg-linear-to-br from-blue-100 to-teal-100 dark:from-blue-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <CubeIcon className="w-5 h-5 text-brand-navy dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.medication?.name}</p>
                    {item.medication?.dosage && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.medication.dosage}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('orders.qty')}: {item.quantity} × {item.price?.toLocaleString()} UGX
                    </p>
                  </div>
                  <p className="font-bold text-brand-navy dark:text-blue-400 text-sm shrink-0">
                    {(item.price * item.quantity)?.toLocaleString()} UGX
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          {order.type === 'DELIVERY' && (order.deliveryAddress || order.deliveryZone) && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('orders.deliveryDetails')}</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">{order.deliveryAddress}</p>
                  </div>
                )}
                {order.deliveryZone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">{t('orders.zone')}: {order.deliveryZone}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-6">
                  {t('orders.deliveryFee')}: <span className="font-semibold">{order.deliveryFee?.toLocaleString() || 0} UGX</span>
                </p>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('orders.paymentSummary')}</h3>
            <div className="bg-linear-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('orders.subtotal')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.subtotal?.toLocaleString()} UGX</span>
              </div>
              {(order.deliveryFee ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('orders.deliveryFee')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.deliveryFee?.toLocaleString()} UGX</span>
                </div>
              )}
              {(order.insuranceCoverage ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 dark:text-green-400">{t('orders.insuranceCoverage')}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">-{order.insuranceCoverage?.toLocaleString()} UGX</span>
                </div>
              )}
              <div className="border-t border-blue-200/60 dark:border-blue-800/50 pt-2.5 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">{t('common.total')}</span>
                <span className="text-xl font-extrabold bg-linear-to-r from-brand-navy to-brand-teal bg-clip-text text-transparent">
                  {order.total?.toLocaleString()} UGX
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <BanknotesIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{order.paymentMethod}</span>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={
                    order.paymentStatus === 'COMPLETED' || order.paymentStatus === 'PAID'
                      ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                      : { backgroundColor: '#FEF3C7', color: '#92400E' }
                  }
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Prescription */}
          {order.prescription && (
            <div className="px-6 py-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('prescriptions.prescriptionsTitle')}</h3>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <span className="text-sm text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                  {t('common.status')}:
                  <StatusBadge status={order.prescription.status} />
                </span>
                {order.prescription.fileUrl && (
                  <a
                    href={order.prescription.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand-navy dark:text-blue-400 hover:underline"
                  >
                    {t('common.view')} →
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.close')}
          </button>
          <Link
            href={`/patient/orders/${order.id}`}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-linear-to-r from-brand-navy to-brand-teal hover:opacity-90 transition-opacity text-center flex items-center justify-center"
          >
            {t('orders2.manageOrder', 'Manage Order')}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const allCount = orders.length;
  const pendingCount = orders.filter((o) => PENDING_STATUSES.includes(o.status)).length;
  const completedCount = orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length;

  const filteredOrders = orders.filter((order) => {
    if (filter === 'pending') return PENDING_STATUSES.includes(order.status);
    if (filter === 'completed') return COMPLETED_STATUSES.includes(order.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-8">

        {/* Page Header */}
        <div className="relative bg-linear-to-r from-brand-navy to-brand-teal rounded-3xl shadow-xl overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-6 w-52 h-52 rounded-full bg-white/5" />
          <div className="relative p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{t('orders2.myOrders')}</h1>
            </div>
            <p className="text-blue-100 text-sm pl-1">{t('orders2.trackManage')}</p>
          </div>
        </div>

        {/* Quick Action Filter Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
              filter === 'all'
                ? 'border-brand-navy bg-linear-to-br from-brand-navy to-[#2763b0] text-white shadow-lg scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-brand-navy/40 hover:shadow-md'
            }`}
          >
            <ArchiveBoxIcon className={`w-6 h-6 ${filter === 'all' ? 'text-white' : 'text-brand-navy dark:text-blue-400'}`} />
            <span className={`text-2xl font-extrabold leading-none ${filter === 'all' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {allCount}
            </span>
            <span className={`text-xs font-semibold ${filter === 'all' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('orders2.orderAll')}
            </span>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
              filter === 'pending'
                ? 'border-amber-500 bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-amber-400 hover:shadow-md'
            }`}
          >
            <ClockIcon className={`w-6 h-6 ${filter === 'pending' ? 'text-white' : 'text-amber-500'}`} />
            <span className={`text-2xl font-extrabold leading-none ${filter === 'pending' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {pendingCount}
            </span>
            <span className={`text-xs font-semibold ${filter === 'pending' ? 'text-amber-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('orders2.orderActive')}
            </span>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
              filter === 'completed'
                ? 'border-emerald-500 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg scale-[1.02]'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <CheckCircleIcon className={`w-6 h-6 ${filter === 'completed' ? 'text-white' : 'text-emerald-500'}`} />
            <span className={`text-2xl font-extrabold leading-none ${filter === 'completed' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {completedCount}
            </span>
            <span className={`text-xs font-semibold ${filter === 'completed' ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {t('orders2.orderCompleted')}
            </span>
          </button>
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
            {filter === 'all' ? t('orders2.allOrders') : filter === 'pending' ? t('orders2.inProgressOrders') : t('orders2.completedOrders')}
            <span className="ml-2 text-sm font-normal text-gray-400">({filteredOrders.length})</span>
          </h2>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-800 dark:text-gray-200 text-base font-bold mb-1">{t('orders2.noOrdersFound')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {filter === 'pending'
                ? t('orders2.noActiveOrders')
                : filter === 'completed'
                ? t('orders2.noCompletedOrders')
                : t('orders2.ordersWillAppearOnce')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order: any) => {
              const meta = getStatusMeta(order.status as OrderStatus, t);
              const date = new Date(order.createdAt);
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 hover:border-brand-teal/30 transition-all duration-200 overflow-hidden group active:scale-[0.99]"
                >
                  <div className="flex">
                    <div className={`w-1.5 shrink-0 rounded-l-2xl ${meta.sideBarClass}`} />
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">
                              #{order.orderNumber || order.id?.slice(0, 8)}
                            </p>
                            <StatusBadge status={order.status} label={meta.label} />
                          </div>

                          <p className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1">
                            {order.pharmacy?.name}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {order.orderItems?.slice(0, 2).map((item: any) => (
                              <span
                                key={item.id}
                                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-brand-navy dark:text-blue-300 px-2.5 py-1 rounded-lg font-medium"
                              >
                                {item.medication?.name} ×{item.quantity}
                              </span>
                            ))}
                            {(order.orderItems?.length ?? 0) > 2 && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-lg font-medium">
                                +{order.orderItems.length - 2} more
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="text-xs text-gray-400">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <p className="text-lg font-extrabold text-brand-navy dark:text-blue-400 leading-none">
                            {order.total?.toLocaleString()}
                            <span className="text-xs font-bold text-gray-400 ml-1">UGX</span>
                          </p>
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-brand-teal flex items-center justify-center transition-colors">
                            <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}
