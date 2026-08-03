# Suitora — Virtual Try-On Engine (Fotor-Style Pipeline) Implementation Plan

> **Status:** 📋 Planned · **Owner:** AI/Backend · **Depends on:** none blocking (runs alongside existing vision pipeline)
> **Source spec:** `Todo.md` — "AI Virtual Try-On Engine (Fotor-Style Pipeline)" architecture doc.
> This plan maps each stage of the Fotor pipeline to concrete Suitora files, DB changes, API routes, and a RunPod GPU deployment.

---

## 1. Executive Summary

Suitora currently **simulates** virtual try-on: `lib/ai/tryon.ts` returns the clothing image unchanged after a 1.5 s delay, and `analyses.generatedImage` is never written. This plan replaces that with a **real image-synthesis try-on engine** matching the Fotor architecture (multi-stage Latent Diffusion Model).

**Hard constraint:** Suitora runs on Vercel (serverless, no GPU). A diffusion backbone cannot execute in-process, so the generative stage runs on **RunPod GPU workers** exposed as an HTTP service. Suitora keeps all orchestration, storage, validation, and UX on Vercel and calls the worker asynchronously.

**What ships in Suitora (this plan):**

1. A provider-agnostic `lib/ai/tryon/` service layer (mock today → RunPod when configured).
2. Category mapping from the existing `ItemProfile` (`upper_body / lower_body / dresses`) — already derived in `lib/ai/item-attributes.ts`.
3. An async status lifecycle on `analyses` (`tryOnStatus`, `tryOnJobId`, `tryOnError`).
4. Generation kicked off by `POST /api/analysis` and completed via poll-tick on `GET /api/analysis` **or** a `POST /api/tryon/webhook` callback.
5. Output persisted to Cloudinary → `analyses.generatedImage` → already rendered by the Results page ("Virtual Try-On" toggle).
6. Input validation, cost controls, caching, and graceful fallback to the current mock.

**⚠️ License gate (read §5 before Phase 1):** the two strongest open-source VTON models (IDM-VTON, CatVTON) are **CC BY-NC-SA 4.0 / research-only** — they cannot be used commercially without a license. The container architecture below is model-agnostic so this decision can be made without re-architecting.

---

## 2. Current State Audit

| Area | Where | Status today |
|------|-------|--------------|
| Try-on generation | `lib/ai/tryon.ts` | **Mock only** — 1.5 s delay, returns `clothingImageUrl` |
| Generated image column | `drizzle/schema.ts` → `analyses.generatedImage` | Column exists, **never populated** |
| Analysis lifecycle | `app/api/analysis/route.ts` | POST creates `pending` row; GET runs a **time-based fake pipeline** (~6 s), then vision scoring; never invokes try-on |
| Results display | `app/(dashboard)/results/[id]/page.tsx` | Already has "Virtual Try-On / Original Item" toggle rendering `generatedImage` (falls back to product image) |
| Progress UI | `app/(dashboard)/analysis/page.tsx` | Already has a `"try-on"` stage + poll loop (1.5 s) |
| Item category | `lib/ai/item-attributes.ts` (`detectCategory`) | Detects 10 Suitora categories — must be mapped to VTON zones |
| Product extraction | `lib/ai/product-extraction.ts` | OG/JSON-LD scraping → product image |
| Uploads | `app/api/uploads/route.ts` + Cloudinary | Product/self images → Cloudinary or base64 (dev) |
| Rate limiting | `lib/rate-limit.ts` (Upstash) | Login/register limiters exist; reusable `createLimiter` pattern |
| GPU / queue / worker | — | **None** |

**Gaps to close:**

- `generateVirtualTryOn()` is never called from the pipeline.
- No provider abstraction for try-on (unlike `vision.ts`).
- No mapping `ItemCategory → VTON zone` (upper_body / lower_body / dresses).
- No async job tracking for a 20–60 s GPU job inside the existing 6 s fake timeline.
- No input validation for try-on suitability (full body, face visible, minimum resolution).
- No caching, per-user budget caps, or webhook endpoint.
- No cleanup of generated images on analysis delete.

---

## 3. Target Architecture

