# 15 — Shared UI Components Test Plan

**Location:** `components/ui/*` and shared dashboard primitives  
**Components:** `Button`, `Input`, `Card`, `Badge`, `CategoryBadge`, `Avatar`, `ScoreCircle`, `Skeleton`, `Toast`, `ConfirmModal`, `ScoreBar`, etc.  

These tests are component-level and should be exercised both in isolation (Storybook/unit) and in context on pages.

---

## 15.1 Button

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-001 | P1 | Functional | Default button | Click | Fires handler |
| UI-002 | P1 | Functional | Disabled | Click | No action |
| UI-003 | P1 | UI | Loading prop (if any) | Set loading | Spinner; disabled |
| UI-004 | P1 | UI | Variants | Primary / secondary / ghost / danger | Visual distinction matches design |
| UI-005 | P1 | A11y | Focus | Tab | Visible focus ring |
| UI-006 | P2 | Responsive | Full width on mobile usage | View in forms | Stretches as intended |

---

## 15.2 Input

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-010 | P1 | Functional | Type text | Input | Value updates |
| UI-011 | P1 | Functional | Error state | Set error | Error message + invalid styling |
| UI-012 | P1 | A11y | Label | Associate label | Clicking label focuses input |
| UI-013 | P1 | Functional | Password type + toggle | Toggle | Mask/unmask |
| UI-014 | P2 | UI | Disabled / readOnly | State | Non-editable appearance |

---

## 15.3 Toast

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-020 | P1 | Functional | Trigger success toast | Action | Toast appears with message |
| UI-021 | P1 | Functional | Trigger error toast | Action | Error styling |
| UI-022 | P1 | UX | Auto-dismiss | Wait | Toast disappears after timeout |
| UI-023 | P1 | Functional | Manual dismiss | Click close | Toast closes |
| UI-024 | P2 | UX | Multiple toasts | Stack | Ordered; no permanent overlap blocking UI |

---

## 15.4 ConfirmModal

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-030 | P1 | Functional | Open modal | Confirm action | onConfirm fires; modal closes |
| UI-031 | P1 | Functional | Cancel | Cancel / overlay | onCancel; no destructive action |
| UI-032 | P1 | A11y | Open | Focus | Focus moves into modal; trap while open |
| UI-033 | P1 | A11y | Escape | Press Esc | Closes if implemented |
| UI-034 | P2 | UI | Long title/body | Content | Scrolls inside modal; buttons remain visible |

---

## 15.5 ScoreCircle / ScoreBar

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-040 | P1 | Functional | Score 0, 50, 100 | Render | Correct visual fill and label |
| UI-041 | P1 | A11y | Score | SR | Numeric value announced |
| UI-042 | P2 | UI | Color thresholds | Low/mid/high | Distinct colors |

---

## 15.6 Skeleton

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-050 | P1 | UI | Loading states | View pages | Skeletons match approximate final layout |
| UI-051 | P2 | UI | Reduced motion | View | Animation subtle or static |

---

## 15.7 Badge / CategoryBadge / Avatar / Card

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-060 | P2 | UI | Badges | Various categories | Correct colors/labels |
| UI-061 | P2 | UI | Avatar | With/without image | Image or initials fallback |
| UI-062 | P2 | UI | Card | Content | Padding and border consistent with design system |

---

## 15.8 Dashboard primitives

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| UI-070 | P1 | UI | PageHeader | Title + actions | Renders on all major pages consistently |
| UI-071 | P1 | UI | EmptyState | CTA | Clickable and navigates |
| UI-072 | P2 | UI | MetricCard / QuickActionCard | Desktop & mobile | Align in grids without overflow |
