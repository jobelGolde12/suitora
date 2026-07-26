/**
 * Body-Fit Matching: TypeScript contracts.
 * Single source of truth for all fit engine interfaces.
 */

// ─── Enums & Unions ──────────────────────────────────────────────

export type BodyShape =
  | "rectangle"
  | "pear"
  | "apple"
  | "hourglass"
  | "inverted-triangle"
  | "triangle";

export type SkinTone = "warm" | "cool" | "neutral" | "olive" | "deep";

export type FaceShape =
  | "round"
  | "oval"
  | "heart"
  | "square"
  | "diamond"
  | "oblong";

export type ItemCategory =
  | "tops"
  | "dresses"
  | "bottoms"
  | "outerwear"
  | "footwear"
  | "headwear"
  | "accessories"
  | "activewear"
  | "formal"
  | "full_outfit";

export type Silhouette =
  | "fitted"
  | "relaxed"
  | "oversized"
  | "a-line"
  | "straight"
  | "flared"
  | "bodycon"
  | "wrap"
  | "empire"
  | "boxy"
  | "slim"
  | "regular"
  | "wide-leg";

export type FabricStretch = "rigid" | "moderate" | "high";

export type StyleTag =
  | "casual"
  | "minimalist"
  | "streetwear"
  | "vintage"
  | "formal"
  | "korean"
  | "business-casual"
  | "bohemian"
  | "athleisure"
  | "preppy"
  | "edgy"
  | "romantic"
  | "classic"
  | "avant-garde";

// ─── Body Profile ────────────────────────────────────────────────

export interface BodyMeasurements {
  bust?: number;       // cm
  waist?: number;      // cm
  hips?: number;       // cm
  shoulderWidth?: number; // cm
  armLength?: number;  // cm
  torsoLength?: number; // relative or cm
  legLength?: number;  // relative or cm
  neckCircumference?: number; // cm
  headCircumference?: number; // cm
  footLength?: number; // cm
  footWidth?: number;  // cm
}

export interface UserBodyProfile {
  heightCm?: number;
  weightKg?: number;
  bodyShape: BodyShape;
  measurements: BodyMeasurements;
  skinTone: SkinTone;
  faceShape: FaceShape;
  stylePreference: StyleTag[];
  confidence: number; // 0-1 overall confidence
}

// ─── Item Profile ────────────────────────────────────────────────

export interface ItemMeasurements {
  bust?: number;
  waist?: number;
  hips?: number;
  shoulderWidth?: number;
  lengthCm?: number;
  inseamCm?: number;
  outseamCm?: number;
  sleeveLengthCm?: number;
  neckDropCm?: number;
  thighCm?: number;
  legOpeningCm?: number;
  footLengthCm?: number;
  footWidthCm?: number;
  heelHeightCm?: number;
  shaftHeightCm?: number;
  headCircumferenceCm?: number;
}

export interface ItemProfile {
  category: ItemCategory;
  subtype: string;           // e.g. "midi_wrap_dress", "high-top_sneaker"
  silhouette: Silhouette;
  keyMeasurements: ItemMeasurements;
  fabricStretch: FabricStretch;
  colors: string[];          // hex codes
  patternType?: string;      // "solid", "striped", "floral", etc.
  neckline?: string;         // "v-neck", "crew", "turtleneck", etc.
  sleeveType?: string;       // "sleeveless", "short", "long", etc.
  rise?: string;             // "high", "mid", "low" (bottoms)
  heelHeight?: number;       // cm (footwear)
  toeShape?: string;         // "round", "pointed", "square" (footwear)
  styleTags: StyleTag[];
  brandSizeChart?: Record<string, ItemMeasurements>;
}

// ─── Scores ──────────────────────────────────────────────────────

export interface FitScores {
  overall: number;   // 0-100
  body: number;      // 0-100
  color: number;     // 0-100
  style: number;     // 0-100
}

// ─── Size Recommendation ────────────────────────────────────────

export interface SizeRecommendation {
  suggested: string;               // e.g. "M"
  range?: string[];                // e.g. ["S", "M"]
  rationale: string;
}

// ─── Insights ────────────────────────────────────────────────────

export interface FitInsights {
  positives: string[];
  cautions: string[];
  stylingTips: string[];
}

