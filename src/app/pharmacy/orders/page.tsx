'use client';
// src/app/(pharmacy)/orders/page.tsx
import { formatCurrency } from '@/lib/currency';
import { useFetch } from '@/hooks/useFetch';
import { useState, useEffect, useCallback} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, FunnelIcon, EyeIcon } from '@heroicons/react/24/outline';
import StatusBadge from '@/components/shared/StatusBadge';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

type TabKey = 'All Orders' | 'PENDING' | 'ACCEPTED' | 'READY_FOR_CHECKOUT' | 'COMPLETED' | 'REJECTED';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:            { bg: '#FEF3C7', text: '#92400E' },
  ACCEPTED:           { bg: '#E0E7FF', text: '#3730A3' },
  READY_FOR_CHECKOUT: { bg: '#DBEAFE', text: '#1E40AF' },
  COMPLETED:          { bg: '#D1FAE5', text: '#065F46' },
  REJECTED:           { bg: '#FEE2E2', text: '#991B1B' },
  'All Orders':       { bg: 'linear-gradient(to right, #0284C7, #38BDF8)', text: '#FFFFFF' },
};

export default function PharmacyOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filtered, setFiltered] = useState<any[]>([]);
  const [tab, setTab]           = useState<TabKey>('All Orders');
  const [search, setSearch]     = useState('');
  const [branch, setBranch]     = useState('');

  const fetchOrdersData = useCallback(
  async (signal: AbortSignal) => {
    const [ordRes, brRes] = await Promise.all([
      api.get('/orders/pharmacy-orders', { signal }),
      api.get('/branches/my-branches', { signal }),
    ]);

    return {
      orders: ordRes.data?.data ?? ordRes.data ?? [],
      branches: brRes.data?.data ?? brRes.data ?? [],
    };
  },
  []
  );

  const { data, loading, error } = useFetch<{
  orders: any[];
  branches: any[];
  }>(fetchOrdersData,[]);

const orders = data?.orders ?? [];
const branches = data?.branches ?? [];

  useEffect(() => {
     if (error) {
        toast.error(t('errors.failedToLoadOrders'));
      };
    }, [error, t]);

  useEffect(() => {
    let res = tab === 'All Orders' ? orders : orders.filter(o => o.status === tab);
    
    if (branch) res = res.filter(o => o.branchId === branch);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(o =>
      o.id?.toLowerCase().includes(q) ||
        o.patientName?.toLowerCase().includes(q)
      );
    }
    setFiltered(res);
  }, [orders, tab, branch, search]);

    const countFor = (s: TabKey) => {
      if (s === 'All Orders') return orders.length;
      return orders.filter(o => o.status === s).length;
    };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'All Orders',         label: t('pharmacyOwner.allOrders') },
    { key: 'PENDING',            label: t('pharmacyOwner.pending') },
    { key: 'ACCEPTED',           label: t('pharmacyOwner.accepted') },
    { key: 'READY_FOR_CHECKOUT', label: t('pharmacyOwner.readyForCheckout') },
    { key: 'COMPLETED',          label: t('pharmacyOwner.completedTab') },
    { key: 'REJECTED',           label: t('pharmacyOwner.rejected') },
  ];

  return (
    <div className="space-y-6">
    {/* Hero */}
      <div className="rounded-2xl p-8 text-white" style={{ backgroundColor: '#E0F2FE' }}>
      <h1 className="text-3xl font-bold" style={{ color: '#1E3A8A' }}>
        {t('pharmacyOwner.orderOverviewTitle')}
      </h1>
      <p className="mt-1 text-white/70" style={{ color: '#38BDF8' }}>
        {t('pharmacyOwner.orderOverviewSubtitle')}
      </p>
    </div>

    {/* Filters */}
      <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
        <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pharmacyOwner.searchOrders')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
      </div>
      <div className="flex items-center gap-2">
        <FunnelIcon className="w-4 h-4 text-gray-400" />
        <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
          <option value="">{t('pharmacyOwner.allBranches')}</option>
          {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
          ))}
          </select>
      </div>
    </div>

    {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label }) => {
          const c = countFor(key);
          const active = tab === key;
          const config = STATUS_COLORS[key] ?? { bg: '#F3F4F6', text: '#374151' };
          
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                active
                  ? { background: 'linear-gradient(90deg, #0284C7, #38BDF8)', color: 'white', boxShadow: '0 4px 12px rgba(30,77,140,0.15)' }
                  : { backgroundColor: '#F3F4F6', color: '#4B5563' }
              }
            >
              <span>{label}</span>
              {/* Count badge pill matching the context configuration colors */}
              <span 
                className="px-2 py-0.5 text-xs font-bold rounded-md min-w-[24px] text-center transition-all"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.2)' : config.bg,
                  color: active ? '#FFFFFF' : config.text
                }}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>

    {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {[
                t('pharmacyOwner.orderId'),
                t('pharmacyOwner.customer'),
                t('common.total'),
                t('common.status'),
                t('pharmacyOwner.staff'),
                t('common.date'),
                t('common.actions'),
              ].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
                </th>
            ))}
            </tr>
        </thead>
        <tbody>
          {loading ? (
              <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400">
                {t('common.loading')}
                </td>
            </tr>
          ) : filtered.length === 0 ? (
              <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400">
                {t('common.noData')}
                </td>
            </tr>
          ) : (
              filtered.map((order: any) => {
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4 text-sm font-medium text-gray-800">
                    #{order.id?.slice(0, 8)}
                    </td>
                  <td className="px-5 py-4 text-sm text-gray-700">
                    {order.patientName ?? '—'}
                    </td>
                  <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#0284C7' }}>
                    {formatCurrency(order.total)}
                    </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {order.staffName ?? '—'}
                    </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : '—'}
                    </td>
                  <td className="px-5 py-4">
                    <button
                        onClick={() => router.push(`/pharmacy/orders/${order.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0284C7] rounded-lg text-sm text-[#0284C7] hover:bg-gray-50"
                      >
                      <EyeIcon className="w-[14px] h-[14px]" />
                      {t('common.view')}
                      </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
      </table>
    </div>
  </div>
);
}