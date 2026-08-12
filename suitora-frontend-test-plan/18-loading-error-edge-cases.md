# 18 — Loading, Error & Edge Cases Test Plan

Cross-cutting scenarios that apply across multiple pages.

---

## 18.1 Loading States

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-001 | P1 | UX | Slow network (throttle) | Open dashboard | Skeletons shown; content replaces without layout jump when possible |
| EDGE-002 | P1 | UX | Slow network | Open trending | Card skeletons then grid |
| EDGE-003 | P1 | UX | Slow network | Open results | Section skeletons for scores/images |
| EDGE-004 | P2 | UX | Soft navigation | Client-side route change | Prefer retained layout + section loading over full blank |

---

## 18.2 Network & API Errors

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-010 | P0 | Error | Offline | Submit login | Clear network error |
| EDGE-011 | P0 | Error | Offline | Start analysis | Error; inputs retained if possible |
| EDGE-012 | P1 | Error | 500 from stats API | Dashboard | Partial UI or error banner; no white screen |
| EDGE-013 | P1 | Error | 401 mid-session | Any authenticated action | Redirect to login or session-expired message |
| EDGE-014 | P1 | Error | 429 rate limit | Rapid analysis/stylist calls | User-friendly rate limit message |
| EDGE-015 | P1 | Error | Image upload fails | Upload clothing | Toast/error; can retry |

---

## 18.3 Empty States

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-020 | P1 | UX | New user | Dashboard, History, Favorites, Wardrobe | Helpful empty states with primary CTA |
| EDGE-021 | P1 | Functional | Empty state CTAs | Click | Navigate to sensible next step (usually `/upload`) |
| EDGE-022 | P2 | UX | Filtered empty (history search) | Search no match | “No results” distinct from global empty |

---

## 18.4 Invalid / Malicious Input

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-030 | P0 | Validation | XSS strings in profile name | Save | Stored/escaped; not executed in UI |
| EDGE-031 | P1 | Validation | Extremely long strings | Forms | Rejected or truncated per schema |
| EDGE-032 | P1 | Validation | Script in product URL field | Submit | Rejected or safely handled |
| EDGE-033 | P1 | Validation | SVG/HTML file as image | Upload | Rejected by type validation |

---

## 18.5 Concurrent & Race Conditions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-040 | P2 | Functional | Double-click Analyze | Rapid clicks | Only one analysis request in flight |
| EDGE-041 | P2 | Functional | Favorite toggle spam | Rapid clicks | Ends in consistent state matching server |
| EDGE-042 | P2 | Functional | Navigate away during analysis | Leave upload mid-request | No uncaught errors; optional abort |

---

## 18.6 Data Edge Cases

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-050 | P1 | Functional | Analysis with missing optional fields | Open results | Sections omit gracefully (no undefined crashes) |
| EDGE-051 | P1 | Functional | Zero scores / null scores | Open results | Displays 0 or “N/A”, not NaN |
| EDGE-052 | P2 | Functional | Very old analysis | Open history item | Still renders or shows migration message |
| EDGE-053 | P2 | Functional | Deleted analysis ID bookmarked | Open URL | Not-found |

---

## 18.7 File Edge Cases

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-060 | P1 | Validation | 0-byte file | Upload | Rejected |
| EDGE-061 | P1 | Validation | Exactly at MAX_FILE_SIZE | Upload | Accepted or rejected per inclusive rule; message clear |
| EDGE-062 | P1 | Validation | HEIC if not supported | Upload | Clear type error |
| EDGE-063 | P2 | Functional | Very wide/tall image | Upload + preview | Preview constrained; no layout blowout |

---

## 18.8 Auth Edge Cases

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| EDGE-070 | P1 | Functional | Open reset link twice | Second use | Invalid token state |
| EDGE-071 | P1 | Functional | Register then immediately use app | Flow | Session valid; self-image empty as expected |
| EDGE-072 | P2 | Functional | Multiple tabs logout | Logout in one tab | Other tab handles next action with re-auth |
