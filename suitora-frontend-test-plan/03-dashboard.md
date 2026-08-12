# 03 — Dashboard Test Plan

**Route:** `/dashboard`  
**Auth:** Required  
**Key components:** `PageContainer`, `PageHeader`, `MetricCard`, `ScoreTrendCard`, `Sparkline`, `QuickActionCard`, `AnalysisListItem`, `EmptyState`, `ContextualTips`, `SeasonalTipCard`, skeletons  

---

## 3.1 Page Load & Shell

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-001 | P0 | Functional | Logged in | Navigate to `/dashboard` | Dashboard renders inside DashboardShell (sidebar desktop / bottom nav mobile) |
| DB-002 | P0 | Functional | Logged out | Navigate to `/dashboard` | Redirect to `/login` |
| DB-003 | P1 | UI | Logged in | First load | Skeleton states appear then resolve to real data (or empty states) |
| DB-004 | P1 | UI | Logged in with data | Load dashboard | Metrics, score trend, quick actions, recent analyses all present |

---

## 3.2 Metrics Cards

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-010 | P1 | Functional | User with analyses | View metrics | Cards show Total Analyses, Avg. Score, Favorites, This Week (or equivalent labels) with correct numbers |
| DB-011 | P1 | Functional | New user (no data) | View metrics | Zeros or “—”; no NaN / broken numbers |
| DB-012 | P2 | UI | None | Hover/focus metric cards | Subtle interaction if designed; no layout jump |
| DB-013 | P1 | Responsive | Mobile | View metrics | Grid stacks to 2×2 or single column cleanly |

---

## 3.3 Score Trend

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-020 | P1 | Functional | User with multiple analyses | View score trend section | Summary text + sparkline (if data exists) |
| DB-021 | P1 | Functional | New user | View score trend | Empty/placeholder state without crash |
| DB-022 | P2 | UI | None | Sparkline | Renders without overflow; accessible contrast |

---

## 3.4 Quick Actions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-030 | P0 | Functional | Logged in | Click “Try It On” / Upload quick action | Navigates to `/upload` |
| DB-031 | P1 | Functional | Logged in | Click History quick action | Navigates to `/history` |
| DB-032 | P1 | Functional | Logged in | Click Settings (if present) | Navigates to `/settings` |
| DB-033 | P2 | UI | None | View quick action cards | Icons + labels clear; consistent card styling |

---

## 3.5 Recent Analyses List

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-040 | P0 | Functional | User with analyses | View recent list | Items show thumbnail/score/date; clickable |
| DB-041 | P0 | Functional | Click an analysis item | Navigate | Goes to `/results/[id]` for that analysis |
| DB-042 | P1 | Functional | New user | View recent section | `EmptyState` with CTA to upload |
| DB-043 | P1 | Functional | Empty state CTA | Click CTA | Goes to `/upload` |
| DB-044 | P2 | UI | Long list | View list | Does not break layout; optional “View all” to history |

---

## 3.6 Tips / Seasonal Content

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-050 | P2 | UI | None | View ContextualTips / SeasonalTipCard | Tips render without error; dismissible if designed |
| DB-051 | P3 | Functional | Dismiss tip | Dismiss | Tip hides for session or per preference |

---

## 3.7 Data Refresh & Navigation

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-060 | P1 | Functional | After completing new analysis | Return to dashboard | Recent analyses and metrics reflect new data (after refresh or revalidation) |
| DB-061 | P2 | Performance | Hover Dashboard nav link | Prefetch | Stats endpoint may be prefetched (per Sidebar behavior); no visible error |
| DB-062 | P1 | Error | API `/api/dashboard/stats` fails | Load dashboard | Error or empty metrics with retry/message; page does not white-screen |

---

## 3.8 Dashboard Accessibility & Responsive

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| DB-070 | P1 | A11y | Keyboard | Tab through page | Focus order logical; cards and links operable |
| DB-071 | P1 | Responsive | 375px width | Full page check | No horizontal scroll; bottom nav visible; content padded |
| DB-072 | P2 | UI | Tablet | Layout | Metrics and lists use intermediate breakpoints correctly |