```
┌─ Browser ─────────────────────────────────────────────────────────┐
│  upload page → POST /api/analysis          analysis page (poll)   │
└──────────────┬──────────────────────────────────────▲────────────┘
               │ creates analysis (status: pending)   │ GET /api/analysis?id=…
               ▼                                      │
┌─ Vercel (control plane, no GPU) ────────────────────┼────────────┐
│  runFitPipeline (existing vision scoring) ──────────┤            │
│  TryOnEngine.generateVirtualTryOn()                  │  lazily    │
│    ├─ validate inputs (validation.ts)                │  syncs     │
│    ├─ map category → zone                           │  RunPod     │
│    ├─ provider.submit() → RunPod /runs → jobId       │  status    │
│    ├─ provider.poll() → GET /status/{id}             │            │
│    └─ webhook route  POST /api/tryon/webhook ────────┘            │
│  output → Cloudinary → analyses.generatedImage                    │
└──────────────┬────────────────────────────────────────────────────┘
               │  HTTPS (inputs: person + garment URLs, category)
               ▼
┌─ RunPod (compute plane, GPU) ────────────────────────────────────┐
│  VTON worker container (FastAPI or runpod SDK handler)           │
│  1. Pre-process : SCHP parsing · DWPose/OpenPose · agnostic mask │
│  2. Warp/align : garment → body (attention / flow-based)         │
│  3. Diffusion  : dual-UNet/DiT inpainting + cross-attention      │
│  4. Post       : VAE decode · blending · (optional) 4K upscale   │
└──────────────────────────────────────────────────────────────────┘
```

**Two planes:**

- **Control plane (Vercel):** auth, uploads, validation, orchestration, status lifecycle, storage, cost control. Cheap and fast.
- **Compute plane (RunPod):** the Fotor diffusion stages. One GPU call per analysis. Never blocks a Vercel function (function-duration limits: Hobby 10 s, Pro 60 s default — see §8).

---

## 4. Fotor Pipeline Stage Mapping

The Fotor spec defines 4 pipeline stages plus inputs/outputs. Here is exactly where each runs and what implements it.

| Fotor stage | Runs in | Implementation |
|-------------|---------|----------------|
| **Input specs** (person_image, garment_image, category, text_prompt) | Suitora (Vercel) | `lib/ai/tryon/validation.ts` + existing upload/product extraction. `category` comes from `detectCategory()` in `item-attributes.ts`, mapped to `upper_body \| lower_body \| dresses`. `text_prompt` optional, passed through. |
| **1. Pre-processing & Feature Extraction** | RunPod worker | Human parsing (SCHP), pose estimation (DWPose/OpenPose), DensePose + agnostic mask (`M_agnostic`) generation, garment encoding (CLIP / VAE / IP-Adapter). Provided by the model pipeline (IDM-VTON / CatVTON / chosen model) inside the container. |
| **2. Garment Warping & Geometric Alignment** | RunPod worker | Flow-based / attention warping so the garment conforms to the body pose. Encapsulated by the model. |
| **3. Conditional Denoising Diffusion Loop** | RunPod worker | Latent inpainting over the masked region; dual-UNet / DiT with cross-attention (ReferenceNet-style); ~30 denoising steps, guidance scale ~2.0; lighting/shadow adaptation. Model-specific settings. |
| **4. Post-Processing & Super-Resolution** | RunPod worker (+ Suitora assist) | VAE decode → Poisson / soft-alpha blending → optional Real-ESRGAN 4K upscale. Worker returns final image; Suitora verifies + stores to Cloudinary and (optionally) generates a thumbnail via Cloudinary transforms. |

**Contract between planes** (single HTTP contract, model-agnostic):

```jsonc
// Suitora → RunPod worker
POST /tryon
{
  "person_image_url": "https://…",   // existing self image
  "garment_image_url": "https://…",  // product image
  "category": "upper_body",          // upper_body | lower_body | dresses
  "text_prompt": "optional styling directive",
  "options": { "width": 768, "height": 1024, "steps": 30, "seed": 42 }
}

// Response
{ "job_id": "…" }                    // async mode (preferred)
// or
{ "image_url": "https://…", "latency_ms": 42_000 }   // sync mode
```

---

## 5. Model & License Decision Gate ⚠️

This is the **first decision to make** and it gates Phase 1. All major open VTON models are **non-commercial**:

