import type { Claim } from '@/types/hospital';
// This file contains mock data for hospital claims, which can be used for testing and development purposes. The data includes a list of claims with various attributes such as patient name, amount, type, date, insurance provider, and status. Additionally, there are datasets for monthly claim submissions and claim type breakdowns that can be used for visualizations like line charts and donut charts.
export const MOCK_CLAIMS: Claim[] = [
  { id: 'clm-001', patientName: 'Jean Bosco Niyonzima',  amount: 45_000,  type: 'OUTPATIENT',  date: '2026-05-28', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-002', patientName: 'Esperance Mukandoli',   amount: 180_000, type: 'INPATIENT',   date: '2026-05-25', insurance: 'Sanlam',       status: 'PENDING'   },
  { id: 'clm-003', patientName: 'Regis Habineza',        amount: 28_000,  type: 'OUTPATIENT',  date: '2026-05-22', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-004', patientName: 'Theogene Murenzi',      amount: 250_000, type: 'INPATIENT',   date: '2026-06-01', insurance: 'UAP Uganda',   status: 'PENDING'   },
  { id: 'clm-005', patientName: 'Sylvie Nzeyimana',      amount: 62_000,  type: 'OUTPATIENT',  date: '2026-05-27', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-006', patientName: 'Chantal Mukabutera',    amount: 420_000, type: 'INPATIENT',   date: '2026-05-20', insurance: 'Britam',       status: 'REJECTED'  },
  { id: 'clm-007', patientName: 'Fidele Nsengimana',     amount: 15_000,  type: 'OUTPATIENT',  date: '2026-05-20', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-008', patientName: 'Odette Umuraza',        amount: 38_000,  type: 'SPECIALIST',  date: '2026-05-18', insurance: 'Sanlam',       status: 'PENDING'   },
  { id: 'clm-009', patientName: 'Immaculee Uwera',       amount: 95_000,  type: 'INPATIENT',   date: '2026-05-31', insurance: 'UAP Uganda',   status: 'PENDING'   },
  { id: 'clm-010', patientName: 'Gaspard Bizimana',      amount: 22_500,  type: 'OUTPATIENT',  date: '2026-05-24', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-011', patientName: 'Vestine Nyiranzeyimana',amount: 75_000,  type: 'SPECIALIST',  date: '2026-05-15', insurance: 'Britam',       status: 'REJECTED'  },
  { id: 'clm-012', patientName: 'Placide Nzabonimana',   amount: 38_000,  type: 'OUTPATIENT',  date: '2026-06-02', insurance: 'RSSB',         status: 'PENDING'   },
  { id: 'clm-013', patientName: 'Aimable Tuyishimire',   amount: 52_000,  type: 'OUTPATIENT',  date: '2026-05-31', insurance: 'Sanlam',       status: 'APPROVED'  },
  { id: 'clm-014', patientName: 'Emmanuel Gakwerere',    amount: 68_000,  type: 'SPECIALIST',  date: '2026-06-03', insurance: 'UAP Uganda',   status: 'PENDING'   },
  { id: 'clm-015', patientName: 'Alphonsine Umutoni',    amount: 29_000,  type: 'OUTPATIENT',  date: '2026-06-04', insurance: 'RSSB',         status: 'PENDING'   },
  { id: 'clm-016', patientName: 'Thierry Nkurunziza',    amount: 18_500,  type: 'OUTPATIENT',  date: '2026-06-01', insurance: 'RSSB',         status: 'APPROVED'  },
  { id: 'clm-017', patientName: 'Marie Claire Mukasonga',amount: 24_000,  type: 'OUTPATIENT',  date: '2026-06-03', insurance: 'Britam',       status: 'APPROVED'  },
  { id: 'clm-018', patientName: 'Joselyne Uwizeyimana',  amount: 42_000,  type: 'SPECIALIST',  date: '2026-06-04', insurance: 'Sanlam',       status: 'REJECTED'  },
  { id: 'clm-019', patientName: 'Faustin Niyomugabo',    amount: 31_000,  type: 'OUTPATIENT',  date: '2026-06-02', insurance: 'RSSB',         status: 'PENDING'   },
  { id: 'clm-020', patientName: 'Claudine Uwimana',      amount: 32_500,  type: 'EMERGENCY',   date: '2026-05-30', insurance: 'UAP Uganda',   status: 'PENDING'   },
];

// Monthly claim submissions for line chart (last 6 months)
export const MOCK_CLAIMS_MONTHLY = [
  { label: 'Jan 2026', count: 42 },
  { label: 'Feb 2026', count: 38 },
  { label: 'Mar 2026', count: 55 },
  { label: 'Apr 2026', count: 49 },
  { label: 'May 2026', count: 61 },
  { label: 'Jun 2026', count: 20 },
];

// Claim type breakdown for donut chart
export const MOCK_CLAIMS_BY_TYPE = [
  { name: 'Inpatient',  value: 4  },
  { name: 'Outpatient', value: 10 },
  { name: 'Emergency',  value: 1  },
  { name: 'Specialist', value: 5  },
];
