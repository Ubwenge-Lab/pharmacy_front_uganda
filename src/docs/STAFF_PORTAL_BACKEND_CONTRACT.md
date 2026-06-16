# Staff Portal Backend Integration Contract

This document outlines the current integration gaps between the Staff Portal frontend and the backend API, along with the temporary workarounds implemented in the frontend.

## Gap 1: Profile Editing
**Frontend File:** `src/app/staff/profile/page.tsx`  
**Endpoint:** `PUT /staff/profile/me`  
**Description:** The frontend provides an edit form for staff members to update their profile details (`firstName`, `lastName`, `phone`). However, the backend currently returns a `404 Not Found` or `405 Method Not Allowed` because the endpoint does not exist in `staff.controller.ts`.  

### Expected Request Shape:
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string"
}
```

### Expected Response:
`200 OK` with the updated profile object.

### Frontend Workaround:
The frontend catches `404` or `405` errors on save and displays a notice banner: *"Profile editing is temporarily unavailable the backend update endpoint is being implemented."* The Save button is disabled after a failed attempt until further changes are made.

---

## Gap 2: Order Cancellation
**Frontend File:** `src/app/staff/orders/page.tsx`  
**Endpoint:** `PATCH /orders/:id/status`  
**Description:** The frontend previously allowed "Reject / Cancel Order" for all active states. However, the backend `validateStatusTransition()` only permits `PENDING` -> `CANCELLED`. Transitions from `ACCEPTED` or `PREPARING` to `CANCELLED` return a `400 Bad Request`.

### Expected Request Shape:
```json
{
  "status": "CANCELLED"
}
```

### Frontend Workaround:
The "Reject / Cancel Order" button is now conditionally rendered **only for PENDING orders**. For `ACCEPTED` and `PREPARING` orders, a read-only info line is shown: *"Cancellation at this stage requires a manager action."*

---

## Gap 3: Attendance Verification
**Frontend File:** `src/app/staff/dashboard/page.tsx`  
**Endpoints:** `POST /attendance/clock-in` and `POST /attendance/clock-out`  
**Description:** The frontend currently posts an empty body `{}`. The backend expects `ClockInDto` and `ClockOutDto` which may require fields (e.g., coordinates, notes, or branchId). Requests currently fail validation with generic messages.

### Expected Request Shape (Clock-In):
```json
{
  "branchId": "string",
  "notes": "string (optional)"
}
```

### Frontend Workaround:
The frontend now surfaces the **exact backend validation message** in the error toast (e.g., "branchId must be a UUID"). Additionally, the full request and response objects are logged to the console in development mode for easier debugging.

---

## Gap 4: Status Transition Availability
**Frontend File:** `src/app/staff/orders/page.tsx`  
**Endpoint:** `PATCH /orders/:id/status`  
**Description:** The transition from `PENDING` to `ACCEPTED` is defined in the frontend `NEXT_STATUSES` map. Although the backend was patched to allow this, it requires a server restart. Until then, it returns a `400 Cannot transition` error.

### Expected Request Shape:
```json
{
  "status": "ACCEPTED"
}
```

### Frontend Workaround:
The frontend wraps the status advance call in a specific catch for `400` errors containing "Cannot transition". It displays a user-friendly message: *"Status transition not yet available backend is being updated. Please try again shortly."* instead of a raw error toast.

---

## Additional Observations
- **Inventory Updates:** `PUT /medications/:id` returns `403 Forbidden` for Cashiers even when they have been assigned medication edit permissions. The backend should verify permission-based access controls for this route.
- **Prescription Status:** `PUT /prescriptions/:id/status` is functional for `PHARMACIST`, but the action does not currently trigger a notification to the patient. Backend should implement notification logic (e.g., SMS or Email) upon status changes.
- **Clock-In Requirements:** The frontend sends an empty body `{}` to endpoints expecting `ClockInDto`. Backend should clearly define if `branchId` or `location` are mandatory.
