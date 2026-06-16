// src/types/index.ts

export type UserRole = 'SUPER_ADMIN' | 'PHARMACY' | 'PATIENT' | 'BRANCH_MANAGER' | 'PHARMACIST' | 'CASHIER' | 'NURSE';

export type PharmacyStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type BranchStatus = 'INVITED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';

export type OrderType = 'DELIVERY' | 'PICKUP';

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'INSURANCE' | 'CASH';

export interface Profile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  pharmacyStatus?: PharmacyStatus;
  rejectionReason?: string | null;
  branchStatus?: BranchStatus;
  requiresPasswordChange?: boolean;
  profile?: Profile;
}

export interface Medication {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  requiresPrescription: boolean;
  category: string;
  description?: string;
  quantity: number;
  pharmacy?: Pharmacy;
  pharmacyId?: string;
  branchId?: string;
  branch?: Branch;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  medication: Medication;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
  pharmacyId?: string;
  medications: Medication[];
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  branchStatus: BranchStatus;
}

export interface Order {
  id: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  patientPayment?: number;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  // Two shapes exist: GET /orders/:id returns `items`, GET /orders/pharmacy-orders returns `orderItems`
  items?: OrderItem[];
  orderItems?: OrderItem[];
  patient: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    email?: string;
    user?: { phone?: string; address?: string; email?: string };
  };
  pharmacy: Pharmacy;
  branch?: Branch;
  prescription?: {
    id: string;
    status: string;
    fileUrl?: string;
  } | null;
  paymentStatus?: string;
  cancellationReason?: string;
  orderNumber?: string;
  subtotal?: number;
  deliveryFee?: number;
  deliveryZone?: string;
  insuranceCoverage?: number;
  createdAt: string;
}

// ── Dashboard & Analytics ────────────────────────────────────────────────────

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export interface BranchRevenueSeries {
  branchName: string;
  data: RevenuePoint[];
}

export interface PharmacyStats {
  totalBranches: number;
  totalEmployees: number;
  monthlyRevenue: number;
  totalRevenue: number;
  revenueByBranch: { name: string; revenue: number; percentage?: number }[];
  inventoryDistribution: { name: string; value: number }[];
  alerts: unknown[];
  revenueOverTime: { month: string; revenue: number }[];
  monthlyComparison?: { month: string; revenue: number }[];
}

export interface PharmacyAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  itemsSold: number;
  revenueChange?: number;
  ordersChange?: number;
  avgValueChange?: number;
  itemsChange?: number;
}

export interface DailyRevenue {
  dailyTotal: RevenuePoint[];
  branchDaily: BranchRevenueSeries[];
}

export interface WeeklyRevenue {
  weeklyTotal: RevenuePoint[];
  branchWeekly: BranchRevenueSeries[];
}

export interface AttendanceSummary {
  approved?: number;
  pending?: number;
  completed?: number;
  totalHoursWorked?: number;
  totalPresent?: number;
  totalAbsent?: number;
  totalLate?: number;
  [key: string]: unknown;
}

export interface SuperAdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  revenueChange?: number;
  totalPharmacies?: number;
  approvedPharmacies?: number;
  pendingPharmacies?: number;
  platformFeePerPharmacy?: number;
  totalPatients?: number;
  totalBranches?: number;
  totalUsers?: number;
  [key: string]: unknown;
}

export interface SuperAdminRevenue {
  totalRevenue?: number;
  transactionCount?: number;
  [key: string]: unknown;
}

// ── Profile & Pharmacy Detail ─────────────────────────────────────────────────

export interface PharmacyProfile {
  name: string;
  representativeName?: string;
  ownerName?: string;
  // email is flattened from the User relation by the backend's findByUserId method.
  // It is available directly as profile.email on the response object.
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  dateOfIncorporation?: string;
  rdbCertificate?: string;
  pharmacyLicense?: string;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  // Nested user relation — present on the raw API response before flattening.
  // Frontend should read profile.email (flattened) rather than profile.user.email.
  user?: { email?: string };
}

export interface PharmacyDetail extends Pharmacy {
  status?: PharmacyStatus;
  isActive?: boolean;
  email?: string;
  representativeName?: string;
  dateOfIncorporation?: string;
  rdbCertificate?: string;
  pharmacyLicense?: string;
  businessRegistration?: string;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt?: string;
  isLocationVerified?: boolean;
  locationVerifiedAt?: string | null;
  user?: { id: string; email: string; profile?: Profile };
  orders?: Order[];
  _count?: {
    medications: number;
    orders: number;
    branches: number;
    employees: number;
  };
}

export interface BranchDetail extends Branch {
  latitude?: number;
  longitude?: number;
  phone?: string;
  pharmacyId?: string;
  monthlyRevenue?: number;
  medicationCount?: number;
  branchManagerEmail?: string;
  staff?: { id: string; email: string; role: string }[];
  manager?: {
    id: string;
    email: string;
    profile?: Profile;
  };
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface MedicationDetail {
  id: string;
  name: string;
  category: string;
  dosage?: string;
  description?: string;
  unitPrice?: number;
  price?: number;
  quantityInStock?: number;
  quantity?: number;
  lowStockThreshold?: number;
  requiresPrescription: boolean;
  manufacturer?: string;
  expiryDate?: string;
}

export interface MedicationForm {
  name: string;
  category: string;
  // pharmacy/inventory uses `dosage`; branch/staff/inventory use `chemicalName` for the same field
  dosage?: string;
  chemicalName?: string;
  description: string;
  // pharmacy/inventory uses `unitPrice`/`quantityInStock`; branch/staff use `price`/`quantity`
  unitPrice?: string;
  quantityInStock?: string;
  price?: string;
  quantity?: string;
  lowStockThreshold: string;
  requiresPrescription: boolean;
  manufacturer: string;
  expiryDate: string;
}

// ── Patient (super-admin view) ────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  isVerified?: boolean;
}

// ── API wrappers ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface DecodedToken {
  sub: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  pharmacyStatus?: PharmacyStatus;
  branchStatus?: BranchStatus;
  iat: number;
  exp: number;
}
