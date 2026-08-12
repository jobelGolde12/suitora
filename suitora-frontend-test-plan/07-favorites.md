# 07 — Favorites Test Plan

**Route:** `/favorites`  
**Auth:** Required  
**Features:** List favorited analyses, unfavorite, navigate to results, empty state  
**Related:** Favorite toggle on results and possibly list items  

---

## 7.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| FAV-001 | P0 | Functional | User with favorites | Open `/favorites` | Favorited items listed with key metadata |
| FAV-002 | P0 | Functional | User with no favorites | Open `/favorites` | Empty state + CTA (e.g. explore history or upload) |
| FAV-003 | P0 | Functional | Logged out | Open `/favorites` | Redirect to login |
| FAV-004 | P1 | UI | With data | Load | Skeleton → content |

---

## 7.2 Interactions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| FAV-010 | P0 | Functional | Favorited item | Click item | Opens `/results/[id]` |
| FAV-011 | P0 | Functional | Favorited item | Unfavorite from list | Item removed from favorites list; heart state updates |
| FAV-012 | P1 | Functional | From results page | Favorite then open Favorites | New item appears |
| FAV-013 | P1 | Error | Unfavorite API fails | Attempt unfavorite | Error feedback; item stays |
| FAV-014 | P2 | Functional | Unfavorite last item | Confirm | Empty state shown |

---

## 7.3 Consistency Across App

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| FAV-020 | P1 | Functional | Item favorited on results | Check dashboard recent / history heart (if shown) | State consistent |
| FAV-021 | P1 | Functional | Unfavorite on favorites page | Return to results of same ID | Heart shows unfavorited |

---

## 7.4 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| FAV-030 | P1 | Responsive | Mobile | Favorites grid/list | Layout adapts; actions tappable |
| FAV-031 | P1 | A11y | Favorite controls | Screen reader | “Add to favorites” / “Remove from favorites” labels |
