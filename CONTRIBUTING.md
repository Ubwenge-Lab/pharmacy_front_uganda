# Contributing

How we branch, commit, and ship changes to `pharmacy_front`. Local setup lives
in the [README](README.md#getting-started).

## Branching

Branch off `main`, one logical change per branch. Prefix by type:

- `feat/…` — new functionality
- `fix/…` — bug fix
- `refactor/…` — internal change, no behaviour change
- `docs/…` — documentation

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) —
`type(scope): summary`, imperative mood. Types we use: `feat`, `fix`,
`refactor`, `docs`, `style`, `test`, `chore`.

```
feat(patient): add prescription upload to checkout
fix(auth): clear stale cookies when refresh token is missing
```

## Code conventions

Specific to this repo — following them keeps reviews fast:

- **TypeScript** — use real types, avoid `any`.
- **Design tokens, not hex.** Use `bg-brand-navy`, `text-brand-teal`, … — see
  [`src/DESIGN_TOKENS.md`](src/DESIGN_TOKENS.md).
- **Status pills** use the shared `StatusBadge`
  (`src/components/shared/StatusBadge.tsx`) — never hand-roll one.
- **Icons** come from Heroicons, sized with Tailwind (`w-5 h-5`).
- **No hardcoded UI text** — everything user-facing goes through `t('…')`.
- **HTTP** goes through the shared axios instance in `src/lib/api.ts`.

## Translations

Every user-facing string lives in all three dictionaries —
`src/lib/i18n/{en,fr,rw}.ts`:

1. Add the key + English value to `en.ts` (the source of truth).
2. Mirror the key in `fr.ts` and `rw.ts`.
3. Unsure of a translation? Add a best-effort value tagged `[REVIEW XX]`
   rather than leaving it out — see [`docs/i18n.md`](docs/i18n.md).

A missing key silently falls back to English, so keep all three in sync.

## Pull requests

Target `main` and fill in the
[PR template](.github/pull_request_template.md). List the exact screens or flows
a reviewer should check.

Before opening:

- [ ] `npm run build` passes (this also type-checks)
- [ ] `npm run lint` passes
- [ ] new strings exist in `en`, `fr`, and `rw`
- [ ] affected screens verified in the browser
- [ ] no secrets or `.env.local` committed

Reviews go to the frontend lead, [@tresor-01](https://github.com/tresor-01).

For security issues, do **not** open a public issue — see
[`SECURITY.md`](SECURITY.md).
