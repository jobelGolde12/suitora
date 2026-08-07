# Feature Plan: AI Fashion Analysis & Compatibility Scoring

## 1. Feature Overview

- **Name:** AI Fashion Analysis & Compatibility Scoring
- **Current Status:** Partially functional — real OpenAI Vision provider + mock fallback; pipeline includes fit scoring, item attributes, color analysis
- **Primary Goal:** Produce trustworthy overall, body, color, and style scores plus actionable recommendations so users can decide whether an item suits them before purchasing.
- **Key Stakeholders:** End-users, AI/ML owners, product, trust & safety.

## 2. Current State Assessment (As-Is)

### Strengths
- Provider abstraction in `lib/ai/vision.ts` with OpenAI Vision implementation and mock fallback.
- Fit scoring (`fit-scoring.ts`), item attributes, color palette, size prediction, body estimation modules.
- Analysis API (`POST /api/analysis`) creates DB rows with status progression and persists scores + metadata.
- Rate limiting on analysis and upload endpoints.
- Results page consumes real analysis records.

### Pain Points & Bugs
- Quality and consistency of scores depend heavily on prompt engineering and image quality.
- Mock fallback is still used when no API key is present; production must ensure real provider is active.
- Limited evaluation harness to measure score calibration against human judgments.
- Latency of vision calls can feel long without progressive UI updates.

### Missing Functionality
- Systematic A/B of prompts and models.
- Confidence intervals or uncertainty indicators on scores.
- Multi-model ensemble or secondary verification for edge cases.
- Explicit “why this score” explanations grounded in detected attributes.

### Dependencies
- Vision provider credentials (OpenAI / Gemini).
- Stable image URLs from upload/storage.
- Body estimation and item attribute modules.
- Analyses table schema (`overallScore`, `bodyScore`, `colorScore`, `styleScore`, `compatibilityMetadata`, etc.).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Production-grade prompt library + evaluation set of labeled images.
- **High:** Progressive status updates (pending → analyzing → completed) with clear progress UI.
- **Medium:** Confidence / reliability badges on scores.
- **Medium:** Gemini Vision (or other) as secondary provider with automatic failover.
- **Low:** User feedback loop (“Was this score accurate?”) to improve prompts over time.

### Required Fixes & Adjustments
- Ensure env-based provider selection never silently falls back to mock in production.
- Harden timeout, retry, and partial-failure behavior.
- Map all model outputs cleanly into canonical `compatibilityMetadata` and recommendations schema.

### Refactoring & Technical Debt
- Keep a single `analyzeFashion` entry point that orchestrates vision → attributes → scoring → try-on kickoff.
- Version prompts and store prompt version with each analysis for reproducibility.
- Expand unit/integration tests around scoring pure functions.

### KPIs for Success
- Median analysis latency < 8 s (excluding try-on generation).
- Score–human correlation improvement (target Spearman ρ ≥ 0.6 on internal eval set).
- User-reported “helpful” rate on recommendations ≥ 70%.
- Analysis failure rate < 3%.

## 4. Actionable Roadmap

### Phase 1 – Production Reliability (1–2 weeks)
- [ ] Enforce real provider in production + clear error when misconfigured (Small)
- [ ] Status polling / progressive UI polish (Medium)
- [ ] Timeout, retry, and rate-limit tuning (Small)

### Phase 2 – Quality (2–4 weeks)
- [ ] Build labeled evaluation set and scoring harness (Large)
- [ ] Prompt iteration cycles with measurable uplift (Medium–Large)
- [ ] Secondary provider failover (Medium)

### Phase 3 – Trust & Learning (ongoing)
- [ ] Confidence indicators (Medium)
- [ ] Optional user feedback collection (Medium)
- [ ] Prompt versioning in DB (Small)

### Potential Risks & Mitigation
- **Risk:** Model cost spikes with traffic.  
  **Mitigation:** Caching of identical image pairs, user quotas, cheaper model for preliminary pass.
- **Risk:** Biased or culturally insensitive recommendations.  
  **Mitigation:** Diverse eval set, style-guideline review, opt-out of certain advice categories.
