# Suitora — Future Features Implementation Plan

> **Canonical source for upcoming work.**  
> Derived from `README.md`, `docs/project_detail.md`, `docs/data_schema.md`, `docs/analysis_db_alignment_report.md`, `docs/weight_height_prediction_plan.md`, and related docs.  
> Always consult `premium-editorial-ui.md` before any UI work.

---

## Current State Summary (as of latest docs)

| Area | Status | Notes |
|------|--------|-------|
| Phase 1 MVP (UI + mock AI) | ✅ Complete | Landing, auth, dashboard, upload, mock analysis, results, history, favorites, settings |
| Real AI analysis | ❌ Not started | Still using `lib/ai/mock-analysis.ts` |
| DB persistence for analyses/favorites | ❌ Misaligned | See `docs/analysis_db_alignment_report.md` — schema & UI both need work |
| Product URL extraction | ❌ Not started | Planned for Phase 2 |
| Cloudinary | ❌ Optional / not wired | Env vars prepared but not integrated |
| Height & weight estimation | 📋 Planned | Detailed plan in `docs/weight_height_prediction_plan.md` |

**Critical prerequisite before most Phase 2+ work:**  
Align Drizzle schema + implement real server routes/actions so analyses and favorites actually persist (see Section 0 below).

---

## 0. Prerequisite: Database & Persistence Alignment (Must Do First)

**Source:** `docs/analysis_db_alignment_report.md` + `docs/data_schema.md`

### Goal
Make analyses and favorites fully database-backed so every subsequent feature has a reliable data foundation.

### Recommended Path (Option A)
1. Update `drizzle/schema.ts` to match canonical schema in `docs/data_schema.md`:
   - Rename / add: `user_image_url`, `upload_image_url`
   - Add: `product_id`, `status` (`pending` | `analyzing` | `completed` | `failed`), `updated_at`
   - Change `recommendations` and add `compatibility_metadata` to proper JSON storage
2. Generate and apply migration (`npx drizzle-kit generate` → `push` / `migrate`)
3. Implement server actions or route handlers:
   - `POST /api/analysis` (or server action) — create analysis row, set status
   - Update status during processing
   - Persist final scores + JSON payloads
   - `POST/DELETE /api/favorites` — toggle with UNIQUE constraint
4. Wire UI:
   - History, Favorites, Results pages → fetch from DB instead of mock constants
   - Dashboard metrics & recent analyses → real queries
   - Favorite toggle → call server

### Acceptance Criteria
- Creating an analysis writes a real row with status progression
- Favoriting / unfavoriting persists and is reflected after reload
- No more `mock_result_...` IDs or in-memory-only state for core entities

---

## Phase 2 — In Progress / Near-Term

> **Status (Aug 2026):** 2.1, 2.2, 2.3, and 2.5 are **DONE**. 2.4 (multi-item comparison) is deferred. See `Todo.md` for the active checklist.

### 2.1 Real AI Integration (OpenAI Vision / Gemini Vision)

> **DONE (Aug 2026):** `lib/ai/providers/openai-vision.ts` (OpenAI Vision, retry + timeout), `lib/ai/vision.ts` (provider fallback), `lib/ai/mock-analysis.ts` fallback, `lib/ai/size-prediction.ts` + `lib/ai/body-estimation.ts`. Rate limits on `/api/analysis` + `/api/uploads` (`lib/rate-limit.ts`).

**Priority:** Highest after DB alignment

**Implementation Steps**
1. Create `lib/ai/vision.ts` (or split providers):
   - Abstract interface: `analyzeFashion(userImageUrl, clothingImageUrl) → AnalysisResult`
   - Implement OpenAI Vision and Gemini Vision adapters
2. Replace `lib/ai/mock-analysis.ts` usage with real provider (feature-flag or env-based)
3. Map model output to canonical fields:
   - `overallScore`, `bodyScore`, `colorScore`, `styleScore`
   - `compatibilityMetadata` (bodyShape, skinTone, faceShape, styleType, notes, palette, etc.)
   - `recommendations` array
4. Handle rate limits, retries, and graceful degradation (fall back to mock or show clear error)
5. Update analysis page progress UI to reflect real status polling (`analysis:{id}:status` cache pattern from data schema)

**Dependencies**
- Cloudinary (or equivalent) for reliable image URLs
- Environment variables: `OPENAI_API_KEY` / Gemini credentials
- DB status field working

