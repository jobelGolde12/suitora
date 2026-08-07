# Suitora — Responsive Design Plan Inventory

**Project:** Suitora — AI Fashion Compatibility Platform  
**Goal:** Every page and shell must be fully responsive across mobile (320px+), tablet (768px+), laptop (1024px+), and desktop (1280px+ / 1536px+). Content and elements must stay well aligned, readable, and usable with no horizontal overflow, no cramped touch targets, and consistent visual hierarchy.

**Audit Date:** August 2026  

**Design system baseline (Tailwind v4):**
| Token | Mobile-first | Notes |
|-------|----------------|-------|
| Breakpoints | `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536 | Use mobile-first utilities |
| Touch targets | ≥ 44×44 px | Buttons, icon buttons, nav links |
| Page padding | `px-4` → `sm:px-6` → `lg:px-8` | Consistent gutters |
| Max content width | `max-w-7xl` (dashboard) / `max-w-3xl`–`5xl` (narrow) | Center with `mx-auto` |
| Type scale | `text-sm` body on mobile → `text-base`+ on desktop | Avoid fixed large headings on small screens |
| Sidebar | Collapsed / drawer on `< lg` | Persistent on `lg+` |

---

## Page & Shell Plans

### Shared Layouts
| File | Scope |
|------|--------|
| [layout-dashboard-shell.md](responsive-plan/layout-dashboard-shell.md) | Dashboard layout, sidebar, top bar, mobile nav |
| [layout-auth.md](responsive-plan/layout-auth.md) | Auth pages shell (login/register/forgot/reset) |
| [layout-landing.md](responsive-plan/layout-landing.md) | Landing / marketing shell |
| [layout-legal.md](responsive-plan/layout-legal.md) | Legal pages shell |
| [global-error-loading.md](responsive-plan/global-error-loading.md) | `error.tsx`, `not-found.tsx`, `loading.tsx` |

### Public & Auth Pages
| File | Route |
|------|--------|
| [landing-page.md](responsive-plan/landing-page.md) | `/` |
| [login.md](responsive-plan/login.md) | `/login` |
| [register.md](responsive-plan/register.md) | `/register` |
| [forgot-password.md](responsive-plan/forgot-password.md) | `/forgot-password` |
| [reset-password.md](responsive-plan/reset-password.md) | `/reset-password` |
| [privacy-policy.md](responsive-plan/privacy-policy.md) | `/privacy-policy` |

### Dashboard App Pages
| File | Route |
|------|--------|
| [dashboard.md](responsive-plan/dashboard.md) | `/dashboard` |
| [upload.md](responsive-plan/upload.md) | `/upload` |
| [results.md](responsive-plan/results.md) | `/results/[id]` |
| [history.md](responsive-plan/history.md) | `/history` |
| [favorites.md](responsive-plan/favorites.md) | `/favorites` |
| [wardrobe.md](responsive-plan/wardrobe.md) | `/wardrobe` |
| [compare.md](responsive-plan/compare.md) | `/compare` |
| [stylist.md](responsive-plan/stylist.md) | `/stylist` |
| [trending.md](responsive-plan/trending.md) | `/trending` |
| [trending-detail.md](responsive-plan/trending-detail.md) | `/trending/[id]` |
| [settings.md](responsive-plan/settings.md) | `/settings` |

---

## Cross-Cutting Rules (apply to every plan)

1. **No horizontal scroll** at any breakpoint (test 320, 375, 390, 414, 768, 1024, 1280, 1440).
2. **Single column** as default; introduce multi-column only at `md` or `lg` when content supports it.
3. **Images** use `next/image` with responsive `sizes` and never force fixed widths that break the container.
4. **Forms** stack full-width on mobile; labels above inputs; errors visible without layout shift.
5. **Cards / grids** use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (or similar); equal height via flex/grid, not fixed heights.
6. **Modals / drawers** full-screen or bottom-sheet on mobile; centered dialog on `md+`.
7. **Tables / dense lists** become stacked cards on mobile.
8. **Alignment** — every section uses consistent horizontal padding from the page container; nested elements align to the same grid.
9. **Typography** — headings scale down on small screens (`text-2xl sm:text-3xl lg:text-4xl`); body remains readable (≥ 16px preferred for long text).
10. **Focus & a11y** — visible focus rings; logical tab order; skip links where helpful.

---

## Implementation Priority

1. **P0 — Shared shells** (dashboard sidebar, auth, landing) — unlocks all pages  
2. **P1 — Core flows** (Landing, Upload, Results, Dashboard)  
3. **P2 — Collection pages** (History, Favorites, Wardrobe, Compare)  
4. **P3 — Discovery & account** (Trending, Stylist, Settings, Legal)  
5. **P4 — Edge states** (Error, Not Found, Loading, empty states)

Each page plan below is self-contained and actionable.
