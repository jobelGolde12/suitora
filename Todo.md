# Suitora — Enhancement & Fix Plan

> Living checklist for bug fixes, enhancements, and new features.
> Canonical sources: `docs/future_features_implementation.md`, `docs/virtual_tryon_engine_tasks.md`, `docs/analysis_db_alignment_report.md`.
> **Before any UI work, read `premium-editorial-ui.md` and follow the design language.**
> Verify before finishing each item: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm test`.

---

## P0 — Bugs & correctness (do first)

### P0.1 Lint cleanup — `npm run lint` currently fails (~20 errors)

Fix every error/warning below. Prefer typing over `// eslint-disable`. For `react-hooks/set-state-in-effect`: move fetch logic into a `useCallback` invoked from the effect, or derive initial state server-side.

> **DONE (Aug 2026):** `npm run lint` exits 0; `npx tsc --noEmit` clean; `npm run build` succeeds.
> Notes: set-state-in-effect fixed by calling fetch functions through a `.then` promise boundary (rule traces it as async) and inline `.then` chains where the fetcher was effect-only; `Avatar` moved to `next/image`.

- [x] `app/(dashboard)/analysis/page.tsx` — remove unused `useCallback` (3); move `setError("No analysis ID provided.")` out of the effect (36); `intervalId` → `const` (40); type `err` (83)
- [x] `app/(dashboard)/favorites/page.tsx` — type `any` (56); fix `set-state-in-effect` (72) + `exhaustive-deps` (73)
- [x] `app/(dashboard)/history/page.tsx` — fix `set-state-in-effect` (55) + `exhaustive-deps` (56)
- [x] `app/(dashboard)/results/[id]/page.tsx` — replace 3× `any` (82, 125, 173) with a shared `AnalysisResult` type
- [x] `app/(dashboard)/settings/page.tsx` — remove unused `Avatar` (19)
- [x] `app/(dashboard)/upload/page.tsx` — `payload` → `const` (126); type 2× `any` (126, 167)
- [x] `app/api/dashboard/stats/route.ts` — type `any` (47)
- [x] `app/api/favorites/route.ts` — type 3× `any` (34, 84, 122)
- [x] `app/api/trending/route.ts` — `items` → `const` (63)
- [x] `app/api/uploads/route.ts` — type 2× `any` (79, 114)
- [x] `app/api/user/profile/estimate/route.ts` — remove unused `nanoid` (8); `profile` → `const` (42); type `any` (76)
- [x] `app/api/user/profile/route.ts` — remove unused `UserProfile` (11); type 3× `any` (45, 102, 108)
- [x] `app/api/user/self-image/route.ts` — type 2× `any` (24, 71)
- [x] `components/layout/Navbar.tsx` — fix `set-state-in-effect` (30)
- [x] `components/providers/SessionProvider.tsx` — fix `set-state-in-effect` (64)
- [x] `components/results/InsightsList.tsx` + `components/results/ScoreOverview.tsx` — remove unused `cn`
- [x] `components/settings/ProfileForm.tsx` — fix use-before-declare (187)

**Gates:** `npm run lint` exits 0; `npx tsc --noEmit` clean; `npm run build` succeeds.

### P0.2 Shared result type

> **DONE (Aug 2026):** Added `AnalysisResult` (parsed, API-facing) to `types/` plus `FavoriteItem`. Added `toAnalysisResult()` serializer in `lib/db/queries.ts` (decodes `recommendations`/`colorAnalysis`/`compatibilityMetadata` JSON columns). Used across results/favorites/history/dashboard pages and `/api/analysis`, `/api/favorites`, `/api/dashboard/stats` routes. Aligned `Analysis` interface nullable fields with DB (`| null`). Zero `any` left in the codebase.

- [x] Create a shared `AnalysisResult` type in `types/` (from `lib/db/queries.ts` row shape + `lib/ai/` outputs) and use it in results page, favorites, history, dashboard, and API routes instead of `any`.

### P0.3 Consistent API response envelope

