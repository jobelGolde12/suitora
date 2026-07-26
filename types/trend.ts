/**
 * Online trending items & trend outfit types.
 * Normalized model used across API, DB, and UI.
 */

import type { ItemCategory } from "./body-fit";

// ─── Trending Item (online / synced) ─────────────────────────────

export interface TrendItem {
  id: string;
  title: string;
  brand?: string | null;
  category: string;
  subcategory?: string | null;
  gender?: string | null;
  imageUrl: string;
  productUrl?: string | null;
  colors: string[];
  styleTags: string[];
  price?: number | null;
  currency?: string | null;
  provider: string;
  providerId: string;
  popularityScore: number;
  season?: string | null;
  occasion?: string | null;
  description?: string | null;
  isFeatured?: boolean;
  isAvailable?: boolean;
  lastSynced?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrendItemFilters {
  limit?: number;
  category?: string;
  season?: string;
  gender?: string;
  featured?: boolean;
  occasion?: string;
  brand?: string;
  sort?: "popularity" | "newest" | "price_asc" | "price_desc";
}

// ─── Raw provider payload (before normalization) ─────────────────

export interface RawProviderProduct {
  providerId: string;
  title: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  gender?: string;
  imageUrl: string;
  productUrl?: string;
  colors?: string[];
  styleTags?: string[];
  price?: number;
  currency?: string;
  popularityScore?: number;
  season?: string;
  occasion?: string;
  description?: string;
  isFeatured?: boolean;
}

// ─── Trend Outfit (multi-item curated look) ──────────────────────

export type OutfitItemRole =
  | "top"
  | "bottom"
  | "outer"
  | "footwear"
  | "accessory"
  | "headwear"
  | "dress";

export interface TrendOutfitItem {
  analysisId?: string;
  trendItemId?: string;
  category: ItemCategory | string;
  itemName: string;
  itemImageUrl: string;
  individualScore: number;
  role: OutfitItemRole;
}

export interface TrendOutfit {
  id: string;
  name: string;
  items: TrendOutfitItem[];
  overallScore: number;
  coherenceScore: number;
  colorStoryScore: number;
  proportionScore: number;
  formalityConsistency: number;
  seasonTags: string[];
  occasionTags: string[];
  stylingTips: string[];
  generatedImageUrl?: string;
  createdAt: string;
}
