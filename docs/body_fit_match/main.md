# Suitora — Body-Fit Matching & Analytics Plan

> **Goal:** Determine, with high confidence and transparent reasoning, whether any online fashion item (dress, shirt, shorts, shoes, cap, outerwear, accessories, etc.) will suit a specific user’s body — before they buy.  
> This document is the canonical technical and product plan for the fit-matching engine and its analytics layer.  
> It must stay aligned with `docs/data_schema.md`, `docs/weight_height_prediction_plan.md`, `docs/future_features_implementation.md`, `premium-editorial-ui.md`, and the overall product vision in `README.md` / `docs/project_detail.md`.

---

## 1. Product Intent

Suitora answers one core question:

> **“Will this item actually look good and fit *me*?”**

The system must go far beyond a single overall score. It should produce:

- Category-aware fit predictions (a dress is evaluated differently from shoes or a cap)
- Multi-dimensional compatibility scores
- Transparent, human-readable reasoning
- Actionable recommendations (size advice, styling tips, alternatives)
- Confidence levels so the user knows when to trust the result

The experience must remain calm, editorial, and premium — never a dense analytics dashboard.

---

## 2. Supported Item Categories

Every item is classified into a primary category. Category drives which measurements, models, and scoring weights are used.

| Category | Examples | Primary Fit Drivers |
|----------|----------|---------------------|
| **Tops** | T-shirt, blouse, shirt, sweater, hoodie | Chest/bust, shoulder width, sleeve length, torso length, neckline |
| **Dresses** | Midi, maxi, mini, bodycon, A-line, wrap | Bust, waist, hips, length, silhouette vs body shape |
| **Bottoms** | Shorts, jeans, trousers, skirts | Waist, hips, rise, inseam/outseam, thigh, leg opening |
| **Outerwear** | Jacket, coat, blazer, cardigan | Chest, shoulder, sleeve, length, layering allowance |
| **Footwear** | Sneakers, heels, boots, sandals, loafers | Foot length, width, arch, heel height, shaft height (boots) |
| **Headwear** | Cap, hat, beanie, beret | Head circumference, face shape compatibility, proportion |
| **Accessories** | Belt, scarf, bag, jewelry | Secondary — style & proportion relative to body/frame |
| **Activewear / Swim** | Leggings, sports bras, swimsuits | Compression, coverage, stretch, body coverage zones |
| **Formal / Occasion** | Suit, gown, tuxedo | Precise tailoring measurements + formal silhouette rules |

Future categories can be added by extending the classification taxonomy and the measurement dictionary below.

---

## 3. User Body Model

The system maintains a structured **User Body Profile** derived from the uploaded photo(s) and optional user input.

### 3.1 Core Anthropometrics (from vision + optional calibration)

| Attribute | Unit | Source | Notes |
|-----------|------|--------|-------|
| Height | cm | Vision + optional user input | See `weight_height_prediction_plan.md` |
| Weight | kg | Vision + BMI estimation | Confidence-weighted |
| Body Shape | enum | Vision | Rectangle, Pear, Apple, Hourglass, Inverted Triangle, Triangle |
| Shoulder Width | cm / relative | Landmark detection | Critical for tops & outerwear |
| Chest / Bust | cm / relative | Landmark + silhouette | |
| Waist | cm / relative | Landmark + silhouette | |
| Hips | cm / relative | Landmark + silhouette | |
| Torso Length | relative | Vertex → hip | |
| Leg Length / Inseam proxy | relative | Hip → heel | |
| Arm / Sleeve Length | relative | Shoulder → wrist | |
| Neck Circumference | relative | Optional | For collars & high necklines |
| Head Circumference | relative | For headwear | |
| Foot Length / Width | relative or user-input | For footwear | Highly recommended user calibration |
| Skin Tone | Warm / Cool / Neutral + undertone | Vision | Feeds color harmony |
| Face Shape | Round, Oval, Heart, Square, Diamond | Vision | Feeds headwear & neckline advice |
| Style Preference | Casual, Minimalist, Streetwear, Formal, etc. | Inferred + user settings | |

### 3.2 Confidence & Uncertainty

