---
name: suitora-next-analysis-and-persistence-plan
description: Creates a detailed implementation todo covering: (1) how Suitora predicts user weight/height and other traits, (2) single required self-image upload modal behavior, (3) product image input via link or image, and (4) persisting uploads + analyses into the database.
version: 1.0.0
author: BlackboxAI
category: product
tags:
  - todo
  - roadmap
  - uploads
  - modal
  - database
  - drizzle
  - turso
---

# Suitora — Detailed Feature Todo

## 0) Read-me (requirements recap)
Implement the following behaviors while keeping the existing app stable:

1. **Prediction plan**: Document a detailed next-step plan for how the application predicts user characteristics (including **weight and height**) and uses them inside compatibility scoring.
2. **Self-image upload modal**:
   - The user must upload their **whole-body photo** at least once.
   - When starting a new analysis, if the user has **not** uploaded a self-image yet, show a **non-exitable popup modal** (cannot dismiss/close) that forces uploading.
   - After upload, the modal must no longer appear.
3. **Product image input**:
   - For a new analysis, the user can provide either:
     - an **image** (upload), or
     - a **link/URL** to the product image (paste product link).
   - If the user provides a link, extract the product image on the backend (future-proof for scraping/API adapters).
4. **Database persistence**:
   - Uploaded self-image must be **stored in the database**.
   - Analyses must be persisted (not mock-only), including metadata and results needed for history/favorites/results pages.

---

## 1) Implementation planning & design alignment
1. **Design inheritance**
   - Read `premium-editorial-ui.md` before designing any new UI flows (modal, upload screens, result processing states).
2. **Confirm existing analysis persistence gap**
   - Based on `docs/analysis_db_alignment_report.md`, ensure analyses/favorites are actually written/read from the DB (not just UI state).
3. **Define the new UX contract**
   - Add an explicit UX contract: “Self-image required once” + “forced modal until satisfied”.

Deliverables:
- A short “UX contract” section written in this Todo (above the code tasks).

---

## 2) Data model & DB persistence plan (uploads + analyses)
> Goal: Make “self image required once” and “new analysis can be link or image” work end-to-end.

### 2.1 Add/verify DB fields
1. **Users table**
   - Ensure users can reference a persisted self-image.
   - If the repo doesn’t already have it: add `user_self_image_url` (or `selfImageUrl`) and optional metadata (width/height, upload provider, created_at).
2. **Uploads table**
   - Ensure uploads record:
     - `kind`: `user_photo` (self-image) or `product_image`
     - `url`: storage URL
     - `width/height`, `mime_type`, `size_bytes`
     - `created_at`
3. **Analyses table**
   - Ensure analyses are persisted with fields required by the UI:
     - user/product image URLs
     - generated image URL (if applicable)
     - overall/body/style/color scores
     - compatibility metadata + recommendations (JSON)
     - status + timestamps

### 2.2 Migrations & Drizzle work
1. Create migrations to:
   - add missing columns/tables needed for:
     - self-image persistence
     - product URL->image extraction metadata
     - analysis status + JSON fields
2. Run `npx drizzle-kit push` / `migrate` after changes.

### 2.3 Wire favorites/history/results to DB
1. Update server-side queries in `lib/db/queries.ts` if needed.
2. Ensure pages:
   - `/dashboard/history`
   - `/dashboard/favorites`
   - `/results/[id]`
   use DB data instead of mock state.

Deliverables:
- DB schema is consistent with `docs/data_schema.md` (or this repo’s canonical schema is updated accordingly).

---

## 3) Self-image “required once” modal (forced, non-exitable)
> Goal: Prevent any analysis from starting without a stored self-image.

### 3.1 Define modal triggering logic
1. On analysis entrypoints (at minimum):
   - `/upload`
   - `/analysis`
   - any CTA that starts analysis
2. Fetch user self-image state:
   - `GET /api/profile` or a new dedicated endpoint `GET /api/user/self-image`
3. If **no self-image**:
   - show modal
   - modal must be **non-dismissible**:
     - no close button
     - no ESC key close
     - no click-outside close
     - no “skip for later”
     - only allow “Upload” successful completion

### 3.2 Modal UX behavior
1. Modal shows:
   - instructions for whole-body photo
   - preview
   - upload drag-and-drop
   - validation errors (file type/size)
2. On upload success:
   - persist to DB
   - close modal automatically
   - continue navigation to analysis flow
3. On failure:
   - show error UI, keep modal visible

### 3.3 Store modal-uploaded self-image in DB
1. Upload handler:
   - store the image (currently Cloudinary is referenced; if not enabled, use existing storage strategy)
   - create an `uploads` row (kind=user_photo)
   - update user’s self-image URL reference
2. Ensure DB read confirms the modal won’t appear again.

### 3.4 Concurrency and correctness
1. If the user starts multiple analysis flows in parallel:
   - ensure upload creation is idempotent (avoid duplicate user self-image rows if your DB design allows it)
   - modal should still resolve with the newest stored URL.

---

## 4) Product input: link or image (one consistent “product source” API)
> Goal: User can upload a product image OR paste a product link; the backend converts either into a `productImage` URL for analysis.

### 4.1 UI changes: Upload page
1. On `/upload`, update the product input section:
   - Add a toggle or dual input:
     - “Upload product image”
     - “Paste product URL”
2. Ensure validation:
   - if URL input is selected, validate it’s a URL
   - if image upload is selected, validate type/size

