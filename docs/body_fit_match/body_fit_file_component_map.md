# Suitora — Body-Fit Matching: File & Component Implementation Map

> Companion to `docs/body_fit_matching_analytics_plan.md`.  
> This document answers: **what files and components to create or extend**, **where they live**, **what each one is for**, and **what features it owns**.  
> Follow `premium-editorial-ui.md` for every UI file and `docs/data_schema.md` for every data shape.

---

## 1. Overview — Layers to Touch

| Layer | Responsibility | Primary Locations |
|-------|----------------|-------------------|
| **Types** | Shared TypeScript contracts for body & item profiles, scores, insights | `types/` |
| **Schema & DB** | Persist body profiles, richer analysis metadata, optional size charts | `drizzle/`, `lib/db/` |
| **AI / Vision** | Landmark detection, measurement estimation, item attribute extraction, scoring | `lib/ai/` |
| **Server Actions / API** | Create analysis, run fit pipeline, fetch detailed results | `app/api/` or `actions/` |
| **Upload Flow** | Capture user photo + item (image or URL), trigger analysis | `app/(dashboard)/upload/`, `components/upload/` |
| **Analysis Processing** | Progress UI while fit engine runs | `app/(dashboard)/analysis/`, `components/analysis/` |
| **Results & Analytics UI** | Display scores, breakdowns, size advice, insights | `app/(dashboard)/results/`, `components/analysis/` or `components/results/` |
| **Dashboard / History** | Surface recent fit scores and confidence | `components/dashboard/`, history page |
| **Docs** | Keep this map and the analytics plan updated | `docs/` |

---

## 2. Types Layer

### 2.1 `types/body-fit.ts` (NEW)

**Path:** `types/body-fit.ts`  
**Purpose:** Single source of truth for TypeScript interfaces used by the fit engine and UI.  
**Features / Contents:**
- `BodyShape`, `SkinTone`, `FaceShape`, `ItemCategory`, `Silhouette` enums/unions
- `BodyMeasurement` and `UserBodyProfile` (height, weight, measurements, confidence)
- `ItemProfile` (category, subtype, keyMeasurements, stretch, colors, styleTags)
- `FitScores` (`overall`, `body`, `color`, `style`)
- `SizeRecommendation`
- `FitInsights` (positives, cautions, stylingTips)
- `CompatibilityMetadata` (the full JSON shape stored on an analysis)
- `FitAnalysisResult` (what the engine returns to the UI)

**Also update:** `types/index.ts` to re-export these types.

---

## 3. Database & Schema Layer

### 3.1 `drizzle/schema.ts` (EXTEND)

**Path:** `drizzle/schema.ts`  
**Purpose:** Align with canonical schema and support rich fit metadata.  
**Changes / Features:**
- Ensure `analyses` has:
  - `userImageUrl` / `uploadImageUrl` (or keep current names + document mapping)
  - `overallScore`, `bodyScore`, `colorScore`, `styleScore`
  - `compatibilityMetadata` (JSON / text)
  - `recommendations` (JSON / text)
  - `status` (`pending` | `analyzing` | `completed` | `failed`)
  - `updatedAt`
- Optional new table: `user_body_profiles`
  - `id`, `userId`, `profile` (JSON), `sourceAnalysisId`, `confidence`, `createdAt`, `updatedAt`
- Optional later: `brand_size_charts` for scraped or curated size data

**Related:** Run `npx drizzle-kit generate` + migrate after changes.  
**Docs to update:** `docs/data_schema.md`, `docs/analysis_db_alignment_report.md`.

### 3.2 `lib/db/queries.ts` (EXTEND)

**Path:** `lib/db/queries.ts`  
**Purpose:** All read/write access for analyses and body profiles.  
**New or extended functions:**
- `createAnalysis(...)` — insert with `status: 'pending'`
- `updateAnalysisStatus(id, status)`
- `completeAnalysis(id, scores, compatibilityMetadata, recommendations)`
- `getAnalysisById(id)`
- `listAnalysesForUser(userId, opts)`
- `getLatestBodyProfile(userId)` / `upsertBodyProfile(...)`
- `addFavorite` / `removeFavorite` / `listFavorites` (if not already real)

---

## 4. AI / Fit Engine Layer

### 4.1 `lib/ai/body-landmarks.ts` (NEW)

**Path:** `lib/ai/body-landmarks.ts`  
**Purpose:** Detect body keypoints and derive relative measurements from a user photo.  
**Features:**
- Call Vision model or pose model (PoseNet / BlazePose / Gemini / OpenAI Vision)
- Return normalized landmarks + derived segment ratios
- Pose quality checks (lean, truncation, occlusion)
- Confidence score for the landmark set

