# Suitora — Next Enhancement Plan

> Living plan for the next batch of work. Derived from `docs/future_features_implementation.md`, `docs/body_fit_match/trending_items_roadmap.md`, and gaps found in the codebase during the last implementation round.

## Current State

**Shipped recently (validated: tsc ✓ lint ✓ build ✓, migration applied):**

- AI Stylist chatbot (`/stylist`, `/api/stylist`, `lib/ai/stylist.ts`, `stylist_messages` table)
- Multi-item Comparison (`/compare`, `components/compare/ComparisonView.tsx`, up to 4 items)
- Color Palette recommendations (`lib/ai/color-palette.ts`, `ColorPaletteCard` on results)
- Dashboard Part 1 (ScoreTrendCard, ContextualTips, personalized greeting, new quick actions)
- Android-style mobile shell (bottom nav + FAB, top bar, page transitions)
- **Wardrobe Management** (`/wardrobe`, folders API, `ItemFolderModal`, nav + dashboard)
- **Outfit save/regenerate** + surfaces on dashboard & results
- **Seasonal advice** (`lib/season.ts`, SeasonalTipCard, stylist season context)
- **Stylist enhancements** (richer context, follow-up + action chips)

---

## Phase 1 — Wardrobe Management (complete the half-built feature)

### 1.1 Wardrobe folders API
- **Tasks:**
  - [x] New table `wardrobe_folders` (id, user_id FK cascade, name, created_at) in `drizzle/schema.ts` + hand-written migration in `drizzle/migrations/`.
  - [x] `GET /api/wardrobe` → `{ folders: [{ id, name, itemCount }], items: [...] }` (in-wardrobe favorites joined with folder info).
  - [x] `POST /api/wardrobe/folders` (create), `PATCH /api/wardrobe/folders/[id]` (rename), `DELETE /api/wardrobe/folders/[id]` (folders reset assigned items to null).
  - [x] `PATCH /api/favorites` already supports `wardrobeFolder`/`wardrobeTags` — keep it as the single mutation path for items; folders route only manages folder rows.
  - [x] Validation + auth on every route; consistent `apiOk`/`apiError` envelopes.

### 1.2 Item folder & tag editor (modal)
- **Tasks:**
  - [x] `components/wardrobe/ItemFolderModal.tsx` — pick/create folder, edit tags (chip input, max ~5), reuse in Favorites + Wardrobe pages.
  - [x] Wire existing Favorites "wardrobe" toggle to also open the modal on first add; add an "edit" affordance on the wardrobe badge.
  - [x] Optimistic updates + toast on save/error (mirror `handleToggleWardrobe` pattern).

### 1.3 Dedicated `/wardrobe` page
- **Tasks:**
  - [x] `app/(dashboard)/wardrobe/page.tsx` — loads `GET /api/wardrobe`; folder filter tabs + "All"; item cards reuse Favorites card layout.
  - [x] Include `OutfitSuggestions` on this page (needs `wardrobeCount` prop) so outfits surface where the wardrobe lives.
  - [x] Empty states: no favorites, no wardrobe items, empty folder.

### 1.4 Navigation integration
- **Tasks:**
  - [x] Add `Wardrobe` link to `dashboardLinks` in `lib/navigation.ts` (sidebar; keep mobile bottom nav at 4 tabs + FAB).
  - [x] Add a Wardrobe quick action card on the dashboard.

---

## Phase 2 — Outfit Suggestions completion (roadmap 3.2)

### 2.1 Save / regenerate outfits
- **Tasks:**
  - [x] `POST /api/wardrobe/outfits/regenerate` (or query param) → re-run `lib/ai/outfit-recommender.ts` with the same wardrobe; return new set.
  - [x] `favorite_outfits` table (id, user_id, outfit JSON snapshot, created_at) + `POST/DELETE /api/wardrobe/outfits/favorite`; save/unsave toggle on `OutfitCard`.

### 2.2 Surface outfits on dashboard & results
- **Tasks:**
  - [x] Reuse `OutfitSuggestions` on the dashboard (when wardrobe non-empty) below quick actions.
  - [x] On results page, add a slim "Wear it with" strip using `OutfitItemStrip` when the analyzed item is in the wardrobe.