**Related Docs**
- AI Workflow section in `README.md` / `project_detail.md`
- Height/weight plan can later plug into the same pipeline

---

### 2.2 Paste Product URL → Auto-Extract Clothing Image

> **DONE (Aug 2026):** URL input on the upload page; `lib/ai/product-extraction.ts` (`extractProductFromUrlCached`, 24h cache). `POST /api/analysis` accepts a link and persists `productId`.

**Implementation Steps**
1. Add product URL input on Upload page (alongside image upload)
2. Server-side scraper / extractor (or use a service):
   - Accept URL → extract primary product image, title, brand, price if available
   - Store in `products` table (`docs/data_schema.md`)
3. Return `productId` + image URL to client
4. Proceed to analysis with extracted image
5. Cache mapping: `product:url:{encodedUrl}:id` (TTL 24h)

**Edge Cases**
- Blocked / anti-bot sites → clear user messaging + fallback to manual upload
- Multiple images on page → pick largest / most likely product image or let user choose

---

### 2.3 Cloudinary Image Hosting

> **DONE (Aug 2026):** `lib/storage/cloudinary.ts` (upload/delete), `POST /api/uploads` (rate-limited), image URLs persisted on analyses, `next/image` remotePatterns configured.

**Implementation Steps**
1. Configure env vars (already documented in README)
2. Implement `lib/storage/cloudinary.ts` (upload, optimize, generate CDN URL)
3. Replace mock upload path in analysis flow
4. Store returned URLs in `user_image_url` / `upload_image_url` / `generatedImage`
5. Optionally track in `uploads` table for retention / cleanup

**Retention Policy**
- Define 90-day (or configurable) retention for user photos; delete from Cloudinary + `uploads` table

---

### 2.4 Multiple Outfit Comparison

**Implementation Steps**
1. Extend Upload / Analysis flow to accept 2–4 clothing items
2. Run parallel (or sequential) analyses
3. New comparison results view:
   - Side-by-side score cards
   - Winner highlight
   - Shared recommendations
4. Persist each analysis; optionally create a `comparison` parent record if needed later

**UI Notes**
- Follow premium editorial spacing and calm comparison layout
- Mobile: stacked cards with clear score hierarchy

---

### 2.5 Favorite Items & Wardrobe Management

> **DONE (Aug 2026):** Favorites are DB-backed (`/api/favorites` GET/POST/DELETE/PATCH). Wardrobe state added (`in_wardrobe`, `wardrobe_tags`, `wardrobe_folder`) with an "In Wardrobe" filter on the Favorites page.

**Original implementation steps:**

**Implementation Steps**
1. Complete DB wiring (Section 0)
2. Expand Favorites page:
   - List favorited analyses + optional product metadata
   - Filters / search / sort
3. Introduce lightweight Wardrobe concept:
   - User can mark analyses or products as “in wardrobe”
   - Simple tags or folders later
4. Dashboard “Favorites” metric becomes real count

---

## Phase 3 — Planned

### 3.1 AI Stylist Chatbot

- Conversational interface (dashboard or dedicated page)
- Context: user’s past analyses, body metrics, preferred styles, current wardrobe
- Tool-calling capable (suggest new analysis, recommend similar items, explain scores)
- Persist chat history (new table or JSON in settings)

### 3.2 Outfit Recommendation Engine

- Given one or more analyses / wardrobe items → generate complete outfit suggestions
- Score each suggestion against user’s body/color/style profile
- Surface on Results page and a new “Recommendations” section

### 3.3 Similar Clothing Suggestions

> **Partially DONE (Aug 2026):** "Items Like This" on the Results page (`/api/trending/similar` + `lib/ai/similar-items.ts`) scores same-category trend items against the user's profile. Embedding/vision-similarity search remains future work.

- Embedding or vision-similarity search against internal catalog or external affiliate feeds
- “Items like this that may suit you better” section on Results

### 3.4 Color Palette Recommendations

- Derive seasonal / personal color palette from skin tone + hair + previous analyses
- Recommend complementary / avoid colors
- Store palette in user profile or `compatibility_metadata`

### 3.5 Seasonal Fashion Advice

- Time-aware recommendations (current season + location optional)
- Lightweight content layer + AI-generated tips

---