| Model | Architecture fit to Fotor spec | Resolution | VRAM / speed | License | Commercial? |
|-------|--------------------------------|------------|--------------|---------|-------------|
| **IDM-VTON** (ECCV 2024) | Highest — DWPose, SCHP parsing, DensePose, agnostic mask, garment warping, dual-UNet + cross-attention (IP-Adapter), VAE | 768×1024 | ~24 GB; ~20–60 s/run | CC BY-NC-SA 4.0 | ❌ |
| **CatVTON** (ICLR 2025) | High — lightweight DiT, SCHP + DensePose masks, SD1.5-inpainting base | 1024×768 | <8 GB VRAM; fast | CC BY-NC-SA 4.0 | ❌ |
| VITON-HD | Medium | 1024×768 | research | research-only | ❌ |
| OOTDiffusion | Medium (full/upper/lower) | ~1024 | heavy | CC BY-NC-SA 4.0 | ❌ |
| Commercial VTON APIs (ZMO.ai, Vue.ai, Revery.ai, Fotor API) | n/a (SaaS) | n/a | n/a | vendor EULA | ✅ |

**Recommended paths (pick one before Phase 1):**

1. **Commercial license / partnership** with a model author (IDM-VTON or CatVTON authors) — keeps full control on RunPod.
2. **Self-trained model on a permissive base** (e.g., LoRA on SDXL OpenRAIL-M / FLUX.1-schnell Apache-2.0) — most work, full commercial freedom, and can be *fine-tuned on fashion imagery* to keep the Suitora aesthetic.
3. **Commercial SaaS VTON API** behind the same `TryOnProvider` interface — zero GPU ops, per-call pricing, but less control and per-image cost.

**The plan is built so this choice is a swap of one provider implementation, not an architecture change.** For **development/prototyping only**, IDM-VTON or CatVTON can be containerized on RunPod immediately.

---

## 6. RunPod Worker Deployment

### 6.1 Container

- **Base:** `pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime` (or model image).
- **Service:** prefer the official `runpod` SDK handler (`runpod.serverless.start({'handler': handler})`) for the Serverless product — it handles queueing, scaling, and warm pools. Alternative: plain FastAPI on an on-demand GPU pod (fixed instance, no cold start, always-billed).
- **Model download:** bake weights into the image or mount a network volume to avoid re-downloading on every cold start.
- **Endpoints:**
  - `POST /tryon` (or `handler(job)`) → returns `{ job_id }` or output image
  - `GET /health` → liveness (used by Suitora `TRYON_HEALTH_CHECK`)
  - `POST /webhook` only if the container calls back; prefer RunPod's own webhook (below).

### 6.2 RunPod Serverless HTTP contract (from Suitora side)

| Call | Endpoint | Notes |
|------|----------|-------|
| Submit (async) | `POST https://api.runpod.ai/v2/{endpoint_id}/runs` | Header `Authorization: Bearer $RUNPOD_API_KEY`; body `{ "input": { … }, "webhook": "https://…/api/tryon/webhook" }` → `{ id, status: "IN_QUEUE" }` |
| Poll | `GET https://api.runpod.ai/v2/{endpoint_id}/status/{run_id}` | `IN_QUEUE → IN_PROGRESS → COMPLETED \| FAILED \| TIMED_OUT`; `COMPLETED` includes `output` |
| Sync (not recommended) | `POST …/runsync` | Blocks ~50–90 s gateway timeout — **too short** for diffusion; use async + poll/webhook |
| Webhook | RunPod POSTs to Suitora | `https://{app}/api/tryon/webhook` with full job result; secure with a shared secret |

- **Timeouts:** per-job execution timeout default ~15 min (fine); cold starts 15–60 s for large images.
- **Concurrency:** set `max_workers` for parallel queue; set `min_workers: 0` to save cost (accept cold starts) or `1` to eliminate them during campaigns.

### 6.3 GPU + cost math (single image, worst→typical)

| GPU | ~Rate (serverless) | Typical run | Cost/run |
|-----|--------------------|-------------|----------|
| RTX 4090 (24 GB) | ~$0.74–0.80/h | 30–60 s (CatVTON/IDM-VTON) | ~$0.01–0.02 |
| A40 (48 GB) | ~$0.77–0.89/h | 30–90 s + upscale headroom | ~$0.01–0.03 |
| L40S (48 GB) | ~$1.15–1.79/h | faster / 4K upscale | ~$0.02–0.05 |
| A100 (80 GB) | ~$1.89–2.19/h | batch / heavy | — |

