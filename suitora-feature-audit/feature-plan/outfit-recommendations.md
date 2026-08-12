# Feature Plan: Outfit Recommendation Engine

## 1. Feature Overview

- **Name:** Outfit Recommendation Engine
- **Current Status:** Partially functional (`lib/ai/outfit-recommender.ts` + tests; used in wardrobe suggestions)
- **Primary Goal:** Suggest complete looks and complementary items based on the user’s wardrobe, body attributes, and current trends.
- **Key Stakeholders:** End-users, product, stylist feature.

## 2. Current State Assessment (As-Is)

### Strengths
- Dedicated recommender module with tests.
- Integrated into wardrobe OutfitSuggestions.
- Can leverage item attributes, color palette, and season utilities.

### Pain Points & Bugs
- Recommendations may still feel generic without rich wardrobe data.
- Limited explanation of *why* an outfit was suggested.
- No strong feedback loop (accept / reject).

### Missing Functionality
- Occasion-based recommendations (work, date, travel).
- Budget constraints.
- “Shop the missing piece” deep links to trending or external retailers.

### Dependencies
- Wardrobe and favorites data.
- Item attributes and color analysis.
- Trending catalog (optional).

## 3. Future State Plan (To-Be)

### Proposed Enhancements (Priority)
- **High:** Occasion and season filters.
- **High:** Explainability chips (“matches your preferred palette”, “balances your last low-score category”).
- **Medium:** Feedback buttons that retrain or re-rank for the user.
- **Medium:** Missing-piece suggestions linked to trending.
- **Low:** Collaborative signals (anonymized popularity among similar profiles).

### Required Fixes & Adjustments
- Graceful degradation when wardrobe is empty (seed with trending + profile).
- Cap recommendation latency.

### Refactoring & Technical Debt
- Keep scoring pure and unit-tested.
- Version recommendation logic for later analysis of quality.

### KPIs for Success
- Click-through on recommended outfits.
- Save-to-wardrobe rate of recommended looks.
- Positive feedback ratio.

## 4. Actionable Roadmap

### Phase 1 – Quality (1–2 weeks)
- [ ] Occasion / season inputs (Medium)
- [ ] Explanation chips (Medium)
- [ ] Empty-wardrobe fallback (Small)

### Phase 2 – Feedback & Discovery (1–2 weeks)
- [ ] Accept / reject signals (Medium)
- [ ] Missing-piece → trending links (Medium)

### Phase 3 – Advanced (later)
- [ ] Collaborative signals (Large)

### Potential Risks & Mitigation
- **Risk:** Homogeneous recommendations.  
  **Mitigation:** Diversity constraints and occasional exploration of new styles.
