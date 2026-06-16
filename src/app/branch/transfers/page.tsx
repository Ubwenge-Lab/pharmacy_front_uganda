'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { getErrorMessage } from '@/lib/errorHandler';

type Tab          = 'outgoing' | 'incoming';
type BackendState = 'loading' | 'unavailable' | 'ready';

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-blue-100   text-blue-700',
  REJECTED:  'bg-red-100    text-red-700',
  SHIPPED:   'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100  text-green-700',
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#29ABE2]">
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-[#1E3A5F]">{value}</p>
    </div>
  );
}

export default function BranchTransfersPage() {
  const { t } = useTranslation();
  const [backendState, setBackendState] = useState<BackendState>('loading');
  const [tab, setTab]                   = useState<Tab>('outgoing');
  const [transfers, setTransfers]       = useState<any[]>([]);
  const [showForm, setShowForm]         = useState(false);
  const [branches, setBranches]         = useState<any[]>([]);
  const [medications, setMedications]   = useState<any[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [myBranchId, setMyBranchId]     = useState<string | null>(null);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  const [form, setForm] = useState({
    toBranchId: '',
    notes: '',
    items: [{ medicationId: '', quantity: '' }],
  });

  useEffect(() => {
    api.get('/branches/my-branch-details')
      .then(res => setMyBranchId(res.data?.id || null))
      .catch(() => {});
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setBackendState('loading');
    try {
      const res = await api.get('/stock-transfers/branch');
      setTransfers(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
      setBackendState('ready');
    } catch (err: any) {
      const status = err?.response?.status;
      setBackendState(status === 404 || status === 403 ? 'unavailable' : 'unavailable');
    }
  };

  const fetchFormData = async () => {
    try {
      const [medsRes, branchRes] = await Promise.allSettled([
        api.get('/medications/pharmacy/my-medications'),
        api.get('/branches/pharmacy-branches'),
      ]);
      if (medsRes.status === 'fulfilled')   setMedications(Array.isArray(medsRes.value.data) ? medsRes.value.data : []);
      if (branchRes.status === 'fulfilled') setBranches(branchRes.value.data?.data ?? branchRes.value.data ?? []);
    } catch { /**/ }
  };

  const handleUpdateStatus = async (transferId: string, status: string) => {
    setUpdatingId(transferId);
    try {
      await api.patch(`/stock-transfers/${transferId}/status`, { status });
      toast.success(`Transfer status updated to ${status}`);
      fetchTransfers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/stock-transfers', {
        toBranchId: form.toBranchId,
        notes:      form.notes || undefined,
        items:      form.items.map(i => ({ medicationId: i.medicationId, quantity: parseInt(i.quantity) })),
      });
      toast.success(t('success.transferSubmitted'));
      setShowForm(false);
      setForm({ toBranchId: '', notes: '', items: [{ medicationId: '', quantity: '' }] });
      fetchTransfers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('transfers.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { medicationId: '', quantity: '' }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, value: string) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const outgoing = transfers.filter(t => t.direction === 'outgoing' || t.isOutgoing || (myBranchId && t.fromBranchId === myBranchId));
  const incoming = transfers.filter(t => t.direction === 'incoming' || t.isIncoming || (myBranchId && t.toBranchId === myBranchId));
  const displayed = tab === 'outgoing' ? outgoing : incoming;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-300';

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A5F]">{t('transfers.stockTransfers')}</h1>
          <p className="text-sm font-medium text-[#29ABE2] mt-1">{t('transfers.requestManage')}</p>
          <button
            onClick={() => { setShowForm(true); fetchFormData(); }}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#29ABE2' }}
          >
            <PlusIcon className="w-4 h-4" />
            {t('transfers.requestTransfer')}
          </button>
        </div>
        {/* Decorative arrows */}
        <div className="hidden sm:flex flex-col gap-2 opacity-20">
          <svg width="80" height="28" viewBox="0 0 80 28"><path d="M0 14 L70 14 M56 4 L70 14 L56 24" stroke="#1E3A5F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          <svg width="80" height="28" viewBox="0 0 80 28"><path d="M80 14 L10 14 M24 4 L10 14 L24 24" stroke="#1E3A5F" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </div>
      </div>

      {backendState === 'loading' && <div className="flex justify-center py-16"><LoadingSpinner /></div>}

      {backendState === 'unavailable' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-4">🔄</p>
          <h3 className="font-semibold text-gray-700 mb-1">This feature is not yet available</h3>
          <p className="text-sm text-gray-400">The backend team is implementing the transfer endpoints.</p>
        </div>
      )}

      {backendState === 'ready' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Transfers" value={transfers.length}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>} />
            <StatCard label="Pending" value={transfers.filter(t => t.status === 'PENDING').length}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
            <StatCard label="In Transit" value={transfers.filter(t => t.status === 'SHIPPED').length}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10"/></svg>} />
            <StatCard label="Completed" value={transfers.filter(t => t.status === 'COMPLETED').length}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 w-fit mt-5">
            {(['outgoing', 'incoming'] as Tab[]).map(item => (
              <button key={item} onClick={() => setTab(item)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                  tab === item ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {item} ({item === 'outgoing' ? outgoing.length : incoming.length})
              </button>
            ))}
          </div>

          {/* Request form */}
          {showForm && (
            <form onSubmit={handleSubmitTransfer} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4 mt-5">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{t('transfers.newTransferRequest')}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Destination Branch *</label>
                {branches.length > 0
                  ? <select required value={form.toBranchId} onChange={e => setForm(f => ({ ...f, toBranchId: e.target.value }))} className={inputCls}>
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  : <input required value={form.toBranchId} onChange={e => setForm(f => ({ ...f, toBranchId: e.target.value }))} placeholder="Branch ID" className={inputCls} />
                }
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-600">Items *</label>
                  <button type="button" onClick={addItem} className="text-xs text-[#29ABE2] hover:underline">+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    {medications.length > 0
                      ? <select required value={item.medicationId} onChange={e => updateItem(i, 'medicationId', e.target.value)} className={`${inputCls} flex-1`}>
                          <option value="">Select medication...</option>
                          {medications.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      : <input required value={item.medicationId} onChange={e => updateItem(i, 'medicationId', e.target.value)} placeholder="Medication ID" className={`${inputCls} flex-1`} />
                    }
                    <input type="number" required min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="Qty" className={`${inputCls} w-20`} />
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-1">✕</button>}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: '#29ABE2' }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="mt-5">
            {displayed.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                <div className="flex justify-center mb-4 opacity-20">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M8 24 L38 24 M28 14 L38 24 L28 34" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M40 24 L10 24 M20 14 L10 24 L20 34" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 4)"/></svg>
                </div>
                <p className="font-semibold text-gray-600 mb-1">No transfers found</p>
                <p className="text-sm text-gray-400">Use the button above to request stock from another branch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">
                            {tab === 'outgoing'
                              ? `To: ${item.toBranch?.name ?? item.toBranchId}`
                              : `From: ${item.fromBranch?.name ?? item.fromBranchId}`}
                          </p>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Requested: {formatDate(item.createdAt)}</p>
                        {item.notes && <p className="text-xs text-gray-400 italic">{item.notes}</p>}
                        {item.items?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {item.items.map((med: any, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                {med.medication?.name ?? med.medicationId} x{med.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-center">
                        {/* If current branch is B (toBranchId, receiver of the request, sender of the stock) */}
                        {item.toBranchId === myBranchId && item.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                              disabled={updatingId === item.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                              disabled={updatingId === item.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* If current branch is B (toBranchId, sender of the stock) and status is APPROVED */}
                        {item.toBranchId === myBranchId && item.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'SHIPPED')}
                            disabled={updatingId === item.id}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                          >
                            Ship Transfer
                          </button>
                        )}

                        {/* If current branch is A (fromBranchId, initiator, receiver of the stock) and status is SHIPPED */}
                        {item.fromBranchId === myBranchId && item.status === 'SHIPPED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                            disabled={updatingId === item.id}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                          >
                            Complete / Receive
                          </button>
                        )}

                        {/* If current branch is A (fromBranchId, initiator) and status is PENDING */}
                        {item.fromBranchId === myBranchId && item.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                            disabled={updatingId === item.id}
                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg disabled:opacity-50 transition"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
