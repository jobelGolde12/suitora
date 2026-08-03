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
  userImage: string;
  productImage: string;
  generatedImage?: string;
  tryOnStatus?: "pending" | "processing" | "completed" | "failed" | "skipped";
  tryOnCategory?: string;
  tryOnJobId?: string;
  tryOnProvider?: string;
  tryOnError?: string;
  tryOnLatencyMs?: number;
  overallScore: number;
  bodyScore?: number;
  styleScore?: number;
  colorScore?: number;
  bodyShape?: BodyShape;
  skinTone?: SkinTone;
  faceShape?: FaceShape;
  styleType?: StyleType;
  recommendations?: string[];
  colorAnalysis?: ColorAnalysis;
  createdAt: string;
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

// Dashboard types
export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  favoriteCount: number;
  recentActivity: number;
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

// Re-export body-fit types
export * from "./body-fit";

// Re-export trend types
export * from "./trend";

