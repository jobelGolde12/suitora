# Responsive Plan: Landing Page (`/`)

**Route:** `app/(landing)/page.tsx`  
**Components:** `components/landing/*`

---

## 1. Goals

- Tell the product story without forcing zoom or horizontal scroll on any device.
- Every section’s content shares the same horizontal grid (via shared Section wrapper).
- CTAs remain prominent and thumb-friendly on mobile.

---

## 2. Section-by-Section Alignment

### 2.1 Hero
| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Container | `px-4 py-12` | `px-6 py-16` | `px-8 py-20 lg:py-28`, `max-w-7xl mx-auto` |
| Eyebrow | Centered, `text-xs sm:text-sm` | Same | Same or left if left-aligned hero |
| Headline | `text-3xl leading-tight` → `sm:text-4xl` → `lg:text-5xl xl:text-6xl` | | |
| Subcopy | `text-sm sm:text-base max-w-xl mx-auto` (if centered) | | Limit line length |
| CTA group | Stack full-width (`flex-col gap-3`) or two equal buttons | Inline `flex-row gap-3` when space allows | Inline |
| Media | Below copy, full content width, fixed aspect-ratio | Optional side-by-side at `lg` | Side-by-side with equal vertical center |

**Alignment rules**
- If hero is centered: all text blocks and CTA group share center axis.
- If split: text column and media column top-align or center-align consistently; gap `gap-8 lg:gap-12`.
- Primary CTA min-height 48px on mobile.

### 2.2 Social proof / logos (if present)
- Horizontal scroll **or** wrapping flex with centered items on mobile.
- Prefer wrap with `justify-center gap-6` over forced marquee if logo count is small.
- Logos constrained height (`h-6 sm:h-8`); grayscale optional; never overflow.

### 2.3 Features grid
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Card internal layout: icon (fixed box) → title → body; left edges of titles align across cards in the same row.
- Equal card padding; avoid fixed heights that clip text — use `h-full` on cards inside grid.

### 2.4 How it works
- Steps: vertical timeline on mobile (number + text); horizontal steps on `lg` if 3–4 steps.
- Numbers/icons aligned in a column of fixed width so step text lines up.
- Connecting lines (if any) must not cause overflow; hide decorative lines on mobile if needed.

### 2.5 FAQ
- Full width of section container.
- Each item: question and chevron on one row (`justify-between items-start` or `items-center`); question text wraps; chevron stays top-right.
- Expanded answer: same left padding as question text.

### 2.6 Final CTA band
- Full-bleed background optional; inner content still `max-w-7xl` + same horizontal padding as other sections.
- Heading + button group centered; buttons full-width on mobile.

### 2.7 Footer
- See [layout-landing.md](layout-landing.md).

---

## 3. Typography Scale (page-specific)

| Role | Mobile | Desktop |
|------|--------|---------|
| Hero H1 | 1.875–2.25rem | 3–3.75rem |
| Section H2 | 1.5rem | 2–2.25rem |
| Body | 0.875–1rem | 1rem |
| Small / meta | 0.75–0.875rem | 0.875rem |

---

## 4. Media & Performance

- Hero image: `sizes="100vw"` on mobile, constrained on desktop if split.
- Priority only on LCP image.
- No layout shift: width/height or aspect-ratio boxes reserved.

---

## 5. Testing Checklist

- [ ] 320px: hero CTAs stack, no overflow, FAQ expandable
- [ ] 375–414: comfortable reading measure
- [ ] 768: 2-col features aligned
- [ ] 1024–1440: 3-col features, hero split balanced, max-w respected
- [ ] Landscape phone: hero not excessively tall; sticky header usable

---

## 6. Implementation Tasks

1. [ ] Apply shared Section wrapper to every block.
2. [ ] Hero responsive type + CTA stack rules.
3. [ ] Feature cards equal padding and grid breakpoints.
4. [ ] FAQ row alignment and touch targets.
5. [ ] Footer responsive columns.
6. [ ] Lighthouse + manual device pass.

---

## 7. Risks

- Centered long headlines overflowing → allow controlled wrap; avoid `whitespace-nowrap` on hero.
- Absolute-positioned decorations causing scroll → contain within section `overflow-hidden` carefully without clipping focus rings.
