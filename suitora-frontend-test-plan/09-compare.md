# 09 — Compare Test Plan

**Route:** `/compare`  
**Auth:** Required  
**Component:** `ComparisonView`  
**Features:** Select multiple analyses/items and compare scores, fit, visuals side-by-side  

---

## 9.1 Page Load

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| CMP-001 | P0 | Functional | Logged in | Open `/compare` | Compare UI loads (selector + comparison area) |
| CMP-002 | P0 | Functional | Logged out | Open `/compare` | Redirect to login |
| CMP-003 | P1 | Functional | No analyses to compare | Open page | Empty guidance: need at least 2 items |

---

## 9.2 Selecting Items

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| CMP-010 | P0 | Functional | Multiple analyses exist | Select 2 items | Comparison view populates |
| CMP-011 | P1 | Functional | Select 3+ items (if supported) | Add more | Layout supports multi-column or capped max with message |
| CMP-012 | P1 | Functional | Deselect item | Remove from comparison | View updates |
| CMP-013 | P1 | Validation | Select only 1 | Attempt compare | Message requiring minimum 2 |
| CMP-014 | P2 | Functional | Search/filter selector | Filter list | Can find items quickly |

---

## 9.3 Comparison Display

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| CMP-020 | P0 | Functional | 2 items selected | View comparison | Side-by-side scores, key attributes, images |
| CMP-021 | P1 | Functional | Different score profiles | Compare | Differences clear (highlights if designed) |
| CMP-022 | P1 | UI | Long attribute lists | Scroll within columns | Independent scroll if needed; no page break |
| CMP-023 | P2 | Functional | Open item from comparison | Click through | Goes to `/results/[id]` |

---

## 9.4 Error & Edge

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| CMP-030 | P1 | Error | One selected ID fails to load | Load comparison | Partial error handled; remaining items shown or clear error |
| CMP-031 | P2 | Functional | Refresh with selection in URL (if any) | Reload | Selection restored or gracefully reset |

---

## 9.5 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| CMP-040 | P1 | Responsive | Mobile | Compare 2 items | Stacks vertically or horizontal scroll with clear labels |
| CMP-041 | P1 | A11y | Comparison table/cards | Screen reader | Column headers / item names associated with values |