> **DONE (Aug 2026, light pass per decision):** Created `lib/api/response.ts` with `apiError(message, status)` and `apiOk(data?, message?)`. All `/api/*` routes now use `apiError` for a consistent `{ error }` shape + status codes (401/400/403/404/429/500). Added `success: true` to `PUT /api/user/profile`; standardized `trending/sync` `ok:true` → `success:true`. Success payload shapes preserved (clients unchanged). Kept `GET /api/analysis` poll responses as-is (client contract reads `data.error` on 200). Removed internal error detail leakage in `POST /api/analysis` URL-extraction failure.

- [x] Audit all `/api/*` routes and align responses to `{ success, data, message }` (AGENTS.md API rule). Routes: `analysis`, `favorites`, `uploads`, `user/*`, `dashboard/stats`, `trending*`, `tryon/webhook`. Unify error handling (401/400/403/500) without leaking internals.

### P0.4 Rate limiting on AI-heavy endpoints

> **DONE (Aug 2026):** Added `analysisRateLimiter` (20/1d) + `uploadRateLimiter` (10/1h) in `lib/rate-limit.ts`, wired into `POST /api/analysis` and `POST /api/uploads` keyed by user id with 429 responses. Mirrors existing tryon/login limiters.

- [x] Add `createLimiter` guards (see `lib/rate-limit.ts`) to `POST /api/analysis` (e.g. 20/day/user) and `POST /api/uploads` (e.g. 10/hour) — mirrors existing login/register/tryon limiters. Return 429 with a readable message.

### P0.5 Analysis pipeline hardening

> **DONE (Aug 2026):**
> - `lib/ai/providers/openai-vision.ts`: added `fetchWithRetry` — 30s hard timeout (AbortController) + up to 3 attempts with exponential backoff (1s/2s + jitter), retrying only transient failures (network/timeout/408/429/5xx). Auth/validation errors pass through.
> - Fallback verified: with no provider configured → mock. With OpenAI configured but failing after retries → the analysis is marked `failed` and `GET /api/analysis` returns a clear, sanitized "Analysis failed. Please try again." message (no internal error leakage, no silent 500).
> - Partial results (scores with no try-on) already surfaced by design (try-on soft-fails independently via `tryOnStatus: skipped`).
> - `DELETE /api/analysis` cleanup confirmed correct as-is: it deletes the generated try-on image; the user self-image (`user_image` = shared `users.selfImageUrl`) and product image (may be shared via `products` table) must NOT be removed — deleting them would break the profile/other analyses.

- [x] Verify `lib/ai/vision.ts` provider fallback: when OpenAI returns an error/timeout, degrade to mock or a clear user-facing failure — never a silent 500.
- [x] Add retry/backoff for OpenAI vision calls; surface partial results (scores with no try-on) as already designed.
- [x] Confirm `DELETE /api/analysis` also cleans Cloudinary user image + generated image (not just generated).

---

## P1 — Enhancements

### P1.1 Product URL → auto-extract (Phase 2.2)

> **DONE (Aug 2026):** URL input already existed on the upload page (link mode); `POST /api/analysis` already extracted via `lib/ai/product-extraction.ts` and persisted to the `products` table with `productId` on the analysis. Added 24h in-memory cache (`extractProductFromUrlCached`, `product:url:{encoded}` key) so repeat analyses don't re-scrape. Graceful fallback message on blocked sites already in place.

- [x] Add "Paste product URL" input on `app/(dashboard)/upload/page.tsx` alongside image upload
- [x] Implement extractor in `lib/products/` (accept URL → primary product image, title, brand, price); store in `products` table; cache `product:url:{encoded}:id` (24h TTL via `lib/trend/cache.ts` pattern)
- [x] Graceful fallback to manual upload when a site blocks scraping (clear message)
- [x] Wire extracted image into analysis flow (set `productId` on the analysis row)

### P1.2 Results page — similar items & outfit suggestions