## Future / Longer-Term

### AI Virtual Try-On Engine (Generative)

Real, Fotor-style Latent Diffusion try-on (replaces the current mock in `lib/ai/tryon.ts`).

- **Design source:** `docs/virtual_tryon_engine_plan.md`
- Backend: RunPod GPU worker behind a provider-agnostic `lib/ai/tryon/` service; `analyses.generatedImage` column already exists
- ⚠️ License gate: IDM-VTON / CatVTON are non-commercial — production path (commercial license / permissive fine-tune / SaaS VTON API) must be chosen before Phase 1

---

| Feature | Notes | Suggested Starting Point |
|---------|-------|--------------------------|
| Mobile app (React Native) | Share API + auth; reuse design tokens where possible | After Phase 2 solid |
| Chrome Extension | Browser shopping assistant — inject “Does this suit me?” on product pages | Requires stable analysis API + auth |
| Affiliate integration | Monetization layer on recommendations & similar items | After recommendation engine |
| Social sharing & community | Share results, public lookbooks, follows | Privacy review first |
| AI outfit generation | Full generative try-on / new outfit creation | After real vision pipeline mature |

---

## Height & Weight Prediction (Cross-Cutting Capability)

**Source:** `docs/weight_height_prediction_plan.md`

This is not a standalone user-facing feature but a foundational capability that improves Body Fit scoring and personalization.

### Integration Points
1. Run during user-photo analysis (after person detection / background removal)
2. Produce:
   - Estimated height (cm)
   - Estimated weight (kg)
   - Confidence score
   - Body shape (already partially present)
3. Feed into:
   - Body Fit Score calculation
   - Style recommendations (proportion-aware)
   - Uncertainty propagation (dampen extreme scores when confidence < 0.75)

### Implementation Options
- **Preferred:** Vision LLM + calibration heuristics (Gemini 1.5 Pro class)
- **Fallback:** Classical geometric silhouette estimation

Store results inside `compatibility_metadata` or dedicated columns if querying becomes frequent.

---

## Implementation Order Recommendation

1. **DB schema alignment + real persistence** (Section 0) — unblocks everything
2. **Cloudinary upload path**
3. **Real AI Vision integration** (replace mock)
4. **Product URL extraction**
5. **Favorites / Wardrobe hardening**
6. **Multiple outfit comparison**
7. **Height & weight estimation** (can run in parallel with 3 once vision pipeline exists)
8. Phase 3 features (chatbot, recommendation engine, etc.)
9. Longer-term (mobile, extension, affiliate, social)

---

## Cross-Cutting Requirements for All Future Work

- **Design:** Read and follow `premium-editorial-ui.md` before any UI change.
- **Data:** Update `docs/data_schema.md` (and cache keys) whenever new persistent fields or tables are added.
- **Docs:** Add or update a short note in `docs/` for significant new feature flows (see pattern in `dashboard_feature_flow.md` and `welcome_page_design_plan.md`).
- **Security / Privacy:** Validate uploads, rate-limit AI endpoints, respect retention policy for user images, never log PII unnecessarily.
- **Performance:** Prefer server components, streaming where useful, short cache TTLs with proper invalidation.
- **Accessibility & Responsive:** Maintain editorial calm on mobile; full keyboard / screen-reader support.

---

## File Ownership Hints

| Feature Area | Primary Locations |
|--------------|-------------------|
| Schema & queries | `drizzle/schema.ts`, `lib/db/queries.ts` |
| AI providers | `lib/ai/` |
| Upload / storage | `lib/` + Cloudinary helper |
| Analysis flow UI | `app/(dashboard)/analysis/`, `components/analysis/` |
| Results / History / Favorites | `app/(dashboard)/results/`, `history/`, `favorites/` |
| Dashboard metrics | `components/dashboard/`, `app/(dashboard)/dashboard/page.tsx` |
| Product URL | Upload page + new `lib/products/` or scraper service |
| Chatbot (Phase 3) | New route + `lib/ai/chat.ts` |

---

## Tracking

- Keep this file updated as features move from Planned → In Progress → Done.
- Link PRs / issues to specific subsections when possible.
- When a feature ships, move its summary into the main README Features table and archive detailed notes here or in a `docs/completed/` folder if desired.

---

*Last generated from repository documentation. Treat this as the living implementation roadmap for all post-MVP work.*