// ─── Compatibility Metadata (stored on analysis) ────────────────

export interface CompatibilityMetadata {
  bodyProfile: UserBodyProfile;
  itemProfile: ItemProfile;
  scores: FitScores;
  sizeRecommendation: SizeRecommendation;
  insights: FitInsights;
  confidence: number;
  flags: string[];
}

// ─── Fit Analysis Result (returned by engine) ────────────────────

export interface FitAnalysisResult {
  scores: FitScores;
  bodyShape: BodyShape;
  skinTone: SkinTone;
  faceShape: FaceShape;
  styleType: StyleTag;
  height?: number;
  heightConfidence?: number;
  weight?: number;
  weightConfidence?: number;
  recommendations: string[];
  colorAnalysis: {
    primaryColors: string[];
    recommendedColors: string[];
    avoidColors: string[];
  };
  compatibilityMetadata: CompatibilityMetadata;
}

// ─── Category Scoring Weights ────────────────────────────────────

export interface CategoryWeights {
  body: number;
  color: number;
  style: number;
}

export const CATEGORY_WEIGHTS: Record<ItemCategory, CategoryWeights> = {
  tops:        { body: 0.45, color: 0.25, style: 0.30 },
  dresses:     { body: 0.40, color: 0.30, style: 0.30 },
  bottoms:     { body: 0.50, color: 0.20, style: 0.30 },
  outerwear:   { body: 0.40, color: 0.25, style: 0.35 },
  footwear:    { body: 0.50, color: 0.25, style: 0.25 },
  headwear:    { body: 0.25, color: 0.30, style: 0.45 },
  accessories: { body: 0.15, color: 0.35, style: 0.50 },
  activewear:  { body: 0.55, color: 0.20, style: 0.25 },
  formal:      { body: 0.45, color: 0.25, style: 0.30 },
  full_outfit: { body: 0.35, color: 0.30, style: 0.35 },
};

// ─── Silhouette vs Body Shape Rules ──────────────────────────────

export interface SilhouetteRule {
  bodyShape: BodyShape;
  flatteringSilhouettes: Silhouette[];
  avoidSilhouettes: Silhouette[];
  notes: string;
}

export const SILHOUETTE_RULES: SilhouetteRule[] = [
  {
    bodyShape: "hourglass",
    flatteringSilhouettes: ["fitted", "wrap", "bodycon", "a-line", "regular"],
    avoidSilhouettes: ["boxy", "oversized"],
    notes: "Your balanced proportions suit most fitted styles",
  },
  {
    bodyShape: "pear",
    flatteringSilhouettes: ["a-line", "empire", "relaxed", "flared"],
    avoidSilhouettes: ["bodycon", "slim"],
    notes: "A-line and empire cuts balance your silhouette beautifully",
  },
  {
    bodyShape: "apple",
    flatteringSilhouettes: ["empire", "a-line", "relaxed", "wrap"],
    avoidSilhouettes: ["bodycon", "fitted"],
    notes: "Empire and wrap styles create a flattering waist definition",
  },
  {
    bodyShape: "rectangle",
    flatteringSilhouettes: ["a-line", "flared", "wrap", "empire"],
    avoidSilhouettes: ["straight", "boxy"],
    notes: "Curved silhouettes add dimension to your athletic frame",
  },
  {
    bodyShape: "inverted-triangle",
    flatteringSilhouettes: ["a-line", "flared", "relaxed"],
    avoidSilhouettes: ["fitted", "bodycon"],
    notes: "Bottoms with volume balance your broader shoulders",
  },
  {
    bodyShape: "triangle",
    flatteringSilhouettes: ["a-line", "empire", "fitted"],
    avoidSilhouettes: ["flared", "oversized"],
    notes: "Structured tops and fitted styles highlight your upper body",
  },
];

// ─── Measurement Comparison ──────────────────────────────────────

export interface MeasurementDelta {
  measurement: string;
  userValue?: number;
  garmentValue?: number;
  delta?: number;         // garment - user (positive = room, negative = tight)
  unit: string;
  status: "ideal" | "slightly.tight" | "tight" | "slightly.roomy" | "roomy";
  label: string;
}
