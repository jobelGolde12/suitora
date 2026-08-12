# Responsive Plan: Landing Layout

**Scope:** `app/(landing)/layout.tsx` + landing header/footer components

---

## 1. Goals

- Marketing page reads cleanly from phone to ultrawide.
- Header navigation collapses cleanly; CTAs always reachable.
- Sections share one horizontal alignment grid so the page feels designed, not stacked randomly.

---

## 2. Breakpoint Strategy

| Range | Header / Nav | Content |
|-------|--------------|---------|
| `< md` | Logo + hamburger; links in drawer or accordion | Single column, `px-4` |
| `md`–`lg` | Logo + compact links or still hamburger | `px-6`, some 2-col feature grids |
| `≥ lg` | Full horizontal nav + primary CTA | `px-8`, multi-column sections, `max-w-7xl mx-auto` |

---

## 3. Element-by-Element Alignment

### 3.1 Header
- Sticky or static with `h-14 sm:h-16`.
- **Mobile:** Logo left, menu button right (44×44). Drawer contains nav links + CTA stacked, left-aligned text, full-width CTA at bottom of drawer.
- **Desktop:** Logo left; nav links center or left-of-CTA; primary CTA right. All items `items-center` on one row.
- Horizontal padding matches section containers (`px-4 sm:px-6 lg:px-8`) so logo and section content share the same left edge when `max-w-7xl` is applied.

### 3.2 Section containers (all landing sections)
- Wrapper: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- Vertical section spacing: `py-12 sm:py-16 lg:py-24` (consistent rhythm).
- Section headings: centered or left; if left, align with body column, not viewport edge.
- Section subcopy: `max-w-2xl` when centered so lines do not become unreadably long on wide screens.

### 3.3 Hero
- Stack: eyebrow → title → subtitle → CTA group → optional media.
- Mobile: title `text-3xl`–`text-4xl`; CTAs full-width stacked or side-by-side if short.
- Desktop: title `text-5xl`–`text-6xl`; CTAs inline with gap.
- Media (image/video): full width of content column; aspect-ratio locked; never wider than container.
- Align CTA group center (if centered hero) or start (if left-aligned hero) — pick one and keep consistent.

### 3.4 Feature / How-it-works grids
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8`.
- Each card: equal padding (`p-5 sm:p-6`); icon, title, body aligned to the same internal left edge.
- Card titles same size; body `text-sm sm:text-base`.

### 3.5 FAQ
- Accordion full width of content column.
- Question row min-height comfortable for touch; chevron aligned right on same baseline as question text.
- Answer padding left-aligned with question text (not under the chevron only).

### 3.6 Footer
- Mobile: stacked columns (`flex-col gap-8`).
- Desktop: multi-column grid with equal top alignment of column headings.
- Bottom bar: copyright + legal links; wrap on small screens; vertical gap when wrapped.
- Links: adequate spacing, not cramped.

---

## 4. Testing Matrix

| Width | Focus |
|-------|--------|
| 320–414 | No overflow; hero CTAs tappable; nav drawer works; FAQ usable |
| 768 | Feature grid 2-col aligned; header not cramped |
| 1024+ | Full nav; 3-col features; max-w and gutters consistent |
| Ultrawide | Content remains in `max-w-7xl`; no stretched text lines |

---

## 5. Implementation Tasks

1. [ ] Shared `Section` wrapper with max-width + padding.
2. [ ] Mobile nav drawer with focus trap and body scroll lock.
3. [ ] Hero CTA responsive stacking rules.
4. [ ] Footer column collapse behavior.
5. [ ] Verify all sections share identical horizontal inset.

---

## 6. Risks

- Large hero images causing CLS → reserve aspect-ratio boxes.
- Sticky header covering section anchors → offset scroll-margin.
