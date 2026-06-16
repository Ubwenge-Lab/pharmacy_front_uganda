// Mock data for Finance tab
// Sources:
//   KPIs         → GET /api/hospitals/:hospitalId/dashboard/stats (totalRevenue, monthlyRevenue)
//   Invoices     → GET /api/hospitals/:hospitalId/invoices
//   Weekly chart → GET /api/hospitals/:hospitalId/dashboard/weekly-revenue

import type { Invoice, FinanceKPI, WeeklyRevenue } from '@/types/hospital';

export const MOCK_FINANCE_KPIS: FinanceKPI[] = [
  { label: 'Total Revenue',        value: 48_750_000, trend: 12.4, trendUp: true  },
  { label: 'Total Expenses',       value: 31_200_000, trend: 6.1,  trendUp: false },
  { label: 'Net Profit',           value: 17_550_000, trend: 18.7, trendUp: true  },
  { label: 'Outstanding Payments', value: 4_320_000,  trend: 3.2,  trendUp: false },
];

// Reuse from dashboard — same endpoint
export const MOCK_FINANCE_WEEKLY: WeeklyRevenue[] = [
  { label: 'May 4 – May 10',  revenue: 980_000  },
  { label: 'May 11 – May 17', revenue: 1_140_000 },
  { label: 'May 18 – May 24', revenue: 1_060_000 },
  { label: 'May 25 – May 31', revenue: 1_320_000 },
];

// Source: GET /api/hospitals/:hospitalId/invoices
export const MOCK_INVOICES: Invoice[] = [
  { id: 'inv-001', patientName: 'Jean Bosco Niyonzima',  totalAmount: 45_000, status: 'PAID',               dueDate: '2026-06-10', createdAt: '2026-05-28', appointmentId: 'apt-005' },
  { id: 'inv-002', patientName: 'Claudine Uwimana',       totalAmount: 32_500, status: 'UNPAID',             dueDate: '2026-06-15', createdAt: '2026-05-30' },
  { id: 'inv-003', patientName: 'Esperance Mukandoli',    totalAmount: 180_000,status: 'INSURANCE_PENDING',  dueDate: '2026-06-20', createdAt: '2026-05-25', appointmentId: 'apt-004' },
  { id: 'inv-004', patientName: 'Regis Habineza',         totalAmount: 28_000, status: 'PAID',               dueDate: '2026-06-05', createdAt: '2026-05-22', appointmentId: 'apt-011' },
  { id: 'inv-005', patientName: 'Sylvie Nzeyimana',       totalAmount: 62_000, status: 'PAID',               dueDate: '2026-06-08', createdAt: '2026-05-27', appointmentId: 'apt-014' },
  { id: 'inv-006', patientName: 'Theogene Murenzi',       totalAmount: 250_000,status: 'INSURANCE_PENDING',  dueDate: '2026-06-25', createdAt: '2026-06-01', appointmentId: 'apt-017' },
  { id: 'inv-007', patientName: 'Immaculee Uwera',        totalAmount: 95_000, status: 'UNPAID',             dueDate: '2026-06-18', createdAt: '2026-05-31', appointmentId: 'apt-010' },
  { id: 'inv-008', patientName: 'Fidele Nsengimana',      totalAmount: 15_000, status: 'PAID',               dueDate: '2026-06-04', createdAt: '2026-05-20', appointmentId: 'apt-019' },
  { id: 'inv-009', patientName: 'Chantal Mukabutera',     totalAmount: 48_000, status: 'UNPAID',             dueDate: '2026-06-22', createdAt: '2026-06-01' },
  { id: 'inv-010', patientName: 'Gaspard Bizimana',       totalAmount: 22_500, status: 'PAID',               dueDate: '2026-06-07', createdAt: '2026-05-24' },
  { id: 'inv-011', patientName: 'Placide Nzabonimana',    totalAmount: 38_000, status: 'INSURANCE_PENDING',  dueDate: '2026-06-28', createdAt: '2026-06-02' },
  { id: 'inv-012', patientName: 'Alphonsine Umutoni',     totalAmount: 55_000, status: 'UNPAID',             dueDate: '2026-06-30', createdAt: '2026-06-04' },
];
