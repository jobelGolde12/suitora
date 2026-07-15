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

export type BodyShape = "rectangle" | "pear" | "apple" | "hourglass" | "triangle";
export type SkinTone = "warm" | "cool" | "neutral";
export type FaceShape = "round" | "oval" | "heart" | "square" | "diamond";
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
