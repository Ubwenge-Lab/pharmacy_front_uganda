# Architecture

This document describes how `pharmacy_front` is organised, how users are routed,
and how the app authenticates and talks to the backend.

## High-level shape

`pharmacy_front` is a single Next.js (App Router) application that serves five
role-based portals from one codebase. The backend API lives in a separate
service; this app is a pure client of that API.

```
Browser ──> Next.js (App Router + edge middleware) ──> Backend API (HTTP/JWT)
```

## The five portals

Each portal is a top-level segment under `src/app/`:

| Portal | Route prefix | Audience |
|---|---|---|
| Patient | `/patient/*` | End users ordering medication |
| Pharmacy | `/pharmacy/*` | Pharmacy owners / representatives |
| Branch | `/branch/*` | Branch managers |
| Staff | `/staff/*` | Pharmacists, cashiers, nurses |
| Super-admin | `/super-admin/*` | Platform administrators |

Public routes (login, signup, email verification, password reset, the various
"pending"/"rejected" screens) live at the top level and are not guarded.

## Routing & authorization

### Edge middleware

`src/middleware.tsx` runs on every request to a guarded prefix (see its
`matcher`). It:

1. Reads the `accessToken` cookie.
2. Decodes the JWT payload to obtain `role` and (for pharmacies) account status.
3. Redirects to `/` if there is no token or the token can't be decoded.
4. Enforces role-appropriate access per prefix:
   - `/super-admin/*` → `SUPER_ADMIN`
   - `/pharmacy/*` → `PHARMACY`, then branches on status:
     `PENDING` → `/pending-approval`, `REJECTED` → `/pharmacy-rejected`,
     `APPROVED` → allowed
   - `/patient/*` → `PATIENT`, **and** the patient feature flag (env var or
     `dev_mode` cookie) must be enabled
   - `/branch/*` → `BRANCH_MANAGER`
   - `/staff/*` → `PHARMACIST`, `CASHIER`, or `NURSE`

> The middleware decodes the token payload to route requests. The backend API
> remains the authoritative validator of tokens and permissions — the frontend
> guard is for navigation/UX, not the security boundary.

### Post-login routing

`AuthContext` (`src/context/AuthContext.tsx`) decides where to send a user
immediately after login, mirroring the middleware rules:

- `PATIENT` → `/patient/dashboard`
- `PHARMACY` → `/pharmacy/dashboard` (or the pending/rejected screen by status)
- `SUPER_ADMIN` → `/super-admin/dashboard`
- `BRANCH_MANAGER` → `/branch/dashboard` (or `/branch/change-password` on first
  login with a temporary password)
- `PHARMACIST` / `CASHIER` / `NURSE` → `/staff/dashboard` (or
  `/staff/change-password` on first login)

## Authentication & session

- **Tokens.** A short-lived **access token** and a longer-lived **refresh
  token** are stored as cookies via `js-cookie`. The signed-in user can be
  reconstructed from the token (see `src/lib/auth.ts`).
- **Request auth.** The shared axios instance (`src/lib/api.ts`) attaches
  `Authorization: Bearer <accessToken>` to every request through a request
  interceptor.
- **Refresh flow.** A response interceptor watches for `401`s. On the first
  `401` for a request, it tries to refresh the access token using the refresh
  token and retries the original request once. If refresh fails (or there's no
  refresh token), it clears the session cookies and redirects to `/login`.
- **Auth API.** Login, registration, verification, password reset/change, and
  logout are exposed through `authApi` in `src/lib/api.ts`.

## API layer

All HTTP traffic goes through `src/lib/api.ts`:

- Base URL comes from `NEXT_PUBLIC_API_URL` (defaults to
  `http://localhost:4000/api`).
- Requests send credentials (`withCredentials: true`) and time out after 15s.
- `unwrapData()` normalises responses that sometimes return an array directly
  and sometimes wrap it as `{ data: [...] }`.

Higher-level data access is organised in:

- `src/services/` — API service wrappers (e.g. pharmacy lookups)
- `src/hooks/useFetch.ts` — a reusable fetch hook with abort handling

## State & context

- **`AuthContext`** — current user, `login`, `logout`, `refreshUser`.
- **`CartContext`** — patient shopping cart state.

## Cross-cutting building blocks

- **Shared components** (`src/components/shared/`) — `StatusBadge`,
  `LoadingSpinner`, `LocationPicker`, `LanguageSwitcher`, etc.
- **Maps** (`src/components/map/`, `src/features/map/`) — Leaflet/react-leaflet
  components for pharmacy discovery, including heatmaps.
- **Design tokens** — brand colours are defined as Tailwind v4 `@theme` tokens;
  see [`../src/DESIGN_TOKENS.md`](../src/DESIGN_TOKENS.md).
- **Constants** (`src/lib/constants.ts`) — shared values like the Rwanda FDA
  medication categories, polling interval, and page size.

## Feature flags

The patient portal is gated. It is visible when **either**:

- `NEXT_PUBLIC_ENABLE_PATIENT_FEATURES=true`, **or**
- the `dev_mode` cookie is `true` (set locally via `?dev_mode=true`).

The check lives in `src/lib/features.ts` and is enforced both in middleware and
in patient UI.

## Internationalization

Strings are served in English, French, and Kinyarwanda via `i18next` /
`react-i18next`. See [`i18n.md`](i18n.md).
