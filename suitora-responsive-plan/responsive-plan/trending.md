# Responsive Plan: Trending (`/trending`)

**Route:** `app/(dashboard)/trending/page.tsx`  
**Components:** `components/trending/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Category filters and item grid work smoothly on mobile.
- Product cards keep consistent image aspect and text alignment.
- Loading skeletons match the grid.

---

## 2. Element-by-Element Alignment

### 2.1 Header
- Title + description; optional “Sync” or refresh control in overflow on mobile.

### 2.2 Filters (`TrendingFilters`)
- Horizontal scroll chips on mobile.
- Wrap on `md+` if few categories.
- Active chip distinct; min touch size.
- Filter row shares page horizontal padding; chips do not cause page overflow.

### 2.3 Grid (`TrendingGrid`)
| Breakpoint | Columns |
|------------|---------|
| default | 2 (image-forward fashion cards work at 2-col on phones) |
| `sm` | 2 |
| `md` | 3 |
| `lg` | 4 |

**Card**
- Image: `aspect-[3/4]` or design token; `object-cover`.
- Body: brand/title `line-clamp-2`, price, optional score/CTA.
- Padding equal; grid `gap-3 sm:gap-4 lg:gap-6`.
- Entire card clickable preferred; secondary “Try on” button with stopPropagation and 44px height if present.

### 2.4 Empty / error
- Centered in grid area; does not leave a single stretched column.

### 2.5 Skeleton
- Same column counts and aspect ratios as real cards.

---

## 3. Testing Checklist

- [ ] 320px: 2-col cards still legible (or fall back to 1-col if titles suffer)
- [ ] Filter chips scroll independently
- [ ] Images uniform height in a row
- [ ] 1280: 4-col aligned to container

---

## 4. Implementation Tasks

1. [ ] Responsive grid column map.
2. [ ] Filter chip scroller.
3. [ ] Card aspect + line-clamp.
4. [ ] Skeleton grid parity.
5. [ ] Optional 1-col below `sm` if content density requires.

---

## 5. Risks

- 2-col on 320px with large padding → reduce gap before dropping to 1-col.
- Lazy-loaded images causing layout jump → aspect boxes always reserved.
