# Responsive Plan: Analysis Results (`/results/[id]`)

**Route:** `app/(dashboard)/results/[id]/page.tsx`  
**Components:** `components/results/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Scores, try-on, recommendations, and actions remain understandable on a phone-sized screen.
- Visual comparison (user photo / garment / try-on) aligns without horizontal overflow.
- Primary actions (favorite, wardrobe, compare) are reachable and correctly sized.

---

## 2. Page Structure

1. Header (back, title, actions)  
2. Score summary  
3. Visual / try-on section  
4. Attribute breakdown (body, color, style)  
5. Recommendations list  
6. Secondary actions  

---

## 3. Element-by-Element Alignment

### 3.1 Header
- Back link/button left; title truncates; favorite + overflow menu right.
- Mobile: two rows if needed — row1 back+actions, row2 title — **or** single row with truncate.
- Action icons 44×44.

### 3.2 Score summary
| Breakpoint | Layout |
|------------|--------|
| Mobile | Overall score large, centered; sub-scores in 3-col grid or horizontal chips |
| `md+` | Overall left; sub-scores in a row or ring chart + legend |

**Alignment**
- Sub-score labels and values share a baseline.
- Progress bars (if used) same width within the group.
- Color of scores accessible (not color-only).

### 3.3 Try-on / media section
- Mobile: single column — tabs or segmented control (Original | Garment | Try-on) switching one large image.
- Desktop: 2–3 images side by side with equal height (`object-cover` in shared aspect boxes) **or** tabbed still.
- Before/after slider (if implemented): full width of media column; handle 44px touch target.
- Toggle control aligned under or above media, centered or left consistent with section title.

### 3.4 Attribute / insight cards
- `grid-cols-1 sm:grid-cols-2 gap-4`.
- Card titles align; body text same size; icons in fixed column if present.

### 3.5 Recommendations
- List: number or icon in fixed left column; text block; optional action.
- Mobile: stacked full width.
- Desktop: same list or 2-col if cards.
- Long recommendation text wraps; no overflow.

### 3.6 Action bar
- Mobile: sticky bottom with primary actions (Favorite, Add to wardrobe) — equal width buttons or icon+label.
- Desktop: inline under header or under scores, right-aligned group.
- Ensure sticky bar does not cover the last recommendation (content `pb-*`).

---

## 4. Typography

- Overall score: `text-4xl sm:text-5xl font-bold`.
- Section titles: `text-lg sm:text-xl font-semibold`.
- Body / recommendations: `text-sm sm:text-base`.

---

## 5. Testing Checklist

- [ ] 320px: score chips readable; media not overflowing
- [ ] Tabbed media works with touch
- [ ] Slider (if any) usable with thumb
- [ ] Sticky actions clear of home indicator
- [ ] 1024+: multi-image row aligned; no sparse awkward gaps
- [ ] Missing try-on image: placeholder same size as real image slot

---

## 6. Implementation Tasks

1. [ ] Responsive score header layout.
2. [ ] Media section: tabs on mobile, multi-column on large screens.
3. [ ] Recommendation list fixed left column for markers.
4. [ ] Sticky action bar with safe-area.
5. [ ] Placeholder aspect boxes for images.

---

## 7. Risks

- Three side-by-side images on tablet look tiny → switch to tabs until `lg`.
- Very long recommendation strings from AI → `line-clamp` with expand control.
