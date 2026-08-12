# Feature Plan: Analysis History

## 1. Feature Overview

- **Name:** Analysis History (Search, Sort, Delete)
- **Current Status:** Fully functional
- **Primary Goal:** Let users review past analyses, find specific items, and manage their history so the product becomes a long-term style memory, not a one-off tool.
- **Key Stakeholders:** End-users, product.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated `/history` page with list of past analyses.
- Search, sort, and delete capabilities.
- Integration with favorites and score display.
- Skeleton loading and empty states.

### Pain Points & Bugs
- Search is likely client-side or simple; may not scale for power users with hundreds of analyses.
- Bulk actions (multi-delete, bulk favorite) limited or absent.
- Filtering by score range, category, or date range could be richer.

### Missing Functionality
- Advanced filters (score range, category, date, has-try-on).
- Bulk operations.
- Export history (CSV / JSON) for power users.
- Infinite scroll or cursor pagination for large histories.

### Dependencies
- Analyses queries filtered by user.
- Auth and ownership checks on delete.
- Results and favorites routes.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Server-side search + pagination.
- **Medium:** Filter chips (score, category, date).
- **Medium:** Bulk select + delete / favorite.
- **Low:** Export and “re-analyze” action.

### Required Fixes & Adjustments
- Confirm soft-delete vs hard-delete policy and cascade behavior on favorites.
- Ensure delete is irreversible only after confirmation.

### Refactoring & Technical Debt
- Reuse list item components with history, favorites, and wardrobe.
- Keep query parameters in the URL for shareable filtered views.

### KPIs for Success
- History page return rate (users who revisit history weekly).
- Successful search → result open rate.
- Accidental-delete support tickets near zero.

## 4. Actionable Roadmap

### Phase 1 – Scale (1 week)
- [ ] Cursor or offset pagination + server search (Medium)
- [ ] Confirm delete dialog and cascade behavior (Small)

### Phase 2 – Power Features (1–2 weeks)
- [ ] Filter chips and URL state (Medium)
- [ ] Bulk actions (Medium)

### Phase 3 – Extras (later)
- [ ] Export (Small–Medium)
- [ ] Re-analyze shortcut (Small)

### Potential Risks & Mitigation
- **Risk:** Expensive full-table scans as history grows.  
  **Mitigation:** Indexes on `user_id` + `created_at`, limited default page size, search only on indexed or full-text fields.
