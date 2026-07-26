# Suitora — Trend Outfit & Item Display System

> **Purpose:** Define how Suitora visually presents trend outfits, dresses, shoes, headwear, accessories, and all supported fashion categories across the application — from upload and analysis through results, history, and recommendations.
>
> **Audience:** Developers, designers, and AI agents implementing or extending the display layer.
>
> **Related docs:** `docs/body_fit_match/main.md`, `docs/body_fit_match/body_fit_file_component_map.md`, `docs/data_schema.md`, `premium-editorial-ui.md`, `docs/dashboard_feature_flow.md`

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Category System Overview](#2-category-system-overview)
3. [Display Components by Category](#3-display-components-by-category)
4. [Image Handling & Optimization](#4-image-handling--optimization)
5. [Category-Aware Results Display](#5-category-aware-results-display)
6. [Trend Outfits: Multi-Item Display](#6-trend-outfits-multi-item-display)
7. [History & Favorites Display](#7-history--favorites-display)
8. [Upload Flow by Category](#8-upload-flow-by-category)
9. [Empty & Loading States](#9-empty--loading-states)
10. [Accessibility & Responsive Behavior](#10-accessibility--responsive-behavior)
11. [Implementation Guide](#11-implementation-guide)
12. [Related Files & Components](#12-related-files--components)

---

## 1. Design Philosophy

### 1.1 Visual Principles

Every item display in Suitora follows the premium editorial aesthetic defined in `premium-editorial-ui.md`:

- **Calm hierarchy:** The item is the hero. Scores, metadata, and actions recede into supporting roles.
- **Editorial framing:** Item images are presented like editorial lookbook photos — generous padding, soft rounded corners, subtle shadows.
- **Progressive disclosure:** Surface the primary item image and key score; reveal detailed analytics on interaction.
- **Consistent sizing:** All item thumbnails share a consistent aspect ratio (4:5 portrait) so the grid/list feels harmonious regardless of category.
- **Contextual categories:** The display adapts to the item category — shoes are shown with a different layout emphasis than dresses.

### 1.2 Category-Aware Display Rules

Each category has tailored display rules:

| Category | Primary Visual Focus | Key Display Dimensions | Special Treatment |
|----------|---------------------|----------------------|-------------------|
| **Dresses** | Full silhouette, length visibility | Full-body vertical crop | Length indicator overlay |
| **Tops** | Shoulder & neckline detail | Upper-body crop | Neckline badge overlay |
| **Bottoms** | Waist & length clarity | Lower-body crop | Rise & inseam callout |
| **Outerwear** | Layered proportion, full silhouette | Full-body with space around | Layering suggestion chip |
| **Footwear** | Side profile + top-down angle | Square crop, shoe-focused | Heel height & type badge |
| **Headwear** | Crown height & brim detail | Head-region crop | Face-shape compatibility note |
| **Accessories** | Scale relative to body | Contextual crop | Body-frame proportion note |
| **Activewear** | Compression & fit zones | Full-body athletic pose | Stretch & coverage callout |
| **Full Outfits** | Complete head-to-toe look | Full-body, multi-item | Individual item breakdown |

---

## 2. Category System Overview

### 2.1 Category Taxonomy

The system uses a two-level category classification:

```
Level 1 (Primary Category)              Level 2 (Subtype / Silhouette)
─────────────────────────────           ───────────────────────────────
Tops                                     T-shirt, Blouse, Shirt, Sweater,
                                         Hoodie, Tank Top, Crop Top,
                                         Bodysuit, Polo, Henley, Kimono

Dresses                                  Midi, Maxi, Mini, Bodycon, A-line,
                                         Wrap, Shift, Slip, Shirt Dress,
                                         Sundress, Jumpsuit, Romper

Bottoms                                  Jeans, Trousers, Shorts, Skirt,
                                         Leggings, Joggers, Cargo Pants,
                                         Wide-leg, Bootcut, Mini Skirt,
                                         Midi Skirt, Maxi Skirt

Outerwear                                Jacket, Coat, Blazer, Cardigan,
                                         Bomber, Trench, Denim Jacket,
                                         Leather Jacket, Puffer, Vest

Footwear                                 Sneakers, Heels, Boots, Sandals,
                                         Loafers, Flats, Wedges, Platforms,
                                         Oxfords, Mules, Slides, Ankle Boots

Headwear                                 Cap, Hat, Beanie, Beret, Bucket Hat,
                                         Visor, Headband, Baseball Cap

Accessories                              Belt, Scarf, Bag, Jewelry, Watch,
                                         Sunglasses, Wallet, Backpack,
                                         Hair Accessory

Activewear & Swim                        Sports Bra, Leggings, Swim Top,
                                         Swim Bottom, One-Piece, Rash Guard,
                                         Bike Shorts, Yoga Pants

Formal / Occasion                        Suit, Tuxedo, Gown, Cocktail Dress,
                                         Blazer + Trousers set, Vest + Skirt set

Full Outfits (Trend)                     Complete look with 2+ items styled together
```

### 2.2 Category Detection & Classification

When an item is uploaded, the system auto-classifies it into the taxonomy:

1. **Vision-based classification:** The AI model analyzes the item image and returns the most likely category + subtype
2. **Confidence scoring:** Each classification includes a confidence score (0–1)
3. **User override:** The user can manually correct the category during upload if the auto-detection is wrong
4. **Fallback:** If confidence < 0.6, show a category picker to the user before analysis begins

### 2.3 TypeScript Types

```typescript
// From: types/body-fit.ts

export type ItemCategory =
  | "top"
  | "dress"
  | "bottom"
  | "outerwear"
  | "footwear"
  | "headwear"
  | "accessory"
  | "activewear"
  | "formal"
  | "full_outfit";

export type ItemSubtype = string; // Free-text, e.g. "midi_wrap_dress", "high_top_sneaker"

export interface ItemProfile {
  category: ItemCategory;
  subtype: ItemSubtype;
  silhouette: "fitted" | "relaxed" | "oversized" | "a_line" | "flared" | "straight" | "wrap";
  keyMeasurements: Record<string, number>;
  stretch: "none" | "moderate" | "high";
  colors: string[];
  patterns?: string[];
  styleTags: string[];
  neckline?: "v_neck" | "crew" | "turtleneck" | "off_shoulder" | "square" | "sweetheart";
  sleeveType?: "sleeveless" | "short" | "long" | "three_quarter" | "bell" | "raglan";
  riseType?: "high" | "mid" | "low";
  heelHeight?: number; // cm, for footwear
  toeShape?: "round" | "pointed" | "square" | "open";
  brimStyle?: "wide" | "narrow" | "flat" | "curved"; // for headwear
}
```

---

## 3. Display Components by Category

### 3.1 Shared Display Patterns

All item displays share these base components:

```tsx
// Primary item image — used across all categories
<Image
  src={itemImageUrl}
  alt={itemDescription}
  width={displayWidth}
  height={displayHeight}
  className="object-cover rounded-xl"
  priority={isPrimary}
  unoptimized
/>
```

```tsx
// Category badge — overlaid on item image
<Badge variant="category">
  {categoryLabel}
</Badge>
```

```tsx
// Score display — consistent across all categories
<ScoreCircle value={overallScore} size="md" />
```

### 3.2 Dress Display

Dresses require the most nuanced display because fit depends on silhouette, length, and body shape interaction.

**Results Page Layout:**
```
┌─────────────────────────────────────┐
│  ┌─────────────────┐  ┌──────────┐ │
│  │                 │  │ Score    │ │
│  │  Full Dress     │  │ Overview │ │
│  │  Image (4:5)    │  │          │ │
│  │                 │  │ Body Fit │ │
│  │                 │  │ Color    │ │
│  │                 │  │ Style    │ │
│  │                 │  │          │ │
│  │  [Length: Midi] │  │ Size Rec │ │
│  │  [Silhouette]   │  └──────────┘ │
│  └─────────────────┘               │
│                                     │
│  "This midi wrap dress follows your │
│   waist cleanly and sits at...      │
│                                     │
│  ┌─ Fit Breakdown ─────────────────┐│
│  │  Bust:  88cm → 90cm  ✓         ││
│  │  Waist: 70cm → 72cm  ✓         ││
│  │  Hips:  96cm → 98cm  ✓         ││
│  │  Length: 110cm (ideal for       ││
│  │          your height)           ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Visual Treatments:**
- Full-body 4:5 portrait crop to show the complete dress length
- Length indicator (mini / knee / midi / maxi) overlaid as a subtle badge
- Silhouette visualization — small icon showing A-line, bodycon, wrap shape
- Color swatches extracted from the dress displayed underneath the image
- Neckline detail callout (V-neck, sweetheart, etc.)

**Key Component:** `components/results/DressFitDisplay.tsx` (or extended via `DetailedFitAnalytics.tsx` with `category="dress"`)

### 3.3 Top Display

**Visual Treatments:**
- Upper-body crop (focus on shoulders, chest, neckline)
- Neckline badge: "V-Neck", "Crew", "Turtleneck"
- Sleeve type badge: "Short Sleeve", "Long Sleeve", "Sleeveless"
- Shoulder width comparison visual (user vs garment)
- Color swatch strip

**Layout (Results Page):**
```
┌────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────┐  │
│  │              │  │ Score     │  │
│  │  Top Image   │  │ Overview  │  │
│  │  (upper body │  │           │  │
│  │   crop)      │  │ Fit: 85   │  │
│  │              │  │ Color: 78 │  │
│  │  [Crew Neck] │  │ Style: 82 │  │
│  │  [Short Slv] │  └───────────┘  │
│  └──────────────┘                 │
│                                    │
│  Fit Notes: Shoulder width matches │
│  closely. Moderate ease across     │
│  chest.                            │
└────────────────────────────────────┘
```

### 3.4 Bottom Display (Shorts, Trousers, Skirts, Jeans)

**Visual Treatments:**
- Lower-body crop (waist to hem)
- Rise indicator: "High Rise", "Mid Rise", "Low Rise"
- Length callout: inseam for trousers, shorts length
- Leg opening width visualization
- Waist-to-hip ratio comparison

**Layout:**
```
┌────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────┐  │
│  │              │  │ Score     │  │
│  │  Bottom      │  │ Overview  │  │
│  │  Image       │  │           │  │
│  │  (waist-down)│  │ Fit: 88   │  │
│  │              │  │ Color: 72 │  │
│  │  [High Rise] │  │ Style: 80 │  │
│  │  [Inseam 7"] │  └───────────┘  │
│  └──────────────┘                 │
│                                    │
│  Rise matches your torso length.   │
│  Waist fits comfortably with your  │
│  natural waistline.                │
└────────────────────────────────────┘
```

### 3.5 Footwear Display (Shoes, Sneakers, Boots, Sandals)

**Visual Treatments:**
- Square or slightly portrait crop focused on the shoe(s)
- Heel height badge: "Flat", "Low Heel (3cm)", "High Heel (8cm)"
- Shoe type badge: "Sneaker", "Boot", "Pump", "Sandal"
- Toe shape icon
- For boots: shaft height callout, calf circumference note
- Side-profile view is preferred when available

**Layout:**
```
┌────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────┐  │
│  │              │  │ Score     │  │
│  │  Shoe Image  │  │ Overview  │  │
│  │  (square     │  │           │  │
│  │   crop)      │  │ Fit: 82   │  │
│  │              │  │ Color: 90 │  │
│  │  [Heels 6cm] │  │ Style: 85 │  │
│  │  [Pointed]   │  └───────────┘  │
│  └──────────────┘                 │
│                                    │
│  Heel height complements your leg  │
│  length. Toe shape works with your │
│  foot shape.                       │
└────────────────────────────────────┘
```

### 3.6 Headwear Display (Caps, Hats, Beanies)

**Visual Treatments:**
- Head-region crop (focus on crown height and brim)
- Circumference badge: "S/M", "L/XL", "Adjustable"
- Brim style badge: "Wide Brim", "Curved Brim", "Flat Brim"
- Face shape compatibility note
- Crown height visualization

**Layout:**
```
┌────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────┐  │
│  │              │  │ Score     │  │
│  │  Hat Image   │  │ Overview  │  │
│  │  (head crop) │  │           │  │
│  │              │  │ Fit: 76   │  │
│  │  [Adjustable]│  │ Color: 85 │  │
│  │  [Curved]    │  │ Style: 88 │  │
│  │              │  └───────────┘  │
│  └──────────────┘                 │
│                                    │
│  This cap style complements your   │
│  oval face shape. The adjustable   │
│  band accommodates most head       │
│  circumferences.                   │
└────────────────────────────────────┘
```

### 3.7 Accessory Display

**Visual Treatments:**
- Contextual crop based on accessory type (close for jewelry, wider for bags)
- Scale indicator relative to body frame
- Style tags prominently displayed
- Color harmony emphasized over fit

**Layout:**
```
┌────────────────────────────────────┐
│  ┌──────────────┐  ┌───────────┐  │
│  │              │  │ Style     │  │
│  │  Bag Image   │  │ Score     │  │
│  │  (contextual │  │           │  │
│  │   crop)      │  │ Fit: 72   │  │
│  │              │  │ Color: 92 │  │
│  │  [Crossbody] │  │ Style: 88 │  │
│  │  [Leather]   │  └───────────┘  │
│  └──────────────┘                 │
│                                    │
│  Bag scale suits your frame.       │
│  Color complements your warm skin  │
│  tone.                             │
└────────────────────────────────────┘
```

### 3.8 Activewear & Swim Display

**Visual Treatments:**
- Full-body athletic pose crop
- Coverage zone indicators (high-neck, full-coverage, etc.)
- Stretch & compression callout
- Fabric breathability note
- Activity suitability tags

### 3.9 Formal / Occasion Display

**Visual Treatments:**
- Full-body portrait with emphasis on tailoring precision
- Precise measurement callouts
- Formality level indicator ("Business", "Cocktail", "Black Tie")
- Occasion tags: "Wedding", "Interview", "Gala", "Date Night"

---

## 4. Image Handling & Optimization

### 4.1 Image Sources

Items can be displayed from three sources, in priority order:

1. **User-uploaded image:** Direct file upload via the upload page
2. **Product URL extracted image:** Auto-extracted from a pasted URL (Phase 2)
3. **AI-generated try-on image:** Composite image from the virtual try-on pipeline

### 4.2 Image Storage & Delivery

| Aspect | Implementation |
|--------|---------------|
| **Storage** | Cloudinary (primary) with public/ fallback for static assets |
| **Optimization** | Manual optimization before upload (resize to max 1200px, convert to WebP) |
| **Next.js Image** | `unoptimized` prop used (bypasses sharp optimization pipeline due to compatibility) |
| **Responsive sizes** | `sizes` prop for fill-mode images: `"(max-width: 768px) 100vw, 50vw"` |
| **Placeholder** | Low-quality blur placeholder or soft gradient background while loading |
| **Fallback** | Category-specific placeholder icon when no image is available |

### 4.3 Image Display Dimensions by Context

| Display Context | Aspect Ratio | Max Width | Notes |
|----------------|-------------|-----------|-------|
| Results page hero | 4:5 (portrait) | 560px | Primary item display |
| History list item | 1:1 (square) | 80px | Thumbnail |
| History grid item | 4:5 | 200px | Grid view on desktop |
| Dashboard recent | 1:1 | 48px | Mini thumbnail |
| Upload preview | 4:5 | 400px | During upload flow |
| Comparison view | 4:5 | 300px each | Side-by-side items |
| Favorites grid | 4:5 | 200px | Saved items view |

### 4.4 Category-Specific Crop Guidance

| Category | Crop Region | Aspect Ratio | Focus |
|----------|------------|-------------|-------|
| Dresses | Full body | 4:5 | Head to hem |
| Tops | Upper body | 4:5 | Neck to waist |
| Bottoms | Lower body | 4:5 | Waist to ankle |
| Footwear | Foot level | 1:1 | The shoe(s) |
| Headwear | Head level | 1:1 | Crown + brim |
| Accessories | Contextual | Varies | The item |
| Activewear | Full body | 4:5 | Athletic silhouette |
| Formal | Full body | 4:5 | Tailoring detail |
| Full Outfit | Full body | 4:5 | Complete look |

---

## 5. Category-Aware Results Display

### 5.1 Unified Results Page

The results page (`app/(dashboard)/results/[id]/page.tsx`) renders different sub-components based on the item category:

```tsx
// Pseudo-code for category-aware rendering
function ResultsPage({ analysis }) {
  const { category } = analysis.itemProfile;

  return (
    <PageContainer>
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Hero image — category-aware styling */}
        <CategoryHeroImage
          category={category}
          imageUrl={analysis.uploadImageUrl}
        />

        {/* Scores — shared component */}
        <ScoreOverview scores={analysis.scores} />
      </div>

      {/* Editorial summary — shared */}
      <FitSummary insights={analysis.insights} />

      {/* Detailed breakdown — category-specific */}
      <CategoryFitBreakdown
        category={category}
        bodyProfile={analysis.bodyProfile}
        itemProfile={analysis.itemProfile}
        scores={analysis.scores}
      />
    </PageContainer>
  );
}
```

### 5.2 Category-Specific Breakdown Components

Each category can have its own detailed breakdown component, or a unified component can render different sections based on the category:

| Component | Purpose | Categories |
|-----------|---------|------------|
| `DressFitBreakdown` | Length, silhouette, neckline, waist definition analysis | dress |
| `TopFitBreakdown` | Shoulder, sleeve, neckline, chest ease analysis | top |
| `BottomFitBreakdown` | Rise, waist, hip, inseam, leg opening analysis | bottom, shorts |
| `OuterwearFitBreakdown` | Layering allowance, shoulder fit, length analysis | outerwear |
| `FootwearFitBreakdown` | Heel height, toe shape, shaft height, size analysis | footwear |
| `HeadwearFitBreakdown` | Circumference, brim style, face shape analysis | headwear |
| `AccessoryFitBreakdown` | Scale, proportion, style coherence analysis | accessory |
| `ActivewearFitBreakdown` | Compression, coverage, stretch analysis | activewear |
| `FormalFitBreakdown` | Tailoring precision, formality match analysis | formal |
| `OutfitFitBreakdown` | Inter-item proportion, color story, coherence | full_outfit |

### 5.3 Unified Alternative: MeasurementComparison

Instead of separate components per category, `MeasurementComparison` can be extended to render different measurement rows based on category:

```typescript
function getCategoryMeasurements(category: ItemCategory): MeasurementRow[] {
  switch (category) {
    case "dress":
      return [
        { label: "Bust", userValue: 88, itemValue: 90, unit: "cm" },
        { label: "Waist", userValue: 70, itemValue: 72, unit: "cm" },
        { label: "Hips", userValue: 96, itemValue: 98, unit: "cm" },
        { label: "Length", userValue: null, itemValue: 110, unit: "cm" },
      ];
    case "footwear":
      return [
        { label: "Length", userValue: 25.5, itemValue: 26, unit: "cm" },
        { label: "Width", userValue: "D", itemValue: "D", unit: "standard" },
        { label: "Heel Height", userValue: null, itemValue: 6, unit: "cm" },
      ];
    case "headwear":
      return [
        { label: "Circumference", userValue: 56, itemValue: 58, unit: "cm" },
        { label: "Face Shape", userValue: "Oval", itemValue: null, unit: "" },
      ];
    // ... other categories
  }
}
```

---

## 6. Trend Outfits: Multi-Item Display

### 6.1 What is a Trend Outfit?

A **trend outfit** is a curated or AI-generated combination of 2+ items styled together. Trend outfits represent the highest level of fashion analysis in Suitora — they evaluate not just individual items, but how items work together as a complete look.

### 6.2 Trend Outfit Data Model

```typescript
export interface TrendOutfit {
  id: string;
  name: string; // e.g. "Summer Casual", "Office Chic"
  items: TrendOutfitItem[];
  overallScore: number;
  coherenceScore: number; // How well items work together
  colorStoryScore: number;
  proportionScore: number; // Visual balance across items
  formalityConsistency: number; // All items match in formality
  seasonTags: string[];
  occasionTags: string[];
  stylingTips: string[];
  generatedImageUrl?: string; // AI-generated composite try-on
  createdAt: string;
}

export interface TrendOutfitItem {
  analysisId: string;
  category: ItemCategory;
  itemName: string;
  itemImageUrl: string;
  individualScore: number;
  role: "top" | "bottom" | "outer" | "footwear" | "accessory" | "headwear" | "dress";
}
```

### 6.3 Trend Outfit Display Layout

```
┌──────────────────────────────────────────────────────┐
│  Summer Casual · Trend Score: 88                      │
│  ┌────────────────────────────────────────────────┐   │
│  │                                                │   │
│  │   AI-generated composite outfit image          │   │
│  │   (full body, head-to-toe)                     │   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──┐ │
│  │ Linen Shirt │ │ Wide Pants │ │ Sandals    │ │Bag│ │
│  │   Score 85  │ │  Score 82  │ │  Score 78  │ │82 │ │
│  │  [Top: Base]│ │ [Bottom]   │ │ [Footwear] │ │   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └──┘ │
│                                                        │
│  Coherence: 86  ·  Color Story: 90  ·  Proportion: 82  │
│                                                        │
│  "A relaxed summer look with balanced proportions.     │
│   The wide-leg pants pair beautifully with the fitted   │
│   linen shirt. Sandals keep the silhouette light."      │
│                                                        │
│  Styling Tips:                                          │
│  • Add a straw hat for sun protection                   │
│  • Tuck the shirt slightly for waist definition         │
│  • A crossbody bag completes the casual vibe            │
└──────────────────────────────────────────────────────────┘
```

### 6.4 Trend Outfit Display Components

| Component | Purpose |
|-----------|---------|
| `TrendOutfitCard` | Summary card for outfit grid display |
| `TrendOutfitHero` | Full outfit display with composite image |
| `OutfitItemStrip` | Horizontal strip of individual items in the outfit |
| `OutfitCoherenceScore` | Visual dimension scores (coherence, color, proportion) |
| `OutfitStylingTips` | Actionable styling advice for the complete look |

### 6.5 How Trend Outfits Are Created

1. **AI curation:** The system analyzes all items the user has uploaded and clusters compatible pieces into outfit suggestions
2. **Manual assembly:** User picks items from their wardrobe/history and requests an outfit analysis
3. **Trend discovery:** System identifies trending combinations based on seasonal patterns and user preferences
4. **Recommendation engine:** Generates "complete the look" suggestions from a single uploaded item

### 6.6 Displaying Outfits from History & Favorites

```tsx
// Grid display of saved outfits
function OutfitGrid({ outfits }: { outfits: TrendOutfit[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {outfits.map((outfit) => (
        <TrendOutfitCard key={outfit.id} outfit={outfit} />
      ))}
    </div>
  );
}

// Single outfit card
function TrendOutfitCard({ outfit }: { outfit: TrendOutfit }) {
  return (
    <div className="group rounded-2xl border border-border overflow-hidden bg-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={outfit.generatedImageUrl || outfit.items[0].itemImageUrl}
          alt={outfit.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute top-3 right-3">
          <ScoreCircle value={outfit.overallScore} size="sm" />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-heading text-base font-medium">{outfit.name}</h3>
        <div className="flex flex-wrap gap-1.5">
          {outfit.items.map((item) => (
            <Badge key={item.analysisId} variant="subtle" size="sm">
              {item.role}
            </Badge>
          ))}
        </div>
        <div className="flex gap-3 text-xs text-muted">
          <span>{outfit.items.length} items</span>
          <span>·</span>
          <span>Coherence {outfit.coherenceScore}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. History & Favorites Display

### 7.1 History List Item

Every history entry shows the item with category-specific context:

```tsx
function HistoryListItem({ analysis }: { analysis: Analysis }) {
  const categoryConfig = getCategoryDisplayConfig(analysis.itemProfile.category);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      {/* Thumbnail */}
      <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ${categoryConfig.cropClass}`}>
        <Image
          src={analysis.uploadImageUrl}
          alt={analysis.itemProfile.subtype}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Category icon overlay */}
        <div className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center">
          <categoryConfig.icon className="h-3 w-3" />
        </div>
      </div>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {formatItemName(analysis.itemProfile)}
        </p>
        <p className="text-xs text-muted">
          {formatCategory(analysis.itemProfile.category)}
          {analysis.itemProfile.subtype && ` · ${analysis.itemProfile.subtype}`}
        </p>
        <p className="text-xs text-muted">
          {formatDate(analysis.createdAt)}
        </p>
      </div>

      {/* Score */}
      <ScoreCircle value={analysis.overallScore} size="sm" />

      {/* Actions */}
      <Button variant="ghost" size="sm">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### 7.2 Category Display Config

```typescript
const categoryDisplayConfig: Record<ItemCategory, CategoryDisplayConfig> = {
  dress:     { icon: DressIcon,     cropClass: "aspect-[4/5]", label: "Dress" },
  top:       { icon: TopIcon,       cropClass: "aspect-[4/5]", label: "Top" },
  bottom:    { icon: BottomIcon,    cropClass: "aspect-[4/5]", label: "Bottom" },
  footwear:  { icon: ShoeIcon,      cropClass: "aspect-square", label: "Shoes" },
  headwear:  { icon: HatIcon,       cropClass: "aspect-square", label: "Headwear" },
  accessory: { icon: AccessoryIcon, cropClass: "aspect-square", label: "Accessory" },
  outerwear: { icon: JacketIcon,    cropClass: "aspect-[4/5]", label: "Outerwear" },
  activewear:{ icon: ActiveIcon,    cropClass: "aspect-[4/5]", label: "Activewear" },
  formal:    { icon: FormalIcon,    cropClass: "aspect-[4/5]", label: "Formal" },
  full_outfit:{ icon: OutfitIcon,   cropClass: "aspect-[4/5]", label: "Outfit" },
};
```

### 7.3 Favorites Grid

The favorites page displays saved items in a grid, with filters by category:

```tsx
function FavoritesPage() {
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");

  return (
    <PageContainer>
      <PageHeader
        label="Saved"
        title="Your Favorites"
        description="Items that scored well and you want to remember."
      />

      {/* Category filter tabs */}
      <CategoryFilterBar
        categories={Object.values(categoryDisplayConfig)}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Items grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFavorites.map((fav) => (
          <FavoriteCard key={fav.id} favorite={fav} />
        ))}
      </div>
    </PageContainer>
  );
}
```

### 7.4 Category Filter Bar

```
┌────────────────────────────────────────────────────┐
│ [All] [Dresses] [Tops] [Bottoms] [Shoes] [More▼] │
└────────────────────────────────────────────────────┘
```

When the user selects a category, the grid filters to show only items of that category. The "More" dropdown reveals less common categories: Headwear, Accessories, Outerwear, Activewear, Formal, Full Outfits.

---

## 8. Upload Flow by Category

### 8.1 Category Auto-Detection During Upload

When a user uploads or pastes an item image, the system:

1. Displays the image with a loading skeleton
2. Runs category detection (via vision model)
3. Shows the detected category as a badge under the image
4. Provides a dropdown for the user to correct the category if needed
5. Adjusts the upload preview crop to match the detected category

### 8.2 Upload Preview Adaptation

```tsx
function UploadPreview({ imageUrl, detectedCategory }: {
  imageUrl: string;
  detectedCategory: ItemCategory | null;
}) {
  const cropClass = detectedCategory
    ? getCategoryCropClass(detectedCategory)
    : "aspect-[4/5]"; // default

  return (
    <div className={`relative overflow-hidden rounded-2xl ${cropClass}`}>
      <Image
        src={imageUrl}
        alt="Upload preview"
        fill
        className="object-cover"
        unoptimized
      />

      {detectedCategory && (
        <div className="absolute bottom-3 left-3">
          <Badge variant="category">
            {categoryDisplayConfig[detectedCategory].icon}
            <span className="ml-1">{categoryDisplayConfig[detectedCategory].label}</span>
          </Badge>
        </div>
      )}
    </div>
  );
}
```

### 8.3 Category-Specific Upload Guidance

Different categories benefit from different upload guidance:

| Category | Photo Guidance |
|----------|---------------|
| **Dresses** | Full-length mirror shot, front-facing, good lighting |
| **Tops** | Chest-up or full upper body, arms visible |
| **Bottoms** | Waist-down, standing straight |
| **Footwear** | Side profile + top-down view (2 photos ideal) |
| **Headwear** | Front + side profile of hat on flat surface |
| **Accessories** | On-body or flat lay with size reference |
| **Outerwear** | Full-body, worn open to show layering |

---

## 9. Empty & Loading States

### 9.1 Category-Specific Empty States

When no items exist in a category yet, show a contextual empty state:

| Category | Empty State Message | Suggested Action |
|----------|-------------------|------------------|
| All items | "No analyses yet. Upload your first clothing item!" | "Upload an Item" |
| Dresses | "No dress analyses yet. Try uploading a dress!" | "Upload a Dress" |
| Shoes | "No shoe analyses yet. Let's see how those sneakers fit!" | "Upload Shoes" |
| Outfits | "No outfits created yet. Combine your items into a look!" | "Create Outfit" |

### 9.2 Loading States

- **History list:** 5 skeleton rows with category-shaped placeholders
- **Favorites grid:** 6 skeleton cards with aspect ratio matching the category
- **Results page:** Full skeleton with image placeholder + score circles
- **Upload:** Pulse animation on the image area with crop hint for the detected category

---

## 10. Accessibility & Responsive Behavior

### 10.1 Responsive Display Rules

| Breakpoint | History View | Favorites View | Results View |
|------------|-------------|----------------|--------------|
| < 640px | Single column list | 2-column grid | Stacked (image top, scores below) |
| 640–1024px | Single column list | 3-column grid | Side-by-side (image left, scores right) |
| > 1024px | Single column list | 4-column grid | Side-by-side with wider analytics |

### 10.2 Accessibility

- All item images must have descriptive `alt` text including category and subtype
- Category badges must include `aria-label` for screen readers
- Score circles must announce value and label (e.g., "Body fit score: 85 out of 100")
- Touch targets on mobile: minimum 44×44px for favorite/share buttons
- Color-coded category indicators must include a non-color identifier (icon or label)
- Focus states visible on all interactive elements

---

## 11. Implementation Guide

### 11.1 Step-by-Step Implementation Order

1. **Category types & config** (`types/body-fit.ts`)
   - Define `ItemCategory` type, `CategoryDisplayConfig` interface, and the display config map

2. **Shared display primitives** (`components/ui/`)
   - `CategoryBadge` — reusable badge showing category icon + label
   - `CategoryIcon` — icon component that renders the right icon per category

3. **Upload flow extension** (`components/upload/`)
   - Add category auto-detection display to upload preview
   - Add manual category correction dropdown

4. **Results page extension** (`components/results/`)
   - Create or extend `ScoreOverview` to render category context
   - Add category-aware sections to `DetailedFitAnalytics`
   - Implement measurement rows dynamically based on category

5. **History & favorites** (`app/(dashboard)/history/`, `app/(dashboard)/favorites/`)
   - Add category filter to favorites grid
   - Show category badge on history list items

6. **Trend outfit display** (`components/results/` or new `components/outfits/`)
   - `TrendOutfitCard` for grid display
   - Category icons in the item strip

7. **Phase 2: Multi-item upload & comparison**
   - Upload multiple items and classify each
   - Side-by-side results display

### 11.2 Category Display Config Implementation

```typescript
// config/category-display.ts — single source of truth for category display

import {
  Shirt, // tops
  DressIcon, // dresses
  ShoppingBag, // bottoms
  Footprints, // footwear
  Hat, // headwear
  Watch, // accessories
  Jacket, // outerwear
  Dumbbell, // activewear
  Briefcase, // formal
  Sparkles, // full outfit
} from "lucide-react";

export interface CategoryDisplayConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pluralLabel: string;
  cropClass: string;
  primaryMeasurementLabels: string[];
  emptyStateMessage: string;
  emptyStateAction: string;
}

export const categoryConfig: Record<string, CategoryDisplayConfig> = {
  dress: {
    icon: DressIcon,
    label: "Dress",
    pluralLabel: "Dresses",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Bust", "Waist", "Hips", "Length"],
    emptyStateMessage: "No dress analyses yet. Upload a dress to see how it fits!",
    emptyStateAction: "Upload a Dress",
  },
  footwear: {
    icon: Footprints,
    label: "Shoe",
    pluralLabel: "Shoes",
    cropClass: "aspect-square",
    primaryMeasurementLabels: ["Length", "Width", "Heel Height"],
    emptyStateMessage: "No shoe analyses yet. Let's find your perfect fit!",
    emptyStateAction: "Upload Shoes",
  },
  // ... other categories
};
```

### 11.3 File Creation Checklist

**New files to create:**

```
components/ui/CategoryBadge.tsx        # Reusable category badge component
config/category-display.ts             # Single source of truth for display config
components/results/CategoryHeroImage.tsx  # Category-aware hero image display
components/outfits/TrendOutfitCard.tsx  # Outfit card for grid display
components/outfits/OutfitItemStrip.tsx  # Horizontal item strip within an outfit
```

**Files to extend:**

```
types/body-fit.ts                      # Add ItemCategory, TrendOutfit types
components/results/DetailedFitAnalytics.tsx  # Category-aware breakdown sections
components/results/MeasurementComparison.tsx # Dynamic measurement rows
components/dashboard/AnalysisListItem.tsx    # Category badge on history items
app/(dashboard)/results/[id]/page.tsx        # Category-aware rendering
app/(dashboard)/upload/page.tsx              # Category detection display
app/(dashboard)/favorites/page.tsx           # Category filter bar
```

---

## 12. Related Files & Components

### 12.1 Core Display Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ScoreOverview` | `components/results/ScoreOverview.tsx` | Primary score display (shared) |
| `FitSummary` | `components/results/FitSummary.tsx` | Editorial summary paragraph |
| `DetailedFitAnalytics` | `components/results/DetailedFitAnalytics.tsx` | Expandable deep analytics |
| `MeasurementComparison` | `components/results/MeasurementComparison.tsx` | User vs item measurements |
| `SizeRecommendationCard` | `components/results/SizeRecommendationCard.tsx` | Size advice |
| `InsightsList` | `components/results/InsightsList.tsx` | Positives, cautions, tips |
| `ScoreCircle` | `components/ui/ScoreCircle.tsx` | Circular score display |
| `Badge` | `components/ui/Badge.tsx` | Category and status badges |
| `CategoryBadge` | `components/ui/CategoryBadge.tsx` *(new)* | Category-specific badge |
| `CategoryHeroImage` | `components/results/CategoryHeroImage.tsx` *(new)* | Category-aware hero |

### 12.2 Data & Type Files

| File | Path | Purpose |
|------|------|---------|
| Body-fit types | `types/body-fit.ts` | TypeScript interfaces |
| Category config | `config/category-display.ts` *(new)* | Display configuration |
| Schema | `drizzle/schema.ts` | Database schema |
| Queries | `lib/db/queries.ts` | Data access |

### 12.3 Page Files

| Page | Path | Item Display Responsibility |
|------|------|----------------------------|
| Results | `app/(dashboard)/results/[id]/page.tsx` | Primary item + scores display |
| History | `app/(dashboard)/history/page.tsx` | Item list with thumbnails |
| Favorites | `app/(dashboard)/favorites/page.tsx` | Item grid with category filter |
| Upload | `app/(dashboard)/upload/page.tsx` | Upload preview with category |
| Dashboard | `app/(dashboard)/dashboard/page.tsx` | Recent items mini-thumbnails |

---

## Appendix: Display Rules Summary

```
EVERY item display MUST include:
  □ Item image (with category-appropriate crop)
  □ Category badge or indicator
  □ Overall score (except thumbnails < 48px)

EVERY results page MUST include:
  □ Hero item image
  □ Overall score + 3 sub-scores
  □ Size recommendation
  □ Editorial summary paragraph
  □ At least 3 fit insights

CATEGORY-AWARE displays MUST adapt:
  □ Measurement comparison rows
  □ Which fit dimensions are emphasized
  □ Crop region and aspect ratio
  □ Empty state messages
  □ Upload guidance text

MOBILE displays MUST:
  □ Stack image above scores
  □ Use full-width touch targets
  □ Maintain 4:5 image aspect ratio where applicable
  □ Keep category badges readable at small sizes
```

---

*This document defines how Suitora visually presents every clothing category — from a single dress to a complete trend outfit. As new categories are added or display patterns evolve, update this file to keep it aligned with the codebase and the premium editorial UI standards.*

*Companion docs: `docs/body_fit_match/main.md`, `docs/body_fit_match/body_fit_file_component_map.md`, `premium-editorial-ui.md`, `docs/data_schema.md`*
