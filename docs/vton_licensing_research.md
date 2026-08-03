# Virtual Try-On — Licensing & Commercial Path Research

> **Status:** 📋 Research summary · **Applies to:** `docs/virtual_tryon_engine_plan.md` §5 (License Decision Gate)
> **Bottom line:** No major open-source VTON model is commercially usable out of the box. Pick one of the three paths below before Phase 1.

---

## 1. Open VTON models — licensing status (verified from repo READMEs, Jul 2026)

| Model | Repo | License | Commercial use? |
|-------|------|---------|-----------------|
| IDM-VTON (ECCV 2024) | `yisol/IDM-VTON` | **CC BY-NC-SA 4.0** (code + checkpoints) | ❌ |
| CatVTON (ICLR 2025) | `Zheng-Chong/CatVTON` | **CC BY-NC-SA 4.0** (code, checkpoints, demo) | ❌ |
| VITON-HD | `shibing624/VITON-HD` (research) | Research-only | ❌ |
| OOTDiffusion | `levihsu/OOTDiffusion` | CC BY-NC-SA 4.0 | ❌ |

**Key facts:**

- **CC BY-NC-SA 4.0** means: non-commercial only, share-alike, attribution required. Using these models in Suitora (a commercial product) is not permitted without a separate license from the authors.
- **CatVTON** also releases **CatV2TON** (image + video) and a **FLUX LoRA (CatVTON-FLUX)** — the FLUX LoRA inherits the license constraints of both the base model and the LoRA (see §2).
- IDM-VTON ships a Gradio demo wired to DWPose/OpenPose + SCHP + DensePose, which maps exactly to the Fotor pipeline stages in `Todo.md` — that's why it was the reference architecture. Its **non-commercial license is the blocker**, not the engineering.

---

## 2. Permissive-base fine-tuning path (recommended for full control)

Instead of using a pre-trained VTON model, **fine-tune a VTON LoRA/checkpoint on a commercially-permissive base model**:

| Base model | License | Commercial fine-tune allowed? |
|------------|---------|-------------------------------|
| **SDXL** | OpenRAIL-M (stability.ai) | ✅ Yes (with redistribution conditions) |
| **FLUX.1-schnell** | Apache-2.0 | ✅ Yes (weights + code) |
| FLUX.1-dev | FLUX non-commercial license | ❌ |
| SD 1.5 | CreativeML OpenRAIL-M | ✅ Yes |

**How it would work (the plan's "own model" option):**

1. Start from SDXL (permissive) — it already handles 1024×1024 and inpainting well.
2. Collect/curate a licensed paired try-on dataset (person image ↔ same person wearing garment). Public research datasets (VITON-HD, DressCode) are **research-only** — you need your own licensed data, or obtain dataset licenses.
3. Train a VTON LoRA (or use the open-source CatVTON-FLUX training approach against `FLUX.1-schnell` instead of FLUX.1-dev).
4. Keep the SCHP/DWPose/DensePose pre-processing (those models are Apache-2.0; **OpenPose has its own restrictive custom license** — prefer DWPose, which is Apache-2.0, for pose keypoints) for mask + pose generation; the generative core is your fine-tuned model.

**Trade-offs:** most work (data + training + eval); full commercial freedom; can tune for Suitora's aesthetic; requires GPU for training (RunPod on-demand OK) — but this is a multi-week effort, so treat it as the *long-term* path.

---

## 3. Commercial SaaS VTON APIs (fastest to production)

If the goal is to ship real try-on quickly while staying compliant:

| Option | Notes |
|--------|-------|
| **Leonardo AI API** | Commercial image-generation API (permissive for production); general image gen, not VTON-specific — needs prompt/2-image composition work. Recommended by Gravity Index search for this use case. |
| **ZMO.ai / Vue.ai / Revery.ai** | Dedicated fashion/VTON SaaS APIs — purpose-built try-on, model/mannequin libraries, per-image pricing. Requires vendor evaluation + contract. |
| **Fotor / PhotoRoom APIs** | Consumer-style try-on/background tools with APIs; lighter fit for a programmatic pipeline. |

**Trade-offs:** fastest integration (weeks, not months); per-image cost; data leaves your infra (needs DPA + consent copy); less control over quality/pose/lighting; **but it also works behind the same `TryOnProvider` interface** in `lib/ai/tryon/` — so the architecture doesn't change.

---

## 4. Recommendation for Suitora

| Path | Effort | Cost | Control | Fit |
|------|--------|------|---------|-----|
| A. Negotiate commercial license with IDM-VTON / CatVTON authors | Low (one contract) | One-off fee, unknown pricing | High | ✅ **Best near-term if obtainable** |
| B. Permissive-base fine-tune (SDXL / FLUX-schnell LoRA) | High (weeks of ML work) | GPU training time | Full | ✅ Long-term / differentiating |
| C. Commercial SaaS VTON API | Medium (integration) | Per-image | Low | ✅ Fastest to ship |

**Suggested sequencing:**

1. **Now (Phase 0):** run with the mock provider — done, zero cost, no license exposure.
2. **Near-term:** email the IDM-VTON and CatVTON authors re: commercial licensing (path A); while waiting, evaluate 1–2 SaaS VTON APIs on a trial key (path C) behind the `runpod`/SaaS adapter.
3. **Long-term:** invest in path B (own fine-tune) once unit economics justify it.

**Open item to resolve:** confirm whether a commercial license is obtainable from the model authors and at what price — this is the single decision that unblocks Phase 1.
