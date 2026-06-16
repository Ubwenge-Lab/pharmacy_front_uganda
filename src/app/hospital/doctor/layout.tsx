'use client';

import { useState } from 'react';
import HospitalSidebar from '@/components/hospital/HospitalSidebar';
import HospitalTopbar from '@/components/hospital/HospitalTopbar';
import { MOCK_DOCTOR } from '@/mock/hospital/user';

// TODO: replace MOCK_DOCTOR with useAuth() once hospital login is configured

export default function HospitalDoctorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userName = `${MOCK_DOCTOR.firstName} ${MOCK_DOCTOR.lastName}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <HospitalSidebar
        portalType="doctor"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-64 min-w-0">
        <HospitalTopbar
          userName={userName}
          roleLabel={MOCK_DOCTOR.specialisation}
          hospitalName={MOCK_DOCTOR.hospitalName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