**Budget assumptions:** at ~2¢/run and 1,000 analyses/month → **~$20–50/month** compute, before caching. Caching + per-user caps (Phase 2) reduce this significantly.

---

## 7. Suitora Integration

### 7.1 Service layer — `lib/ai/tryon/` (mirrors `vision.ts` pattern)

New files:

- `lib/ai/tryon/types.ts`
  ```ts
  export type TryOnCategory = "upper_body" | "lower_body" | "dresses";
  export type TryOnStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

  export interface TryOnRequest {
    personImageUrl: string;
    garmentImageUrl: string;
    category: TryOnCategory;
    textPrompt?: string;
  }
  export interface TryOnResult {
    generatedImageUrl: string;
    provider: string;
    latencyMs?: number;
  }
  export interface TryOnProvider {
    name: string;
    submit(req: TryOnRequest, webhookUrl?: string): Promise<{ jobId: string }>;
    getStatus(jobId: string): Promise<{ status: TryOnStatus; resultUrl?: string; error?: string }>;
  }
  ```
- `lib/ai/tryon/category.ts` — maps `ItemCategory → TryOnCategory` (`dresses→dresses`, `tops/outerwear→upper_body`, `bottoms→lower_body`, fallback `upper_body`).
- `lib/ai/tryon/validation.ts` — input checks before spending GPU: person image must load, be ≥ ~512px on the short side, contain a detectable person (can reuse `analyzeWithVision` cheaply or run a "person present?" check on the worker); garment image must load and be non-empty; reject if either input is corrupt.
- `lib/ai/tryon/providers/mock.ts` — **existing mock behavior** refactored into a provider (returns clothing image; keeps dev/fallback UX intact).
- `lib/ai/tryon/providers/runpod.ts` — implements `submit()` / `getStatus()` against §6.2 API. `getStatus` maps RunPod states → `TryOnStatus`. Polling is **never done in a Vercel function for >5 s**; the route just fetches the current RunPod status snapshot.
- `lib/ai/tryon/index.ts` — `generateVirtualTryOn()` facade:
  ```ts
  export async function generateVirtualTryOn(userImageUrl, clothingImageUrl, category, opts?) {
    // provider selected by TRYON_PROVIDER env ("mock" default, "runpod" when configured)
    // wraps submit + lazy status resolution; throws typed TryOnError
  }
  ```
- Provider registry + env-driven init — modeled on `lib/ai/providers/index.ts` (keep `tryon.ts` export name so existing callers/imports stay valid).

### 7.2 DB changes (`drizzle/schema.ts` + migration)

Add to `analyses` (all nullable, no breaking change):

| Column | Type | Purpose |
|--------|------|---------|
| `tryOnStatus` | text, default `"skipped"` | lifecycle state (§8) |
| `tryOnJobId` | text | RunPod run id |
| `tryOnProvider` | text | provenance ("mock" \| "runpod") |
| `tryOnError` | text | last error message |
| `tryOnLatencyMs` | integer | observed generation time |

`generatedImage` already exists — **no schema change required to start storing outputs.**

Generate with `npx drizzle-kit generate` and apply via the project's migration flow (see `drizzle/migrations/`).

### 7.3 API routes

1. **`POST /api/analysis`** (existing):
   - After inserting the `pending` analysis, set `tryOnStatus: "pending"`.
   - **Lazy kick-off** (recommended): do not block the POST on GPU. The first `GET` tick starts the RunPod job. This keeps POST latency ~0 and avoids Vercel function-duration limits.
   - Add optional `category` to the request body (passed from the upload page or auto-derived from extracted product).

2. **`GET /api/analysis?id=`** (existing) — extend the stage machine:
   - Keep the existing vision-scoring path (it completes ~6 s in, untouched).
   - When `tryOnStatus` is `pending` and vision has started → call `provider.submit()`, set `tryOnStatus: "processing"`, `tryOnJobId`.
   - When `processing` → one `provider.getStatus(jobId)` snapshot per poll tick; on `COMPLETED`, download the result URL, upload to Cloudinary (`suitora/tryon/outputs`), set `generatedImage`, `tryOnStatus: "completed"`, `tryOnLatencyMs`.
   - On `FAILED`/`TIMED_OUT` → set `tryOnStatus: "failed"`, `tryOnError`; **fall back**: leave `generatedImage` null (Results page already falls back to product image) and surface a soft notice.
   - Return `tryOnStatus` in the response so the client can show a "Generating your try-on…" state.

