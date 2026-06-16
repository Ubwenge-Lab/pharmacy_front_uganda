# Security Policy

`pharmacy_front` handles patient, prescription, and pharmacy data, so security
matters here. If you've found a problem, thank you for disclosing it
responsibly — here's how to reach us.

## Reporting a vulnerability

Please report it **privately**. Don't open a public issue, pull request, or
discussion — that could expose the problem before there's a fix.

Reach out directly to one of the project leads:

- **Robert** — project lead
- **Tresor** — frontend lead ([@tresor-01](https://github.com/tresor-01))

It helps to include:

- **What and where** — the issue, and the route, screen, or file it affects
- **How to reproduce it** — clear steps
- **Impact** — what someone could do with it

We'll acknowledge your report, investigate, and keep you posted on the fix.
Please give us a reasonable window to patch it before any public disclosure.

## Scope

This policy covers the **`pharmacy_front`** web app. If you spot something in the
backend API or a third-party dependency, report it the same way and we'll
coordinate the fix with the right people.

## Supported versions

Only the latest version deployed from `main` is supported — we fix forward
rather than patching older builds.

## How the frontend handles security

A quick map of the moving parts — full detail lives in
[`docs/architecture.md`](docs/architecture.md):

- **Authentication** — JWT access and refresh tokens stored in cookies. The
  access token is short-lived; the refresh token lasts longer.
- **Token refresh** — automatic in `src/lib/api.ts`: on a `401` it refreshes
  once and retries the request, or clears the session and redirects to login.
- **Route access** — edge middleware (`src/middleware.tsx`) gates every portal
  by role (patient, pharmacy, branch, staff, super-admin) and, for pharmacies,
  by account status (pending / rejected / approved).
- **The frontend is not the security boundary** — client-side checks exist for
  UX. The backend API is the authoritative enforcer of authentication,
  authorization, and data access, so never rely on the frontend alone to protect
  a resource.
