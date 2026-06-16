# Patient Portal & Branch Manager Portal — Backend Contract

> **Purpose:** Documents the frontend-side logic applied as workarounds for backend inconsistencies.
> The backend team should apply the same logic server-side so these workarounds can be removed.
> Last updated: 2026-05-25

---

## 1. Dual Order Item Field Names

### Problem
Two endpoints return order items under different field names:

| Endpoint | Field returned |
|---|---|
| `GET /orders/:id` | `items: OrderItem[]` |
| `GET /orders/my-orders` | `orderItems: OrderItem[]` (sometimes `items`) |
| `GET /orders/pharmacy-orders` | `orderItems: OrderItem[]` |

This causes runtime `undefined` reads when code written for one endpoint is used against the other.

### Frontend fix (applied)
`src/lib/orderUtils.ts` exports a `getOrderItems(order)` helper:

```ts
export function getOrderItems(order: Order): OrderItem[] {
  return order.orderItems ?? order.items ?? [];
}
```

All patient portal pages now call `getOrderItems(order)` instead of accessing either field directly.

### Backend action required
Standardise on one field name — recommend `items` — across all order response DTOs:
- `GET /orders/:id`
- `GET /orders/my-orders`
- `GET /orders/pharmacy-orders`
- `GET /orders/branch-orders` (if applicable)

---

## 2. Pending Order Count Missing Statuses

### Problem
`GET /orders/my-orders` returns orders with statuses `OUT_FOR_DELIVERY` and `READY_FOR_PICKUP`,
but the patient dashboard previously only counted `PENDING`, `ACCEPTED`, and `PREPARING` as "pending".
This caused the "active orders" counter to under-report in-flight orders.

### Frontend fix (applied)
`src/lib/constants.ts` defines the canonical status groups used everywhere:

```ts
export const PENDING_STATUSES = [
  'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP',
];
export const COMPLETED_STATUSES = ['DELIVERED', 'CANCELLED', 'COMPLETED'];
```

These replace all inline `['PENDING', 'ACCEPTED', 'PREPARING'].includes(...)` filters.

### Backend action required
None required — this is purely a frontend filtering issue. However, confirm that the full set of
active statuses the backend transitions through is: `PENDING → ACCEPTED → PREPARING →
OUT_FOR_DELIVERY | READY_FOR_PICKUP → DELIVERED`. If additional statuses exist, update the
`PENDING_STATUSES` constant accordingly.

---

## 3. Hardcoded Rejection Reasons (Branch Manager Dashboard)

### Problem
`branch/dashboard/page.tsx` previously sent `{ reason: 'Rejected by manager' }` (hardcoded,
i18n string) for every clock-in / clock-out rejection. Staff could not see a meaningful reason.

### Frontend fix (applied)
`branch/dashboard/page.tsx` and `branch/attendance/page.tsx` now show an inline textarea
when the manager clicks the reject button. The manager types a reason before confirming.
The reason is sent as-is to:
- `PUT /attendance/:id/reject-clock-in   { reason: string }`
- `PUT /attendance/:id/reject-clock-out  { reason: string }`

### Backend action required
Confirm that the `reason` field on the attendance rejection endpoints is stored and returned in
attendance records so staff can see why their clock-in/out was rejected. If `reason` is currently
optional and not persisted, make it required and persist it.

---

## 4. Browser `prompt()` Used for Rejection Reason (Attendance Page)

### Problem
`branch/attendance/page.tsx` used `window.prompt()` to collect the rejection reason. This:
- Blocks the browser UI thread
- Is unstyled and inaccessible
- Cannot be tested in automated tests
- Does not work in some embedded/iframe environments

### Frontend fix (applied)
Replaced `prompt()` with the same inline textarea pattern used in the prescriptions page and
branch dashboard. State: `rejectingId: string | null` keyed as `id + '-in'` or `id + '-out'`,
plus `rejectReason: string`. The textarea renders inline within the table action cell.

### Backend action required
Same as §3 above — persist and return the `reason` field.

---

## 5. Branch Manager Inventory Access Gated by Role

### Problem
`GET /medications/pharmacy/my-medications` returns HTTP 403 for `BRANCH_MANAGER` role.
The branch inventory page (`branch/inventory/page.tsx`) catches this 403 and displays a
"pending backend" banner explaining the exact endpoints and role that need to be added.

### Backend action required
Add `Role.BRANCH_MANAGER` to the `@Roles()` decorator on the following endpoints in
`medications.controller.ts`:
- `GET /medications/pharmacy/my-medications`
- `GET /medications/pharmacy/low-stock`
- `GET /medications/pharmacy/out-of-stock`
- `POST /medications`
- `PUT /medications/:id`

No frontend changes will be needed once this is done.

---

## Files changed (frontend)

| File | Change |
|---|---|
| `src/lib/constants.ts` | Added `PENDING_STATUSES`, `COMPLETED_STATUSES` |
| `src/lib/orderUtils.ts` | New — `getOrderItems()` helper |
| `src/app/patient/orders/page.tsx` | Use `getOrderItems()`, import constants |
| `src/app/patient/dashboard/page.tsx` | Use `getOrderItems()`, use `PENDING_STATUSES` |
| `src/app/branch/dashboard/page.tsx` | Inline reject textarea for clock-in/out |
| `src/app/branch/attendance/page.tsx` | Replace `prompt()` with inline reject textarea |
