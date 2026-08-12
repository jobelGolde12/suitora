# 13 — Legal & Privacy Test Plan

**Route:** `/privacy-policy`  
**Auth:** Public  
**Components:** `LegalPage`, markdown renderer  
**Content:** `lib/legal/content.ts` / privacy_policy assets  

---

## 13.1 Privacy Policy Page

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LEG-001 | P1 | Functional | None | Open `/privacy-policy` | Page renders full privacy policy content |
| LEG-002 | P1 | UI | None | Scroll document | Headings, paragraphs, lists readable; no cut-off text |
| LEG-003 | P1 | Functional | From footer link | Click Privacy on landing | Lands on privacy policy |
| LEG-004 | P2 | UI | Markdown rendering | Check links/lists | Links work; formatting correct |
| LEG-005 | P2 | Responsive | Mobile | View policy | Readable line length; no horizontal scroll |
| LEG-006 | P2 | A11y | Headings | Inspect structure | Logical heading hierarchy for screen readers |

---

## 13.2 Future Legal Pages (if added)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LEG-010 | P3 | Functional | Terms of service route | Open if exists | Renders similarly via LegalPage pattern |
| LEG-011 | P3 | Functional | Cookie policy | Open if exists | Renders correctly |

---

## 13.3 Layout

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LEG-020 | P2 | UI | Legal layout | View | Consistent with marketing/legal layout (not dashboard shell) |
| LEG-021 | P2 | Functional | Nav from legal | Logo / back | Can return to home |
