import type { Consultation, Refusal } from '@/types/hospital';

// Consultations — derived from completed/active appointments
export const MOCK_CONSULTATIONS: Consultation[] = [
  { id: 'con-001', patientName: 'Aimable Tuyishimire',  date: '2026-06-01', type: 'Follow-up',      diagnosis: 'Stable angina',        duration: '25 min', status: 'COMPLETED' },
  { id: 'con-002', patientName: 'Regis Habineza',       date: '2026-06-02', type: 'Review',         diagnosis: 'Hypertension Grade 1', duration: '20 min', status: 'COMPLETED' },
  { id: 'con-003', patientName: 'Claudine Uwimana',     date: '2026-06-01', type: 'Initial Visit',  diagnosis: 'Pending labs',                             status: 'ACTIVE'    },
  { id: 'con-004', patientName: 'Jean Bosco Niyonzima', date: '2026-06-01', type: 'Follow-up',                                                             status: 'ACTIVE'    },
  { id: 'con-005', patientName: 'Fidele Nsengimana',    date: '2026-06-04', type: 'Review',         diagnosis: 'Controlled epilepsy',  duration: '15 min', status: 'COMPLETED' },
  { id: 'con-006', patientName: 'Sylvie Nzeyimana',     date: '2026-06-03', type: 'Initial Visit',  diagnosis: 'Falciparum malaria',   duration: '30 min', status: 'COMPLETED' },
  { id: 'con-007', patientName: 'Thierry Nkurunziza',   date: '2026-06-01', type: 'Initial Visit',                                                         status: 'PENDING'   },
  { id: 'con-008', patientName: 'Esperance Mukandoli',  date: '2026-06-01', type: 'Pre-operative',                                                          status: 'PENDING'   },
  { id: 'con-009', patientName: 'Odette Umuraza',       date: '2026-06-01', type: 'Specialist Referral', diagnosis: 'Chronic migraine',                    status: 'ACTIVE'    },
  { id: 'con-010', patientName: 'Chantal Mukabutera',   date: '2026-06-02', type: 'Follow-up',                                                              status: 'ACTIVE'    },
  { id: 'con-011', patientName: 'Gaspard Bizimana',     date: '2026-06-01', type: 'Annual Check',                                                           status: 'PENDING'   },
  { id: 'con-012', patientName: 'Immaculee Uwera',      date: '2026-06-02', type: 'Post-operative',                                                         status: 'ACTIVE'    },
  { id: 'con-013', patientName: 'Alphonsine Umutoni',   date: '2026-06-04', type: 'Initial Visit',                                                          status: 'PENDING'   },
  { id: 'con-014', patientName: 'Placide Nzabonimana',  date: '2026-06-02', type: 'Initial Visit',                                                          status: 'PENDING'   },
  { id: 'con-015', patientName: 'Emmanuel Gakwerere',   date: '2026-06-03', type: 'Specialist Referral',                                                    status: 'ACTIVE'    },
  { id: 'con-016', patientName: 'Faustin Niyomugabo',   date: '2026-06-02', type: 'Follow-up',                                                              status: 'PENDING'   },
  { id: 'con-017', patientName: 'Theogene Murenzi',     date: '2026-06-03', type: 'Surgical Consult',                                                       status: 'ACTIVE'    },
  { id: 'con-018', patientName: 'Marie Claire Mukasonga',date: '2026-06-03',type: 'Milestone Check',                                                        status: 'PENDING'   },
];

// Refusals — insurance/coverage rejections
export const MOCK_REFUSALS: Refusal[] = [
  { id: 'ref-001', patientName: 'Chantal Mukabutera',    date: '2026-05-20', reason: 'Procedure not covered by plan',          insurance: 'Britam',       status: 'REJECTED' },
  { id: 'ref-002', patientName: 'Vestine Nyiranzeyimana',date: '2026-05-15', reason: 'Incomplete documentation submitted',      insurance: 'Britam',       status: 'REJECTED' },
  { id: 'ref-003', patientName: 'Joselyne Uwizeyimana',  date: '2026-06-04', reason: 'Specialist referral not pre-authorised',  insurance: 'Sanlam',       status: 'REJECTED' },
  { id: 'ref-004', patientName: 'Esperance Mukandoli',   date: '2026-05-25', reason: 'Annual benefit limit reached',            insurance: 'Sanlam',       status: 'PENDING'  },
  { id: 'ref-005', patientName: 'Theogene Murenzi',      date: '2026-06-01', reason: 'Surgery pre-authorisation in review',     insurance: 'UAP Uganda',   status: 'PENDING'  },
  { id: 'ref-006', patientName: 'Immaculee Uwera',       date: '2026-05-31', reason: 'Out-of-network provider',                 insurance: 'UAP Uganda',   status: 'PENDING'  },
  { id: 'ref-007', patientName: 'Odette Umuraza',        date: '2026-05-18', reason: 'Awaiting specialist referral letter',     insurance: 'Sanlam',       status: 'PENDING'  },
  { id: 'ref-008', patientName: 'Jean Bosco Niyonzima',  date: '2026-05-10', reason: 'Insurance card expired at time of visit', insurance: 'RSSB',         status: 'APPROVED' },
  { id: 'ref-009', patientName: 'Gaspard Bizimana',      date: '2026-05-05', reason: 'Missing employer contribution certificate',insurance: 'RSSB',        status: 'APPROVED' },
  { id: 'ref-010', patientName: 'Faustin Niyomugabo',    date: '2026-06-02', reason: 'Dermatology not in basic plan',           insurance: 'RSSB',         status: 'PENDING'  },
  { id: 'ref-011', patientName: 'Placide Nzabonimana',   date: '2026-06-02', reason: 'Paediatric specialist claim under review', insurance: 'RSSB',        status: 'PENDING'  },
  { id: 'ref-012', patientName: 'Claudine Uwimana',      date: '2026-05-30', reason: 'Emergency admission pending authorisation',insurance: 'UAP Uganda',  status: 'APPROVED' },
];
