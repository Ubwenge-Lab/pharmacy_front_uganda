// Mock data for Schedule / Calendar tab
// Source: GET /api/appointments (same endpoint, filtered for calendar display)
// Appointment type: IN_PERSON | ONLINE
// Color coding: Each doctor has an assigned color for consistent display across the app (see DOCTOR_COLORS mapping below)
// Shift colour palette per doctor (consistent across pages)
export const DOCTOR_COLORS: Record<string, string> = {
  'doc-001': '#2D9B8A', // teal   — Alice Mutoni
  'doc-002': '#1E4D8C', // navy   — Patrick Habimana
  'doc-003': '#7C3AED', // violet — Diane Mukamana
  'doc-004': '#B45309', // amber  — Eric Nsanzimana
  'doc-005': '#0891B2', // cyan   — Solange Ingabire
  'doc-006': '#059669', // emerald— Celestin Rudasingwa
  'doc-007': '#DB2777', // pink   — Beata Mukamugisha
};

export interface ScheduleEntry {
  id: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  date: string;       // ISO date e.g. '2026-06-02'
  startTime: string;  // e.g. '08:30'
  endTime: string;    // e.g. '09:00'
  type: 'IN_PERSON' | 'ONLINE';
  color: string;
}

// Current week: June 2 – 8, 2026
export const MOCK_SCHEDULE: ScheduleEntry[] = [
  // Monday June 2
  { id: 'sch-001', doctorId: 'doc-001', doctorName: 'Dr. Alice Mutoni',      patientName: 'Jean Bosco Niyonzima', date: '2026-06-02', startTime: '08:30', endTime: '09:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-001'] },
  { id: 'sch-002', doctorId: 'doc-002', doctorName: 'Dr. Patrick Habimana',  patientName: 'Claudine Uwimana',     date: '2026-06-02', startTime: '09:00', endTime: '09:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-002'] },
  { id: 'sch-003', doctorId: 'doc-003', doctorName: 'Dr. Diane Mukamana',    patientName: 'Thierry Nkurunziza',   date: '2026-06-02', startTime: '09:30', endTime: '10:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-003'] },
  { id: 'sch-004', doctorId: 'doc-005', doctorName: 'Dr. Solange Ingabire',  patientName: 'Odette Umuraza',       date: '2026-06-02', startTime: '11:00', endTime: '11:30', type: 'ONLINE',    color: DOCTOR_COLORS['doc-005'] },
  { id: 'sch-005', doctorId: 'doc-001', doctorName: 'Dr. Alice Mutoni',      patientName: 'Aimable Tuyishimire',  date: '2026-06-02', startTime: '14:00', endTime: '14:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-001'] },

  // Tuesday June 3
  { id: 'sch-006', doctorId: 'doc-006', doctorName: 'Dr. Celestin Rudasingwa', patientName: 'Emmanuel Gakwerere', date: '2026-06-03', startTime: '09:00', endTime: '09:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-006'] },
  { id: 'sch-007', doctorId: 'doc-002', doctorName: 'Dr. Patrick Habimana',    patientName: 'Gaspard Bizimana',   date: '2026-06-03', startTime: '11:30', endTime: '12:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-002'] },
  { id: 'sch-008', doctorId: 'doc-003', doctorName: 'Dr. Diane Mukamana',      patientName: 'Marie Claire Mukasonga', date: '2026-06-03', startTime: '10:00', endTime: '10:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-003'] },
  { id: 'sch-009', doctorId: 'doc-007', doctorName: 'Dr. Beata Mukamugisha',   patientName: 'Faustin Niyomugabo', date: '2026-06-03', startTime: '11:00', endTime: '11:30', type: 'ONLINE',    color: DOCTOR_COLORS['doc-007'] },

  // Wednesday June 4
  { id: 'sch-010', doctorId: 'doc-001', doctorName: 'Dr. Alice Mutoni',      patientName: 'Alphonsine Umutoni',  date: '2026-06-04', startTime: '09:00', endTime: '09:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-001'] },
  { id: 'sch-011', doctorId: 'doc-005', doctorName: 'Dr. Solange Ingabire',  patientName: 'Fidele Nsengimana',   date: '2026-06-04', startTime: '10:00', endTime: '10:30', type: 'ONLINE',    color: DOCTOR_COLORS['doc-005'] },
  { id: 'sch-012', doctorId: 'doc-007', doctorName: 'Dr. Beata Mukamugisha', patientName: 'Joselyne Uwizeyimana',date: '2026-06-04', startTime: '11:30', endTime: '12:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-007'] },

  // Thursday June 5
  { id: 'sch-013', doctorId: 'doc-002', doctorName: 'Dr. Patrick Habimana',  patientName: 'Sylvie Nzeyimana',    date: '2026-06-05', startTime: '08:30', endTime: '09:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-002'] },
  { id: 'sch-014', doctorId: 'doc-003', doctorName: 'Dr. Diane Mukamana',    patientName: 'Placide Nzabonimana', date: '2026-06-05', startTime: '08:00', endTime: '08:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-003'] },
  { id: 'sch-015', doctorId: 'doc-006', doctorName: 'Dr. Celestin Rudasingwa', patientName: 'Vestine Nyiranzeyimana', date: '2026-06-05', startTime: '14:00', endTime: '14:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-006'] },

  // Friday June 6
  { id: 'sch-016', doctorId: 'doc-001', doctorName: 'Dr. Alice Mutoni',      patientName: 'Regis Habineza',      date: '2026-06-06', startTime: '09:30', endTime: '10:00', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-001'] },
  { id: 'sch-017', doctorId: 'doc-005', doctorName: 'Dr. Solange Ingabire',  patientName: 'Chantal Mukabutera',  date: '2026-06-06', startTime: '10:00', endTime: '10:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-005'] },
  { id: 'sch-018', doctorId: 'doc-002', doctorName: 'Dr. Patrick Habimana',  patientName: 'Immaculee Uwera',     date: '2026-06-06', startTime: '14:00', endTime: '14:30', type: 'IN_PERSON', color: DOCTOR_COLORS['doc-002'] },
];
