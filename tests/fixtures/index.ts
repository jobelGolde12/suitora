/**
 * Typed fixtures (Pillar 05, Action Item 5).
 *
 * Factories mirror the Drizzle schema shapes (`drizzle/schema.ts`) and the
 * API-facing types (`types/`). Fixtures are deterministic: call the factory
 * with overrides for the specific test. Keep everything JSON-safe and seeded
 * with fixed values so tests are repeatable.
 */

import type { Analysis, User } from "@/types";
import type { TrendItem } from "@/types/trend";

export function userFixture(overrides: Partial<User> = {}): User {
  return {
    id: "user_1",
    name: "Test User",
    email: "test@example.com",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function analysisFixture(
  overrides: Partial<Analysis> = {}
): Analysis {
  return {
    id: "analysis_1",
    userId: "user_1",
    productId: null,
    userImage: "https://cdn.example.com/self.jpg",
    productImage: "https://cdn.example.com/dress.jpg",
    generatedImage: null,
    status: "completed",
    tryOnStatus: "completed",
    tryOnCategory: null,
    tryOnJobId: null,
    tryOnProvider: null,
    tryOnError: null,
    tryOnLatencyMs: null,
    tryOnStartedAt: null,
    overallScore: 82,
    bodyScore: 80,
    styleScore: 85,
    colorScore: 90,
    bodyShape: "hourglass",
    skinTone: "warm",
    faceShape: "oval",
    styleType: "casual",
    height: null,
    heightConfidence: null,
    weight: null,
    weightConfidence: null,
    recommendations: [],
    colorAnalysis: null as unknown as Analysis["colorAnalysis"],
    compatibilityMetadata: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function favoriteRowFixture(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    favorite: {
      id: "fav_1",
      analysisId: "analysis_1",
      createdAt: "2026-01-02T00:00:00.000Z",
      inWardrobe: false,
      wardrobeTags: '["casual"]',
      wardrobeFolder: null,
      addedToWardrobeAt: null,
    },
    analysis: analysisFixture(),
    ...overrides,
  };
}

export function trendItemFixture(overrides: Partial<TrendItem> = {}): TrendItem {
  return {
    id: "trend_1",
    title: "Summer Dress",
    brand: "Test Brand",
    category: "dresses",
    subcategory: null,
    gender: "women",
    imageUrl: "https://cdn.example.com/trend.jpg",
    productUrl: null,
    colors: ["white", "pink"],
    styleTags: ["casual"],
    price: 4990,
    currency: "USD",
    provider: "shopify",
    providerId: "p-1",
    popularityScore: 77,
    season: "summer",
    occasion: null,
    description: null,
    isFeatured: false,
    isAvailable: true,
    lastSynced: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function stylistMessageFixture(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    id: "msg_1",
    userId: "user_1",
    role: "assistant",
    content: "A great fit for you.",
    createdAt: "2026-01-03T00:00:00.000Z",
    ...overrides,
  };
}