### 4.2 `lib/ai/body-profile.ts` (NEW)

**Path:** `lib/ai/body-profile.ts`  
**Purpose:** Turn landmarks (+ optional user height) into a full `UserBodyProfile`.  
**Features:**
- Height & weight estimation (see `docs/weight_height_prediction_plan.md`)
- Body shape classification
- Absolute or relative measurements (shoulder, chest, waist, hips, etc.)
- Skin tone & face shape
- Overall profile confidence

### 4.3 `lib/ai/item-attributes.ts` (NEW)

**Path:** `lib/ai/item-attributes.ts`  
**Purpose:** Extract structured `ItemProfile` from product image or scraped product data.  
**Features:**
- Category & subtype classification (dress, shorts, shoes, cap, …)
- Silhouette, neckline, sleeve, rise, length cues
- Dominant colors / pattern
- Stretch / fabric hints
- Style tags
- Optional size-chart merge when product URL was used

### 4.4 `lib/ai/fit-scoring.ts` (NEW)

**Path:** `lib/ai/fit-scoring.ts`  
**Purpose:** Category-aware scoring engine — the core of “does it fit?”.  
**Features:**
- Per-category scorers (dress, top, bottom, footwear, headwear, outerwear, …)
- Body Fit, Color, Style, Overall score calculation
- Size recommendation logic
- Insight generation (positives, cautions, styling tips)
- Uncertainty dampening when confidence is low
- Returns `FitAnalysisResult` / `CompatibilityMetadata`

### 4.5 `lib/ai/fit-pipeline.ts` (NEW)

**Path:** `lib/ai/fit-pipeline.ts`  
**Purpose:** Orchestrate the full analysis run.  
**Features:**
- Accept user image URL + item image URL (and optional product metadata)
- Run landmarks → body profile → item attributes → fit scoring
- Update analysis status in DB at each major step
- Persist final scores + `compatibilityMetadata` + recommendations
- Error handling and `failed` status

### 4.6 `lib/ai/mock-analysis.ts` (EXTEND or DEPRECATE)

**Path:** `lib/ai/mock-analysis.ts`  
**Purpose:** Keep working mock while real pipeline is built; eventually route through `fit-pipeline` behind a flag.  
**Features:**
- Feature flag: `USE_REAL_FIT_ENGINE`
- Mock should still return the same `FitAnalysisResult` shape so UI can be built against it

### 4.7 Optional later
- `lib/ai/size-charts.ts` — brand/size lookup
- `lib/ai/color-harmony.ts` — dedicated color scoring
- `lib/ai/style-matching.ts` — style embedding / tag matching

---

## 5. Server Actions / API Layer

### 5.1 `actions/analysis.ts` or `app/api/analysis/route.ts` (NEW or EXTEND)

**Path (preferred):** `actions/analysis.ts` (Server Actions)  
**Alternative:** `app/api/analysis/route.ts`  
**Purpose:** Entry points for creating and reading analyses.  
**Features:**
- `startAnalysis({ userImageUrl, uploadImageUrl, productId? })` → creates row, kicks off pipeline
- `getAnalysis(id)` → returns full result including `compatibilityMetadata`
- Auth checks (only owner can read/write)
- Rate limiting consideration

### 5.2 `actions/body-profile.ts` (NEW, optional)

**Path:** `actions/body-profile.ts`  
**Purpose:** Read/update the user’s saved body profile.  
**Features:**
- Get latest profile
- Allow manual overrides (height, usual size, foot size) for better calibration

---

## 6. Upload Flow (UI + Components)

### 6.1 `app/(dashboard)/upload/page.tsx` (EXTEND)

**Path:** `app/(dashboard)/upload/page.tsx`  
**Purpose:** Let user provide self photo + clothing item (image or URL).  
**Features to add/confirm:**
- Dual upload zones (user photo + item)
- Optional “Paste product URL” field (Phase 2)
- Preview + validation
- Call `startAnalysis` and navigate to analysis progress page

### 6.2 `components/upload/UserPhotoUpload.tsx` (NEW or EXTEND)

**Path:** `components/upload/UserPhotoUpload.tsx`  
**Purpose:** Dedicated, guided capture of a full-body (or appropriate) user photo.  
**Features:**
- Guidance copy (front-facing, full body when possible, good lighting)
- Drag-and-drop + file picker
- Client-side validation (type, size)
- Preview with gentle editorial framing