### 4.2 Backend: normalize “product source” to a stored product image
Create a server route/handler (align with existing structure):
1. Accept payload:
   - `productUrl` OR `productImageUpload`
   - optional: `meta: { source: 'paste_link' | 'upload_image' }`
2. If `productUrl`:
   - extract best image candidate
   - download/stream to storage (Cloudinary) or temporary buffer
   - store a `products` record and/or `uploads` record
3. If image upload:
   - store to storage
   - store `uploads` record (kind=product_image)

### 4.3 Security & robustness
1. URL scanning:
   - block unsupported domains or non-http(s)
2. Rate limiting for URL scraping.
3. Image verification (must be real images).

Deliverables:
- A single normalized output:
  - `productImageUrl` (URL that the analysis engine consumes)

---

## 5) How the app predicts weight and height (detailed plan)
> Goal: Provide a concrete, multi-step plan for predicting weight/height (and related traits) from a whole-body image.

### 5.1 Inputs needed from the user photo
1. Whole-body photo (front-facing preferred).
2. Detect:
   - body landmarks (head/feet, major joints)
   - pose (standing straight vs angled)
   - estimated body proportions and clothing coverage ambiguity.

### 5.2 Approach options (choose at implementation time)
Document both options so the team can switch later:

**Option A (Best practice): Vision model + calibration heuristics**
1. Use a vision-capable model to:
   - estimate body scale segments
   - output:
     - relative measurements (e.g., hip-to-ankle ratio, torso/leg ratio)
     - confidence scores
2. Convert to absolute height:
   - use a clothing/shoe baseline if present
   - optionally request a single calibration datum later (but MVP can avoid this)
3. Convert to weight:
   - estimate body volume proxy:
     - combine silhouette area + body shape classification + pose-normalization
   - map silhouette/shape to BMI range, then derive weight from height
4. Output:
   - `height_cm`, `weight_kg` + confidence

**Option B (MVP heuristic): Landmark + proportional estimation**
1. Use classical landmark detection:
   - head-to-toe pixel span as height proxy
   - normalize using known typical garment/body ratios
2. Estimate weight via body area proxy:
   - compute segmentation silhouette area (pixels)
   - map silhouette area to weight using a learned calibration curve (bootstrapped from dataset or simulated priors)
3. Provide confidence based on photo quality.

### 5.3 Handling pose, camera distance, and confidence
1. Pose normalization:
   - detect lean/rotation and normalize.
2. Camera distance estimation:
   - optional via reference object detection; if absent, confidence decreases.
3. Output a “confidence gate”:
   - if confidence low, the UI should display results as “estimated” with a lower trust label.

### 5.4 How weight/height feed into scoring
1. Compute derived features:
   - BMI proxy
   - body shape fit adjustment
2. Adjust clothing fit recommendations:
   - emphasize proportions (e.g., sleeve length proxy for upper-body)
3. Ensure scores reflect uncertainty:
   - do not overstate precision.

Deliverables:
- Define exact fields persisted in `analyses` for:
  - `height` (with confidence)
  - `weight` (with confidence)
  - any additional intermediate estimates (optional)

---

## 6) Full end-to-end analysis flow (from modal to results)
### 6.1 Step sequence
1. User signs in.
2. User opens “Start Analysis”.
3. App checks `user.selfImageUrl`.
4. If missing -> forced self-image modal.
5. After self-image stored:
   - user chooses product source (link or image)
6. Submit analysis request:
   - create analysis row with status `pending`/`analyzing`
7. Background processing:
   - person detection + background removal
   - body analysis (including height/weight plan)
   - product image extraction if needed
   - virtual try-on generation (mock for now or real integration later)
8. Persist results and update status to `completed`.
9. Results page loads from DB by analysis id.

### 6.2 Progress updates
1. Add `status` + optional `progress` field to analyses.
2. UI polling strategy:
   - poll `analysis:{id}` status endpoint
3. Ensure errors set status `failed` and expose retry.

---

## 7) Update/extend AI pipeline code (mock -> real-ready)
1. Locate:
   - `lib/ai/mock-analysis.ts`
   - `lib/ai/upload.ts`
2. Refactor to accept a normalized payload:
   - `userImageUrl`
   - `productImageUrl`
   - metadata (source, url, etc.)
3. Add new module boundaries:
   - `lib/ai/body-estimation.ts` (height/weight plan)
   - `lib/ai/product-extraction.ts` (URL->image extraction)
   - `lib/ai/tryon.ts` (virtual generation)

Deliverables:
- A function signature plan and persistence points.

---

## 8) Testing plan
1. Unit tests:
   - URL validation
   - image type validation
   - DB insert/update correctness
2. Integration tests:
   - self-image missing -> modal blocks analysis
   - upload self-image -> modal not shown next time
   - product URL -> extracted product image stored and analysis row created
3. Manual QA checklist:
   - desktop + mobile
   - modal non-dismissable verification
   - history/favorites reflect persisted DB state

---

## 9) Acceptance criteria
1. When user has never uploaded self-image:
   - forced modal appears and cannot be dismissed.
2. After self-image upload:
   - self-image stored in DB.
   - modal never appears again for new analyses.
3. Product input supports:
   - image upload and URL paste.
4. Analyses:
   - persisted to DB
   - results/history/favorites read from DB.
5. Weight/height prediction plan is documented and implemented behind a feature flag if needed.

