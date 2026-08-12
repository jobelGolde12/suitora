# Feature Plan: Trending Items

## 1. Feature Overview

- **Name:** Trending Items & Trend Sync
- **Current Status:** Fully functional
- **Primary Goal:** Surface currently popular fashion items so users can discover and analyze pieces that match the moment, increasing engagement and analysis volume.
- **Key Stakeholders:** End-users, growth, partnerships, content.

## 2. Current State Assessment (As-Is)

### Strengths
- `/trending` page with filters and grid.
- Detail route `/trending/[id]`.
- `trendItems` and `trendSyncLogs` tables.
- Sync job (`jobs/trend-sync.ts`) and API routes for list, detail, similar, and sync.
- Provider-agnostic design under `lib/trend/` (affiliate, etc.).
- Similar-items logic exists.

### Pain Points & Bugs
- Freshness depends on sync frequency and provider reliability.
- Personalization of “trending for you” is limited (mostly global or category filters).
- Image quality and metadata completeness vary by provider.

### Missing Functionality
- Personalized ranking using user’s style tags and past scores.
- “Analyze this trending item” one-click flow that pre-fills the analysis pipeline.
- Editorial collections / curated drops.

### Dependencies
- Trend providers and network access.
- Products / analysis pipeline for deep linking into try-on.
- Background job runner / cron.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** One-click “Try on me” from trending cards (uses self-image + product image).
- **High:** Personalized ranking signals from user profile and history.
- **Medium:** Editorial / seasonal collections.
- **Medium:** Stronger similar-items recommendations.
- **Low:** Social proof (how many Suitora users analyzed this).

### Required Fixes & Adjustments
- Monitor sync success rates per provider; alert on prolonged failure.
- Deduplicate items across providers.
- Graceful empty states when a category has no items.

### Refactoring & Technical Debt
- Keep normalize layer strict so UI never sees provider-specific quirks.
- Index popularity and category fields for fast filtering.

### KPIs for Success
- Click-through from trending → analysis.
- % of analyses that originate from trending.
- Sync job success rate ≥ 95%.

## 4. Actionable Roadmap

### Phase 1 – Conversion (1 week)
- [ ] “Try on me” deep link into upload/analysis (Medium)
- [ ] Sync monitoring & alerts (Small)

### Phase 2 – Personalization (1–2 weeks)
- [ ] Rank by user style affinity (Medium)
- [ ] Similar items polish (Medium)

### Phase 3 – Content (later)
- [ ] Curated collections (Medium)
- [ ] Social proof counters (Small)

### Potential Risks & Mitigation
- **Risk:** Stale or unavailable product links.  
  **Mitigation:** Availability flags, periodic re-validation, fallback messaging.
- **Risk:** Affiliate / commercial conflicts.  
  **Mitigation:** Clear commercial policy and provider contracts.
