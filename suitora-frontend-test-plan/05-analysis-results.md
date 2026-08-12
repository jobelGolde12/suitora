# 05 — Analysis Results Test Plan

**Route:** `/results/[id]`  
**Auth:** Required  
**Key components:** `ScoreOverview`, `FitSummary`, `DetailedFitAnalytics`, `MeasurementComparison`, `ColorPaletteCard`, `SizeRecommendationCard`, `InsightsList`, `CategoryHeroImage`, try-on image display, action buttons (favorite, save to wardrobe, etc.)  

---

## 5.1 Page Load & Ownership

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-001 | P0 | Functional | Logged in, valid own analysis ID | Open `/results/[id]` | Results page loads with scores, images, insights |
| RES-002 | P0 | Functional | Invalid ID | Open `/results/nonexistent` | Not-found or error state; no crash |
| RES-003 | P1 | Functional | Another user’s analysis ID | Open if accessible by ID | Either 404/forbidden or only own data (per security design) |
| RES-004 | P1 | UI | Valid result | First paint | Skeletons then content; try-on / product images load |
| RES-005 | P0 | Functional | Logged out | Open results URL | Redirect to login |

---

## 5.2 Score Overview

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-010 | P0 | Functional | Completed analysis | View ScoreOverview | Overall compatibility score visible (numeric + visual e.g. ScoreCircle) |
| RES-011 | P1 | Functional | Completed analysis | View sub-scores | Fit, color, style (or equivalent) scores shown if provided by API |
| RES-012 | P2 | UI | Score values | Check ranges | Scores within expected 0–100 (or design scale); colors match thresholds |

---

## 5.3 Fit Summary & Detailed Analytics

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-020 | P1 | Functional | Analysis with fit data | View FitSummary | Human-readable fit verdict |
| RES-021 | P1 | Functional | Analysis with measurements | View DetailedFitAnalytics / MeasurementComparison | Body vs garment comparison readable |
| RES-022 | P2 | UI | Long content | Expand/collapse if present | Works without layout break |

---

## 5.4 Color Palette & Size Recommendation

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-030 | P1 | Functional | Analysis with palette | View ColorPaletteCard | Swatches + labels render |
| RES-031 | P1 | Functional | Analysis with size rec | View SizeRecommendationCard | Recommended size and rationale shown |
| RES-032 | P2 | UI | Palette | Color contrast of text on swatches | Readable labels |

---

## 5.5 Insights & Recommendations

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-040 | P1 | Functional | Analysis with insights | View InsightsList | Bullet/list of insights; no empty broken list |
| RES-041 | P2 | Functional | Seasonal line (if any) | View seasonal tip | Text from season helper appears when applicable |

---

## 5.6 Virtual Try-On Visual

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-050 | P0 | Functional | Analysis with try-on image | View hero / try-on | Try-on image displays (or mock placeholder when engine mocked) |
| RES-051 | P1 | UI | Image load failure | Broken image URL | Fallback UI; no infinite broken icon spam |
| RES-052 | P1 | Functional | Category-specific crop | View product/try-on | Crop class applied per category config when relevant |

---

## 5.7 Actions on Results

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-060 | P0 | Functional | Not favorited | Toggle favorite | Item becomes favorited; UI updates (heart filled); persists on refresh |
| RES-061 | P0 | Functional | Favorited | Toggle favorite again | Unfavorited; UI updates |
| RES-062 | P1 | Functional | Results page | Save to wardrobe (if control present) | Item appears in wardrobe after success |
| RES-063 | P1 | Functional | Results page | Navigate back / to history | Correct navigation |
| RES-064 | P2 | Functional | Share (if present) | Activate share | Share sheet or copy link works |
| RES-065 | P1 | Error | Favorite API fails | Toggle favorite | Error toast; UI reverts |

---

## 5.8 Related / Outfit Suggestions on Results

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-070 | P2 | Functional | Suggestions available | View related outfits/items | Cards render; links work |
| RES-071 | P2 | Functional | Empty suggestions | View section | Hidden or empty state, not error |

---

## 5.9 Responsive & A11y

| ID | Priority | Type | Preconditions | Steps | Expected Result |
|----|----------|------|---------------|-------|-----------------|
| RES-080 | P1 | Responsive | Mobile | Full results page | Sections stack; images scale; actions reachable above bottom safe area |
| RES-081 | P1 | A11y | Score visuals | Screen reader | Score values available as text, not only color |
| RES-082 | P1 | UX | Immersive route | Mobile bottom nav | Hidden on `/results/*` per navigation rules |
