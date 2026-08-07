# Feature Plan: Database & Persistence

## 1. Feature Overview

- **Name:** Database Schema, Queries & Persistence Layer
- **Current Status:** Fully functional (evolving)
- **Primary Goal:** Provide a reliable, typed, and performant source of truth for users, analyses, favorites, wardrobe, trends, and stylist history.
- **Key Stakeholders:** Engineering, product, reliability.

## 2. Current State Assessment (As-Is)

### Strengths
- Drizzle ORM + Turso (edge SQLite).
- Comprehensive schema covering users, sessions, analyses, favorites, products, uploads, settings, trend items, stylist messages, wardrobe folders, outfits, etc.
- Typed queries in `lib/db/queries.ts`.
- Migrations folder present.
- Indexes on common access paths (user_id, created_at, etc.).

### Pain Points & Bugs
- Historical docs (e.g., older alignment reports) may lag the current schema — documentation drift.
- Some JSON fields stored as text; application must serialize/deserialize carefully.
- Query performance on dashboard still being optimized (see Todo).

### Missing Functionality
- Stronger migration discipline and environment promotion process.
- Read replicas or caching layer for hot paths if traffic grows.
- Soft-delete strategy standardized across entities.

### Dependencies
- Turso credentials and network.
- Drizzle Kit for migrations.
- All feature modules that read/write data.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Keep schema docs and `docs/data_schema.md` in sync with `drizzle/schema.ts`.
- **High:** Complete dashboard query performance improvements.
- **Medium:** Standardize soft-delete + retention markers.
- **Medium:** Query-level caching for dashboard and trending.
- **Low:** Explore Turso replicas or secondary store if write volume grows.

### Required Fixes & Adjustments
- All mutations must be user-scoped and authorization-checked.
- Avoid N+1 patterns; prefer joins or batched ID lookups.

### Refactoring & Technical Debt
- Prefer Drizzle query builders over raw SQL.
- Keep a single module for complex aggregations.
- Add migration checklist to PR template.

### KPIs for Success
- Zero data-loss incidents.
- p95 query latency for dashboard aggregates within target (see Dashboard plan).
- Migration apply success rate 100% in staging before production.

## 4. Actionable Roadmap

### Phase 1 – Hygiene (1 week)
- [ ] Sync data_schema.md with current Drizzle schema (Medium)
- [ ] Dashboard parallel queries + favorite ID optimization (Small–Medium)
- [ ] AuthZ review on mutation endpoints (Medium)

### Phase 2 – Performance (1–2 weeks)
- [ ] Targeted indexes based on EXPLAIN / slow query review (Medium)
- [ ] Short-TTL cache for hot user-scoped reads (Medium)

### Phase 3 – Lifecycle (later)
- [ ] Soft-delete conventions (Medium)
- [ ] Capacity planning for Turso (ongoing)

### Potential Risks & Mitigation
- **Risk:** Destructive migrations.  
  **Mitigation:** Expand-contract pattern, backups, staging rehearsal.
- **Risk:** Schema drift between environments.  
  **Mitigation:** Single migration path, CI checks.
