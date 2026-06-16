// src/types/hospital.ts
// Types derived from hospital_portal_api_mapping.md — match actual API shapes.

// ── Auth / User ───────────────────────────────────────────────────────────────

export type HospitalRole = 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';

export interface MockDoctor {
  id: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR';
  specialisation: string;
  department: string;
  hospitalId: string;
  hospitalName: string;
  email: string;
}

export interface MockAdmin {
  id: string;
  firstName: string;
  lastName: string;
  role: 'HOSPITAL_ADMIN';
  hospitalId: string;
  hospitalName: string;
  email: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// Source: GET /api/hospitals/:hospitalId/dashboard/stats

export interface DashboardStats {
  totalAppointments: {
    thisMonth: number;
    allTime: number;
  };
  appointmentsByStatus: {
    PENDING: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  totalRevenue: number;
  monthlyRevenue: number;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
}

// Source: GET /api/hospitals/:hospitalId/dashboard/weekly-revenue
export interface WeeklyRevenue {
  label: string;
  revenue: number;
}

// ── Appointments ──────────────────────────────────────────────────────────────
// Source: GET /api/appointments
// Status flow: PENDING → CONFIRMED → READY_FOR_DOCTOR → COMPLETED | CANCELLED

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY_FOR_DOCTOR'
  | 'COMPLETED'
  | 'CANCELLED';

export type AppointmentType = 'IN_PERSON' | 'ONLINE';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  date: string;               // ISO date string
  reason?: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  diagnosisSummary?: string;
  doctorRecommendations?: string;
  // Derived / joined fields used in the UI
  patientName: string;
  doctorName: string;
  specialization: string;
}

// ── Inventory / Drug Stock ────────────────────────────────────────────────────
// Source: GET /api/hospitals/:hospitalId/drug-stock

export interface DrugStock {
  hospitalId: string;
  drugId: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;         // ISO date string
  lowStockAlert: boolean;
  drug: {
    brandName: string;
    genericName: string;
    dosageStrength: string;
    dosageForm: string;
  };
}

// Derived status for display — calculated on the frontend
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';

// ── Doctors / Staff ───────────────────────────────────────────────────────────
// Source: GET /api/hospitals/:hospitalId/doctors

export interface DoctorProfile {
  id: string;
  specialization: string;
  licenseNumber: string;
  firstName: string;
  lastName: string;
  isAvailable: boolean;
  bio?: string;
  rating?: number;
  user: {
    email: string;
    hospitalStaff?: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
}

// For the staff management table (union of doctors + nurses from hospitalStaff)
export interface HospitalStaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
  specialization?: string;
  department?: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  joinedAt: string;
}

// ── Finance / Invoices ────────────────────────────────────────────────────────
// Source: GET /api/hospitals/:hospitalId/invoices

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'INSURANCE_PENDING';

export interface Invoice {
  id: string;
  patientName: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  appointmentId?: string;
}

export interface FinanceKPI {
  label: string;
  value: number;
  trend: number;       // percentage vs last month
  trendUp: boolean;
}

// ── Departments ───────────────────────────────────────────────────────────────
// Derived client-side by grouping DoctorProfile[] by specialization

export interface Department {
  id: string;
  name: string;
  doctorCount: number;
  nurseCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

// ── Reports ───────────────────────────────────────────────────────────────────
// Source: GET /api/reports/export/* (CSV) + mock for analytics charts

export interface ReportSummary {
  totalPatients: number;
  newAdmissions: number;
  discharged: number;
  avgStayDays: number;
}

export interface AdmissionDataPoint {
  label: string;
  admissions: number;
}

export interface DiagnosisBreakdown {
  name: string;
  value: number;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface HospitalSettings {
  hospitalName: string;
  address: string;
  phone: string;
  email: string;
}

export interface AdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export type MessageDirection = 'SENT' | 'RECEIVED';

export interface Message {
  id: string;
  text: string;
  direction: MessageDirection;
  timestamp: string;
}

export interface Conversation {
  id: string;
  senderName: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

// ── Claims ────────────────────────────────────────────────────────────────────

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ClaimType = 'INPATIENT' | 'OUTPATIENT' | 'EMERGENCY' | 'SPECIALIST';

export interface Claim {
  id: string;
  patientName: string;
  amount: number;
  type: ClaimType;
  date: string;
  insurance: string;
  status: ClaimStatus;
}

// ── Consultations & Refusals ─────────────────────────────────────────────────

export type ConsultationStatus = 'ACTIVE' | 'COMPLETED' | 'PENDING';

export interface Consultation {
  id: string;
  patientName: string;
  date: string;
  type: string;
  diagnosis?: string;
  duration?: string;
  status: ConsultationStatus;
}

export type RefusalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Refusal {
  id: string;
  patientName: string;
  date: string;
  reason: string;
  insurance?: string;
  status: RefusalStatus;
}
