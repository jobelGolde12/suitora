import { describe, it, expect } from "vitest";
import { computeRankScore, rankTrendItems, getCurrentSeason } from "./ranking";
import type { TrendItem } from "@/types/trend";

function item(overrides: Partial<TrendItem> = {}): TrendItem {
  return {
    id: "1",
    title: "Item",
    category: "dresses",
    imageUrl: "https://x/img.jpg",
    provider: "shopify",
    providerId: "p-1",
    popularityScore: 50,
    colors: [],
    styleTags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeRankScore", () => {
  it("starts from popularity", () => {
    expect(computeRankScore(item({ popularityScore: 77 }))).toBe(77);
  });

  it("adds 40 for featured items", () => {
    expect(computeRankScore(item({ isFeatured: true, popularityScore: 10 }))).toBe(50);
  });

  it("adds 15 when the season matches", () => {
    const base = item({ season: "summer" });
    expect(computeRankScore(base, { currentSeason: "summer" })).toBe(65);
    expect(computeRankScore(base, { currentSeason: "winter" })).toBe(50);
  });

  it("adds 5 when the gender matches the preference", () => {
    const base = item({ gender: "women" });
    expect(computeRankScore(base, { preferredGender: "women" })).toBe(55);
    expect(computeRankScore(base, { preferredGender: "men" })).toBe(50);
  });

  it("boosts recently updated items by recency band", () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const monthOld = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeRankScore(item({ updatedAt: recent }))).toBe(58);
    expect(computeRankScore(item({ updatedAt: monthOld }))).toBe(53);
  });

  it("gives no recency boost to old items", () => {
    const old = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeRankScore(item({ updatedAt: old }))).toBe(50);
  });
});

describe("rankTrendItems", () => {
  it("returns a new array sorted by descending score without mutating input", () => {
    const low = item({ id: "low", popularityScore: 10 });
    const high = item({ id: "high", popularityScore: 90 });
    const input = [low, high];
    const ranked = rankTrendItems(input);
    expect(ranked.map((i) => i.id)).toEqual(["high", "low"]);
    expect(input.map((i) => i.id)).toEqual(["low", "high"]);
    expect(ranked).not.toBe(input);
  });

  it("puts featured items ahead of higher popularity non-featured", () => {
    const featured = item({ id: "f", popularityScore: 5, isFeatured: true });
    const popular = item({ id: "p", popularityScore: 40 });
    expect(rankTrendItems([popular, featured]).map((i) => i.id)).toEqual(["f", "p"]);
  });
});

describe("getCurrentSeason", () => {
  it("maps months to the expected season", () => {
    expect(getCurrentSeason(new Date(2026, 2, 1))).toBe("spring");
    expect(getCurrentSeason(new Date(2026, 6, 1))).toBe("summer");
    expect(getCurrentSeason(new Date(2026, 9, 1))).toBe("fall");
    expect(getCurrentSeason(new Date(2026, 0, 1))).toBe("winter");
    expect(getCurrentSeason(new Date(2026, 11, 15))).toBe("winter");
  });
});
