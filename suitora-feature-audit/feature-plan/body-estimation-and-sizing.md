# Feature Plan: Body Estimation & Size Prediction

## 1. Feature Overview

- **Name:** Body Estimation, Height/Weight Prediction & Size Recommendation
- **Current Status:** Partially functional — modules exist (`body-estimation.ts`, `size-prediction.ts`); detailed plan in `docs/weight_height_prediction_plan.md`
- **Primary Goal:** Infer body-related attributes from the self-image (and optional user input) to improve fit scoring, size advice, and stylist context.
- **Key Stakeholders:** End-users, AI pipeline, product.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated modules and tests for size prediction.
- Schema fields on analyses for height, weight, and confidence.
- Profile estimate API route.
- Integration points into the broader fit pipeline.

### Pain Points & Bugs
- Estimation accuracy varies with pose, clothing, and camera angle.
- Confidence is not always prominently shown or actionable.
- Cultural and body-diversity coverage of training assumptions may be limited.

### Missing Functionality
- Explicit user confirmation / correction of estimates.
- Size charts mapped to major retailers.
- Continuous improvement loop from user corrections.

### Dependencies
- Self-image quality.
- Vision / body-estimation models.
- Fit-scoring and results UI.

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Always show confidence and allow one-tap correction.
- **High:** Use corrected values to improve subsequent analyses for that user.
- **Medium:** Map predicted size to common regional size systems.
- **Low:** Optional guided measurement flow (tape or known garment).

### Required Fixes & Adjustments
- Never present estimates as medical or definitive facts.
- Handle missing or low-confidence cases without blocking the whole analysis.

### Refactoring & Technical Debt
- Keep pure prediction functions testable and versioned.
- Store model / method version with estimates.

### KPIs for Success
- Correction rate of estimates (target decreasing over time).
- Uplift in body-score correlation when estimates are present.
- User trust signals (low complaint rate about body-related messaging).

## 4. Actionable Roadmap

### Phase 1 – Trust UX (1 week)
- [ ] Confidence + correction UI on profile and results (Medium)
- [ ] Copy review for sensitivity (Small)

### Phase 2 – Accuracy (2–3 weeks)
- [ ] Incorporate user corrections into profile (Medium)
- [ ] Size-system mapping (Medium)
- [ ] Eval set expansion (Large)

### Phase 3 – Optional Inputs (later)
- [ ] Guided measurement mode (Large)

### Potential Risks & Mitigation
- **Risk:** Body image sensitivity.  
  **Mitigation:** Careful language, easy opt-out of body estimates, focus on garment fit rather than body judgment.
