# VTON License — Request Templates & SaaS Evaluation Checklist

> **Status:** 📋 Ready to send · **Relates to:** `docs/vton_licensing_research.md` §4
> The followup "action the license decision" is a **human step** (emailing authors / signing up for trials). This doc gives you copy-paste templates and a checklist so it can be done in minutes.

---

## 1. Commercial license request — model authors

Replace `[bracketed]` fields, keep the calm Suitora tone. Send to the GitHub/paper contact emails of **IDM-VTON** (`yisol/IDM-VTON`) and **CatVTON** (`Zheng-Chong/CatVTON`). Both are CC BY-NC-SA 4.0, so a separate commercial license is required.

### Subject
> Commercial licensing inquiry — [IDM-VTON / CatVTON] for [Company Name]

### Body

```
Hello [Author Name],

My team builds Suitora, a fashion compatibility platform where users upload a
photo and a garment to get a virtual try-on with fit/color/style scores
([product url or one-line description]).

We are evaluating [IDM-VTON / CatVTON] for our production virtual try-on
pipeline (running on our own RunPod GPU workers) and would like to license it
for commercial use, since your repository is released under CC BY-NC-SA 4.0
(non-commercial).

Could you share:

1. Whether you offer commercial licenses for [model name], and the terms.
2. Indicative pricing (one-time fee vs. revenue share vs. annual license).
3. Any usage limits or attribution requirements beyond the CC BY-NC-SA terms.
4. The best contact / channel to proceed.

We are happy to sign an NDA and can provide usage volume estimates to help you
quote. Thank you for the excellent work, and we look forward to hearing from
you.

Best regards,
[Your name]
[Role] — Suitora ([contact email])
```

---

## 2. SaaS VTON API — trial evaluation checklist

If the author path stalls, evaluate 1–2 commercial SaaS VTON APIs behind the existing `TryOnProvider` interface (`lib/ai/tryon/providers/`). Sign up for trial keys, then run this checklist:

| # | Check | Pass? |
|---|-------|-------|
| 1 | Trial key issued; API docs clear (submit → poll/webhook) | ☐ |
| 2 | Try-on quality on a **golden set** (3–5 person+garment pairs) meets bar for fit, fabric, and face preservation | ☐ |
| 3 | Category coverage (upper_body / lower_body / dresses) works | ☐ |
| 4 | Per-image pricing fits budget (~$0.02–0.05/run target) | ☐ |
| 5 | Latency P95 ≤ 60 s (async ok) | ☐ |
| 6 | Data privacy: DPA available, no training on customer images, region/hosting acceptable | ☐ |
| 7 | Output URLs are stable/persistent or re-uploadable to Cloudinary | ☐ |
| 8 | Provider returns an API key to add as `RUNPOD_API_KEY`-style env (or a new provider adapter) | ☐ |

**Integration note:** SaaS providers plug into `lib/ai/tryon/providers/` the same way `runpod.ts` does — add a `providers/saasX.ts` implementing `TryOnProvider`, select it via `TRYON_PROVIDER`.

---

## 3. Where to record the decision

Once a path is chosen, update:
- `docs/virtual_tryon_engine_plan.md` §5 (license gate) → mark resolved.
- `docs/vton_licensing_research.md` → move the chosen path to "Decided".
- `docs/virtual_tryon_engine_tasks.md` → tick "License decision".
