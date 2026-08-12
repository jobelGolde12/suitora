# Responsive Plan: Outfit Comparison (`/compare`)

**Route:** `app/(dashboard)/compare/page.tsx`  
**Components:** `components/compare/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Selecting up to N analyses and viewing a side-by-side comparison works on phones without unusable tiny columns.
- On mobile, comparison becomes stacked or swipeable rather than squeezed multi-column.

---

## 2. Page Structure

1. Header  
2. Selection list / picker  
3. Selected items summary (chips)  
4. Comparison view  
5. CTA (clear / open results)  

---

## 3. Element-by-Element Alignment

### 3.1 Selection list
- Same row pattern as History (thumb + title + score + checkbox).
- Checkbox fixed left column; alignment consistent across rows.
- Mobile: full-width rows; desktop: optional 2-col selection grid.

### 3.2 Selected chips
- Horizontal wrap or scroll; each chip removable with 44px-friendly remove target.
- Align to content left edge.

### 3.3 Comparison view
| Viewport | Layout |
|----------|--------|
| Mobile (`< md`) | **Stacked cards** (one analysis per section) **or** horizontal swipe/tabs between items |
| `md`–`lg` | 2 columns if 2 selected; tabs/stack if 3–4 |
| `≥ lg` | Up to 3–4 columns only if each column retains readable width (≥ ~200px); otherwise cap visible columns and allow horizontal scroll **inside** the comparison panel only |

**Per column / card**
- Image aspect locked.
- Scores in a consistent order (Overall → Body → Color → Style).
- Attribute rows: label left, value right; labels share a column width across compared items when side-by-side.

### 3.4 Metric rows (when side-by-side)
- Use CSS grid with shared template columns so metric names align across items.
- On mobile stacked mode, repeat the full metric block per item (clear section headers).

---

## 4. Testing Checklist

- [ ] 320px: selection usable; comparison is stacked or swipeable — **not** 4 micro-columns
- [ ] 768: 2-up comparison readable
- [ ] 1280: 3–4 up only if still legible
- [ ] Chips wrap without page overflow
- [ ] Max selection enforcement message visible

---

## 5. Implementation Tasks

1. [ ] Mobile comparison = stack or tabs (explicit decision in UI).
2. [ ] Desktop multi-column with min column width guard.
3. [ ] Shared metric row grid for alignment.
4. [ ] Selection list checkbox column alignment.
5. [ ] Empty state when fewer than 2 selected.

---

## 6. Risks

- Forcing 4 columns on tablet destroys readability → enforce min-width and fall back to scroll/tabs.
- Horizontal scroll of entire page → isolate scroll to comparison container.
