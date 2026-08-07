# Feature Plan: Dashboard

## 1. Feature Overview

- **Name:** Dashboard (Stats, Recent Analyses, Quick Actions, Score Trends)
- **Current Status:** Fully functional (performance improvements identified)
- **Primary Goal:** Give authenticated users an at-a-glance view of their activity, progress, and next best actions (upload new item, review history, open stylist).
- **Key Stakeholders:** End-users, product, growth.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated page at `/dashboard` with stats cards, recent analyses, favorites summary, and quick actions.
- API route `/api/dashboard/stats` aggregates data.
- Skeleton loading states preserve perceived performance.
- Consistent design language with rest of dashboard shell.

### Pain Points & Bugs
- Sequential DB queries in stats endpoint increase latency (documented in `Todo.md`).
- Favorites lookup can be optimized (N+1 / over-fetch).
- Client often refetches on every navigation; no SWR / stale-while-revalidate yet.
- Limited personalization of “next action” recommendations.

### Missing Functionality
- Personalized tips based on score trends or wardrobe gaps.
- Quick “analyze trending item” entry points.
- Empty-state onboarding checklist for first-time users.

### Dependencies
- Auth session.
- Analyses, favorites, and user profile queries.
- Design system components (`PageContainer`, skeletons, etc.).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Parallelize independent queries with `Promise.all` and lightweight favorite-ID query.
- **High:** Client-side SWR / React Query for stats with short stale time.
- **Medium:** First-run checklist and progressive disclosure.
- **Medium:** Score-trend sparkline or small chart with actionable insight.
- **Low:** Configurable dashboard widgets (power users).

### Required Fixes & Adjustments
- Implement parallel fetching and reduce over-fetching as outlined in `Todo.md`.
- Ensure cache invalidation after new analysis or favorite change.
- Improve empty and error states.

### Refactoring & Technical Debt
- Keep stats aggregation in a single well-typed service function.
- Prefer server components where possible; isolate client islands for interactive parts.
- Add unit tests for aggregation edge cases (zero analyses, etc.).

### KPIs for Success
- Dashboard TTFB / time-to-content reduced by ≥ 40%.
- Increase “Upload” CTA clicks from dashboard by 15%.
- Reduce support tickets related to “nothing loads” or stale data.

## 4. Actionable Roadmap

### Phase 1 – Performance (3–5 days)
- [ ] Parallelize `/api/dashboard/stats` queries (Small)
- [ ] Optimize favorites ID lookup (Small)
- [ ] Add response caching headers or short server cache (Small)

### Phase 2 – Client Caching & UX (1 week)
- [ ] Introduce SWR (or equivalent) for dashboard data (Medium)
- [ ] First-time user checklist (Medium)
- [ ] Better empty / error states (Small)

### Phase 3 – Insights (later)
- [ ] Score trend visualization + insight copy (Medium)
- [ ] Cross-links to trending and stylist (Small)

### Potential Risks & Mitigation
- **Risk:** Over-aggressive caching shows stale stats.  
  **Mitigation:** Short TTLs + explicit invalidation on analysis completion and favorite changes.
- **Risk:** Adding charts increases bundle size.  
  **Mitigation:** Lazy-load chart library only when data exists.
