// frontend/src/app/super-admin/patients/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import type { PatientSummary } from '@/types';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function SuperAdminPatientsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // You'll need to create this endpoint in the backend
      const res = await api.get('/super-admin/patients');
      setPatients(res.data);
    } catch (error: unknown) {
      toast.error(t('errors.failedToLoadPatients'));
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
  patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 lg:p-8" style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #f0f9ff 100%)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1E3A5F' }}>{t('superAdmin.patients')}</h1>
            <p className="text-sm mt-1" style={{ color: '#4B7BAE' }}>{filteredPatients.length} registered patients</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('patients.searchPlaceholder')}
              className="w-full sm:w-64 px-4 py-2 border border-blue-200 bg-white rounded-xl outline-none focus:border-blue-400 text-sm"
            />
          </div>
        </div>
      </div>

          {/* Patients List */}
        {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {searchTerm ? t('patients.noPatientsFound') : 'No patients registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient: any) => (
            <div
              key={patient.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 text-white" style={{ backgroundColor: '#1E3A5F' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h3>
                    {patient.user?.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-white/80">
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        <span>{t('patients.verified')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700">
                  <EnvelopeIcon className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate">{patient.user?.email}</span>
                </div>

                {patient.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <PhoneIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{patient.phone}</span>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPinIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{patient.address}</span>
                  </div>
                )}

                {patient.dateOfBirth && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}

                {patient.insuranceProvider && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Insurance Provider</p>
                    <p className="text-sm text-blue-800">{patient.insuranceProvider}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}