# 16 — Responsive & Cross-Browser Test Plan

**Breakpoints (Tailwind defaults / project usage):**  
- Mobile: < 768px (focus 375, 390, 430)  
- Tablet: 768–1023px  
- Desktop: ≥ 1024px (1280, 1440, 1920)  

**Browsers:** Chromium (Chrome/Edge), WebKit (Safari), Firefox  

---

## 16.1 Global Responsive Rules

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RESP-001 | P0 | Responsive | All main routes | 375px width | No horizontal scrollbar; content padded; touch targets ≥ 44px where possible |
| RESP-002 | P0 | Responsive | Dashboard routes | Mobile | Bottom nav + top bar; sidebar hidden |
| RESP-003 | P0 | Responsive | Dashboard routes | Desktop | Sidebar visible; bottom nav hidden |
| RESP-004 | P1 | Responsive | Tablet | Dashboard | Usable intermediate layout (sidebar collapsible or overlay) |
| RESP-005 | P1 | Responsive | Orientation change | Rotate device | Layout reflows without broken fixed elements |

---

## 16.2 Page-Specific Responsive Checks

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RESP-010 | P1 | Responsive | Landing | Mobile | Hero CTA visible without excessive scroll; FAQ accordion usable |
| RESP-011 | P1 | Responsive | Auth forms | Mobile | Inputs and buttons full width; keyboard does not permanently hide submit |
| RESP-012 | P1 | Responsive | Upload | Mobile | Dropzones and preview fit; Analyze button reachable |
| RESP-013 | P1 | Responsive | Results | Mobile | Scores and images stack; actions not under nav (nav hidden) |
| RESP-014 | P1 | Responsive | Compare | Mobile | Comparison readable (stack or swipe) |
| RESP-015 | P1 | Responsive | Trending grid | Mobile | 1–2 columns |
| RESP-016 | P1 | Responsive | Stylist chat | Mobile | Composer above safe area |
| RESP-017 | P1 | Responsive | Settings | Mobile | Sections stacked; save sticky or easily reachable |

---

## 16.3 Cross-Browser

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| BR-001 | P0 | Functional | Chrome latest | Smoke core flow: login → upload → results | Works |
| BR-002 | P0 | Functional | Safari latest (macOS/iOS) | Same core flow | Works; file upload and camera permissions handled |
| BR-003 | P1 | Functional | Firefox latest | Core flow | Works |
| BR-004 | P1 | UI | Safari | Flex/grid layouts | No major gaps/overflow unique to WebKit |
| BR-005 | P2 | UI | Firefox | Framer Motion animations | Acceptable; no permanent stuck states |
| BR-006 | P1 | Functional | iOS Safari | Bottom nav + safe areas | Not obscured by home indicator |
| BR-007 | P2 | Functional | Android Chrome | File picker / camera | Image selection works for self and clothing |

---

## 16.4 Touch & Pointer

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| TOUCH-001 | P1 | UX | Mobile | Tap all primary CTAs | Reliable hit targets |
| TOUCH-002 | P1 | UX | Drag-and-drop zones | On touch device | Fallback to file picker still works (drag optional on mobile) |
| TOUCH-003 | P2 | UX | Carousels | Swipe | Horizontal swipe works on trending carousel |

---

## 16.5 Zoom & Text Resize

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| ZOOM-001 | P2 | A11y / Responsive | Browser zoom 200% | Key pages | Content reflows; no clipped controls |
| ZOOM-002 | P2 | A11y | Increase system font | Pages | Text does not overflow containers destructively |