Every estimated measurement carries a confidence score \( C \in [0, 1] \).

- High confidence (≥ 0.85): full-body, front-facing, good lighting, form-fitting clothes
- Medium (0.65–0.84): partial occlusion, loose clothing, slight angle
- Low (< 0.65): truncated photo, heavy outerwear, extreme pose → system dampens extreme scores and labels results “Estimated”

When confidence is low, the UI must communicate this calmly (editorial tone, never alarming).

### 3.3 Storage

Store the structured body profile inside:

- `compatibility_metadata` (JSON) on the analysis, **and/or**
- A dedicated `user_body_profiles` table (recommended long-term) linked to `user_id` with versioning and `updated_at`

---

## 4. Item Representation

When a user uploads an image or pastes a product URL, the system builds an **Item Profile**.

### 4.1 Extracted Attributes

| Attribute | Description |
|-----------|-------------|
| Category | Auto-classified (top, dress, bottom, footwear, etc.) |
| Subtype | e.g. “midi wrap dress”, “high-top sneaker”, “baseball cap” |
| Silhouette | Fitted, relaxed, oversized, A-line, straight, flared, etc. |
| Key Measurements | Extracted or inferred (chest, waist, length, size chart if available) |
| Fabric / Stretch | Rigid, moderate stretch, high stretch (affects ease) |
| Color & Pattern | Dominant colors, pattern type, contrast |
| Neckline / Collar | V-neck, crew, turtleneck, off-shoulder, etc. (tops & dresses) |
| Sleeve Type | Sleeveless, short, long, bell, etc. |
| Rise / Length | For bottoms and dresses |
| Heel Height / Toe Shape | Footwear |
| Brand Size Chart | If scraped or known |
| Style Tags | Casual, formal, street, athletic, romantic, etc. |

### 4.2 Size & Measurement Sources (priority order)

1. Explicit size chart from product page (best)
2. Brand + size → standard measurement tables
3. Vision estimation from product image (mannequin or flat-lay heuristics)
4. User-selected size + brand ease assumptions

---

## 5. Matching Engine — Core Algorithm

### 5.1 High-Level Pipeline

```
User Photo ──► Body Landmark Detection ──► Body Profile + Confidence
                                              │
Product Image / URL ──► Item Classification & Attribute Extraction
                                              │
                                              ▼
                                    Category-Specific Fit Model
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              Body Fit Score          Color Harmony Score         Style Match Score
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                    Overall Compatibility Score
                                              │
                                              ▼
                          Recommendations + Reasoning + Alternatives
```

### 5.2 Category-Specific Fit Models

#### A. Dresses & One-Pieces
- Compare bust, waist, hip measurements of the garment vs user
- Evaluate silhouette vs body shape rules (e.g. A-line flatters pear; bodycon rewards hourglass)
- Length relative to height and preferred coverage
- Ease / stretch consideration
- Output: Fit Score + “Recommended size” + “Why this silhouette works / doesn’t”

#### B. Tops (Shirts, Blouses, Sweaters)
- Shoulder width match (critical)
- Chest/bust ease
- Sleeve length vs arm length
- Torso length / hem position
- Neckline vs face shape & personal style

#### C. Bottoms (Shorts, Trousers, Skirts, Jeans)
- Waist and hip match
- Rise (high/mid/low) vs torso proportion and preference
- Inseam / outseam vs leg length and desired look (shorts vs full length)
- Thigh and leg opening for comfort and style

#### D. Outerwear
- Chest and shoulder (allowance for layering)
- Sleeve length
- Length relative to torso and desired proportion
- Style compatibility with existing wardrobe (future)

#### E. Footwear
- Foot length and width (strongly prefer user-provided or high-confidence estimate)
- Heel height suitability (stability, occasion, leg length proportion)
- Shaft height for boots vs calf circumference
- Toe box shape vs foot shape

#### F. Headwear (Caps, Hats, Beanies)
- Head circumference
- Crown height and brim style vs face shape
- Proportion relative to overall body scale
- Style match (sporty cap vs formal hat)

#### G. Accessories
- Primarily style, color, and scale (bag size vs body frame, belt width vs waist definition, etc.)
- Lower weight in overall score unless the item is the primary focus

