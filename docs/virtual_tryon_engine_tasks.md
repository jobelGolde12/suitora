# Build Tasks: Virtual Try-On Engine

Generated from: `docs/virtual_tryon_engine_plan.md` (plan) + `docs/vton_licensing_research.md` (license gate)
Date: 2026-07-31

## Foundation

- [x] **Phase 0 — Try-on service layer**: `lib/ai/tryon/` with `types.ts`, `category.ts`, `validation.ts`, `providers/{mock,runpod,index}.ts`, and facade `index.ts`; `TRYON_PROVIDER` defaults to mock, preserving legacy behavior. *Reuses: `vision.ts` provider pattern, `item-attributes` categories, `lib/env.ts`.*
- [ ] **License decision**: choose the commercial path (author license / permissive-base fine-tune / SaaS VTON API) per `docs/vton_licensing_research.md`. *Blocks all Phase 1+ GPU work.*

## Core Pipeline (RunPod worker)

- [x] **Worker container skeleton**: `worker/vton-worker/` with Dockerfile, `handler.py` (runpod), `app.py` (FastAPI), `pipeline.py` stub that downloads inputs and returns the garment URL. *Scaffolded but not yet built/tested on RunPod.*
- [ ] **Model wiring (Phase 1)**: implement Fotor stages 1–4 in `pipeline.py` with the chosen model — human parsing (SCHP) + pose (DWPose) + agnostic mask → garment warping → diffusion inpainting → VAE decode + optional 4K upscale. *Depends on: license decision, worker skeleton.*
- [x] **Worker contract tests**: `POST /tryon` smoke tests in CI (invalid inputs → 400, valid → 200 with `image_url`), health check. *Implemented: `worker/vton-worker/contract_test.py` (health, malformed payload → 400, broken image → 400, valid file:// inputs → 200) + `smoke_test.py`; `app.py` maps validation/download errors to 400.*

## Suitora Integration

- [x] **DB migration**: add `tryOnStatus`, `tryOnJobId`, `tryOnProvider`, `tryOnError`, `tryOnLatencyMs` to `analyses`; `npx drizzle-kit generate` + apply. *Modifies: `drizzle/schema.ts`, migrations. Applied via `scripts/migrate-tryon.mjs`.*
- [x] **Wire pipeline — POST /api/analysis**: after inserting the `pending` analysis, set `tryOnStatus: "pending"`; lazy kick-off of `submitTryOn()` on first GET tick (category from body or product extraction).
- [x] **Wire pipeline — GET /api/analysis**: extend the stage machine — submit job, poll `resolveTryOn()` once per tick, download result → Cloudinary (`suitora/tryon/outputs`) → set `generatedImage`, `tryOnStatus`, `tryOnLatencyMs`; map FAILED/TIMED_OUT → `tryOnStatus: "failed"` + `tryOnError`, soft-fail.
- [x] **Webhook route — POST /api/tryon/webhook**: verify `RUNPOD_WEBHOOK_SECRET`, look up analysis by `tryOnJobId`, complete it. *Implemented: constant-time secret check (query/header/body), reuses `completeTryOnByJobId` from `lib/ai/tryon/lifecycle.ts`.*
- [x] **DELETE cleanup**: delete generated Cloudinary image when an analysis is deleted. *Implemented: `deleteCloudinaryImageFromUrl` in `lib/storage/cloudinary.ts` (URL → publicId → destroy), called from `DELETE /api/analysis`.*

## UI States

- [x] **Analysis page try-on state**: show "Generating your try-on…" while `tryOnStatus === "processing"`, graceful notice on `failed` (scores still shown). *Added a "can take up to a minute" hint on the try-on stage.*
- [x] **Results page placeholder**: "Generating preview…" skeleton while processing; hide the try-on toggle if it never completes. *Implemented: poll-while-processing, placeholder, toggle hidden on failed/skipped.*

## Cost Control & Hardening

- [x] **Caching**: reuse a completed analysis's `generatedImage` for the same user + product (30-day TTL key via `meta` table or Upstash). *Implemented in `syncTryOnLifecycle` (same userId + productId + 30-day window, checked before any GPU submit).*
- [x] **Rate limiting**: add `tryOnRateLimiter` via `createLimiter` (e.g., 10 runs/day/user) + RunPod monthly spend alarm. *Implemented: 10/day/user, only applied to the runpod provider.*
- [ ] **Monitoring**: log jobId, provider, latency, status transitions; surface failure rate in dashboard.

## Review

- [ ] **Design/QA review**: E2E upload → analysis → try-on → results with a golden image set; record P95 latency + cost per run.
