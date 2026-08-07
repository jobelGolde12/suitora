# Responsive Plan: Wardrobe (`/wardrobe`)

**Route:** `app/(dashboard)/wardrobe/page.tsx`  
**Components:** `components/wardrobe/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Folders, tags, items, and outfit suggestions remain usable on mobile.
- Folder management modals work as sheets on small screens.
- Item grids align; outfit builder does not require horizontal page scroll.

---

## 2. Page Structure

1. Header + actions (Add, New folder)  
2. Folder tabs / chips / sidebar list  
3. Filters / tags  
4. Item grid  
5. Outfit suggestions block  
6. Modals (folder assign, item edit)  

---

## 3. Element-by-Element Alignment

### 3.1 Header
- Standard responsive pattern; secondary actions in overflow menu on mobile if more than two.

### 3.2 Folder navigation
| Viewport | Pattern |
|----------|---------|
| Mobile | Horizontal scroll chips **or** dropdown select |
| `md+` | Chips wrap **or** left vertical list + right content |

- Chips: equal height, `px-3 py-2`, min touch size; active state clear.
- Scroll container does not expand page width.

### 3.3 Item grid
- Same breakpoints as Favorites: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Card: image aspect box → title → tags → actions.
- Tags: wrap inside card; do not overflow card boundary (`flex-wrap gap-1`).

### 3.4 Outfit suggestions
- Horizontal snap carousel on mobile (`flex overflow-x-auto snap-x`).
- Grid on `md+`.
- Each suggestion card fixed min-width on mobile so edges align visually; peek next card slightly to hint scroll.

### 3.5 Item folder modal
- Mobile: full-screen or bottom sheet.
- Desktop: centered dialog `max-w-md`.
- Folder list: full-width rows, 44px min height; radio/checkbox left-aligned in fixed column.

### 3.6 Empty states
- Per-folder empty vs global empty — both centered in the content pane, not under the sidebar only.

---

## 4. Testing Checklist

- [ ] 320px: folder chips scroll; grid 1-col; modals full usable height
- [ ] Outfit carousel snaps; no page-level horizontal scroll
- [ ] Tags wrap inside cards
- [ ] 1024+: optional split folder list + grid aligned to same top

---

## 5. Implementation Tasks

1. [ ] Folder chip scroller with padding.
2. [ ] Item grid + aspect images.
3. [ ] Outfit horizontal snap section.
4. [ ] Modal sheet variant for mobile.
5. [ ] Empty states for folder vs global.

---

## 6. Risks

- Nested horizontal scrolls (chips + carousel) → separate vertical spacing; test gesture conflicts.
- Long folder names → truncate chips with max-width.