### 5.3 Scoring Dimensions (Canonical)

Every analysis produces at least these scores (0–100):

| Score | Meaning | Primary Inputs |
|-------|---------|----------------|
| **Body Fit Score** | How well the garment dimensions and silhouette match the user’s measurements and body shape | Measurements, silhouette rules, ease, stretch |
| **Color Score** | Harmony between item colors and user’s skin tone, hair, and preferred palette | Skin undertone, seasonal color analysis, item palette |
| **Style Score** | Alignment with user’s inferred or declared style preferences and the item’s style tags | Style embedding / tags, occasion |
| **Overall Score** | Weighted combination | Configurable weights (default: Body 40%, Color 30%, Style 30%) — adjustable by category |

Additional derived metrics (stored in `compatibility_metadata`):

- Size recommendation (e.g. “M — or size up if you prefer oversized”)
- Confidence of the overall result
- Key risk flags (“May be tight across shoulders”, “Length may be short for your height”)
- Positive highlights (“Excellent waist definition for your shape”)

### 5.4 Weighting & Uncertainty Propagation

When any critical measurement has low confidence:

- Pull extreme Body Fit scores toward a neutral band (≈ 68–78)
- Surface an “Estimated” badge
- Prefer recommending a size range rather than a single size
- Still provide full reasoning so the user understands the limitation

---

## 6. Detailed Analytics Output

The results page and stored analysis must support rich but calm analytics.

### 6.1 Primary Display (Results Page)

Keep the premium editorial aesthetic:

- Large virtual try-on image (or generated composite)
- Prominent Overall Score (circular or elegant numeric treatment)
- Three secondary scores (Body / Color / Style) with subtle progress or radial indicators
- Short editorial summary paragraph (“This midi dress follows your waist cleanly and sits at a flattering length for your proportions.”)
- Size recommendation chip
- Confidence indicator (subtle)

### 6.2 Expandable / Secondary Analytics

Available via calm disclosure (accordion or “See detailed analysis”):

**Body Fit Breakdown**
- Measurement comparison table (User vs Garment) for the relevant dimensions
- Silhouette compatibility explanation
- Ease / stretch notes
- Risk flags and positive notes

**Color Analysis**
- Detected item palette
- User seasonal / undertone classification
- Harmony score rationale
- Suggested complementary colors

**Style Insights**
- Detected item style tags
- Match against user style profile
- Occasion suitability

**Recommendations**
- Size advice
- Styling tips (“Pair with a structured blazer to balance the relaxed fit”)
- Alternative items or similar styles that may score higher (Phase 3)
- “What to avoid” (gentle)

### 6.3 Data Shape (for `compatibility_metadata` + recommendations)

```json
{
  "bodyProfile": {
    "heightCm": 168,
    "weightKg": 62,
    "bodyShape": "hourglass",
    "measurements": { "bust": 88, "waist": 70, "hips": 96, "shoulderWidth": 38 },
    "confidence": 0.87
  },
  "itemProfile": {
    "category": "dress",
    "subtype": "midi_wrap",
    "silhouette": "wrap_a_line",
    "keyMeasurements": { "bust": 90, "waist": 72, "hips": 98, "lengthCm": 110 },
    "stretch": "moderate",
    "colors": ["#C5A07A", "#F8F5F1"],
    "styleTags": ["romantic", "casual-chic"]
  },
  "scores": {
    "overall": 84,
    "body": 88,
    "color": 79,
    "style": 86
  },
  "sizeRecommendation": {
    "suggested": "M",
    "range": ["S", "M"],
    "rationale": "Garment waist is close to your measurement; moderate stretch allows comfortable fit."
  },
  "insights": {
    "positives": ["Wrap silhouette accentuates your waist", "Length is well proportioned to your height"],
    "cautions": ["May feel slightly fitted across the bust if you prefer more ease"],
    "stylingTips": ["Add a slim belt to further define the waist", "Pair with low heels to elongate the leg line"]
  },
  "confidence": 0.84,
  "flags": []
}
```

