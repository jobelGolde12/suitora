# Responsive Plan: Dashboard Shell (Layout)

**Scope:** `app/(dashboard)/layout.tsx` + `components/layout/*` + sidebar / top bar / mobile nav  
**Applies to:** All authenticated pages (`/dashboard`, `/upload`, `/history`, `/favorites`, `/wardrobe`, `/compare`, `/stylist`, `/trending`, `/settings`, `/results/[id]`, etc.)

---

## 1. Goals

- Usable on 320px–4K without horizontal scroll.
- Sidebar never permanently consumes critical mobile viewport width.
- Content area always has consistent, aligned gutters.
- Navigation remains discoverable and reachable with thumb on mobile.

---

## 2. Breakpoint Strategy

| Range | Behavior |
|-------|----------|
| `< lg` (default → 1023px) | Sidebar **off-canvas** (drawer). Hamburger in top bar opens/closes it. Content is full width minus page padding. |
| `≥ lg` (1024px+) | Sidebar **persistent**, fixed or sticky left. Content area has `margin-left` / flex sibling equal to sidebar width. |
| `≥ xl` | Optional slightly wider content max-width; sidebar width can stay constant. |

**Sidebar width tokens**
- Mobile drawer: full width up to `max-w-xs` (320px) or 85vw.
- Desktop: fixed `w-64` (256px) or `w-72` — never fluid in a way that squeezes content unpredictably.

---

## 3. Element-by-Element Alignment

### 3.1 Top Bar (mobile + desktop)

| Element | Mobile (`< lg`) | Tablet / Desktop (`≥ lg`) | Alignment rules |
|---------|-----------------|---------------------------|-----------------|
| Container | `h-14` or `h-16`, full width, `px-4`, border-b, sticky top-0, z-40 | Same height, `px-6 lg:px-8` | Vertical center all children with `items-center` |
| Menu (hamburger) | Visible, 44×44 min touch target, left-aligned | Hidden (`lg:hidden`) | Icon centered in button |
| Logo / wordmark | Centered or left of title area | Left, after sidebar start | Never overflow; truncate if needed |
| Page title (optional) | Truncate with `truncate` | Full | Single line |
| Right actions (user menu, theme, notifications) | Icon buttons, 44×44, gap-2 | Same | Right-aligned group; no wrap that pushes height |

**Alignment checklist**
- [ ] All top-bar items share one horizontal baseline (`flex items-center`).
- [ ] Padding left of content matches page container padding so titles align with body content.
- [ ] Safe-area: respect `env(safe-area-inset-top)` on notched devices if using fixed positioning.

### 3.2 Sidebar / Drawer

| Element | Mobile drawer | Desktop sidebar | Alignment rules |
|---------|---------------|-----------------|-----------------|
| Backdrop | Full viewport, semi-transparent, closes on click | N/A | `fixed inset-0 z-40` |
| Panel | `fixed inset-y-0 left-0 z-50`, slide-in transform | `sticky top-0 h-screen` or fixed | Vertical scroll independent of content |
| Logo block | Top, `px-4 py-5`, aligned with nav items | Same | Logo + product name on one baseline |
| Nav group labels | `text-xs uppercase tracking-wide`, `px-4` | Same | Consistent left padding for all labels and links |
| Nav links | Full-width row, `px-4 py-3`, icon + label, min-height 44px | Same | Icons in fixed-width column (e.g. `w-5`) so labels align vertically across items |
| Active state | Clear background / left border accent | Same | Accent bar aligned to left edge of panel |
| Footer (user / logout) | Bottom of panel, `mt-auto`, `px-4 py-4` | Same | Separated by border-t; avatar + name truncate |

**Alignment checklist**
- [ ] Icon column width identical for every nav item → text columns align.
- [ ] Horizontal padding of logo, labels, and links is identical (`px-4`).
- [ ] Drawer does not shift body scroll; use `overflow-hidden` on `body` while open.
- [ ] Focus trap inside open drawer; Escape closes.

### 3.3 Main Content Area

| Rule | Value |
|------|--------|
| Horizontal padding | `px-4 sm:px-6 lg:px-8` |
| Vertical padding | `py-6 sm:py-8` (page-level) |
| Max width | Prefer `max-w-7xl mx-auto` for wide pages; `max-w-3xl` / `max-w-5xl` for narrow (stylist, forms) |
| Min height | `min-h-[calc(100dvh-theme(spacing.16))]` so short pages still fill viewport without awkward gaps |

**Alignment checklist**
- [ ] Page header (`PageHeader`) title, description, and actions sit on the same horizontal grid as cards below.
- [ ] Nested grids inherit the same left/right edges — no “indented islands” unless intentionally nested cards.
- [ ] Bottom spacing accounts for mobile browser chrome (`pb-safe` or extra `pb-8`).

### 3.4 Mobile Bottom Nav (optional enhancement)

If product decides on bottom tab bar for primary destinations:
- Fixed bottom, `h-16`, safe-area inset.
- 4–5 icons max; labels optional on very small screens.
- Must not collide with floating CTAs (raise CTA above bar or hide bar on certain routes).

---

## 4. Typography & Spacing Scale (shell)

- Sidebar labels: `text-sm font-medium`
- Section labels: `text-xs font-semibold uppercase tracking-wider text-muted`
- Top bar title: `text-base sm:text-lg font-semibold`
- Consistent vertical rhythm: 8px base (`space-y-2`, `gap-4`, `gap-6`)

---

## 5. Interaction & Motion

- Drawer open/close: 200–300ms ease-out transform (`-translate-x-full` → `translate-x-0`).
- Prefer `prefers-reduced-motion` media query to disable transform.
- Overlay click and Escape both close drawer.
- Body scroll lock while drawer open.

---

## 6. Testing Matrix (shell)

| Device width | Must pass |
|--------------|-----------|
| 320 | Drawer opens full usable width; content not shifted; no horizontal scroll |
| 375 / 390 / 414 | Same + comfortable touch targets |
| 768 | Drawer still (or optional persistent mini); content padding comfortable |
| 1024 | Persistent sidebar; content starts after sidebar; no overlap |
| 1280 / 1440 | Sidebar + max-w content centered or left-aligned consistently |
| Landscape phone | Drawer usable; top bar does not eat entire height |

---

## 7. Implementation Tasks

1. [ ] Extract sidebar into a single component with `isMobile` / `open` controlled state.
2. [ ] Top bar: hamburger only `< lg`; user menu always right.
3. [ ] Content wrapper: shared `PageContainer` with standardized `px-*` and `max-w-*`.
4. [ ] Lock body scroll when drawer open; restore on close / route change.
5. [ ] Focus management for drawer.
6. [ ] Visual regression checks at listed breakpoints.
7. [ ] Document sidebar width CSS variable (`--sidebar-width`) for content offset.

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Fixed sidebar overlaps content on resize across `lg` | Use CSS media queries or container queries; avoid JS-only layout |
| iOS Safari address bar changes viewport height | Prefer `dvh` / `100dvh` over `100vh` |
| Nested scroll areas fight each other | Sidebar `overflow-y-auto`; main `overflow-x-hidden` |
