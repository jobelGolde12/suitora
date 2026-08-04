import { describe, it, expect } from "vitest";
import {
  buildUserBodyProfileFromProfile,
  buildItemProfileFromTrendItem,
  scoreTrendItemsForUser,
} from "./similar-items";
import type { TrendItem } from "@/types/trend";

const profileLike = {
  height: 172,
  weight: 62,
  bodyShape: "hourglass",
  bodyShapeConfidence: 0.9,
  skinTone: "neutral",
  faceShape: "oval",
  chestCircumference: 90,
  waistCircumference: 70,
  hipCircumference: 95,
  shoulderWidth: 39,
  styleTags: '["minimalist"]',
};

const trendItem: TrendItem = {
  id: "t1",
  title: "Slim Fit Wool Blazer",
  brand: "Acre",
  category: "tops",
  imageUrl: "https://example.com/1.jpg",
  colors: ["#2D2D2D"],
  styleTags: ["minimalist", "formal"],
  popularityScore: 80,
  provider: "mock",
  providerId: "p1",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("buildUserBodyProfileFromProfile", () => {
  it("prefers manual measurements and parses JSON style tags", () => {
    const body = buildUserBodyProfileFromProfile(profileLike);
    expect(body.bodyShape).toBe("hourglass");
    expect(body.heightCm).toBe(172);
    expect(body.weightKg).toBe(62);
    expect(body.measurements.bust).toBe(90);
    expect(body.stylePreference).toEqual(["minimalist"]);
    expect(body.confidence).toBe(0.9);
  });

  it("falls back to estimates when measurements are missing", () => {
    const body = buildUserBodyProfileFromProfile({
      height: 170,
      bodyShape: "rectangle",
    });
    expect(body.measurements.bust).toBeGreaterThan(80);
    expect(body.measurements.bust).toBeLessThan(95);
    expect(body.stylePreference).toEqual(["casual"]);
  });
});

describe("buildItemProfileFromTrendItem", () => {
  it("maps a trend item to an item profile", () => {
    const item = buildItemProfileFromTrendItem(trendItem);
    expect(item.category).toBe("tops");
    expect(item.colors).toEqual(["#2D2D2D"]);
    expect(item.styleTags).toContain("minimalist");
    expect(item.silhouette).toBeTruthy();
    expect(item.fabricStretch).toBeTruthy();
  });
});

describe("scoreTrendItemsForUser", () => {
  it("returns scored items sorted by overall score descending", () => {
    const other: TrendItem = {
      ...trendItem,
      id: "t2",
      title: "Oversized Street Hoodie",
      styleTags: ["streetwear"],
    };

    const results = scoreTrendItemsForUser(
      buildUserBodyProfileFromProfile(profileLike),
      [other, trendItem]
    );

    expect(results).toHaveLength(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    expect(results[0].scoreLabel).toBeTruthy();
    expect(results[0].id).toBe("t1");
  });
});
