# Design Tokens & UI Conventions

This document is the single source of truth for visual tokens in the Evuze frontend. New components and refactors should reach for tokens defined here before introducing new values.

## Brand color tokens

Defined in `src/app/globals.css` inside the `@theme {}` block. Tailwind v4 picks them up automatically and generates the matching utility classes.

| Token CSS variable          | Hex value | Tailwind utilities                                                |
|-----------------------------|-----------|-------------------------------------------------------------------|
| `--color-brand-navy`        | `#1E4D8C` | `bg-brand-navy`, `text-brand-navy`, `border-brand-navy`, `ring-brand-navy`, opacity variants like `bg-brand-navy/10` |
| `--color-brand-navy-dark`   | `#1a3d6f` | `bg-brand-navy-dark`, `text-brand-navy-dark`, etc.                |
| `--color-brand-teal`        | `#2D9B8A` | `bg-brand-teal`, `text-brand-teal`, etc.                          |
| `--color-brand-teal-light`  | `#F0F7F6` | `bg-brand-teal-light`, etc.                                       |

**Rules:**
- Never write a brand hex literal in JSX. No `style={{ color: '#1E4D8C' }}`, no `bg-[#2D9B8A]`. Always use the token utility.
- For CSS gradients that mix a brand color with a non-brand stop, use the CSS variable: `style={{ background: 'linear-gradient(135deg, var(--color-brand-navy), #0f2a5c)' }}`.
- For opacity, use the slash modifier: `bg-brand-teal/10` instead of `${TEAL}1a`. Tailwind generates the rgba.

**Documented exceptions** (where inline hex is acceptable):
- Leaflet `divIcon` HTML template strings — Tailwind classes don't apply inside Leaflet's raw HTML.
- Leaflet API params (`L.polyline({ color })`) — same reason.
- Chart/SVG presentation attributes (`stroke`, `fill`) in Recharts components — they hit the SVG attribute path, not CSS.
- The `--tw-ring-color` CSS custom property when not using `ring-brand-*` directly.
- Dynamic computed colors from a runtime map (e.g. `MARKER_COLORS[m.type]` in `BaseMap.tsx`).

## Spacing scale

Default to these step sizes. Don't introduce values between them without a reason.

| Use                                                        | Tailwind utility |
|------------------------------------------------------------|------------------|
| Card / section interior padding                            | `p-6` (`p-4` on `sm`, `p-8` on `lg+`) |
| Compact list/row padding                                   | `p-4`            |
| Grid / flex gap between cards                              | `gap-4`          |
| Grid / flex gap between sections                           | `gap-6`          |
| Stat card icon → text gap                                  | `gap-3`          |
| Vertical rhythm between major sections inside a page       | `space-y-6`      |
| Vertical rhythm between rows inside a list                 | `space-y-3`      |

## Border radius scale

| Element                                       | Class         |
|-----------------------------------------------|---------------|
| Top-level card / modal panel                  | `rounded-2xl` |
| Pill button / badge / tag                     | `rounded-full`|
| Standard button / form input                  | `rounded-xl`  |
| Avatar / status dot container                 | `rounded-full`|
| Icon background tile inside a card            | `rounded-xl`  |
| Inline tooltip / micro-pill                   | `rounded-lg`  |

Avoid `rounded-lg` for full cards and `rounded-2xl` for inputs — that mismatch is what made the codebase feel inconsistent before.

## Status badges

All status pills must render through `src/components/shared/StatusBadge.tsx`. Do not hand-roll a `<span>` with `bg-emerald-50 text-emerald-700`-style classes.

```tsx
import StatusBadge from '@/components/shared/StatusBadge';

<StatusBadge status={order.status} />                              {/* default sm */}
<StatusBadge status={shift.status} label="Active shift" size="md" />
<StatusBadge status="OPEN" withDot={false} />
```

Supported `status` values (see `StatusValue` in the component): order lifecycle (`PENDING`, `ACCEPTED`, `PREPARING`, `OUT_FOR_DELIVERY`, `READY_FOR_PICKUP`, `DELIVERED`, `COMPLETED`, `CANCELLED`), approval (`APPROVED`, `REJECTED`), attendance (`CLOCKED_OUT`), entity (`ACTIVE`, `INACTIVE`), inventory (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), pharmacy hours (`OPEN`, `CLOSED`).

Unknown status strings fall back to a neutral gray badge, so it is safe to pass any backend value.

## Icons

Use **Heroicons** only. `lucide-react` is no longer a dependency.

```tsx
import { BellIcon, UserIcon } from '@heroicons/react/24/outline';
```

Outline weight is the default. Use `/24/solid` only for filled states (e.g. a checkmark inside a completed step).

Heroicons does not accept a `size` prop. Size icons with Tailwind sizing utilities (`className="w-5 h-5"`). Standard sizes:

| Use                                | Class            |
|------------------------------------|------------------|
| Inline next to body text           | `w-4 h-4`        |
| Sidebar / topbar nav icon          | `w-[18px] h-[18px]` or `w-5 h-5` |
| Stat card / hero feature icon      | `w-6 h-6` to `w-8 h-8` |
| Empty-state hero icon              | `w-10 h-10` or larger |

## File layout

- Shared cross-portal UI lives in `src/components/shared/`.
- Portal-scoped UI lives in `src/components/{patient|pharmacy|branch|staff|map}/`.
- Page-level layout lives under `src/app/{portal}/`.

## Where this is enforced

- `npm run build` must pass before merge.
- `grep -r "#1E4D8C\|#2D9B8A\|#1a3d6f\|#F0F7F6" src/` must return no results outside `globals.css` and the documented exemption files (Leaflet templates, dynamic marker color maps, `--tw-ring-color` declarations).
- `grep -r "lucide-react" src/` must return zero results.
- `grep -r "\[#1E4D8C\]\|\[#2D9B8A\]" src/` must return zero results.
