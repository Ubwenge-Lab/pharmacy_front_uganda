'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface AuditEntry {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  actorEmail?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  action?: string | null;
  outcome?: string | null;
  ip?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/audit/logs', {
        params: { limit, offset: 0, ...(outcomeFilter ? { outcome: outcomeFilter } : {}) },
      });
      setLogs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load audit logs. Check that you are SYSTEM_ADMIN.');
      console.error('Failed to fetch audit logs', e);
    } finally {
      setLoading(false);
    }
  }, [outcomeFilter, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Active/live mode: re-poll every 15s while the tab is visible, so new
  // errors (500s, failed logins) surface without a manual refresh.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchLogs();
    }, 15000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const actionColor = (action?: string | null) => {
    if (!action) return 'bg-gray-100 text-gray-600';
    if (action.includes('FAILURE') || action === 'HTTP_500') return 'bg-red-50 text-red-700';
    if (action.includes('SUCCESS') || action === 'POS_SALE') return 'bg-teal-50 text-teal-700';
    if (action.includes('LOGIN')) return 'bg-blue-50 text-blue-700';
    return 'bg-indigo-50 text-indigo-700';
  };

  const prettyMetadata = (m?: Record<string, unknown> | null) => {
    if (!m) return '-';
    try {
      return JSON.stringify(m);
    } catch {
      return String(m);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all critical actions across the platform ({total} records).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 mr-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          >
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-brand-teal hover:bg-brand-teal/90 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No audit logs found{outcomeFilter ? ` for outcome "${outcomeFilter}"` : ''}. Logins, POS sales and 500 errors are recorded here.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium w-fit ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                        {log.outcome && (
                          <span className={`text-[10px] font-semibold ${log.outcome === 'SUCCESS' ? 'text-teal-600' : 'text-red-600'}`}>
                            {log.outcome}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {log.targetType} <span className="text-gray-400 dark:text-gray-500 text-xs">({(log.targetId ?? '-').slice(0, 12)})</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span>{log.actorEmail ?? log.actorId ?? '-'}</span>
                        {log.actorRole && <span className="text-xs text-gray-400">{log.actorRole}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      <p className="truncate font-mono text-xs" title={prettyMetadata(log.metadata)}>
                        {prettyMetadata(log.metadata)}
                      </p>
                      {log.correlationId && (
                        <p className="text-[10px] text-gray-400 mt-0.5">corr: {log.correlationId.slice(0, 12)}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
