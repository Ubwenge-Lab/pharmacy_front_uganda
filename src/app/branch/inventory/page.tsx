'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { FDA_CATEGORIES } from '@/lib/constants';

interface Medication {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  requiresPrescription: boolean;
  status?: string;
}

export default function BranchInventoryPage() {
  const { t }  = useTranslation();
  const router = useRouter();
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'high'>('all');

  const fetchMedications = useCallback(async (signal: AbortSignal) => {
    const res = await api.get('/medications/pharmacy/my-medications', { signal });
    return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
  }, []);

  const { data, loading, error } = useFetch<Medication[]>(fetchMedications, []);
  useEffect(() => { if (error) toast.error(t('errors.failedToLoadInventory')); }, [error, t]);

  const meds = data ?? [];

  const filtered = meds.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === 'All Categories' || m.category === catFilter;
    const isLow  = m.quantity <= m.lowStockThreshold;
    const isHigh = m.quantity > m.lowStockThreshold;
    const matchStock  = stockFilter === 'all' || (stockFilter === 'low' && isLow) || (stockFilter === 'high' && isHigh);
    return matchSearch && matchCat && matchStock;
  });

  const lowStockCount  = meds.filter(m => m.quantity <= m.lowStockThreshold).length;
  const outOfStock     = meds.filter(m => m.quantity === 0).length;
  const categories     = [...new Set(meds.map(m => m.category))];

  const statCards = [
    { label: 'Total Items',   value: meds.length },
    { label: 'Categories',    value: categories.length },
    { label: 'Low Stock',     value: lowStockCount, red: true },
    { label: 'Out of Stock',  value: outOfStock,    red: true },
  ];

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="rounded-2xl p-6 bg-[#EBF4FF]">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">{t('branch.inventory')}</h1>
        <p className="text-sm font-medium text-[#29ABE2] mt-1">{t('inventory.viewAndManage')}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
            <p className={`text-3xl font-bold ${s.red && s.value > 0 ? 'text-red-500' : 'text-[#1E3A5F]'}`}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search by name */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('inventory.searchByNameOrCategory')}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-300 w-56"
          />
        </div>

        {/* Category dropdown */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-300 appearance-none bg-white"
          >
            <option>All Categories</option>
            {FDA_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Stock filter pills */}
        {(['all', 'low', 'high'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStockFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              stockFilter === f
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={stockFilter === f ? { backgroundColor: '#29ABE2' } : {}}
          >
            {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'High On Stock'}
          </button>
        ))}

        {/* Add button */}
        <button
          onClick={() => router.push('/branch/inventory/add')}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#29ABE2' }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('inventory.addMedication')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {t('inventory.noMedicationsFound')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Medication', 'Category', 'Price', 'Quantity', 'Threshold', 'Prescription', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const isLow = m.quantity > 0 && m.quantity <= m.lowStockThreshold;
                  const isOut = m.quantity === 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{m.name}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{m.price.toLocaleString()} ugx</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{m.quantity} units</td>
                      <td className="px-5 py-3.5 text-gray-500">{m.lowStockThreshold} units</td>
                      <td className="px-5 py-3.5 text-gray-500">{m.requiresPrescription ? 'YES' : 'NO'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isOut ? 'bg-red-100 text-red-700'
                          : isLow ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                          {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stocks'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => router.push(`/branch/inventory/${m.id}`)}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#29ABE2' }}
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 px-5 py-3 border-t border-gray-50">
              Showing {filtered.length} of {meds.length} medications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
