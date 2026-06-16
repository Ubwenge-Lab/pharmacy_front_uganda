// Mock data matching GET /api/hospitals/:hospitalId/dashboard/stats
// and GET /api/hospitals/:hospitalId/dashboard/weekly-revenue

import type { DashboardStats, WeeklyRevenue, Appointment } from '@/types/hospital';

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalAppointments: {
    thisMonth: 134,
    allTime: 2841,
  },
  appointmentsByStatus: {
    PENDING: 47,
    CONFIRMED: 61,
    COMPLETED: 18,
    CANCELLED: 8,
  },
  totalRevenue: 48_750_000,
  monthlyRevenue: 4_320_000,
  totalDoctors: 16,
  activeDoctors: 12,
  totalPatients: 412,
};

// Source: GET /api/hospitals/:hospitalId/dashboard/weekly-revenue
export const MOCK_WEEKLY_REVENUE: WeeklyRevenue[] = [
  { label: 'May 4 – May 10',  revenue: 980_000 },
  { label: 'May 11 – May 17', revenue: 1_140_000 },
  { label: 'May 18 – May 24', revenue: 1_060_000 },
  { label: 'May 25 – May 31', revenue: 1_320_000 },
];

// Recent appointments (last 5) — derived from GET /api/appointments sorted desc
export const MOCK_RECENT_APPOINTMENTS: Pick<
  Appointment,
  'id' | 'patientName' | 'doctorName' | 'date' | 'status' | 'specialization'
>[] = [
  { id: 'apt-001', patientName: 'Jean Bosco Niyonzima',  doctorName: 'Dr. Alice Mutoni',   date: '2026-06-01T08:30:00Z', status: 'CONFIRMED',       specialization: 'Cardiology' },
  { id: 'apt-002', patientName: 'Claudine Uwimana',       doctorName: 'Dr. Patrick Habimana', date: '2026-06-01T09:00:00Z', status: 'READY_FOR_DOCTOR', specialization: 'General Medicine' },
  { id: 'apt-003', patientName: 'Thierry Nkurunziza',     doctorName: 'Dr. Diane Mukamana',  date: '2026-06-01T09:30:00Z', status: 'PENDING',         specialization: 'Paediatrics' },
  { id: 'apt-004', patientName: 'Esperance Mukandoli',    doctorName: 'Dr. Eric Nsanzimana', date: '2026-05-31T14:00:00Z', status: 'COMPLETED',       specialization: 'Surgery' },
  { id: 'apt-005', patientName: 'Aimable Tuyishimire',    doctorName: 'Dr. Alice Mutoni',    date: '2026-05-31T11:00:00Z', status: 'CANCELLED',       specialization: 'Cardiology' },
];