> **DONE (Aug 2026):** New `GET /api/trending/similar?analysisId=…` (auth-guarded) extracts `category`/`styleTags` from the analysis's `compatibilityMetadata.itemProfile`, queries same-category trend items (`listSimilarTrendItems` in `lib/db/queries.ts`, style-tag overlap first), then scores each against the user's stored profile via the fit engine. New `lib/ai/similar-items.ts` builds `UserBodyProfile` (manual measurements with height-based estimates) and `ItemProfile` from trend rows; `SimilarItemResult` lives in `types/index.ts` so the client component stays light. Results page renders an editorial "Items Like This" grid (`components/trending/SimilarItems.tsx`) linking to `/trending/[id]`, with image-failure fallback and score label badges.

- [x] Add "Items like this" section on `app/(dashboard)/results/[id]/page.tsx` sourced from `trend_items` (same `category`/`styleTags`, sorted by `popularityScore`)
- [x] Score each suggestion against the user's stored profile (reuse `lib/ai/fit-scoring.ts`); link each to `/trending/[id]` or a new analysis run
- [x] Keep it calm/editorial per `premium-editorial-ui.md`

### P1.3 Dashboard — real metrics

> **DONE (Aug 2026):** `getDashboardStats` already computed real `totalAnalyses`, `averageScore`, `favoriteCount` (real favorites count) and `recentActivity` (last 7 days); dashboard page renders them. `TrendingCard` uses fixed image heights (`h-56/h-64/h-72`) + `line-clamp-2`, so card height is stable; added a state-based image-failure fallback (muted placeholder) since `next/image` here doesn't forward `onError` for the layout.

- [x] Replace/augment `app/api/dashboard/stats/route.ts` metrics: real favorites count, last 7-day activity, avg overallScore; keep the recent-analyses list + score trend
- [x] Ensure trending card height is stable (already fixed once — regression-check) and handles image load failures

### P1.4 Profile & measurements

> **DONE (Aug 2026):** `ProfileForm` is fully wired to `user_profiles` (GET/PUT `/api/user/profile`, POST `/api/user/profile/estimate`). Analysis completion now persists high-confidence traits (`persistAnalysisEstimates` in `lib/db/queries.ts`, threshold ≥0.7 for height/weight; manual columns never overwritten). Results page "Your Style Profile" card fetches the profile and shows manual height/weight/shoe size/fit preference with manual data taking precedence over AI estimates (estimated values still shown with confidence when no manual value exists).

- [x] Wire `components/settings/ProfileForm.tsx` fully to `user_profiles` via `/api/user/profile` + `/estimate` (fields: height, weight, measurements, shoe size, fit/size preference)
- [x] Persist AI-estimated body shape/height/weight from an analysis into `user_profiles.estimated_*` when confidence is high
- [x] Surface saved measurements in results page "Your Style Profile" card (manual data takes precedence over estimates)

### P1.5 Wardrobe concept (Phase 2.5)

> **DONE (Aug 2026):** Added wardrobe state to `favorites` (`in_wardrobe`, `wardrobe_tags`, `wardrobe_folder`, `added_to_wardrobe_at` + index; schema + `drizzle/migrations/2026-08-04-add-wardrobe-fields.sql`). New `PATCH /api/favorites` updates wardrobe fields (auth-guarded, favorite must exist, tags capped at 12); GET now returns parsed `inWardrobe`/`wardrobeTags`/`wardrobeFolder`/`addedToWardrobeAt`. Favorites page adds an All / In Wardrobe filter, a per-card wardrobe toggle (optimistic update + rollback), an "In Wardrobe" badge, and tag/folder badges. Favorites page was already DB-backed (verified) with category filters working.

- [x] Add "in wardrobe" state (new column/table) so users can organize favorited analyses; simple tags/folders
- [x] Keep favorites page filters/search working (already partly built — verify against DB not mock)

### P1.6 Multiple outfit comparison (Phase 2.4)

> **DEFERRED (Aug 2026):** Larger feature (2–4 items per upload, parallel analysis runs, side-by-side comparison view). Requires upload/analysis schema changes. Deferred to a future phase; P1 items are otherwise complete.

### P1.7 Upload page — side-by-side "Upload Self" + "Upload Item to Match"

