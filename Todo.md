# AI Agent Implementation Rules

> **IMPORTANT**
>
> These rules are mandatory for every implementation session. The AI agent must follow them before, during, and after implementing any feature in this document.

---

# Rule 1 — Read Required Documentation

Before implementing any task, the AI agent **MUST** read and understand the following project documentation:

- `docs/body_fit_match/trend_outfit_display.md`
- `docs/body_fit_match/trending_items_online.md`
- `docs/body_fit_match/body_fit_file_component_map.md`

These documents define the project's architecture, component relationships, feature flow, and implementation requirements. That documents also define the features to implement so do it.

The AI agent must not begin coding until these documents have been reviewed.

---

# Rule 2 — Follow the Documentation

The AI agent must implement features exactly as defined by the project documentation.

The AI agent must not:

- invent new architecture
- redesign existing flows
- remove existing functionality
- ignore documented requirements
- create duplicate implementations

If implementation details are missing, the AI agent should follow the existing project architecture and coding conventions.

---

# Rule 3 — Work Sequentially

Tasks must be completed in order.

The AI agent must never skip unfinished tasks or jump to a later phase unless explicitly instructed by the user.

---

# Rule 4 — Update Progress

Immediately after successfully completing a task, the AI agent **MUST** update this document.

Change

```md
- [ ]
```

to

```md
- [x]
```

The checkbox must only be checked after the implementation has been completed and verified.

---

# Rule 5 — Verification Before Completion

A task may only be marked as complete when all of the following are true:

- The implementation is finished.
- The project builds successfully.
- No new TypeScript errors exist.
- No new ESLint errors exist.
- Existing features remain functional.
- The implementation follows the referenced documentation.

If any of these conditions are not met, the checkbox must remain unchecked.

---

# Rule 6 — Resume After Interruption

If development is interrupted for any reason (context limit, IDE restart, power outage, network issue, or user pause), the AI agent must resume work without repeating completed tasks.

The AI agent must:

1. Read the three required documentation files.
2. Open this implementation TODO document.
3. Find the first unchecked task (`- [ ]`).
4. Resume implementation from that task.
5. Continue sequentially.

The AI agent must not restart from Phase 1 unless explicitly instructed.

---

# Rule 7 — Never Uncheck Completed Work

Once a task has been marked as completed (`- [x]`), it must remain completed unless the implementation has been intentionally removed or reverted.

---

# Rule 8 — Preserve Existing Functionality

The AI agent must not break or remove existing project functionality while implementing new features.

Backward compatibility with the existing Suitora codebase must always be maintained.

---

# Rule 9 — Complete the Current Phase

The AI agent should finish all tasks within the current phase before moving to the next one.

A phase is considered complete only when every checkbox in that phase has been marked as completed.

---

# Rule 10 — Keep the TODO Updated

---

# Implementation Checklist

All tasks below have been verified as complete.

## Phase 1 — Types & Schema

- [x] `types/trend.ts` — TrendItem, TrendOutfit, RawProviderProduct types
- [x] `types/body-fit.ts` — ItemCategory (including `full_outfit`), all fit interfaces
- [x] `types/index.ts` — Re-exports from body-fit and trend
- [x] `drizzle/schema.ts` — trendItems + trendSyncLogs tables
- [x] `drizzle/migrations/2026-07-26-add-trend-items.sql` — Migration SQL
- [x] Migration applied to SQLite database

## Phase 2 — Config & Services

- [x] `config/category-display.ts` — Category display config + normalize helpers
- [x] `config/trend-providers.ts` — Provider configuration
- [x] `lib/trend/normalize.ts` — Product normalization pipeline
- [x] `lib/trend/fetch.ts` — Fetch service for providers
- [x] `lib/trend/ranking.ts` — Ranking service
- [x] `lib/trend/cache.ts` — In-memory cache layer
- [x] `lib/trend/sync.ts` — Synchronization orchestrator
- [x] `lib/trend/providers/curated.ts` — Curated dataset provider
- [x] `jobs/trend-sync.ts` — Cron job entrypoint

## Phase 3 — API Routes

- [x] `app/api/trending/route.ts` — GET list with filters + caching
- [x] `app/api/trending/[id]/route.ts` — GET detail + similar items
- [x] `app/api/trending/sync/route.ts` — POST manual sync

## Phase 4 — UI Components

- [x] `components/ui/CategoryBadge.tsx` — Category badge with icon + label
- [x] `components/ui/index.ts` — Export CategoryBadge
- [x] `components/results/CategoryHeroImage.tsx` — Category-aware hero image
- [x] `components/results/index.ts` — Export CategoryHeroImage
- [x] `components/results/FitSummary.tsx` — Category-aware summary text
- [x] `components/trending/TrendingCard.tsx` — Trend item card
- [x] `components/trending/TrendingCardSkeleton.tsx` — Loading skeleton
- [x] `components/trending/TrendingCarousel.tsx` — Horizontal carousel
- [x] `components/trending/TrendingGrid.tsx` — Responsive grid
- [x] `components/trending/TrendingCollection.tsx` — Section with title + layout
- [x] `components/trending/TrendingFilters.tsx` — Category filter bar
- [x] `components/trending/index.ts` — Exports
- [x] `components/outfits/OutfitItemStrip.tsx` — Multi-item outfit strip
- [x] `components/outfits/TrendOutfitCard.tsx` — Outfit card
- [x] `components/outfits/index.ts` — Exports

## Phase 5 — Pages & Integration

- [x] `app/(dashboard)/trending/page.tsx` — Trending list page with filters
- [x] `app/(dashboard)/trending/[id]/page.tsx` — Trending item detail page
- [x] `app/(dashboard)/dashboard/page.tsx` — Dashboard with TrendingCollection
- [x] `app/(dashboard)/favorites/page.tsx` — Favorites with category filter
- [x] `app/(dashboard)/history/page.tsx` — History with heart/filter UI
- [x] `components/layout/Sidebar.tsx` — "Trending" nav link with Sparkles icon
- [x] `components/dashboard/AnalysisListItem.tsx` — Category badge integration
- [x] `lib/db/queries.ts` — All trend (listTrendItems, getTrendItemById, etc.)

## Phase 6 — Fixes & Build

- [x] `lib/ai/item-attributes.ts` — Added missing `full_outfit` entries (3 records)
- [x] `next.config.ts` — Added `images.remotePatterns` for Unsplash, Cloudinary, Placeholder
- [x] TypeScript check — Zero errors
- [x] Database migration applied


This implementation document is the single source of truth for project progress.

The AI agent must keep it synchronized with the codebase throughout development.

Every completed task must be reflected immediately by updating its checkbox.