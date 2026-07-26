/**
 * Normalize provider-specific product payloads into the internal TrendItem shape.
 */

import { nanoid } from "@/lib/utils/id";
import { normalizeCategoryKey } from "@/config/category-display";
import type { RawProviderProduct, TrendItem } from "@/types/trend";

export interface NormalizedTrendInsert {
  id: string;
  provider: string;
  providerId: string;
  title: string;
  brand?: string | null;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  gender?: string | null;
  imageUrl: string;
  productUrl?: string | null;
  price?: number | null;
  currency?: string | null;
  season?: string | null;
  occasion?: string | null;
  styleTags: string;
  colors: string;
  popularityScore: number;
  isFeatured: boolean;
  isAvailable: boolean;
}

export function normalizeProduct(
  provider: string,
  raw: RawProviderProduct
): NormalizedTrendInsert {
  const colors = Array.isArray(raw.colors) ? raw.colors : [];
  const styleTags = Array.isArray(raw.styleTags) ? raw.styleTags : [];

  return {
    id: nanoid(),
    provider,
    providerId: raw.providerId,
    title: raw.title.trim(),
    brand: raw.brand?.trim() || null,
    description: raw.description?.trim() || null,
    category: normalizeCategoryKey(raw.category),
    subcategory: raw.subcategory?.trim() || null,
    gender: raw.gender?.toLowerCase().trim() || null,
    imageUrl: raw.imageUrl,
    productUrl: raw.productUrl || null,
    price: typeof raw.price === "number" ? raw.price : null,
    currency: raw.currency || "USD",
    season: raw.season?.toLowerCase().trim() || null,
    occasion: raw.occasion?.toLowerCase().trim() || null,
    styleTags: JSON.stringify(styleTags),
    colors: JSON.stringify(colors),
    popularityScore: clampScore(raw.popularityScore ?? 50),
    isFeatured: Boolean(raw.isFeatured),
    isAvailable: true,
  };
}

export function rowToTrendItem(row: {
  id: string;
  provider: string;
  providerId: string;
  title: string;
  brand: string | null;
  description: string | null;
  category: string;
  subcategory: string | null;
  gender: string | null;
  imageUrl: string;
  productUrl: string | null;
  price: number | null;
  currency: string | null;
  season: string | null;
  occasion: string | null;
  styleTags: string;
  colors: string;
  popularityScore: number;
  isFeatured: boolean;
  isAvailable: boolean;
  lastSynced: string | null;
  createdAt: string;
  updatedAt: string;
}): TrendItem {
  return {
    id: row.id,
    provider: row.provider,
    providerId: row.providerId,
    title: row.title,
    brand: row.brand,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    gender: row.gender,
    imageUrl: row.imageUrl,
    productUrl: row.productUrl,
    price: row.price,
    currency: row.currency,
    season: row.season,
    occasion: row.occasion,
    styleTags: parseJsonArray(row.styleTags),
    colors: parseJsonArray(row.colors),
    popularityScore: row.popularityScore,
    isFeatured: row.isFeatured,
    isAvailable: row.isAvailable,
    lastSynced: row.lastSynced,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