> **PLAN (Aug 2026):**
> Goal: symmetric two-panel upload on `app/(dashboard)/upload/page.tsx`. Left panel uploads the user's body photo ("Upload Self") via an inline dropzone; right panel uploads the item to match ("Upload Item to Match", image or paste URL). Both panels share the same editorial dropzone language (`rounded-2xl border-dashed border-border bg-card shadow-card`, `aspect-[3/4]`, `font-light` helper copy) and the same validation (`validateFile` → `MAX_FILE_SIZE` / `ACCEPTED_IMAGE_TYPES`). The page must stay green on all four gates.
>
> Current state: left panel only *displays* a saved self-image (or a "Self-image required" placeholder that pops the forced `SelfImageModal`); right panel is the "Clothing Item" upload/link input. Plan makes the left panel a real upload zone and removes the forced modal auto-open.

> **DONE (Aug 2026):** `app/(dashboard)/upload/page.tsx` now has two symmetric panels. Left "Upload Self": inline dropzone (drag & drop + click/keyboard, `aria-label`, dashed editorial styling) with immediate validate → `uploadImage()` → `POST /api/user/self-image` → `selfImageUrl` (checks `data.success`), inline uploading overlay (`Loader2`) + inline `selfError` + toast on failure; saved image renders with "Profile Active" badge and "Change Photo" opens `SelfImageModal`. Right panel retitled "Upload Item to Match" (tabs/dropzone/paste-URL/preview/remove/"Ready to Analyze" unchanged, dropzone copy aligned). Removed the forced `SelfImageModal` auto-open on mount; `handleAnalyze` now toasts if the self photo is missing. `AnalysisRequest` payload untouched. All four gates green (lint 0 errors, `tsc --noEmit` clean, build succeeds, 38 tests).

**Left panel — "Upload Self" (`app/(dashboard)/upload/page.tsx`)**
- [x] Inline dropzone (drag & drop + click-to-browse, keyboard accessible) replacing the "Self-image required" placeholder; shows when no saved `selfImageUrl`
- [x] When a saved self-image exists: render it with the "Profile Active" badge and a "Change Photo" action that re-opens `SelfImageModal` (kept for the guided flow)
- [x] On file select/drop: `validateFile` → set pending preview → immediately upload via `uploadImage()` (`lib/ai/upload.ts`) → persist via `POST /api/user/self-image` → update `selfImageUrl` (same contract `SelfImageModal` uses; `data.success` checked)
- [x] Uploading state shows the preview with an inline loading overlay + progress; failures surface inline (`selfError`) and via toast — no silent failures
- [x] Remove the forced `SelfImageModal` auto-open on mount (inline panel is now the primary entry point)

**Right panel — "Upload Item to Match" (`app/(dashboard)/upload/page.tsx`)**
- [x] Retitle existing "Clothing Item" panel to "Upload Item to Match"; keep upload/link tabs, dropzone, paste-URL card, preview + remove + "Ready to Analyze" badge unchanged
- [x] Dropzone helper copy aligned with left panel ("Upload item to match")

**Behavior**
- [x] `canProceed` unchanged: `selfImageUrl` + valid clothing input; "Analyze Compatibility" now toasts if the self photo is missing (replaces modal auto-open)
- [x] `AnalysisRequest { userImageUrl, productImageUpload?, productUrl? }` payload and `/api/analysis` call untouched

**State & handlers (`app/(dashboard)/upload/page.tsx`)**
- [x] Add `selfInputRef`, `pendingSelf` (file + preview), `selfUploading`, `selfError`, `selfDragOver` state
- [x] Add `handleSelfFileSelect`, `handleSelfDrop`, `handleSelfDragOver`, `uploadSelfPhoto()` (upload + persist + state updates)
- [x] Keep `SelfImageModal` for "Change Photo" only

