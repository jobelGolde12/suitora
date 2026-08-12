# 14 — Global Layout, Navigation & Error States Test Plan

**Key components:** `DashboardShell`, `Sidebar`, `MobileNav`, `MobileTopBar`, `Navbar`, `Footer`, `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`, middleware  

---

## 14.1 Dashboard Shell (Authenticated)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-001 | P0 | Functional | Logged in, desktop | Open any dashboard route | Sidebar visible with all `dashboardLinks` |
| LAY-002 | P0 | Functional | Logged in, mobile | Open dashboard route | Mobile top bar + bottom nav; sidebar hidden |
| LAY-003 | P0 | Functional | Click each sidebar link | Navigate | Correct route; active state on current link |
| LAY-004 | P1 | Functional | Collapse sidebar (if supported) | Toggle | Icons-only mode; labels hide; still navigable |
| LAY-005 | P1 | UI | Active route | On `/history` | History link highlighted; others not |
| LAY-006 | P1 | Functional | Logo in sidebar | Click | Goes to `/dashboard` or `/` per design |

---

## 14.2 Mobile Navigation

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-010 | P0 | Functional | Mobile | Bottom nav tabs | Dashboard, Trending, History, Settings (per `bottomNavLinks`) work |
| LAY-011 | P0 | Functional | Mobile | Center FAB (Try It On) | Navigates to `/upload` |
| LAY-012 | P1 | Functional | On `/results/[id]` | Observe bottom nav | Hidden (`isHiddenRoute`) |
| LAY-013 | P1 | Functional | On `/analysis` | Observe bottom nav | Hidden |
| LAY-014 | P1 | Functional | On `/trending/[id]` | Observe bottom nav | Hidden |
| LAY-015 | P1 | UI | Safe area | iOS-like viewport | Bottom nav respects safe-area inset |

---

## 14.3 Marketing Navbar & Footer

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-020 | P1 | Functional | Landing | Navbar links | Login/Register or Dashboard depending on session |
| LAY-021 | P1 | Functional | Footer | Privacy link | Works |
| LAY-022 | P2 | Responsive | Mobile landing nav | Hamburger | Opens/closes; traps focus optionally |

---

## 14.4 Not Found (404)

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-030 | P1 | Functional | None | Visit `/this-does-not-exist` | Custom `not-found` page; link back home/dashboard |
| LAY-031 | P1 | Functional | Invalid results ID | Visit bad results URL | Not-found or friendly error within app chrome |
| LAY-032 | P2 | UI | 404 page | Branding | Consistent with Suitora design |

---

## 14.5 Error Boundary

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-040 | P1 | Error | Force client error (dev) | Trigger error boundary | `error.tsx` UI with retry |
| LAY-041 | P1 | Functional | Click retry | Recover | Attempts re-render; no permanent white screen |

---

## 14.6 Global Loading

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-050 | P2 | UI | Slow navigation | Route change | `loading.tsx` or section skeletons appear |

---

## 14.7 Middleware / Auth Gate

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-060 | P0 | Functional | Logged out | Hit any `/dashboard/*` | Redirect login |
| LAY-061 | P1 | Functional | Logged in | Hit auth pages | Redirect dashboard |
| LAY-062 | P2 | Functional | Deep link to protected page after login | Login with redirect | Lands on originally requested page if supported |

---

## 14.8 Page Transitions

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| LAY-070 | P2 | UX | Navigate between dashboard pages | Observe | `PageTransition` subtle; no jank |
| LAY-071 | P2 | UX | `prefers-reduced-motion` | Navigate | Reduced animation |
