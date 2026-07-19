'use client';

import { useAuth } from '@/context/AuthContext';
import { ShieldCheckIcon, ServerStackIcon, CodeBracketSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SystemStats {
  systemUptime: number;
  activeErrors: number;
  auditLogsToday: number;
}

export default function SystemAdminDashboard() {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/system-admin/stats');
        setSystemStats(data);
      } catch (error) {
        toast.error('Failed to load system stats');
      }
    };
    fetchStats();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const stats = [
    { name: 'System Uptime', value: systemStats ? formatUptime(systemStats.systemUptime) : '...', icon: ServerStackIcon, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Active Errors (Sentry)', value: systemStats?.activeErrors ?? '...', icon: CodeBracketSquareIcon, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Audit Logs Today', value: systemStats?.auditLogsToday ?? '...', icon: ShieldCheckIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Engineer Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.profile?.firstName || 'Engineer'}. All systems operational.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-col gap-3">
           <Link href="/system-admin/audit-logs" className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-gray-900">View Audit Logs</h3>
               <p className="text-sm text-gray-500">Monitor system access and critical changes</p>
             </div>
             <span className="text-blue-600">&rarr;</span>
           </Link>
        </div>
      </div>
    </div>
  );
}
