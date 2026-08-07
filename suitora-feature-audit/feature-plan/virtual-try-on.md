# Feature Plan: Virtual Try-On Engine

## 1. Feature Overview

- **Name:** Virtual Try-On Engine
- **Current Status:** Partially functional — mock provider by default; full provider-agnostic architecture and RunPod adapter scaffolding exist; generated image column ready
- **Primary Goal:** Show users a realistic visualization of how a garment looks on their body, dramatically increasing purchase confidence.
- **Key Stakeholders:** End-users, AI/backend, legal (licensing), cost owners.

## 2. Current State Assessment (As-Is)

### Strengths
- Clean facade in `lib/ai/tryon/` with mock and RunPod providers.
- Category mapping, validation, lifecycle, and monitoring modules.
- Schema fields: `generatedImage`, `tryOnStatus`, `tryOnJobId`, `tryOnError`, latency tracking.
- Webhook route (`/api/tryon/webhook`) for async completion.
- Detailed implementation plan and licensing research already documented (`docs/virtual_tryon_engine_plan.md`, `vton_licensing_research.md`).

### Pain Points & Bugs
- Default behavior is still mock (returns clothing image after delay); real synthesis not production-active.
- Strong open-source VTON models (IDM-VTON, CatVTON) carry non-commercial licenses — commercial use requires licensing or alternative models.
- GPU inference cost and latency are significant; needs careful queueing and caching.
- Results page expects `generatedImage` but it is rarely populated today.

### Missing Functionality
- Production RunPod (or alternative GPU) deployment with monitoring.
- Result caching keyed by (person image hash + garment image hash + category).
- User-facing “regenerate” and quality feedback.
- Multi-view or higher-resolution options for premium tiers.

### Dependencies
- Cloudinary (or equivalent) for output storage.
- Analysis lifecycle and status fields.
- Legal clearance on chosen model weights.
- Webhook security (signature verification).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Productionize RunPod (or chosen provider) with proper secrets, scaling, and health checks.
- **High:** Resolve licensing path (commercial license, alternative model, or partner API).
- **High:** Cache successful try-ons and surface them instantly on re-analysis.
- **Medium:** Progressive UX (placeholder → low-res preview → final).
- **Medium:** Cost controls and per-user daily generation limits.
- **Low:** Higher-fidelity / multi-pose options for paid tiers.

### Required Fixes & Adjustments
- Never leave analyses stuck in `tryOnStatus = processing`; implement timeout + fallback to mock or “try-on unavailable”.
- Secure webhook endpoint (shared secret or signed payload).
- Populate and display `generatedImage` consistently on Results.

### Refactoring & Technical Debt
- Keep the provider interface stable so swapping models does not touch business logic.
- Centralize monitoring metrics (success rate, p95 latency, cost per generation).
- Expand tests around validation and lifecycle state machine.

### KPIs for Success
- Try-on success rate ≥ 90% for supported categories.
- p95 end-to-end generation latency < 25 s (async).
- Cache hit rate ≥ 30% after first month of traffic.
- User engagement with try-on toggle ≥ 60% of result views.

## 4. Actionable Roadmap

### Phase 0 – Legal & Architecture Gate (1 week)
- [ ] Finalize model / provider decision based on licensing research (Large decision)
- [ ] Confirm RunPod (or alternative) cost model and budget alerts (Medium)

### Phase 1 – Production Provider (2–3 weeks)
- [ ] Deploy and harden RunPod worker + webhook (Large)
- [ ] Wire analysis flow to real provider when configured (Medium)
- [ ] Timeout, fallback, and error surface on Results (Medium)

### Phase 2 – Quality & Cost (2 weeks)
- [ ] Result caching layer (Medium)
- [ ] Per-user / per-tier generation quotas (Medium)
- [ ] Monitoring dashboard (success, latency, cost) (Medium)

### Phase 3 – Experience (later)
- [ ] Regenerate + feedback controls (Small–Medium)
- [ ] Premium higher-fidelity options (Large)

### Potential Risks & Mitigation
- **Risk:** License violation if non-commercial weights are used commercially.  
  **Mitigation:** Explicit legal sign-off before any production traffic; prefer commercially licensed or partner APIs.
- **Risk:** Uncontrolled GPU spend.  
  **Mitigation:** Hard daily budgets, queue limits, aggressive caching, and mock fallback under load.
- **Risk:** Poor visual quality damages trust.  
  **Mitigation:** Quality gate before showing result; allow user to hide try-on; collect feedback.
