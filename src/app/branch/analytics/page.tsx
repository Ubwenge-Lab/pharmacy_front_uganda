'use client';

import { formatCurrency } from '@/lib/currency';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n ?? 0);
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

// ── Speedometer gauge ──────────────────────────────────────────────────────
function Gauge({ value, max = 100 }: { value: number; max?: number }) {
  const pct   = Math.min(value / max, 1);
  const angle = -135 + pct * 270; // sweep 270°
  const r     = 70;
  const cx    = 100;
  const cy    = 100;
  const toXY  = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });
  const arcPath = (from: number, to: number, radius: number) => {
    const s = toXY(from);
    const e = toXY(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const needleTip = toXY(angle - 90);

  return (
    <svg viewBox="0 0 200 160" className="w-full max-w-[220px] mx-auto">
      {/* Track */}
      <path d={arcPath(-135, 135, r)} fill="none" stroke="#E5E7EB" strokeWidth="14" strokeLinecap="round" />
      {/* Fill */}
      <path d={arcPath(-135, -135 + pct * 270, r)} fill="none" stroke="#29ABE2" strokeWidth="14" strokeLinecap="round" />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke="#1E4D8C" strokeWidth="3" strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5" fill="#1E4D8C" />
      {/* Labels */}
      <text x="30"  y="148" textAnchor="middle" fontSize="10" fill="#9CA3AF">0</text>
      <text x="170" y="148" textAnchor="middle" fontSize="10" fill="#9CA3AF">{max}</text>
      {/* Value */}
      <text x={cx} y={cy + 30} textAnchor="middle" fontSize="22" fontWeight="bold" fill="#1E3A5F">{value}</text>
    </svg>
  );
}

// ── Funnel chart ───────────────────────────────────────────────────────────
function FunnelChart({ stages }: { stages: { label: string; pct: number }[] }) {
  return (
    <div className="space-y-1.5">
      {stages.map(({ label, pct }, i) => {
        const w = 100 - i * 12;
        const blues = ['#1E4D8C', '#2563AB', '#3B82C4', '#60A5DA', '#93C5ED'];
        return (
          <div key={label} className="flex items-center justify-center flex-col">
            <div
              className="flex items-center justify-between px-4 py-1.5 rounded-sm text-white text-xs font-medium transition-all"
              style={{ width: `${w}%`, backgroundColor: blues[i] }}
            >
              <span>{label}</span>
              <span>{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BranchAnalyticsPage() {
  const { t } = useTranslation();

  const fetchAnalyticsData = useCallback(
    async (signal: AbortSignal) => {
      const [ordersRes, attRes] = await Promise.all([
        api.get('/orders/pharmacy-orders', { signal }),
        api.get('/attendance/summary',     { signal }),
      ]);
      return {
        orders: Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data ?? [],
        attendanceSummary: attRes.data,
      };
    },
    []
  );

  const { data, loading, error } = useFetch<{ orders: any[]; attendanceSummary: any }>(fetchAnalyticsData, []);
  useEffect(() => { if (error) toast.error(t('errors.failedToLoadAnalytics')); }, [error, t]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const orders           = data?.orders ?? [];
  const completedOrders  = orders.filter(o => o.status === 'COMPLETED');
  const totalRevenue     = completedOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const avgOrderValue    = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  const statCards = [
    { icon: ShoppingCartIcon,    label: t('analytics.totalOrders'),     value: orders.length,              sub: t('analytics.thisMonth') },
    { icon: CheckCircleIcon,     label: t('analytics.completedOrders'), value: completedOrders.length,     sub: t('analytics.lastMonth') },
    { icon: CurrencyDollarIcon,  label: t('analytics.totalRevenue'),    value: `${fmt(totalRevenue)} UGX`,  sub: `${t('analytics.vsLastMonth')}` },
    { icon: ArrowTrendingUpIcon, label: t('analytics.avgOrderValue2'),  value: `${fmt(avgOrderValue)}k`,   sub: '+1%' },
  ];

  // Revenue trend (monthly buckets — last 7 months)
  const months = ['Jan','Feb','March','April','May','June','July'];
  const revenueTrend = months.map(m => ({
    month: m,
    revenue: completedOrders
      .filter(o => o.createdAt && new Date(o.createdAt).toLocaleString('en-US', { month: 'short' }) === m.substring(0,3))
      .reduce((s, o) => s + (o.total ?? 0), 0),
  }));

  // Orders by status
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusData = [
    { name: 'Pending',     count: statusCounts['PENDING']   ?? 0 },
    { name: 'In progress', count: statusCounts['PREPARING'] ?? 0 },
    { name: 'Completed',   count: statusCounts['COMPLETED'] ?? 0 },
  ];

  // Completion rate gauge (% completed of all orders)
  const completionRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 70;

  // Funnel stages
  const total = orders.length || 1;
  const funnelStages = [
    { label: 'Created',   pct: 90 },
    { label: 'Confirmed', pct: 80 },
    { label: 'Processed', pct: 70 },
    { label: 'Delivered', pct: Math.round((completedOrders.length / total) * 100) || 60 },
    { label: 'Closed',    pct: Math.max(Math.round((completedOrders.length / total) * 90), 30) },
  ];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF]">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{t('analytics.branchAnalytics')}</h1>
        <p className="text-sm text-[#29ABE2] mt-1 font-medium">{t('analytics.branchPerformance')}</p>
        <button className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-600 border border-gray-200 shadow-sm">
          <span>📅</span> {t('analytics.thisMonth')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                  <Icon className="w-4 h-4 text-[#29ABE2]" />
                </div>
                <p className="text-xs text-gray-400 leading-tight">{s.label}</p>
              </div>
              <p className="text-2xl font-bold text-[#1E3A5F]">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-[#29ABE2] mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#29ABE2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#29ABE2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} width={40} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#29ABE2" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders By Status */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-[#29ABE2] mb-4">Orders By Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                {statusData.map((_, i) => (
                  <rect key={i} fill={i === 1 ? '#1E4D8C' : '#93C5ED'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gauge */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-gray-700 mb-2 self-start">Order Completion Rate</h3>
          <Gauge value={completionRate} max={100} />
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-[#29ABE2] mb-4">Order Completion Percentage</h3>
          <FunnelChart stages={funnelStages} />
        </div>
      </div>
    </div>
  );
}