This structure maps cleanly onto the canonical `analyses` table (`overall_score`, `body_score`, `color_score`, `style_score`, `compatibility_metadata`, `recommendations`).

---

## 7. Category-Specific Analytics Deep Dive

### 7.1 Dresses
- Bust / waist / hip delta analysis
- Silhouette scoring matrix vs body shape
- Length vs height percentile
- Neckline vs face shape and bust support needs
- Movement / ease score (important for bodycon vs flowy)

### 7.2 Shorts & Bottoms
- Waist-to-hip ratio compatibility
- Rise analysis (does high-rise suit short torso?)
- Leg opening vs thigh and desired aesthetic
- Inseam suitability for height and occasion (bermuda vs short shorts)

### 7.3 Shoes
- Length and width match (highest priority)
- Heel height comfort band for the user
- Proportional effect on perceived height and leg line
- Occasion + style coherence
- Special handling for boots (calf circumference)

### 7.4 Caps & Headwear
- Circumference match
- Face-shape compatibility rules (e.g. wide brim vs round face)
- Scale relative to body (oversized bucket hat on petite frame)
- Hair accommodation notes

### 7.5 Multi-Item / Outfit Context (Phase 2+)
When comparing multiple items or building outfits:
- Inter-item proportion checks
- Color story coherence
- Formality consistency
- Overall silhouette balance (volume distribution)

---

## 8. Implementation Roadmap (Aligned with Existing Phases)

### Phase 2 Foundations (required before high-quality fit)
1. Align DB schema and persist real analyses (`docs/analysis_db_alignment_report.md`)
2. Real Vision pipeline (body landmarks + item attributes)
3. Height / weight / measurement estimation (`weight_height_prediction_plan.md`)
4. Cloudinary (or equivalent) for reliable image URLs
5. Category classifier + basic measurement extraction

### Phase 2 / Early Phase 3 — Fit Engine v1
6. Category-specific scoring functions
7. Size recommendation logic
8. Structured `compatibility_metadata` population
9. Results page detailed analytics (editorial UI)
10. Confidence propagation and “Estimated” states

### Phase 3+
11. User body profile persistence and refinement over multiple photos
12. Brand size-chart database / scraping enrichment
13. Footwear and headwear specialized models
14. Outfit-level analytics
15. Recommendation engine that uses historical fit scores
16. Feedback loop (“Did this fit?”) to improve models

---

## 9. UI / UX Constraints (Non-Negotiable)

All analytics must respect `premium-editorial-ui.md`:

- No dense tables as the primary view
- Prefer elegant score displays, short editorial copy, and progressive disclosure
- Warm neutrals, generous whitespace, refined typography
- Motion is subtle (score count-up, soft reveals)
- Mobile-first; detailed measurement tables only in expandable sections
- Accessibility: clear labels, sufficient contrast, screen-reader friendly score announcements

---

## 10. Success Metrics for the Fit Engine

| Metric | Target Direction |
|--------|------------------|
| User-reported “fit accuracy” (post-purchase or feedback) | ↑ |
| % of analyses with confidence ≥ 0.75 | ↑ |
| Size recommendation acceptance / “this helped me choose size” | ↑ |
| Reduction in “will this fit?” support or bounce on results | ↓ |
| Repeat analysis rate (users trust the system enough to keep using it) | ↑ |

---

## 11. Open Questions / Future Research

- How aggressively should we ask users for calibration measurements (height, usual size, foot size)?
- Multi-photo body model refinement (front + side)
- Handling of maternity, adaptive, or non-binary sizing
- Regional size standard differences (US / EU / Asian sizing)
- Real-time try-on quality vs pure analytical scoring trade-offs

---

## 12. Related Documents

- `docs/data_schema.md` — storage contracts
- `docs/weight_height_prediction_plan.md` — anthropometric estimation
- `docs/analysis_db_alignment_report.md` — current persistence gaps
- `docs/future_features_implementation.md` — overall roadmap
- `premium-editorial-ui.md` — visual and interaction standards
- `README.md` / `docs/project_detail.md` — product vision and AI workflow

---

*This plan is the detailed blueprint for making Suitora’s core promise — accurate, trustworthy, category-aware body-fit matching — real and measurable.*
