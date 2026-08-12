# Responsive Plan: Trending Detail (`/trending/[id]`)

**Route:** `app/(dashboard)/trending/[id]/page.tsx`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Product hero image, metadata, and “Try on me” CTA are clear on mobile.
- Similar items section reuses trending grid alignment rules.
- External product link and internal actions do not collide.

---

## 2. Element-by-Element Alignment

### 2.1 Layout
| Viewport | Structure |
|----------|-----------|
| Mobile | Single column: image → info → CTA → similar |
| `lg+` | Two column: image left (sticky optional), info right |

### 2.2 Image
- Full width of its column; constrained aspect; `object-contain` or `cover` per design.
- On desktop, image column ~40–50% width; never overflows.

### 2.3 Info block
- Title: `text-xl sm:text-2xl`, wraps.
- Brand, price, category chips: wrap with gap.
- Description: readable measure; `text-sm sm:text-base`.
- Meta rows (if any): label/value with consistent label column width.

### 2.4 CTAs
- Primary “Try on me” / “Analyze”: full width on mobile, auto width on desktop.
- Secondary “View product” (external): same rules; clear visual hierarchy.
- Min-height 44px; stack with `gap-3` on mobile.

### 2.5 Similar items
- Section title aligned with page content.
- Grid: same breakpoints as Trending list (2 / 3 / 4 cols).
- Cards identical component to trending grid for consistency.

---

## 3. Testing Checklist

- [ ] 320px: image + CTAs stacked cleanly
- [ ] Long titles wrap; price does not overflow
- [ ] 1024+: two-column alignment (tops aligned)
- [ ] Similar grid matches main trending page density

---

## 4. Implementation Tasks

1. [ ] Responsive split layout with stacked fallback.
2. [ ] CTA stack rules.
3. [ ] Reuse Trending card/grid for similar.
4. [ ] Sticky image on large screens optional and non-breaking.

---

## 5. Risks

- Sticky image overlapping footer on short viewports → disable sticky below certain height or use `top` offset carefully.