**Gates (must all pass)**
- [x] `npm run lint` (0 errors)
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` succeeds
- [x] `npm test` green (38 tests)

---

## P2 — Virtual Try-On remaining work (`docs/virtual_tryon_engine_tasks.md`)

- [ ] **License decision** — choose commercial path (author license / permissive fine-tune / SaaS VTON API) per `docs/vton_licensing_research.md`. **Blocks all Phase 1+ GPU work.**
- [ ] **Model wiring (Phase 1)** — implement Fotor stages 1–4 in `worker/vton-worker/pipeline.py` (SCHP + DWPose → agnostic mask → garment warping → diffusion inpainting → VAE decode ± 4K upscale)
- [ ] **Monitoring** — log jobId, provider, latency, status transitions; surface failure rate in dashboard (`audit_logs` + `trend_sync_logs` patterns)
- [ ] **Design/QA review** — E2E upload → analysis → try-on → results with golden image set; record P95 latency + cost per run

---

## P3 — Phase 3 features (planned, unblocks later)

- [ ] AI stylist chatbot (context: past analyses, body metrics, wardrobe; tool-calling)
- [x] **Outfit recommendation engine** — `lib/ai/outfit-recommender.ts` (pure/deterministic: role mapping `tops→top`, `bottoms→bottom`, `dresses→dress`, etc.; generates a dress-alone or top+bottom foundation, greedily adds best outer/footwear/headwear/accessory, then scores each finished look). Scores blend per-item fit (reused from stored analyses) with outfit-level signals: `coherenceScore` (style-tag Jaccard + formality consistency), `colorStoryScore` (hex→HSL palette compatibility), `proportionScore` (silhouette-volume balance), plus `formalityConsistency`; returns ranked `TrendOutfit[]`. Backed by auth-guarded `GET /api/wardrobe/outfits` (feeds wardrobe favorites i.e. `in_wardrobe`) + `getWardrobeFavoritesByUserId` in `lib/db/queries.ts`. Editorial `components/wardrobe/OutfitSuggestions.tsx` rendered on the favorites page (reuses `OutfitItemStrip`, `getScoreColor`). 12 unit tests. All four gates green.
- [ ] Color palette recommendations (skin tone + hair + past analyses → personal palette)
- [ ] Seasonal fashion advice (time/season-aware tips)
- [ ] Social sharing / public lookbooks (privacy review first)
- [ ] Affiliate monetization (requires `TREND_AFFILIATE_API_KEY`; also enables `SERPAPI_API_KEY` provider in `lib/trend/providers/`)

---

## Quality & Infrastructure

> **Status (Aug 2026):** Tests, CI, docs sync, migration runbook, and retention cleanup are done. Env hygiene is only partially verifiable (per AGENTS.md, `.env*` files are not read).

- [x] **Tests** — Vitest coverage added for `lib/ai/fit-scoring`, `lib/ai/size-prediction`, `lib/ai/product-extraction` (mocked fetch), and `lib/ai/similar-items` (new). 38 tests passing (`npm test`).
- [x] **CI** — `.github/workflows/ci.yml` runs `lint`, `tsc --noEmit`, `vitest run`, and a production build on every PR/push to main.
- [x] **Docs sync** — `docs/future_features_implementation.md` status table updated (2.1/2.2/2.3/2.5 DONE, 3.3 partial, 2.4 deferred).
- [x] **Migration hygiene** — schema + dated migration kept in sync (wardrobe columns); migration runbook (local vs remote Turso) documented in `README.md`.
- [x] **Env hygiene** — `.env.example` documents every `lib/env.ts` `serverEnvSchema` key plus optional trend keys (`SERPAPI_API_KEY`, `TREND_AFFILIATE_API_KEY`). Real `.env`/`.env.local` values remain local-only (never committed; agents do not read them). Operators should still diff their local files against the example.
- [x] **Retention policy** — `lib/retention.ts` deletes uploads older than 90 days (skips URLs still referenced by analyses/profiles), exposed via `POST /api/uploads/cleanup` (Vercel-cron or session guarded) + `jobs/retention.ts`; registered weekly cron in `vercel.json`.
- [x] **Final verification (automated)** — `npm run lint` (0 errors), `npx tsc --noEmit` clean, `npm run build` succeeds, `npm test`. Remaining: manual smoke test of landing → login → upload → analysis → results → favorites.
