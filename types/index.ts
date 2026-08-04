// User types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
}

// Analysis types
export interface Analysis {
  id: string;
  userId: string;
  productId?: string | null;
  userImage: string;
  productImage: string;
  generatedImage?: string | null;
  status?: "pending" | "analyzing" | "completed" | "failed";
  tryOnStatus?: "pending" | "processing" | "completed" | "failed" | "skipped";
  tryOnCategory?: string | null;
  tryOnJobId?: string | null;
  tryOnProvider?: string | null;
  tryOnError?: string | null;
  tryOnLatencyMs?: number | null;
  tryOnStartedAt?: string | null;
  overallScore: number;
  bodyScore?: number | null;
  styleScore?: number | null;
  colorScore?: number | null;
  bodyShape?: BodyShape | null;
  skinTone?: SkinTone | null;
  faceShape?: FaceShape | null;
  styleType?: StyleType | null;
  height?: number | null;
  heightConfidence?: number | null;
  weight?: number | null;
  weightConfidence?: number | null;
  recommendations?: string[];
  colorAnalysis?: ColorAnalysis;
  compatibilityMetadata?: unknown;
  createdAt: string;
  updatedAt?: string;
}

/** A favorited analysis as returned by GET /api/favorites. */
export interface FavoriteItem {
  id: string;
  analysisId: string;
  createdAt: string;
  analysis: AnalysisResult;
  inWardrobe: boolean;
  wardrobeTags: string[];
  wardrobeFolder?: string | null;
  addedToWardrobeAt?: string | null;
}

/**
 * The parsed, API-facing analysis shape returned by GET /api/analysis and
 * related routes. JSON columns are decoded into their runtime types.
 */
export interface AnalysisResult
  extends Omit<Analysis, "recommendations" | "colorAnalysis" | "compatibilityMetadata"> {
  recommendations: string[];
  colorAnalysis: ColorAnalysis | null;
  compatibilityMetadata: Record<string, unknown> | null;
  isFavorite?: boolean;
}

export type BodyShape =
  | "rectangle"
  | "pear"
  | "apple"
  | "hourglass"
  | "triangle"
  | "inverted-triangle";
export type SkinTone = "warm" | "cool" | "neutral" | "olive" | "deep";
export type FaceShape = "round" | "oval" | "heart" | "square" | "diamond" | "oblong";
export type StyleType =
  | "casual"
  | "minimalist"
  | "streetwear"
  | "vintage"
  | "formal"
  | "korean"
  | "business-casual";

export interface ColorAnalysis {
  primaryColors: string[];
  recommendedColors: string[];
  avoidColors: string[];
}

export interface Favorite {
  id: string;
  userId: string;
  analysisId: string;
  analysis?: Analysis;
  createdAt: string;
}

// Upload types
export interface UploadResponse {
  url: string;
  publicId: string;
}

// AI Analysis types
export type AnalysisStatus = "idle" | "uploading" | "processing" | "complete" | "error";

export interface AnalysisProgress {
  stage: "detecting" | "analyzing" | "try-on" | "scoring" | "complete";
  progress: number; // 0-100
  message: string;
}

/** Aggregated virtual try-on reliability metrics for the dashboard. */
export interface TryOnStats {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  pending: number;
  processing: number;
  /** Failed / (completed + failed) as 0–100; null when no decided outcomes. */
  failureRate: number | null;
  avgLatencyMs: number | null;
}

// Dashboard types
export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  favoriteCount: number;
  recentActivity: number;
  /** Per-user try-on reliability (from analyses.try_on_*). */
  tryOn: TryOnStats;
}

// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiresAuth?: boolean;
}

// ─── Profile Types ────────────────────────────────────────────────

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese";

export type StyleTag =
  | "casual" | "minimalist" | "streetwear" | "vintage" | "formal"
  | "korean" | "business-casual" | "bohemian" | "athleisure" | "preppy"
  | "edgy" | "romantic" | "classic" | "avant-garde";

export type FitPreference = "tight" | "regular" | "relaxed" | "oversized";

export type SizeSystem = "US" | "EU" | "UK";

export interface UserProfile {
  id: string;
  userId: string;

  // Basic info
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;

  // Manual body measurements
  height?: number;
  weight?: number;
  chestCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  shoulderWidth?: number;
  inseamLength?: number;
  armLength?: number;
  neckCircumference?: number;
  footLength?: number;
  footWidth?: number;
  shoeSize?: string;
  bustCupSize?: string;

  // AI-estimated fields
  estimatedHeight?: number;
  estimatedHeightConfidence?: number;
  estimatedWeight?: number;
  estimatedWeightConfidence?: number;
  bodyShape?: BodyShape;
  bodyShapeConfidence?: number;
  skinTone?: SkinTone;
  faceShape?: FaceShape;
  bmiCategory?: BmiCategory;

  // Self image
  selfImageUrl?: string;
  selfImageThumbnailUrl?: string;
  selfImageUploadedAt?: string;

  // Style preferences
  styleTags?: StyleTag[];
  preferredBrands?: string[];
  preferredColors?: string[];
  avoidColors?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  fitPreference?: FitPreference;
  sizePreference?: SizeSystem;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  chestCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  shoulderWidth?: number;
  inseamLength?: number;
  armLength?: number;
  neckCircumference?: number;
  footLength?: number;
  footWidth?: number;
  shoeSize?: string;
  bustCupSize?: string;
  styleTags?: StyleTag[];
  preferredBrands?: string[];
  preferredColors?: string[];
  avoidColors?: string[];
  priceRangeMin?: number;
  priceRangeMax?: number;
  fitPreference?: FitPreference;
  sizePreference?: SizeSystem;
}

export interface ProfileResponse {
  profile: UserProfile;
}

/** A trending item scored against the user's profile (GET /api/trending/similar). */
export interface SimilarItemResult {
  id: string;
  title: string;
  brand?: string | null;
  imageUrl: string;
  productUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  category: string;
  styleTags: string[];
  colors: string[];
  popularityScore: number;
  score: number;
  bodyScore: number;
  colorScore: number;
  styleScore: number;
  scoreLabel: string;
}

// Re-export body-fit types
export * from "./body-fit";

// Re-export trend types
export * from "./trend";

