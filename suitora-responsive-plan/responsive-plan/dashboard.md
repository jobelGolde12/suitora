# Responsive Plan: Dashboard (`/dashboard`)

**Route:** `app/(dashboard)/dashboard/page.tsx`  
**Components:** `components/dashboard/*`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Stats, recent analyses, and quick actions remain scannable on a phone.
- Cards and lists align to a single content grid.
- Skeletons match final layout to reduce CLS.

---

## 2. Page Structure (top → bottom)

1. Page header (title, optional description, optional primary action)
2. Stats row
3. Quick actions
4. Recent analyses
5. Optional secondary blocks (favorites snapshot, tips)

---

## 3. Element-by-Element Alignment

### 3.1 Page header
- Title + description stack on mobile.
- Action button: full width under description on mobile **or** right-aligned on the same row at `sm+` if space permits.
- Use `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`.
- Title and button share vertical center on `sm+`.

### 3.2 Stats cards
| Breakpoint | Grid |
|------------|------|
| default | `grid-cols-1` or `grid-cols-2` if cards are compact |
| `sm` | `grid-cols-2` |
| `lg` | `grid-cols-4` (or 3 if only three metrics) |

**Per card**
- Padding equal (`p-4 sm:p-5`).
- Label above value; value prominent (`text-2xl sm:text-3xl`).
- Icon: fixed corner or left; if left, text block aligns across cards (same icon column width).
- Avoid fixed heights; allow content to define height; grid items `items-stretch`.

### 3.3 Quick actions
- Horizontal scroll **with snap** on mobile **or** 2×2 grid.
- Prefer `grid grid-cols-2 sm:grid-cols-4 gap-3` so edges align with stats.
- Each action: icon + label centered or left-aligned consistently; min-height 44px+.

### 3.4 Recent analyses list / cards
- Mobile: single column cards or dense list rows.
- Desktop: still single column list **or** 2-col cards if design uses cards.
- Row layout: thumbnail (fixed size) | text block | score | chevron.
  - Thumbnail column fixed width so text columns align.
  - Score right-aligned in a fixed-width column.
- Horizontal padding of list matches page container content edge (no double indent).

### 3.5 Empty state
- Centered in the content area; illustration + message + CTA; CTA min 44px height.
- Max width of empty content `max-w-sm` so it does not stretch on desktop.

---

## 4. Spacing Rhythm

- Between major sections: `space-y-8 sm:space-y-10`.
- Inside cards: `gap-1` label/value, `gap-3` for multi-part content.
- Page container: standard shell padding (`px-4 sm:px-6 lg:px-8`).

---

## 5. Testing Checklist

- [ ] 320px: 2-col stats if used still readable; no card overflow
- [ ] 375–414: quick actions grid aligned
- [ ] 768: stats 2-col; recent list comfortable
- [ ] 1024+: stats 4-col; sidebar + content alignment
- [ ] Skeleton → content: columns match

---

## 6. Implementation Tasks

1. [ ] Stats grid breakpoints and equal card padding.
2. [ ] Header responsive flex rules.
3. [ ] Recent item row with fixed thumbnail/score columns.
4. [ ] Empty and loading states matching grid.
5. [ ] Verify with parallel data loading (no layout jump when late data arrives).

---

## 7. Risks

- Four skinny stat cards on medium widths → switch to 2×2 earlier if labels truncate.
- Long product titles in recent list → `truncate` or `line-clamp-2` with consistent height.