### 6.3 `components/upload/ItemUpload.tsx` (NEW or EXTEND)

**Path:** `components/upload/ItemUpload.tsx`  
**Purpose:** Clothing / product image or URL input.  
**Features:**
- Image upload or URL paste
- Category hint selector (optional, can be auto-detected later)
- Preview

### 6.4 `components/upload/UploadForm.tsx` (NEW or EXTEND)

**Path:** `components/upload/UploadForm.tsx`  
**Purpose:** Compose the full upload experience and submit.  
**Features:**
- Orchestrates user + item uploads
- Loading / disabled states
- Error toasts
- Hands off to analysis action

---

## 7. Analysis Progress UI

### 7.1 `app/(dashboard)/analysis/page.tsx` (EXTEND)

**Path:** `app/(dashboard)/analysis/page.tsx`  
**Purpose:** Show progress while the fit pipeline runs.  
**Features:**
- Poll or subscribe to analysis status
- Editorial progress steps (e.g. “Reading your proportions” → “Understanding the garment” → “Calculating fit”)
- Redirect to `/results/[id]` on `completed`
- Graceful error state on `failed`

### 7.2 `components/analysis/AnalysisProgress.tsx` (NEW or EXTEND)

**Path:** `components/analysis/AnalysisProgress.tsx`  
**Purpose:** Visual progress component.  
**Features:**
- Calm animated steps
- Optional subtle score placeholders
- Matches premium editorial motion language

---

## 8. Results & Detailed Analytics UI

### 8.1 `app/(dashboard)/results/[id]/page.tsx` (EXTEND)

**Path:** `app/(dashboard)/results/[id]/page.tsx`  
**Purpose:** Main results experience — overall score + path into detailed analytics.  
**Features:**
- Fetch real analysis by id (no mock)
- Hero try-on / product image
- Overall score + Body / Color / Style scores
- Size recommendation
- Short editorial summary
- Favorite toggle
- Entry point to detailed breakdown

### 8.2 `components/results/ScoreOverview.tsx` (NEW)

**Path:** `components/results/ScoreOverview.tsx`  
**Purpose:** Primary score presentation.  
**Features:**
- Large overall score (elegant circle or typographic treatment)
- Three secondary scores
- Confidence badge (“High confidence” / “Estimated”)
- Size recommendation chip

### 8.3 `components/results/FitSummary.tsx` (NEW)

**Path:** `components/results/FitSummary.tsx`  
**Purpose:** Short, human editorial paragraph summarizing the match.  
**Features:**
- Uses `insights.positives` / generated summary text
- Calm, confident tone

### 8.4 `components/results/DetailedFitAnalytics.tsx` (NEW)

**Path:** `components/results/DetailedFitAnalytics.tsx`  
**Purpose:** Expandable deep analytics (progressive disclosure).  
**Features:**
- Body Fit breakdown (measurement comparison, silhouette notes)
- Color analysis section
- Style insights
- Cautions and styling tips
- Only shown when user expands — keeps primary view editorial

### 8.5 `components/results/MeasurementComparison.tsx` (NEW)

**Path:** `components/results/MeasurementComparison.tsx`  
**Purpose:** Visual comparison of user vs garment key measurements.  
**Features:**
- Clean, minimal rows or subtle bars
- Only relevant dimensions for the item category
- Accessible labels

### 8.6 `components/results/SizeRecommendationCard.tsx` (NEW)

**Path:** `components/results/SizeRecommendationCard.tsx`  
**Purpose:** Clear size advice.  
**Features:**
- Suggested size + optional range
- Short rationale
- “Size up / size down” guidance when relevant

### 8.7 `components/results/InsightsList.tsx` (NEW)

**Path:** `components/results/InsightsList.tsx`  
**Purpose:** Render positives, cautions, and styling tips.  
**Features:**
- Icon + short text rows
- Visually distinct but still soft (no alarmist red for cautions)

### 8.8 Optional
- `components/results/CategoryBadge.tsx` — show detected category (Dress, Sneaker, Cap, …)
- `components/results/ConfidenceIndicator.tsx` — reusable confidence UI

---

## 9. Dashboard & History Integration

### 9.1 `components/dashboard/AnalysisListItem.tsx` (EXTEND)

**Path:** `components/dashboard/AnalysisListItem.tsx`  
**Purpose:** Show recent analyses with real scores.  
**Features:**
- Overall score
- Category label
- Confidence hint
- Link to full results

