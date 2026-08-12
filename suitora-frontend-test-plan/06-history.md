# 06 — History Test Plan

**Route:** `/history`  
**Auth:** Required  
**Features:** List of past analyses, search, sort, delete, empty state, navigation to results  

---

## 6.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| HIS-001 | P0 | Functional | Logged in with analyses | Open `/history` | List of analysis items with score, date, thumbnail |
| HIS-002 | P0 | Functional | Logged in, no analyses | Open `/history` | Empty state with CTA to Try It On |
| HIS-003 | P0 | Functional | Logged out | Open `/history` | Redirect to login |
| HIS-004 | P1 | UI | With data | Load | Skeleton then list |

---

## 6.2 List Interaction

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| HIS-010 | P0 | Functional | With items | Click an item | Navigates to `/results/[id]` |
| HIS-011 | P1 | Functional | Long history | Scroll list | Performance acceptable; images lazy-load if implemented |
| HIS-012 | P2 | UI | Item row | Hover/focus | Clear affordance |

---

## 6.3 Search & Sort

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| HIS-020 | P1 | Functional | Search input present | Type query matching item | List filters to matches |
| HIS-021 | P1 | Functional | Search | Type non-matching query | Empty filter state or “no results” |
| HIS-022 | P1 | Functional | Clear search | Clear input | Full list restored |
| HIS-023 | P1 | Functional | Sort control | Change sort (date / score) | Order updates correctly |
| HIS-024 | P2 | Functional | Combined search + sort | Apply both | Correct intersection of filters |

---

## 6.4 Delete

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| HIS-030 | P1 | Functional | Item exists | Trigger delete | Confirm modal appears (`ConfirmModal`) |
| HIS-031 | P1 | Functional | Confirm modal | Cancel | Item remains |
| HIS-032 | P1 | Functional | Confirm modal | Confirm delete | Item removed from list; success feedback |
| HIS-033 | P1 | Error | Delete API fails | Confirm delete | Error message; item remains |
| HIS-034 | P2 | Functional | Delete last item | Confirm | Empty state appears |

---

## 6.5 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| HIS-040 | P1 | Responsive | Mobile | History list | Rows usable; actions not clipped |
| HIS-041 | P1 | A11y | Delete flow | Keyboard | Modal focus trap; Escape closes if supported |
