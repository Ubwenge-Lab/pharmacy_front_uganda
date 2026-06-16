'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PatientSidebar from '@/components/patient/PatientSidebar';
import PatientTopbar from '@/components/patient/PatientTopbar';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import SupportBot from '@/components/shared/SupportBot';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'PATIENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || user.role !== 'PATIENT') return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <PatientSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSupport={() => setSupportOpen(true)}
      />
      <div className="flex-1 lg:ml-64 min-w-0">
        <PatientTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
      <SupportBot
        open={supportOpen}
        onOpen={() => setSupportOpen(true)}
        onClose={() => setSupportOpen(false)}
      />
    </div>
  );
}
