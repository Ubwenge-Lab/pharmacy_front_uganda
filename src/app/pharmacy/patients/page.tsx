// frontend/src/app/pharmacy/patients/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useFetch } from '@/hooks/useFetch';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  AdjustmentsHorizontalIcon,
  Bars3BottomRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { isPatientEnabled } from '@/lib/features';
import StatusBadge from '@/components/shared/StatusBadge';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  gender: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
  registeredDate: string;
  preferredBranch: string;
  memberStatus: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    itemCount: number;
    itemsSummary: string;
  }>;
  prescriptions: Array<{
    id: string;
    rxNumber: string;
    uploadedDate: string;
    type: string;
  }>;
}

export default function PharmacyPatientsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'prescriptions'>('orders');
  
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'spent-high' | 'spent-low' | 'orders-high'>('recent');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [viewingPrescription, setViewingPrescription] = useState<any | null>(null);

  // Order History Tab state
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [orderSortOrder, setOrderSortOrder] = useState<'recent' | 'oldest' | 'highest' | 'lowest'>('recent');
  const [showOrderFilterMenu, setShowOrderFilterMenu] = useState(false);
  const [showOrderSortMenu, setShowOrderSortMenu] = useState(false);

  const getFilteredSortedOrders = () => {
    if (!selectedPatient) return [];
    
    const filtered = selectedPatient.orders.filter(order => {
      const searchLower = orderSearchTerm.toLowerCase();
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchLower) || 
                            order.itemsSummary.toLowerCase().includes(searchLower);
      const matchesStatus = orderFilterStatus === 'all' ? true : order.status === orderFilterStatus;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      switch (orderSortOrder) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest': return b.total - a.total;
        case 'lowest': return a.total - b.total;
        case 'recent':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };


  const fetchPatientsData = useCallback(
    async (signal: AbortSignal) => {
      const res = await api.get('/pharmacies/dashboard/patients', { signal });
     
      const raw = res.data?.data ?? res.data;
      const totalPatients = raw.totalPatients ?? 0;
      const normalizedPatients = (raw.patients ?? []).map((p: any) => ({
        ...p,
        email: p.email ?? '',
        phone: p.phone ?? '',
        gender: p.gender ?? '—',
        dateOfBirth: p.dateOfBirth ?? '—',
        address: p.address ?? '—',
        city: p.city ?? '—',
        postalCode: p.postalCode ?? '—',
        registeredDate: p.registeredDate ?? p.lastOrderDate ?? '—',
        preferredBranch: p.preferredBranch ?? '—',
        memberStatus: p.memberStatus ?? 'ACTIVE',
        prescriptions: p.prescriptions ?? [], // Workaround: Backend provides no prescriptions yet
        orders: (p.orders ?? []).map((o: any) => ({
          ...o,
          // Workaround to fallback 
          orderNumber: o.orderNumber ?? o.id?.slice(0, 8) ?? '',
          itemsSummary: o.itemsSummary ?? `${o.itemCount ?? 0} item(s)`,
        })),
      }));
     
      return {
        patients: res.data.patients,
        totalPatients,
      };
    },
    []
  );

  const { data, loading, error } = useFetch<{
    patients: Patient[];
    totalPatients: number;
  }>(fetchPatientsData, []);

  const patients = data?.patients ?? [];
  const totalPatients = data?.totalPatients ?? 0;

  useEffect(() => {
    if (error) toast.error(t('errors.failedToLoadPatients'));
  }, [error, t]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);
      
    const matchesStatus = filterStatus === 'all' ? true : patient.memberStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.registeredDate).getTime() - new Date(b.registeredDate).getTime();
      case 'spent-high':
        return b.totalSpent - a.totalSpent;
      case 'spent-low':
        return a.totalSpent - b.totalSpent;
      case 'orders-high':
        return b.totalOrders - a.totalOrders;
      case 'recent':
      default:
        return new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime();
    }
  });

  const getSortLabel = () => {
    switch (sortOrder) {
      case 'recent': return 'Sort: Recent';
      case 'oldest': return 'Sort: Oldest';
      case 'spent-high': return 'Sort: Highest Spent';
      case 'spent-low': return 'Sort: Lowest Spent';
      case 'orders-high': return 'Sort: Most Orders';
      default: return 'Sort: Recent';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loading && patients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p>{t('common.noData')}</p>
      </div>
    );
  }

  if (!isPatientEnabled()) {
    return (
      <div className="space-y-6">
        <div className="bg-linear-to-r from-brand-navy via-[#2563a8] to-brand-navy-dark rounded-2xl shadow-lg p-6 lg:p-8 text-white">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{t('patients.patientsAndCustomers')}</h1>
          <p className="text-blue-100 text-sm lg:text-base">{t('patients.orderIntegration')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-12 lg:p-20 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <LockClosedIcon className="w-10 h-10 text-brand-navy" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('patients.featureArrivingSoon')}</h2>
          <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
            {t('patients.featureArrivingSoonDesc')}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-xs font-semibold text-gray-500 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            {t('patients.awaitingRFDAApproval')}
          </div>
        </div>
      </div>
    );
  }

  // --- PATIENT DETAIL VIEW ---
  if (selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center text-sm mb-6">
          <button onClick={() => setSelectedPatient(null)} className="text-blue-600 font-semibold hover:underline">
            {t('patientPageUI.patientList') || 'Patient List'}
          </button>
          <ChevronRightIcon className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-500">{selectedPatient.firstName} {selectedPatient.lastName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div 
              className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-black shadow-lg mb-6 shadow-blue-900/20"
              style={{ background: 'linear-gradient(135deg, #1A365D 0%, #3B82F6 100%)' }}
            >
              {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
            <p className="text-gray-500 text-sm mb-8">{selectedPatient.email}</p>
            
            <div className="flex justify-center gap-12 border-t border-gray-100 pt-6">
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{selectedPatient.totalOrders}</p>
                <p className="text-sm text-gray-500">{t('patientPageUI.orders') || 'Orders'}</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{selectedPatient.memberStatus === 'VIP' ? 'VIP' : '-'}</p>
                <p className="text-sm text-gray-500">{t('patientPageUI.status') || 'Status'}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6">
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.gender') || 'Gender'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.gender}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.birthday') || 'Birthday'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.phoneNumber') || 'Phone Number'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.streetAddress') || 'Street Address'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.city') || 'City'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.city}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.postalCode') || 'Postal Code'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.postalCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.memberStatus') || 'Member Status'}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${selectedPatient.memberStatus === 'VIP' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                  <p className="text-gray-900 font-bold">{selectedPatient.memberStatus === 'VIP' ? 'VIP Member' : t('patientPageUI.activeMember') || 'Active Member'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.registeredDate') || 'Registered Date'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.registeredDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">{t('patientPageUI.preferredBranch') || 'Preferred Branch'}</p>
                <p className="text-gray-900 font-bold">{selectedPatient.preferredBranch}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-8 pt-6 pb-2 gap-4">
            <div className="flex gap-8">
              <button 
                className={`pb-4 text-sm transition-colors relative ${activeTab === 'orders' ? 'text-blue-600 font-black' : 'text-gray-500 font-semibold hover:text-gray-700'}`}
                onClick={() => setActiveTab('orders')}
              >
                {t('patientPageUI.orderHistory') || 'Order History'}
                {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
              <button 
                className={`pb-4 text-sm transition-colors relative ${activeTab === 'prescriptions' ? 'text-blue-600 font-black' : 'text-gray-500 font-semibold hover:text-gray-700'}`}
                onClick={() => setActiveTab('prescriptions')}
              >
                {t('patientPageUI.prescriptionsTab') || 'Prescriptions'}
                {activeTab === 'prescriptions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
              </button>
            </div>

            {activeTab === 'orders' && (
              <div className="flex items-center gap-3 w-full sm:w-auto pb-2 sm:pb-0">
                <div className="relative hidden md:block">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full sm:w-64"
                  />
                </div>
                
                {/* Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowOrderFilterMenu(!showOrderFilterMenu);
                      setShowOrderSortMenu(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    Filter
                    {orderFilterStatus !== 'all' && <span className="ml-1 w-2 h-2 rounded-full bg-blue-600"></span>}
                  </button>
                  {showOrderFilterMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-2">
                        <button onClick={() => { setOrderFilterStatus('all'); setShowOrderFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderFilterStatus === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>All</button>
                        <button onClick={() => { setOrderFilterStatus('PENDING'); setShowOrderFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderFilterStatus === 'PENDING' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Pending</button>
                        <button onClick={() => { setOrderFilterStatus('ACCEPTED'); setShowOrderFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderFilterStatus === 'ACCEPTED' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Accepted</button>
                        <button onClick={() => { setOrderFilterStatus('COMPLETED'); setShowOrderFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderFilterStatus === 'COMPLETED' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Completed</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowOrderSortMenu(!showOrderSortMenu);
                      setShowOrderFilterMenu(false);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Bars3BottomRightIcon className="w-4 h-4" />
                    Sort: {orderSortOrder === 'recent' ? 'Recent' : orderSortOrder === 'oldest' ? 'Oldest' : orderSortOrder === 'highest' ? 'Highest' : 'Lowest'}
                  </button>
                  {showOrderSortMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-2">
                        <button onClick={() => { setOrderSortOrder('recent'); setShowOrderSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderSortOrder === 'recent' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Recent</button>
                        <button onClick={() => { setOrderSortOrder('oldest'); setShowOrderSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderSortOrder === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Oldest</button>
                        <button onClick={() => { setOrderSortOrder('highest'); setShowOrderSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderSortOrder === 'highest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Highest Spent</button>
                        <button onClick={() => { setOrderSortOrder('lowest'); setShowOrderSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg ${orderSortOrder === 'lowest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Lowest Spent</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-8 space-y-4">
            {activeTab === 'orders' && getFilteredSortedOrders().map(order => (
              <div key={order.id} className="flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-5">
                  <div className={`p-2.5 rounded-full ${
                    order.status === 'COMPLETED' ? 'text-green-500 bg-green-50 border border-green-100' :
                    order.status === 'ACCEPTED' ? 'text-blue-500 bg-blue-50 border border-blue-100' :
                    'text-orange-500 bg-orange-50 border border-orange-100'
                  }`}>
                    {order.status === 'COMPLETED' ? <CheckBadgeIcon className="w-6 h-6" /> :
                     order.status === 'ACCEPTED' ? <CheckCircleIcon className="w-6 h-6" /> :
                     <ClockIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-lg">#ORD-{order.orderNumber}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">{order.itemsSummary}</p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-gray-900 mb-2 text-lg">{order.total.toLocaleString()} <span className="text-sm font-bold">UGX</span></p>
                  <StatusBadge
                    status={order.status}
                    label={order.status === 'COMPLETED' ? t('patientPageUI.completed') || 'Completed' :
                           order.status === 'ACCEPTED' ? t('patientPageUI.accepted') || 'Accepted' :
                           t('patientPageUI.pending') || 'Pending'}
                  />
                </div>
              </div>
            ))}

            {activeTab === 'orders' && getFilteredSortedOrders().length === 0 && (
              <p className="text-gray-500 py-4 text-center">{t('common.noData') || 'No data found'}</p>
            )}
            
            {activeTab === 'prescriptions' && selectedPatient.prescriptions.map(rx => (
              <div key={rx.id} className="flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <DocumentTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-lg">{rx.rxNumber}</h4>
                    <p className="text-sm text-gray-500 mt-1">{t('patientPageUI.uploaded') || 'Uploaded:'} {rx.uploadedDate}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingPrescription(rx)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-blue-200 text-blue-600 rounded-full text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  {t('patientPageUI.viewBtn') || 'View'}
                </button>
              </div>
            ))}

            {activeTab === 'prescriptions' && selectedPatient.prescriptions.length === 0 && (
              <p className="text-gray-500 py-4 text-center">{t('common.noData') || 'No data found'}</p>
            )}
          </div>
        </div>

        {/* Prescription Viewer Modal */}
        {viewingPrescription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{viewingPrescription.rxNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">Uploaded {viewingPrescription.uploadedDate}</p>
                </div>
                <button 
                  onClick={() => setViewingPrescription(null)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label={t('common.close') || 'Close'}
                >
                  <span className="text-2xl font-light leading-none">&times;</span>
                </button>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto bg-gray-50 flex flex-col items-center justify-center min-h-[400px]">
                {viewingPrescription.type === 'doc' ? (
                  <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="border-b-2 border-gray-100 pb-4 mb-6 text-center">
                      <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-widest">Prescription</h2>
                      <p className="text-sm text-gray-500 mt-2">Dr. House Clinic</p>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 font-medium">Patient:</span>
                        <span className="font-bold text-gray-900">{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500 font-medium">Date:</span>
                        <span className="font-bold text-gray-900">{viewingPrescription.uploadedDate}</span>
                      </div>
                      <div className="pt-4 space-y-3">
                        <p className="font-bold text-gray-900">Rx:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          <li>Amoxicillin 500mg, Take 1 tablet every 8 hours for 7 days</li>
                          <li>Ibuprofen 400mg, Take 1 tablet as needed for pain</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-12 pt-6 border-t border-gray-100 text-center">
                      <div className="w-32 h-16 border-b-2 border-blue-900 mx-auto mb-2 opacity-50 relative">
                        <span className="absolute bottom-1 left-0 right-0 text-gray-400 italic text-lg" style={{ fontFamily: "cursive" }}>Dr. Signature</span>
                      </div>
                      <p className="text-xs text-gray-400">Authorized Signature</p>
                    </div>
                  </div>
                ) : viewingPrescription.type === 'card' ? (
                  <div className="w-full max-w-md bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl text-white">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-2">
                        <CheckBadgeIcon className="w-8 h-8 text-blue-200" />
                        <span className="font-black text-xl tracking-wider">MEDICARD</span>
                      </div>
                      <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Insurance</span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-blue-200 text-xs font-medium mb-1">Member Name</p>
                        <p className="font-bold text-lg">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-blue-200 text-xs font-medium mb-1">ID Number</p>
                          <p className="font-mono font-bold">{viewingPrescription.rxNumber.replace('RX - ', 'ID-')}</p>
                        </div>
                        <div>
                          <p className="text-blue-200 text-xs font-medium mb-1">Valid Thru</p>
                          <p className="font-bold">12/28</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200 text-center text-yellow-800">
                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-yellow-600 opacity-50" />
                    <h3 className="font-bold text-lg mb-2">Medical Bill Copy</h3>
                    <p className="text-sm opacity-80">Reference: {viewingPrescription.rxNumber}</p>
                    <p className="text-xs mt-4 opacity-60">This is a digitized copy of a physical document.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                <button className="px-5 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  Print Document
                </button>
                <button 
                  onClick={() => setViewingPrescription(null)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- PATIENT LIST VIEW ---
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div 
        className="rounded-2xl shadow-sm p-10 text-white relative overflow-hidden"
        style={{ background: '#E0F2FE' }}
      >
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-3" style={{ color: '#1E3A8A' }}>
            {t('patients.pageTitle') || 'Patients'}
          </h1>
          <p className="text-blue-100 text-lg" style={{ color: '#38BDF8' }}>
            {t('patientPageUI.browseAllPatients') || 'Browse all patients who ordered from your pharmacy.'}
          </p>
        </div>
        {/* Optional decorative background elements could go here */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase">{t('patients.totalPatients') || 'Total Patients'}</p>
            <p className="text-4xl font-black text-gray-900 mb-3">{totalPatients}</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-600">
              ↑ +50% {t('patientPageUI.thisMonth') || 'this month'}
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <UserGroupIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase">{t('patients.totalOrders') || 'Total Orders'}</p>
            <p className="text-4xl font-black text-gray-900 mb-3">
              {patients.reduce((sum, p) => sum + p.totalOrders, 0)}
            </p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
              {t('patientPageUI.lifetime') || 'Lifetime'}
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase">{t('patients.totalRevenue') || 'Total Revenue'}</p>
            <p className="text-4xl font-black text-gray-900 mb-3">
              {patients.reduce((sum, p) => sum + p.totalSpent, 0).toLocaleString()} <span className="text-xl">UGX</span>
            </p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-600">
              ↑ {t('patientPageUI.strong') || 'Strong'}
            </span>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <CurrencyDollarIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-lg">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('patients.searchPlaceholder') || 'Search patients by name, email or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button 
              onClick={() => {
                setShowFilterMenu(!showFilterMenu);
                setShowSortMenu(false);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 w-full sm:w-auto transition-colors"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              {t('patientPageUI.filter') || 'Filter'}
              {filterStatus !== 'all' && <span className="ml-1 w-2 h-2 rounded-full bg-blue-600"></span>}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">Member Status</div>
                  <button onClick={() => { setFilterStatus('all'); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterStatus === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>All Statuses</button>
                  <button onClick={() => { setFilterStatus('VIP'); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterStatus === 'VIP' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>VIP Members</button>
                  <button onClick={() => { setFilterStatus('ACTIVE'); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterStatus === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Active Members</button>
                  <button onClick={() => { setFilterStatus('NEW'); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${filterStatus === 'NEW' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>New Members</button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button 
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowFilterMenu(false);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 w-full sm:w-auto transition-colors"
            >
              <Bars3BottomRightIcon className="w-5 h-5" />
              {getSortLabel()}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">Sort By</div>
                  <button onClick={() => { setSortOrder('recent'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'recent' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Most Recent</button>
                  <button onClick={() => { setSortOrder('oldest'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Oldest</button>
                  <button onClick={() => { setSortOrder('spent-high'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'spent-high' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Highest Spent</button>
                  <button onClick={() => { setSortOrder('spent-low'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'spent-low' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Lowest Spent</button>
                  <button onClick={() => { setSortOrder('orders-high'); setShowSortMenu(false); }} className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${sortOrder === 'orders-high' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>Most Orders</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-gray-500 font-bold border-b border-gray-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-5">{t('patientPageUI.patient') || 'PATIENT'}</th>
                <th className="px-6 py-5">{t('patientPageUI.contact') || 'CONTACT'}</th>
                <th className="px-6 py-5">{t('patientPageUI.orders') || 'ORDERS'}</th>
                <th className="px-6 py-5">{t('patientPageUI.lastOrder') || 'LAST ORDER'}</th>
                <th className="px-6 py-5">{t('patientPageUI.totalSpentTable') || 'TOTAL SPENT (UGX)'}</th>
                <th className="px-6 py-5">{t('patientPageUI.details') || 'DETAILS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1A365D 100%)' }}
                      >
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-base">{patient.firstName} {patient.lastName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {patient.memberStatus === 'VIP' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 font-bold">
                              {t('patientPageUI.statusVip') || 'VIP'}
                            </span>
                          ) : patient.memberStatus === 'NEW' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 font-bold">
                              {t('patientPageUI.statusNew') || 'New'}
                            </span>
                          ) : null}
                          
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 font-bold">
                            {t('patientPageUI.statusActive') || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-semibold">{patient.phone}</td>
                  <td className="px-6 py-5 font-black text-gray-900 text-base">{patient.totalOrders}</td>
                  <td className="px-6 py-5 text-gray-900 font-bold">{patient.lastOrderDate ? (new Date(patient.lastOrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) ) : ('—')} </td>
                  <td className="px-6 py-5 font-black text-blue-600 text-base">{patient.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => setSelectedPatient(patient)}
                      className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 hover:bg-blue-100"
                    >
                      {t('patientPageUI.viewDetailsTable') || 'View Details'}
                      <ChevronRightIcon className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData') || 'No patients found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {filteredPatients.length > 0 && (
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              {t('patientPageUI.showing') || 'Showing'} <span className="font-bold text-gray-900">1-{filteredPatients.length}</span> {t('patientPageUI.of') || 'of'} <span className="font-bold text-gray-900">{patients.length}</span> patients
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 font-bold transition-colors">
                {t('patientPageUI.previous') || 'Previous'}
              </button>
              <button className="px-4 py-2 border border-blue-600 bg-blue-50 text-blue-600 rounded-xl font-black transition-colors">1</button>
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 font-bold transition-colors">
                {t('patientPageUI.next') || 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}