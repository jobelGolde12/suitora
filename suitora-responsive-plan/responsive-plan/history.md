# Responsive Plan: Analysis History (`/history`)

**Route:** `app/(dashboard)/history/page.tsx`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Search, filters, sort, and list/grid of past analyses work on small screens.
- Dense information (thumbnail, title, scores, date) stays aligned in columns.
- Bulk actions (if any) remain usable on touch devices.

---

## 2. Page Structure

1. Page header + primary actions  
2. Search + filter/sort controls  
3. Results list or grid  
4. Pagination / infinite scroll  
5. Empty state  

---

## 3. Element-by-Element Alignment

### 3.1 Header
- Title left; optional “New analysis” button full-width under title on mobile, right-aligned on `sm+`.

### 3.2 Toolbar (search / sort / filter)
| Control | Mobile | Desktop |
|---------|--------|---------|
| Search | Full width | Flex-1 in toolbar row |
| Sort | Full width select or button below search | Inline right |
| Filters | Horizontal chip scroll **or** bottom sheet | Inline chips / dropdown |

- Toolbar stacks: `flex-col gap-3 sm:flex-row sm:items-center`.
- All controls share the content left/right edges.

### 3.3 List items
**Preferred mobile pattern:** card or row with:
- Fixed-size thumbnail (e.g. 64×64 or 72×72)
- Text block (title `line-clamp-2`, meta date)
- Score badge right
- Optional overflow menu

**Column alignment**
- Thumbnail column fixed → text starts at the same x for every row.
- Score column fixed width, right-aligned numbers.
- Vertical padding equal per row; divider full width of content area.

**Desktop:** same row pattern or slightly larger thumbnails; avoid multi-column unless cards.

### 3.4 Selection mode (bulk delete)
- Checkbox column appears left of thumbnail; fixed width so text still aligns.
- Bulk action bar sticky bottom on mobile.

### 3.5 Empty / loading
- Skeleton rows match final row height and columns.
- Empty: centered, max-w-sm, CTA to upload.

---

## 4. Testing Checklist

- [ ] 320px: search full width; rows not horizontally scrollable
- [ ] Long titles clamp; scores never wrap under thumbnail
- [ ] Filter chips scroll without page overflow
- [ ] 1024+: toolbar single row; list readable

---

## 5. Implementation Tasks

1. [ ] Responsive toolbar stack.
2. [ ] List row with fixed thumbnail + score columns.
3. [ ] Chip scroller with `overflow-x-auto` and hidden scrollbar optional.
4. [ ] Skeleton parity.
5. [ ] Touch-friendly overflow menus (native or large hit areas).

---

## 6. Risks

- Horizontal chip scroll conflicting with browser back-gesture → adequate padding and vertical separation.