3. **`POST /api/tryon/webhook`** (new, production optimization):
   - Receives RunPod completion callbacks; verifies `RUNPOD_WEBHOOK_SECRET` (header/body), looks up analysis by `tryOnJobId`, completes it exactly like the poll-tick path.
   - Prevents wasted poll cycles; the poll-tick remains as the dev/fallback path.

4. **`DELETE /api/analysis`** (existing): also call `deleteFromCloudinary(publicId)` for the generated image (and optionally the product image) when they live in the `suitora/tryon/` or uploads folders.

### 7.4 Client / UI

- **Analysis page** (`app/(dashboard)/analysis/page.tsx`): the existing `"try-on"` stage now maps to real `tryOnStatus`; keep the 1.5 s poll. Add a generous "This can take up to a minute…" hint when the stage is `try-on`, and a graceful failure state if `tryOnStatus === "failed"` (analysis still completes with scores — try-on is a best-effort enhancement).
- **Results page** (`app/(dashboard)/results/[id]/page.tsx`): already renders `generatedImage` under "Virtual Try-On". Add:
  - "Generating preview…" placeholder with the editorial skeleton style while `tryOnStatus` is `processing`.
  - A subtle "Try-on generated by AI" badge; hide the toggle if try-on never completes.
- **Upload page** (optional, Phase 3): category selector to improve mask accuracy instead of relying on title heuristics.

### 7.5 Environment variables

```
TRYON_PROVIDER=mock|runpod            # default mock
RUNPOD_API_KEY=rpa_…                  # RunPod API key
RUNPOD_ENDPOINT_ID=…                  # serverless endpoint id
RUNPOD_WEBHOOK_SECRET=…               # shared secret for webhook verification
TRYON_MAX_WAIT_MS=120000              # client timeout before showing failure
TRYON_UPSCALE=false                   # enable Real-ESRGAN 4K pass (costs more)
TRYON_HEALTH_CHECK=0                  # 1 = probe worker /health before submitting
```

Add optional keys to `lib/env.ts` (all `.optional()`).

---

## 8. Async Status Lifecycle

```
POST /api/analysis
   │
   ▼
status=pending, tryOnStatus=pending
   │  (first GET poll)
   ▼
tryOnStatus=processing   jobId set (RunPod IN_QUEUE → IN_PROGRESS)
   │  (GET poll ticks or webhook)
   ├──► COMPLETED ──► download → Cloudinary → generatedImage set ──► tryOnStatus=completed
   ├──► FAILED / TIMED_OUT ──► tryOnError set ──► tryOnStatus=failed (scores still shown)
   └──► (analysis.status completes independently via existing vision path)
```

**Why polling on GET works on Vercel:** each poll tick is a quick snapshot (one lightweight RunPod `GET /status`). The slow diffusion happens entirely on RunPod. No Vercel function ever waits >5 s. Webhooks (production) remove even the snapshot calls.

---

## 9. Cost & Performance Budget

| Item | Target |
|------|--------|
| P95 end-to-end (submit → generatedImage) | ≤ 60 s |
| Per-run compute cost | ~$0.01–0.05 (RTX 4090, no upscale) |
| Cache hit rate (same product re-analysis) | ≥ 40% (see caching) |
| Cloudinary output size | ≤ 3 MB, webp, quality auto:good |
| Cold-start mitigation | min_workers=1 during promos; else accept 15–60 s |

**Caching (Phase 2):** before submitting a job, check for a prior completed analysis with the same `productId` (or product image URL) + `userId`; reuse its `generatedImage` in the new analysis row. Keep a small `meta`/cache key (`tryon:gen:{userId}:{productKey}`) with a 30-day TTL.

**Rate limiting (Phase 2):** add `tryOnRateLimiter` in `lib/rate-limit.ts` using the existing `createLimiter` helper (e.g., 10 generations/day/user) plus a monthly spend alarm on the RunPod dashboard.

---

## 10. Security, Privacy & Compliance

