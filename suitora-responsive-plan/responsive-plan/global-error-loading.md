# Responsive Plan: Global Error, Not Found & Loading

**Scope:** `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx` (+ any route-level loading UI)

---

## 1. Goals

- Error and empty states are centered, calm, and usable on every device.
- Loading skeletons mirror the layout of the destination page so content does not “jump” when ready.
- CTAs (home, retry, dashboard) meet touch-target and alignment standards.

---

## 2. Error & Not-Found Pages

### Layout
- Full viewport center: `min-h-dvh flex flex-col items-center justify-center px-4 text-center`.
- Content block: `max-w-md w-full`.

### Elements
| Element | Rules |
|---------|--------|
| Icon / illustration | Fixed aspect, `w-16 h-16 sm:w-20 sm:h-20`, centered |
| Title | `text-xl sm:text-2xl font-semibold` |
| Message | `text-sm sm:text-base text-muted mt-2` |
| Actions | Stacked full-width on mobile (`flex-col gap-3`); row on `sm+` if two buttons; each min-height 44px |
| Secondary link | Below actions, adequate tap area |

### Alignment
- All text centered as a block; buttons share the same width when stacked so edges align.
- No content closer than 16px to screen edges.

---

## 3. Loading UI

### Global `loading.tsx`
- Prefer a lightweight centered spinner **or** a generic page skeleton that matches dashboard shell (top bar + content blocks) so authenticated routes feel stable.
- Spinner: centered in content area, not the whole viewport if shell is already visible.

### Page-level skeletons (dashboard pages)
- Match final layout structure:
  - Header skeleton: title bar + optional action button placeholders.
  - Card grid: same `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` as real content.
  - List rows: same height and left/right padding as real list items.
- Skeleton blocks use consistent border-radius and spacing tokens so when real content appears, alignment does not shift (minimize CLS).

### Rules
- Never show a skeleton wider than the eventual content max-width.
- Animate subtly; respect `prefers-reduced-motion`.

---

## 4. Testing Matrix

| State | 320 | 768 | 1280 |
|-------|-----|-----|------|
| not-found | Centered, buttons tappable | Same | Same |
| error + retry | Same | Same | Same |
| loading skeleton | Matches page grid | Matches 2-col | Matches 3-col |

---

## 5. Implementation Tasks

1. [ ] Unified empty/error component with responsive action layout.
2. [ ] Route loading skeletons aligned to each page’s grid (at least dashboard, history, trending).
3. [ ] CLS check: skeleton → content width parity.

---

## 6. Risks

- Full-page spinner on slow navigations feels broken → prefer structured skeletons inside the shell.
