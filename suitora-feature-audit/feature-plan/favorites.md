# Feature Plan: Favorites Management

## 1. Feature Overview

- **Name:** Favorites Management
- **Current Status:** Fully functional
- **Primary Goal:** Allow users to bookmark high-compatibility or aspirational items for quick revisit, forming the bridge between one-off analysis and long-term wardrobe building.
- **Key Stakeholders:** End-users, product.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated `/favorites` page and API (`/api/favorites`).
- Unique constraint on `(user_id, analysis_id)` prevents duplicates.
- Favorites can also feed wardrobe state (`inWardrobe`, tags, folder).
- Toggle available from results and other list views.

### Pain Points & Bugs
- Possible over-fetch when checking favorite status on lists (see dashboard Todo).
- Distinction between “favorite” and “in wardrobe” may be unclear to new users.

### Missing Functionality
- Collections / boards beyond simple list.
- Notes on a favorite.
- Share a public favorites board (optional, privacy-aware).

### Dependencies
- Analyses and products tables.
- Wardrobe features that reuse favorite rows.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Optimize favorite-status checks (lightweight ID set or SQL CASE).
- **Medium:** Optional notes and tags on favorites.
- **Medium:** Clearer UX copy distinguishing Favorite vs Wardrobe.
- **Low:** Public or shared boards.

### Required Fixes & Adjustments
- Ensure optimistic UI + server confirmation for toggles.
- Invalidate dashboard and list caches on change.

### Refactoring & Technical Debt
- Single `toggleFavorite` server action used everywhere.
- Typed responses consistent with project API shape.

### KPIs for Success
- Favorite rate from results ≥ 25%.
- Percentage of favorites later moved to wardrobe.
- Toggle latency < 300 ms perceived.

## 4. Actionable Roadmap

### Phase 1 – Reliability & Performance (3–5 days)
- [ ] Lightweight favorite-ID query (Small)
- [ ] Cache invalidation hooks (Small)
- [ ] Optimistic UI audit (Small)

### Phase 2 – Enrichment (1 week)
- [ ] Notes / tags on favorites (Medium)
- [ ] UX copy and empty states (Small)

### Phase 3 – Social (later)
- [ ] Optional shareable boards (Large)

### Potential Risks & Mitigation
- **Risk:** Users confuse favorite with wardrobe.  
  **Mitigation:** Onboarding tooltips and consistent iconography/language.
