/**
 * src/lib/constants.ts
 *
 * Single source of truth for all shared constants used across more than one file.
 * Import from here — never define these inline.
 */

// ── Medication categories (Uganda NDA list) ────────────────────────────────
// Used in: pharmacy/inventory/add, pharmacy/inventory/[id],
//          branch/inventory/add,   branch/inventory/[id],   branch/inventory/page,
//          staff/inventory/add,    staff/inventory/[id],    staff/inventory/page
export const FDA_CATEGORIES: string[] = [
  'Analgesics & Antipyretics',
  'Antibiotics & Antimicrobials',
  'Antifungals',
  'Antivirals & Antiretrovirals',
  'Antimalaria',
  'Antituberculosis',
  'Antiparasitics & Anthelmintics',
  'Cardiovascular & Antihypertensives',
  'Antidiabetics',
  'Gastrointestinal',
  'Respiratory & Bronchodilators',
  'Central Nervous System',
  'Vitamins, Minerals & Supplements',
  'Dermatologicals',
  'Ophthalmologicals',
  'ENT (Ear, Nose & Throat)',
  'Hormones & Endocrine',
  'Vaccines & Biologicals',
  'Oncologicals',
  'Immunosuppressants',
  'Contraceptives',
  'Haematologicals',
  'Musculoskeletal & Anti-inflammatories',
  'Urological',
  'Psychiatric & Psychotropic',
  'Anesthetics',
  'Diagnostics & Contrast Media',
  'Traditional & Herbal Medicines',
  'Other',
];

// ── Polling ────────────────────────────────────────────────────────────────
// Used in: patient/notifications/page, pharmacy/notifications/page
export const POLLING_INTERVAL_MS = 30_000; // 30 seconds

// ── Pagination ─────────────────────────────────────────────────────────────
// Used wherever a list is sliced to a page size
export const ITEMS_PER_PAGE = 5;

// ── Support contact ────────────────────────────────────────────────────────
// Falls back to the hardcoded address when the env var is not set.
// Set NEXT_PUBLIC_SUPPORT_EMAIL in .env.local / .env.production to override.
export const SUPPORT_EMAIL: string =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'info@ubwengelab.rw';

// ── Order status groups ────────────────────────────────────────────────────
// Orders that are still in-flight (patient "active" count, filters, etc.)
// Used in: patient/orders/page, patient/dashboard/page
export const PENDING_STATUSES: readonly string[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'READY_FOR_PICKUP',
];

// Terminal states — order can no longer change
// Used in: patient/orders/page, patient/dashboard/page
export const COMPLETED_STATUSES: readonly string[] = [
  'DELIVERED',
  'CANCELLED',
  'COMPLETED',
];
