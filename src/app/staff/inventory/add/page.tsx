'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useMedicationForm } from '@/hooks/useMedicationForm';
import { FDA_CATEGORIES } from '@/lib/constants';

export default function StaffAddMedicationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  // Cashiers cannot add medications — redirect immediately
  useEffect(() => {
    if (user?.role === 'CASHIER') router.replace('/staff/inventory');
  }, [user, router]);
  const {
    form, setForm,
    loading,
    contextLoading: profileLoading,
    branchName,
    handleSubmit,
  } = useMedicationForm('staff');

  if (user?.role === 'CASHIER') return null;

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 transition-colors';
  const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => router.push('/staff/inventory')}
        className="flex items-center gap-2 text-sm font-medium hover:underline text-brand-navy">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Inventory
      </button>

      <div className="rounded-2xl p-6 text-white bg-brand-navy">
        <h1 className="text-2xl font-bold">{t('staff.addMedication')}</h1>
        <p className="mt-1 text-white/70">{t('inventory.addMedicationBranchSubtitle')}</p>
      </div>

      {profileLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
          <div>
            <label className={labelCls}>{t('form.branch')}</label>
            <input type="text" readOnly value={branchName || 'Your branch'}
              className={`${inputCls} bg-gray-50 text-gray-500`} />
            <p className="text-xs text-gray-400 mt-1">{t('inventory.medicationAddedToAssignedBranch')}</p>
          </div>

          <div>
            <label className={labelCls}>Medication Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Amoxicillin 500mg" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>{t('inventory.chemicalName')}</label>
            <input type="text" value={form.chemicalName}
              onChange={e => setForm(f => ({ ...f, chemicalName: e.target.value }))}
              placeholder="e.g. Amoxicillin trihydrate" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select required value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className={inputCls}>
              {FDA_CATEGORIES.map(c => <option key={c} value={c}>{t('medicationCategories.' + c) || c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price (UGX) <span className="text-red-500">*</span></label>
              <input type="number" required min="0" step="any" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="e.g. 1500" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quantity (units) <span className="text-red-500">*</span></label>
              <input type="number" required min="0" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 100" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('inventory.lowStockThresholdUnits')}</label>
            <input type="number" min="1" value={form.lowStockThreshold}
              onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
              className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">{t('inventory.alertRaisedBelow')}</p>
          </div>

          <div>
            <label className={labelCls}>{t('inventory.description')}</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t('inventory.searchBranchPlaceholder')}
              className={`${inputCls} resize-none`} />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="rx" checked={form.requiresPrescription}
              onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <label htmlFor="rx" className="text-sm font-medium text-gray-700">{t('inventory.requiresPrescription')}</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.push('/staff/inventory')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 bg-brand-teal">
              {loading ? t('branch.adding') : t('staff.addMedication')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
