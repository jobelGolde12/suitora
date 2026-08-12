# 10 — Trending Test Plan

**Routes:** `/trending`, `/trending/[id]`  
**Auth:** Required  
**Components:** `TrendingGrid`, `TrendingCard`, `TrendingCarousel`, `TrendingFilters`, `TrendingCollection`, `SimilarItems`, skeletons  
**APIs:** `/api/trending`, `/api/trending/[id]`, similar  

---

## 10.1 Trending List (`/trending`)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TR-001 | P0 | Functional | Logged in | Open `/trending` | Grid/list of trending items loads |
| TR-002 | P0 | Functional | Logged out | Open `/trending` | Redirect to login |
| TR-003 | P1 | UI | Load | Skeletons (`TrendingCardSkeleton`) then cards |
| TR-004 | P1 | Functional | Empty trending data | Open page | Empty state, not crash |
| TR-005 | P1 | Error | API failure | Open page | Error message + retry if available |

---

## 10.2 Filters & Collections

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TR-010 | P1 | Functional | Filters present | Apply category filter | Grid updates to matching items |
| TR-011 | P1 | Functional | Clear filter | Reset | Full list restored |
| TR-012 | P2 | Functional | Multiple filters | Combine | Correct intersection |
| TR-013 | P2 | Functional | Collections / carousel | Browse carousel | Scrolls; cards clickable |

---

## 10.3 Trending Card Actions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TR-020 | P0 | Functional | Card visible | Click card | Navigates to `/trending/[id]` |
| TR-021 | P1 | Functional | Card has external link | Open product link | Opens in new tab (or as designed) with `ExternalLink` behavior |
| TR-022 | P1 | Functional | Try-on CTA on card | Click | Routes toward upload/analysis with item context if supported |
| TR-023 | P2 | UI | Price display | View card | `formatLocalPrice` shows localized price when available |
| TR-024 | P2 | UI | Category badge | View card | `CategoryBadge` renders correctly |

---

## 10.4 Trending Detail (`/trending/[id]`)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TR-030 | P0 | Functional | Valid ID | Open `/trending/[id]` | Detail: image, title, price, category, description, actions |
| TR-031 | P0 | Functional | Invalid ID | Open bad ID | Not-found state |
| TR-032 | P1 | Functional | Back control | Click back | Returns to `/trending` |
| TR-033 | P1 | Functional | Similar items | View SimilarItems | Related cards load; clicking opens other detail |
| TR-034 | P1 | Functional | Try on this item | CTA | Goes to upload flow (prefilled if implemented) |
| TR-035 | P1 | Functional | Favorite (if on detail) | Toggle | State updates |
| TR-036 | P2 | UX | Mobile on detail | Bottom nav | Hidden on `/trending/[id]` per `isHiddenRoute` |
| TR-037 | P1 | Error | Detail API fails | Open ID | Error / not-found UI |

---

## 10.5 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TR-040 | P1 | Responsive | Mobile | Grid | 1–2 columns; filters usable |
| TR-041 | P1 | Responsive | Desktop | Grid | Multi-column; carousel arrows if any |
| TR-042 | P1 | A11y | Cards | Keyboard | Focusable; Enter activates |
| TR-043 | P2 | A11y | Images | Alt text | Meaningful alt or decorative marked appropriately |
