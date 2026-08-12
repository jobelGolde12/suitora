# Feature Plan: Image Upload & Storage

## 1. Feature Overview

- **Name:** Image Upload, Validation & Storage
- **Current Status:** Fully functional
- **Primary Goal:** Allow users to securely and conveniently provide a self-photo and a clothing/product image that feed the analysis and try-on pipelines.
- **Key Stakeholders:** End-users, AI pipeline owners, storage/cost owners.

## 2. Current State Assessment (As-Is)

### Strengths
- Drag-and-drop + file picker with preview on the Upload page.
- Client-side validation (file type, size via `MAX_FILE_SIZE`, `ACCEPTED_IMAGE_TYPES`).
- Self-image persisted on the user record (`users.selfImageUrl`) and reusable across analyses.
- Upload API (`/api/uploads`) and Cloudinary helper (`lib/storage/cloudinary.ts`).
- Cleanup route (`/api/uploads/cleanup`) and retention job support.
- Uploads table tracks metadata for lifecycle management.

### Pain Points & Bugs
- Cloudinary is optional / env-dependent; local or alternative storage paths must remain robust.
- Large images may still cause memory pressure before resizing.
- Limited guidance on ideal photo conditions (lighting, pose, full-body vs cropped).
- Self-image modal UX can be refined for first-time users.

### Missing Functionality
- Client-side resize/compress before upload (to reduce bandwidth and cost).
- Progress indicators for multi-megabyte uploads.
- Automatic quality scoring / rejection of unsuitable self-photos (blur, extreme crop).
- Support for HEIC conversion on the server if needed.

### Dependencies
- Cloudinary (or fallback storage).
- Auth session for ownership.
- Downstream analysis and try-on that consume stable image URLs.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Client-side image compression/resize (max dimension + quality target) before upload.
- **High:** Clear photo guidelines and examples (good vs bad self-photo).
- **Medium:** Upload progress UI and retry on network failure.
- **Medium:** Automatic soft rejection or warning for low-quality self images.
- **Low:** Multi-self-image support (different outfits / seasons) with primary selection.

### Required Fixes & Adjustments
- Ensure all upload paths validate MIME type and size server-side (never trust client).
- Harden error messages when Cloudinary is misconfigured.
- Confirm retention job deletes orphaned and expired objects.

### Refactoring & Technical Debt
- Keep a single `uploadImage` abstraction used by both self and product flows.
- Centralize accepted types and size limits.
- Add tests for validation edge cases.

### KPIs for Success
- Upload success rate ≥ 98%.
- Average upload payload size reduced by 40–60% via client compression.
- Reduction in “bad photo” support tickets / failed analyses caused by input quality.

## 4. Actionable Roadmap

### Phase 1 – Quality & Cost (1 week)
- [ ] Add client-side compress/resize utility (Medium)
- [ ] Server-side re-validation and max-dimension enforcement (Small)
- [ ] Photo guidelines UI component (Small)

### Phase 2 – Resilience (1 week)
- [ ] Upload progress + retry (Medium)
- [ ] Retention job verification and monitoring (Small)
- [ ] Better Cloudinary failure UX (Small)

### Phase 3 – Advanced (later)
- [ ] Basic image quality heuristics (Medium)
- [ ] Multiple self-images (Large)

### Potential Risks & Mitigation
- **Risk:** Aggressive compression degrades AI accuracy.  
  **Mitigation:** Empirically tune quality settings against vision model results; keep original option for power users.
- **Risk:** Storage cost growth.  
  **Mitigation:** Strict retention policies, lifecycle rules on Cloudinary, quota per user tier.