---

## Phase 3 — Seasonal Fashion Advice (roadmap 3.5)

### 3.1 Season utility + content layer
- **Tasks:**
  - [x] `lib/season.ts` — `getCurrentSeason(date)`, `seasonKey`/label/emoji, hemisphere-neutral default; `getSeasonalTip(season, skinTone?)` returning a short editorial line.
  - [x] `SEASONAL_TIPS` map in `lib/season.ts` (spring/summer/autumn/winter; clothing guidance + color nudges).

### 3.2 Dashboard + stylist integration
- **Tasks:**
  - [x] Dashboard: season-aware greeting line + a small `SeasonalTipCard` (or fold into `ContextualTips`).
  - [x] Stylist: inject `Current season: X` into `buildSystemPrompt` context so replies are time-aware.
  - [x] Results page: if the analyzed item's category is seasonal, show a one-line tip under ScoreOverview.

---

## Phase 4 — Stylist enhancements (roadmap 3.1 continuation)

### 4.1 Richer stylist context
- **Tasks:**
  - [x] Extend `buildContext` (`app/api/stylist/route.ts`) with: wardrobe count + folder names, saved-favorite categories, current season, best/worst scoring categories.
  - [x] Add matching fields to `StylistContext` in `lib/ai/stylist.ts` and the mock reply keyed on "wardrobe"/"season".

### 4.2 Follow-up suggestion chips
- **Tasks:**
  - [x] Parse/infer 2–3 follow-up queries after each assistant reply; render as tappable chips under the message (in `StylistChat.tsx`).
  - [x] Fall back to a small canned list when inference is unavailable.

### 4.3 Action chips (deep links)
- **Tasks:**
  - [x] When the stylist reply matches intents ("try on", "compare", "color"), render a small action button linking to `/upload`, `/compare`, or the results palette section.

---

## Phase 5 — Dashboard Part 2 polish

- [x] Season-aware header copy (reuse `lib/season.ts`).
- [x] Wardrobe metric card: count from `GET /api/wardrobe` (fallback to favorites count).
- [x] Keep `ContextualTips` rule set in sync with new features (add wardrobe-empty tip).

---

## Phase 6 — Fixes & Hardening

### 6.1 Trending real-data providers (from `trending_items_roadmap.md`)
- [x] `lib/trend/providers/shopify.ts` (public Storefront API, no key) + register in `config/trend-providers.ts`; keep `curated` as disabled fallback. *(already present)*
- [x] `next.config.ts` `remotePatterns` for `cdn.shopify.com`. *(already present)*
- [x] `app/api/trending/sync/route.ts`: optional `CRON_SECRET` header support + write sync results to `trend_sync_logs`. *(already present)*

### 6.2 Misc fixes
- [x] Compare page: fetch top-N analyses (`/api/analysis` currently returns everything) — add `limit`/`offset` support and cap the selector.
- [x] Stylist GET: paginate history beyond 50 (currently fixed 50).
- [x] Results `ColorPaletteCard` + palette lib: guard against unknown skin tone strings (already cast-validated in API; harden the lib's `deriveSeasonalPalette` default).
- [x] Confirm `deleteUserRecord` covers `stylist_messages` (added) and any new tables from Phases 1–2.
- [x] Run `npx tsc --noEmit`, `npm run lint`, `npm run build` after each phase; apply migrations via the `scripts/migrate-*.mjs` pattern (env-file loaded).

---

## Suggested Order & Rough Sizes

| # | Item | Size | Deps |
|---|------|------|------|
| 1 | Phase 1 Wardrobe (folders API → editor → page → nav) | L | Backend fields already exist |
| 2 | Phase 2 Outfits (save/regenerate + surfaces) | M | Phase 1 |
| 3 | Phase 5 dashboard polish | S | Phase 1 (wardrobe count) |
| 4 | Phase 3 Seasonal advice | S | None |
| 5 | Phase 4 Stylist enhancements | M | Phase 3 (season in context) |
| 6 | Phase 6 hardening | M | None |

> **Status:** All phases implemented. Migration: `node scripts/migrate-wardrobe-folders.mjs`
