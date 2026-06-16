# Pharmacy Owner Portal — Backend Contract

This document records frontend workarounds applied in the Pharmacy Owner Portal due to backend inconsistencies. Each gap includes the problem, frontend workaround, requested backend changes, example response shapes where applicable, and verification criteria.

---

# 1. Quick Summary 

| 1   | Branch list missing                  | `src/app/pharmacy/orders/page.tsx`    | `GET /branches/my-branches` or `GET /orders/pharmacy-orders` | High     |
| 2   | READY_FOR_CHECKOUT mismatch          | `src/app/pharmacy/orders/page.tsx`    | OrderStatus enum                                             | Medium   |
| 3   | Missing patient/staff display fields | `src/app/pharmacy/orders/page.tsx`    | `GET /orders/pharmacy-orders`                                | High     |
| 4   | Owner name missing                   | `src/app/pharmacy/dashboard/page.tsx` | `GET /pharmacies/profile/me`                                 | Medium   |
| 5   | Analytics response shape mismatch    | `src/app/pharmacy/analytics/page.tsx` | `GET /pharmacies/dashboard/stats`                            | Medium   |
| 6   | Inventory dosage naming mismatch     | `src/app/pharmacy/inventory/page.tsx` | Inventory APIs                                               | Low      |
| 7   | Missing patient profile fields       | `src/app/pharmacy/patients/page.tsx`  | `GET /pharmacies/dashboard/patients`                         | Medium   |
| 8   | Missing prescription matrix          | `src/app/pharmacy/patients/page.tsx`  | `GET /pharmacies/dashboard/patients`                         | Medium   |
| 9   | Incomplete order sub-object records  | `src/app/pharmacy/patients/page.tsx`  | `GET /pharmacies/dashboard/patients`                         | Low      |
| 10  | Order timestamp consistency          | `src/app/pharmacy/patients/page.tsx`  | `GET /pharmacies/dashboard/patients`                         | Low      |
| 11  | Notification scope issue             | Notifications module                  | Notifications APIs                                           | High     |
| 12  | Missing orderId on notifications     | Notifications module                  | Notifications APIs                                           | Medium   |
| 13  | Missing OUT_OF_STOCK classification  | Notifications module                  | Notifications APIs                                           | Medium   |

---

# 2. High Priority Gaps

## Gap 1 — Branch List Missing (Orders Page)

### Problem

The Orders page previously relied on `GET /branches/my-branches` to populate the branch filter. During integration, the endpoint was unavailable, resulting in an empty filter dropdown.

### Frontend Workaround

**File:** `src/app/pharmacy/orders/page.tsx`

Branch options are derived from loaded orders by extracting unique branch identifiers and names. When a branch object is unavailable, the frontend falls back to `branchId`.

### Requested Backend Changes

Implement either:

```http
GET /branches/my-branches
```

or include branch information in:

```http
GET /orders/pharmacy-orders
```

### Recommended Response Shape

```json
{
  "id": "o_123",
  "branchId": "b_123",
  "branch": {
    "id": "b_123",
    "name": "MedPlus Main"
  }
}
```

### Verification

* Branch dropdown is populated.
* Branch filtering works correctly.

---

## Gap 2 — READY_FOR_CHECKOUT Status Mismatch

### Problem

The frontend previously displayed a `READY_FOR_CHECKOUT` tab while the backend uses `READY_FOR_PICKUP`.

### Frontend Workaround

**File:** `src/app/pharmacy/orders/page.tsx`

All UI references were mapped from `READY_FOR_CHECKOUT` to `READY_FOR_PICKUP`.

### Requested Backend Changes

Confirm `READY_FOR_PICKUP` as the canonical value and update API documentation accordingly, or provide a compatibility alias if necessary.

### Verification

* Order counts appear correctly under READY_FOR_PICKUP.
* No orphaned READY_FOR_CHECKOUT status exists.

---

## Gap 3 — Missing Patient and Staff Display Fields

### Problem

Frontend originally expected flat `patientName` and `staffName` fields. Backend returns nested patient data and frequently omits staff information.

### Frontend Workaround

**File:** `src/app/pharmacy/orders/page.tsx`

* Patient names are derived from `patient.firstName` and `patient.lastName`.
* Staff names are derived from available staff data or temporary fallbacks.
* Search logic was updated to work with derived values.

### Requested Backend Changes

Include:

```json
{
  "patient": {
    "id": "",
    "firstName": "",
    "lastName": "",
    "phone": "",
    "email": ""
  },
  "staff": {
    "id": "",
    "firstName": "",
    "lastName": ""
  },
  "branch": {
    "id": "",
    "name": ""
  }
}
```

within order responses.

### Verification

* Patient names render correctly.
* Search works using patient names.
* Staff information is consistently displayed.

---

## Gap 4 — Owner Name Missing

### Problem

The dashboard greeting expects an owner name, but `GET /pharmacies/profile/me` only returns `representativeName`, which may be null.

### Frontend Workaround

**File:** `src/app/pharmacy/dashboard/page.tsx`

When `representativeName` is unavailable, the frontend performs an additional request to:

```http
GET /users/me
```

and derives the display name.

### Requested Backend Changes

Return either:

```json
{
  "ownerName": "Jean Doe"
}
```

