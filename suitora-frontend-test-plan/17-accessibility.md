# 17 — Accessibility (A11y) Test Plan

**Standards target:** WCAG 2.2 Level AA where practical  
**Tools:** Keyboard only, screen reader (VoiceOver / NVDA), axe / Lighthouse audits  

---

## 17.1 Keyboard Navigation

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-001 | P0 | A11y | Any page | Tab through interactive elements | Logical order; no keyboard traps (except intentional modal traps) |
| A11Y-002 | P0 | A11y | All pages | Focus visible | Clear focus indicator on links, buttons, inputs |
| A11Y-003 | P0 | A11y | Modals (Confirm, SelfImage) | Open with keyboard | Focus moves inside; Tab cycles within; Esc closes |
| A11Y-004 | P1 | A11y | Sidebar / mobile nav | Tab | All destinations reachable |
| A11Y-005 | P1 | A11y | FAQ accordion | Enter/Space | Toggles panel |
| A11Y-006 | P1 | A11y | Chat input | Enter | Sends message (Shift+Enter for newline if supported) |

---

## 17.2 Semantics & ARIA

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-010 | P1 | A11y | Forms | Inspect | Labels associated via `htmlFor` / wrapping; required indicated |
| A11Y-011 | P1 | A11y | Error messages | Trigger validation | Errors linked with `aria-describedby` or equivalent |
| A11Y-012 | P1 | A11y | Icon-only buttons | Inspect | Accessible name (aria-label) present |
| A11Y-013 | P1 | A11y | Nav | Landmarks | `nav`, `main`, `header`, `footer` used appropriately |
| A11Y-014 | P1 | A11y | Active nav link | Current page | `aria-current="page"` on active items |
| A11Y-015 | P2 | A11y | Live regions | Toasts / chat replies | Announced without stealing focus unnecessarily |
| A11Y-016 | P2 | A11y | Decorative images | Inspect | Empty alt or aria-hidden |
| A11Y-017 | P2 | A11y | Informative images | Inspect | Meaningful alt text |

---

## 17.3 Color & Contrast

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-020 | P1 | A11y | Body text | Contrast check | ≥ 4.5:1 against background |
| A11Y-021 | P1 | A11y | UI components | Buttons, links | ≥ 4.5:1 (or 3:1 for large text) |
| A11Y-022 | P1 | A11y | Score colors | Low/mid/high | Not the sole means of conveying score (text present) |
| A11Y-023 | P2 | A11y | Dark mode (if any) | Contrast | Still meets AA |

---

## 17.4 Screen Reader Flows

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-030 | P1 | A11y | Login | Complete login with SR | Fields, errors, success announced |
| A11Y-031 | P1 | A11y | Upload | Complete selection | Dropzone purpose clear; status updates announced |
| A11Y-032 | P1 | A11y | Results | Browse scores | Scores and insights readable in order |
| A11Y-033 | P2 | A11y | Stylist | Conversation | User and assistant messages distinguishable |

---

## 17.5 Motion

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-040 | P1 | A11y | `prefers-reduced-motion: reduce` | Browse animated pages | Non-essential motion minimized |
| A11Y-041 | P2 | A11y | Page transitions | Reduced motion | No large sliding that causes discomfort |

---

## 17.6 Forms & Timeouts

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| A11Y-050 | P2 | A11y | Session timeout | If session expires mid-form | User warned; data not silently lost where possible |
| A11Y-051 | P1 | A11y | Autocomplete | Login/register fields | Appropriate `autocomplete` attributes |
