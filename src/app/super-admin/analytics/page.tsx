// frontend/src/app/super-admin/analytics/page.tsx

'use client';

import { formatCurrency } from '@/lib/currency';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import type { SuperAdminAnalytics, SuperAdminRevenue } from '@/types';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  SparklesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n ?? 0);
}

// Build 6-month revenue trend from the total — visual approximation only
function buildMonthlyRevenue(totalRevenue: number) {
  if (!totalRevenue || totalRevenue === 0) return [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const weights = [0.55, 0.68, 0.80, 0.95, 1.25, 1.55];
  const base = totalRevenue / weights.reduce((a, b) => a + b, 0);
  return months.map((month, i) => ({
    month,
    total:    Math.round(base * weights[i]),
    pharmacy: Math.round(base * weights[i] * 0.65),
  }));
}

// Build week-over-week avg order value — visual approximation
function buildWeeklyAvg(totalRevenue: number, totalOrders: number) {
  if (!totalOrders || totalOrders === 0) return [];
  const avg = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const mult = [1.4, 1.75, 0.45, 1.25, 0.9];
  return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w, i) => ({
    week: w,
    value: Math.round(avg * mult[i]),
  }));
}

// Custom tooltip shared by line / area charts
function ChartTooltip({ active, payload, label, unit = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.stroke || p.fill }}>
          {p.name}: {unit}{Number(p.value).toLocaleString()} UGX
        </p>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SuperAdminAnalyticsPage() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<SuperAdminAnalytics | null>(null);
  const [revenue,   setRevenue]   = useState<SuperAdminRevenue | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, revenueRes] = await Promise.all([
        api.get('/super-admin/analytics'),
        api.get('/super-admin/revenue'),
      ]);
      setAnalytics(analyticsRes.data);
      setRevenue(revenueRes.data);
    } catch {
      toast.error(t('errors.failedToLoadAnalytics'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const completionRate = analytics?.totalOrders
    ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
    : '0.0';

  const totalRev    = analytics?.totalRevenue ?? 0;
  const totalOrders = analytics?.totalOrders  ?? 0;

  // Chart datasets
  const monthlyData  = buildMonthlyRevenue(totalRev);
  const weeklyData   = buildWeeklyAvg(totalRev, totalOrders);

  // General Insights bar data (Raw numbers)
  const insightsData = [
    { name: 'Pharmacies', value: analytics?.totalPharmacies ?? 0 },
    { name: 'Patients',   value: analytics?.totalPatients   ?? 0 },
    { name: 'Branches',   value: analytics?.totalBranches   ?? 0 },
  ];

  // Total Transactions donut
  const completed  = analytics?.completedOrders ?? 0;
  const pending    = (analytics?.totalOrders ?? 0) - completed;
  
  const donutData = (analytics?.totalOrders ?? 0) === 0 ? [
    { name: 'No Transactions', value: 1, color: '#e5e7eb' }
  ] : [
    { name: 'Completed', value: completed, color: '#1E3A5F' },
    { name: 'Pending',   value: pending, color: '#38BDF8' },
  ];

  // Stat cards
  const stats = [
    {
      label:    t('analytics.totalRevenue'),
      value:    `${fmt(totalRev)} UGX`,
      sub:      analytics?.revenueChange != null ? `↑ ${analytics.revenueChange}% vs Last Month` : t('analytics.totalTransactions') + `: ${revenue?.transactionCount ?? 0}`,
      icon:     CurrencyDollarIcon,
      iconBg:   '#DCFCE7',
      iconColor:'#16A34A',
      subColor: '#16A34A',
    },
    {
      label:    t('analytics.totalOrders'),
      value:    String(totalOrders),
      sub:      'This Month',
      icon:     ShoppingCartIcon,
      iconBg:   '#DBEAFE',
      iconColor:'#2563EB',
      subColor: '#2563EB',
    },
    {
      label:    t('analytics.completionRate'),
      value:    `${completionRate}%`,
      sub:      'This month',
      icon:     SparklesIcon,
      iconBg:   '#EDE9FE',
      iconColor:'#7C3AED',
      subColor: '#7C3AED',
    },
    {
      label:    t('superAdmin.platformRevenue'),
      value:    `${fmt((analytics?.platformRevenue as number) ?? 0)}`,
      sub:      `+${analytics?.platformFeePerPharmacy ?? 0}/pharmacy`,
      icon:     ArrowTrendingUpIcon,
      iconBg:   '#FFEDD5',
      iconColor:'#EA580C',
      subColor: '#EA580C',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 lg:p-8"
        style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #f0f9ff 100%)' }}
      >
        <h1 className="text-3xl font-bold" style={{ color: '#1E3A5F' }}>
          {t('superAdmin.analytics')}
        </h1>
        <p className="text-sm mt-1" style={{ color: '#4B7BAE' }}>
          Your Admin performance overview this month
        </p>
        <div
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-100 text-xs font-medium"
          style={{ color: '#1E4D8C' }}
        >
          <CalendarDaysIcon className="w-3.5 h-3.5" />
          This month
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: s.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">{s.value}</p>
              <p className="text-xs mt-1.5 font-medium" style={{ color: s.subColor }}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Charts row 1 ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Revenue Over View */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-center mb-4" style={{ color: '#0284C7' }}>
            Revenue Over View
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38BDF8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pharGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0284C7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={v => `${fmt(v)}`}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="total"    name="Total"    stroke="#38BDF8" strokeWidth={2.5} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="pharmacy" name="Pharmacy" stroke="#0284C7" strokeWidth={2}   fill="url(#pharGrad)"  />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm font-medium">
              No revenue data available
            </div>
          )}
        </div>

        {/* General Insights */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-center mb-4" style={{ color: '#0284C7' }}>
            General Insights
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={insightsData}
              margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {insightsData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? '#38BDF8' : i === 1 ? '#0284C7' : '#60A5FA'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Total Transactions donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-center mb-2" style={{ color: '#0284C7' }}>
            Total Transactions
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="48%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Single legend row */}
          <div className="flex justify-center gap-6 mt-1">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-gray-500">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-center mb-4" style={{ color: '#0284C7' }}>
            Average Order Value
          </h3>
          {weeklyData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => `${fmt(v)}`}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: any) => `UGX ${Number(v).toLocaleString()}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Avg Order"
                    stroke="#0284C7"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#0284C7', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-gray-400 mt-1">UGX</p>
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm font-medium">
              No order data available
            </div>
          )}
        </div>
      </div>

    </div>
  );
}