or a nested user object containing name fields.

### Verification

* Dashboard greeting displays owner name.
* No secondary user lookup is required.

---

# 3. Medium / Low Priority Gaps

## Gap 5 — Analytics Response Shape Mismatch

### Problem

Analytics charts require display-ready data, but the backend currently returns a flat structure.

### Frontend Workaround

**File:** `src/app/pharmacy/analytics/page.tsx`

* Revenue data is transformed into 3M, 6M, and 1Y buckets.
* Percentages are calculated for branch revenue breakdowns.
* Missing values default to safe empty states.

### Requested Backend Changes

```json
{
  "revenueOverTime": {
    "3M": [],
    "6M": [],
    "1Y": []
  },
  "revenueByBranch": [
    {
      "name": "",
      "revenue": 0,
      "percentage": 0
    }
  ]
}
```

### Verification

* Analytics render without client-side normalization.
* Branch percentages are provided by the API.

---

## Gap 6 — Inventory Dosage Naming Mismatch

### Problem

Frontend expects `dosage` while the backend returns `chemicalName`.

### Frontend Workaround

**File:** `src/app/pharmacy/inventory/page.tsx`

```ts
dosage ?? chemicalName
```

### Requested Backend Changes

Standardize on a single field name across inventory APIs.

### Verification

* Medication dosage displays consistently.
* No frontend fallback logic is required.

---

# 4. Patients API Gaps

**Endpoint:** `GET /pharmacies/dashboard/patients`

## Gap 7 — Missing Extended Patient Profile Fields

### Frontend Workaround

Fallback placeholders are displayed when data is unavailable.

### Requested Backend Changes

```json
{
  "gender": "",
  "dateOfBirth": "",
  "address": "",
  "city": "",
  "postalCode": "",
  "registeredDate": "",
  "preferredBranch": "",
  "memberStatus": ""
}
```

### Verification

Patient profiles display complete demographic information.

---

## Gap 8 — Missing Prescription Matrix

### Frontend Workaround

```ts
p.prescriptions ?? []
```

### Requested Backend Changes

```json
{
  "prescriptions": [
    {
      "id": "",
      "rxNumber": "",
      "uploadedDate": "",
      "type": ""
    }
  ]
}
```

### Verification

Prescription tabs load without requiring empty-array fallbacks.

---

## Gap 9 — Incomplete Order Sub-Object Records

### Frontend Workaround

```ts
`${o.itemCount ?? 0} item(s)`
```

### Requested Backend Changes

```json
{
  "itemsSummary": "3 item(s)"
}
```

within patient order records.

### Verification

Order summaries render directly from API responses.

---

## Gap 10 — Order Timestamp Consistency

### Frontend Workaround

Date formatting is wrapped with null checks.

### Requested Backend Changes

```json
{
  "lastOrderDate": "2026-05-01T12:00:00Z"
}
```

or

```json
{
  "lastOrderDate": null
}
```

### Verification

Date formatting never encounters invalid values.

---

# 5. Notifications API Gaps

## Gap 11 — Multi-Tenant Notification Scope Issue

### Problem

Pharmacy users receive empty notification lists because notification filtering does not correctly apply pharmacy tenancy rules.

### Frontend Workaround

```ts
res.data?.data ?? res.data ?? []
```

### Requested Backend Changes

```http
GET /notifications?userType=pharmacy
PUT /notifications/:id/read
PUT /notifications/read-all?userType=pharmacy
```

must correctly return pharmacy-scoped notifications.

### Verification

Pharmacy users receive relevant notifications.

---

## Gap 12 — Missing orderId on Notifications

### Frontend Workaround

```ts
if (notif.orderId) {
  // navigate
}
```

### Requested Backend Changes

```json
{
  "orderId": "uuid"
}
```

for all order-related notifications.

### Verification

Notification actions can navigate directly to associated orders.

---

## Gap 13 — Missing OUT_OF_STOCK Classification

### Frontend Workaround

```ts
notif.title.toLowerCase().includes('out of stock')
```

### Requested Backend Changes

```json
{
  "type": "OUT_OF_STOCK"
}
```

instead of overloading:

```json
{
  "type": "LOW_STOCK"
}
```

### Verification

Inventory notifications can be categorized reliably.

---

# 6. Frontend Changes Summary

### `src/app/pharmacy/orders/page.tsx`

* Branch filter derived from order data.
* READY_FOR_CHECKOUT mapped to READY_FOR_PICKUP.
* Patient and staff names derived from nested objects.
* Search updated to support derived display values.

### `src/app/pharmacy/dashboard/page.tsx`

* Added fallback request to `GET /users/me`.
* Derived owner name from user profile fields.

### `src/app/pharmacy/analytics/page.tsx`

* Added analytics normalization logic.
* Derived branch revenue percentages.
* Replaced mock values with safe defaults.

### `src/app/pharmacy/inventory/page.tsx`

* Added dosage field fallback support.

### `src/app/pharmacy/patients/page.tsx`

* Added resilience for missing profile fields.
* Added prescription safeguards.
* Added order summary fallbacks.
* Added null-safe date handling.

### Notifications

* Added defensive payload unwrapping.
* Added notification routing guards.
* Added temporary OUT_OF_STOCK classification logic.