### 9.2 `app/(dashboard)/history/page.tsx` (EXTEND)

**Path:** `app/(dashboard)/history/page.tsx`  
**Purpose:** Browse past fit analyses.  
**Features:**
- Real data from DB
- Filter/sort by score, date, category
- Search

### 9.3 `app/(dashboard)/favorites/page.tsx` (EXTEND)

**Path:** `app/(dashboard)/favorites/page.tsx`  
**Purpose:** Saved items that fit well.  
**Features:**
- Backed by real `favorites` + `analyses` join
- Quick view of scores that earned the favorite

---

## 10. Shared UI Primitives (if missing)

| Component | Path | Purpose |
|-----------|------|---------|
| `ScoreCircle` | `components/ui/ScoreCircle.tsx` | Already referenced in project — ensure it supports 0–100 and optional label |
| `Badge` | `components/ui/Badge.tsx` | Category, confidence, size chips |
| `Accordion` / Disclosure | `components/ui/` | For detailed analytics sections |
| `Skeleton` | `components/ui/Skeleton.tsx` | Loading states on results |

Create only what does not already exist; reuse existing `components/ui` primitives.

---

## 11. Documentation Files (Already / To Maintain)

| File | Role |
|------|------|
| `docs/body_fit_matching_analytics_plan.md` | Product + algorithm blueprint |
| `docs/body_fit_file_component_map.md` | This file — concrete implementation map |
| `docs/data_schema.md` | Update when schema changes |
| `docs/weight_height_prediction_plan.md` | Anthropometrics detail |
| `docs/analysis_db_alignment_report.md` | Track persistence gaps until closed |
| `docs/future_features_implementation.md` | Link body-fit work into overall roadmap |
| `premium-editorial-ui.md` | Mandatory before any UI component |

---

## 12. Suggested Implementation Order

1. **Types** — `types/body-fit.ts` + exports  
2. **Schema alignment** — `drizzle/schema.ts` + queries  
3. **Mock-compatible result shape** — make mock return `FitAnalysisResult`  
4. **Results UI shell** — `ScoreOverview`, `FitSummary`, `DetailedFitAnalytics` against mock data  
5. **Fit pipeline skeleton** — `fit-pipeline.ts` calling mock or real steps  
6. **Body landmarks + body profile** — real Vision path  
7. **Item attributes** — category + measurements  
8. **Category scorers** in `fit-scoring.ts`  
9. **Wire upload → analysis → results** with real persistence  
10. **Polish** confidence states, size recommendation, history/favorites  

---

## 13. File Creation Checklist (Quick Reference)

**New files (recommended)**

```
types/body-fit.ts
lib/ai/body-landmarks.ts
lib/ai/body-profile.ts
lib/ai/item-attributes.ts
lib/ai/fit-scoring.ts
lib/ai/fit-pipeline.ts
actions/analysis.ts                    # or app/api/analysis/route.ts
components/upload/UserPhotoUpload.tsx  # if not present
components/upload/ItemUpload.tsx
components/results/ScoreOverview.tsx
components/results/FitSummary.tsx
components/results/DetailedFitAnalytics.tsx
components/results/MeasurementComparison.tsx
components/results/SizeRecommendationCard.tsx
components/results/InsightsList.tsx
```

**Extend existing**

```
drizzle/schema.ts
lib/db/queries.ts
lib/ai/mock-analysis.ts
app/(dashboard)/upload/page.tsx
app/(dashboard)/analysis/page.tsx
app/(dashboard)/results/[id]/page.tsx
app/(dashboard)/history/page.tsx
app/(dashboard)/favorites/page.tsx
components/dashboard/AnalysisListItem.tsx
types/index.ts
docs/data_schema.md
```

---

## 14. Ownership Summary

| Concern | Owns the logic | Owns the UI |
|---------|----------------|-------------|
| Body measurement extraction | `lib/ai/body-landmarks.ts`, `body-profile.ts` | Upload guidance components |
| Item understanding | `lib/ai/item-attributes.ts` | Item upload / URL paste |
| Fit scoring & insights | `lib/ai/fit-scoring.ts` | Results analytics components |
| Orchestration & persistence | `lib/ai/fit-pipeline.ts`, `lib/db/queries.ts`, actions | Analysis progress page |
| Presentation of scores & advice | — | `components/results/*` + results page |

---

*Use this map together with `body_fit_matching_analytics_plan.md`. When a new file is added or a responsibility moves, update this document so agents and humans keep a single clear picture of the fit-matching surface area.*
