# Outfit Recommendation Engine

Generates complete, scored outfit suggestions from a user's **wardrobe** (favorites
flagged `in_wardrobe`).

## Flow

1. `GET /api/wardrobe/outfits?limit=n` (auth-guarded) → `getWardrobeFavoritesByUserId`
   pulls the user's wardrobe favorites joined with their analyses.
2. Each analysis supplies:
   - item profile from `analyses.compatibilityMetadata.itemProfile`
     (category, colors, styleTags, silhouette, subtype)
   - its user-specific fit score (`analyses.overallScore`)
3. `recommendOutfits(items)` in `lib/ai/outfit-recommender.ts`:
   - maps each item to an outfit `role` (`tops→top`, `bottoms→bottom`,
     `dresses→dress`, `outerwear→outer`, `footwear→footwear`, …)
   - builds a **foundation** per dress (alone) and per top×bottom pair
   - greedily enriches with the single best outer / footwear / headwear / accessory
   - scores each finished look and returns the top-ranked `TrendOutfit[]`
4. `components/wardrobe/OutfitSuggestions.tsx` renders the section on the favorites
   page (reuses `OutfitItemStrip`, `getScoreColor`, editorial card language).

## Scoring (`scoreOutfit`)

| Dimension | Source |
|-----------|--------|
| `avgFit` | mean of stored per-item fit scores |
| `coherenceScore` | style-tag Jaccard × 0.55 + formality consistency × 0.45 |
| `colorStoryScore` | pairwise hex→HSL palette compatibility |
| `proportionScore` | silhouette-volume balance (fitted vs loose pairings) |
| `formalityConsistency` | per-item formality band (casual/smart/formal) agreement |
| `overallScore` | `0.45·avgFit + 0.25·coherence + 0.15·color + 0.15·proportion` |

The engine is pure (no DB/network) and deterministic; core logic is covered by
`lib/ai/outfit-recommender.test.ts` (12 tests).
