# Responsive Plan: Favorites (`/favorites`)

**Route:** `app/(dashboard)/favorites/page.tsx`  
**Shell:** [layout-dashboard-shell.md](layout-dashboard-shell.md)

---

## 1. Goals

- Favorited analyses display as a coherent grid or list on all devices.
- Unfavorite and “add to wardrobe” actions are easy to hit without mis-taps.
- Empty state encourages analysis, not a dead end.

---

## 2. Element-by-Element Alignment

### 2.1 Header
- Standard responsive header; optional count badge next to title (does not cause wrap issues).

### 2.2 Grid / list
| Breakpoint | Layout |
|------------|--------|
| Mobile | `grid-cols-1` or `grid-cols-2` if cards are image-forward |
| `sm` | `grid-cols-2` |
| `lg` | `grid-cols-3` |

**Card structure**
- Image top: fixed aspect-ratio (`aspect-[3/4]` or `aspect-square`).
- Body: title `line-clamp-2`, score, actions.
- Action row: icon buttons with 44px targets; evenly spaced or left-aligned group.
- Equal card padding; grid `gap-4 sm:gap-6`.

### 2.3 List alternative
- If list mode exists: same row alignment rules as History (fixed thumb + score columns).

### 2.4 Empty state
- Centered; illustration + copy + CTA to `/upload` or `/trending`.

---

## 3. Testing Checklist

- [ ] 320px: 1-col cards full width; actions tappable
- [ ] 2-col on 375+ without crushing text
- [ ] Images never distort (object-cover + aspect box)
- [ ] Unfavorite confirmation (if any) usable on mobile

---

## 4. Implementation Tasks

1. [ ] Responsive card grid breakpoints.
2. [ ] Aspect-ratio image containers.
3. [ ] Action button hit areas.
4. [ ] Empty and skeleton states.

---

## 5. Risks

- 2-col on very narrow phones makes titles unreadable → use `grid-cols-1` below `sm` if content is text-heavy.