- **User photos leave Vercel** when sent to RunPod → update the privacy copy/consent (existing FAQ already states photos aren't shared with third parties — this needs an explicit "AI processing partner" disclosure).
- Worker ephemerality: inputs are deleted after each run; never persist person images on the worker beyond the job.
- Webhook endpoint must verify `RUNPOD_WEBHOOK_SECRET` (constant-time compare) to avoid forged completions.
- Reuse the existing auth guard pattern (`auth.api.getSession`) on every try-on-touching route.
- Cloudinary retention/cleanup: delete generated images with the analysis (DELETE route) and honor the 90-day retention plan in `docs/future_features_implementation.md`.
- Never log full image URLs or PII; audit log optional via existing `audit_logs` table.
- CSP already restricts connect-src — add the RunPod domain (`api.runpod.ai`) and worker host to `connect-src` in `next.config.ts` **only if** client-side calls are needed (they shouldn't be; keep all RunPod calls server-side).

---

## 11. Testing & QA

| Layer | Approach |
|-------|----------|
| Unit — mock provider | `TRYON_PROVIDER=mock` keeps current behavior; assert `generateVirtualTryOn` returns clothing URL and `tryOnStatus=completed` |
| Unit — RunPod adapter | Mock `fetch` for `/runs` + `/status/{id}`; assert state mapping (IN_QUEUE→pending, IN_PROGRESS→processing, COMPLETED→completed, FAILED→failed) and error propagation |
| Unit — category mapping | Every `ItemCategory` maps to a valid `TryOnCategory`; unknown → `upper_body` |
| Integration — webhook | Signed payload updates the analysis row; unsigned payload → 401 |
| E2E (dev) | Upload → analysis → try-on completes → Results shows generated image under "Virtual Try-On" |
| Quality (golden set) | Fixed person+garment pairs run against the worker; manual review of fit/fabric/face preservation; record P95 latency + cost per run |
| Worker contract | `POST /tryon` smoke tests in the container CI (invalid inputs → 400, valid → 200) |

---

## 12. Rollout Phases

| Phase | Scope | Exit criteria |
|-------|-------|---------------|
| **0 — Abstraction (no behavior change)** | Create `lib/ai/tryon/` types + mock provider + facade; `TRYON_PROVIDER` env; category mapping; env vars in `lib/env.ts` | `TRYON_PROVIDER=mock` → exactly today's UX; tsc + lint green |
| **1 — Real generation** | RunPod container + endpoint; wire submit/poll into `POST/GET /api/analysis`; store `generatedImage`; Results placeholder state | Real try-on image appears on Results for a test account; P95 ≤ 60 s |
| **2 — Hardening** | Webhook route; caching; rate limiting; Cloudinary cleanup on DELETE; monitoring; soft-fail messaging | Budget control active; no orphaned Cloudinary assets |
| **3 — Quality** | 4K upscale option; category selector on upload; golden-set iteration; A/B against mock | Measured quality lift; costs documented |

**Recommended first slice (small, valuable):** Phase 0 + lazy kick-off wiring — zero GPU cost, proves the contract end-to-end with the mock, and unblocks Phase 1.

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Model license (NC)** blocks production | High | Decision gate §5 — commercial license, permissive-base fine-tune, or SaaS VTON API behind the same interface |
| 20–60 s latency feels slow | Medium | Async UX + "Generating your try-on…" state; cache; batch queue on RunPod |
| Cost overrun on GPU | Medium | Per-user caps, caching, mock fallback under load, RunPod spend alarm |
| Cold starts / queue wait | Medium | `min_workers` warm pool; monitor queue depth |
| In-the-wild photos degrade quality | Medium | Input validation (§7.1) + guidance on upload page; category mapping; accept lower quality gracefully |
| Vercel function-duration limits | High (if naive) | Never block on GPU in a route — submit is async, status is a snapshot, webhook completes |
| RunPod outage | Low | Provider fallback to mock + `tryOnStatus: "skipped"` soft-degrade |

---

## 14. Open Questions

1. **License path** (§5) — which of the three routes do we take for production?
2. **Category scope first** — launch `upper_body` only, or all three zones?
3. **4K upscaling** — default on, or opt-in (cost)?
4. **Storage of intermediate artifacts** — Cloudinary transforms only, or also keep the raw worker output?
5. **Monitoring budget** — RunPod dashboard only, or add structured logs/metrics?

---

*This plan is the design source for the VTON feature. When Phase 1 ships, move this summary into the main `README.md` features table and archive details here per the tracking convention in `docs/future_features_implementation.md`.*
