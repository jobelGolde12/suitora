# 19 — Performance & UX Polish Test Plan

---

## 19.1 Perceived Performance

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-001 | P1 | Performance | Cold load landing | Measure | Hero visible quickly (LCP reasonable on broadband) |
| PERF-002 | P1 | Performance | Cold load dashboard | Measure | Shell + skeletons fast; data follows |
| PERF-003 | P1 | UX | Route transitions | Navigate dashboard ↔ history | Instant shell; content swap smooth |
| PERF-004 | P2 | Performance | Prefetch | Hover Dashboard link in sidebar | Stats prefetch may occur; no console errors |
| PERF-005 | P2 | Performance | Image-heavy pages | Trending / results | Images lazy-load; placeholders prevent jump |

---

## 19.2 Animation & Motion UX

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-010 | P2 | UX | Page transitions | Navigate | Motion subtle; duration short |
| PERF-011 | P2 | UX | Accordion / modal | Open | No jank; 60fps target on mid devices |
| PERF-012 | P1 | UX | Reduced motion | System setting on | Animations reduced |

---

## 19.3 Interaction Feedback

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-020 | P1 | UX | Primary buttons | Click | Immediate loading/disabled state |
| PERF-021 | P1 | UX | Form submit | Submit | Prevent double submit |
| PERF-022 | P1 | UX | Destructive actions | Delete | Confirm modal before irreversible action |
| PERF-023 | P2 | UX | Optimistic UI (favorite) | Toggle | Instant UI update with rollback on failure |

---

## 19.4 Content & Copy UX

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-030 | P2 | UX | Empty states | New user | Encouraging, clear next step |
| PERF-031 | P2 | UX | Error messages | Validation | Specific and actionable (not only “Error”) |
| PERF-032 | P2 | UX | Analysis waiting | Long AI call | Progress or reassurance copy |

---

## 19.5 Stability

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-040 | P1 | Performance | Rapid navigation | Click many nav links quickly | No accumulated listeners / memory blowup symptoms |
| PERF-041 | P1 | Performance | Long stylist session | Many messages | Chat remains scrollable and responsive |
| PERF-042 | P2 | Performance | Large history | 50+ items | List remains usable (virtualization if implemented, else acceptable lag) |

---

## 19.6 Core Web Vitals Smoke (Manual)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| PERF-050 | P2 | Performance | Lighthouse mobile | Landing | No catastrophic LCP/CLS issues |
| PERF-051 | P2 | Performance | Lighthouse | Dashboard | CLS low when skeletons match content size |
| PERF-052 | P2 | Performance | Images | Next/Image usage | Proper sizing attributes; no layout shift on load |

---

## 19.7 Suggested Automated Coverage Mapping

| Area | Manual focus | Suggested automation |
|------|--------------|----------------------|
| Auth flows | Full matrix | Playwright: login/register/logout |
| Upload validation | File types/sizes | Component + E2E with fixtures |
| Results rendering | Score presence | E2E with mocked analysis API |
| Navigation | All sidebar links | E2E smoke |
| A11y | Critical paths | axe-core in CI on key routes |
| Visual regression | Landing, dashboard, results | Chromatic / Percy optional |

---

## End of Front-End Test Plan Suite

Return to `00-MASTER-INDEX.md` for the full map and priority definitions.
