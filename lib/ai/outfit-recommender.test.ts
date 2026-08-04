import { describe, it, expect } from "vitest";
import {
  colorCompatibility,
  groupByRole,
  recommendOutfits,
  roleFromCategory,
  scoreOutfit,
  type WardrobeItemInput,
} from "./outfit-recommender";

function item(overrides: Partial<WardrobeItemInput>): WardrobeItemInput {
  return {
    analysisId: "a1",
    name: "Cotton Tee",
    imageUrl: "https://example.com/img.jpg",
    category: "tops",
    colors: ["#2D2D2D"],
    styleTags: ["casual"],
    individualScore: 80,
    ...overrides,
  };
}

describe("roleFromCategory", () => {
  it("maps core categories to outfit roles", () => {
    expect(roleFromCategory("tops")).toBe("top");
    expect(roleFromCategory("bottoms")).toBe("bottom");
    expect(roleFromCategory("dresses")).toBe("dress");
    expect(roleFromCategory("outerwear")).toBe("outer");
    expect(roleFromCategory("footwear")).toBe("footwear");
    expect(roleFromCategory("accessories")).toBe("accessory");
    expect(roleFromCategory("headwear")).toBe("headwear");
  });

  it("applies name heuristics for activewear and formal", () => {
    expect(roleFromCategory("activewear", "Black Leggings")).toBe("bottom");
    expect(roleFromCategory("activewear", "Yoga Bra")).toBe("top");
    expect(roleFromCategory("formal", "Evening Gown")).toBe("dress");
    expect(roleFromCategory("formal", "Tailored Suit")).toBe("top");
  });
});

describe("colorCompatibility", () => {
  it("gives neutrals a high score with any color", () => {
    expect(colorCompatibility("#FFFFFF", "#FF0000")).toBe(100);
    expect(colorCompatibility("#2D2D2D", "#4A90D9")).toBe(100);
  });

  it("scores close hues higher than clashing ones", () => {
    const close = colorCompatibility("#E63946", "#F08080");
    const far = colorCompatibility("#E63946", "#4A90D9");
    expect(close).toBeGreaterThan(far);
  });
});

describe("groupByRole", () => {
  it("groups wardrobe items into their roles", () => {
    const items = [
      item({ analysisId: "t", category: "tops" }),
      item({ analysisId: "b", category: "bottoms" }),
      item({ analysisId: "s", category: "footwear" }),
    ];
    const grouped = groupByRole(items);
    expect(grouped.top).toHaveLength(1);
    expect(grouped.bottom).toHaveLength(1);
    expect(grouped.footwear).toHaveLength(1);
  });
});

describe("scoreOutfit", () => {
  it("scores a single item conservatively", () => {
    const sc = scoreOutfit(
      groupByRole([item({ individualScore: 90 })])!.top!
    );
    expect(sc.overall).toBeLessThan(90);
    expect(sc.overall).toBeGreaterThan(70);
  });

  it("scores a multi-item outfit across all dimensions", () => {
    const scored = groupByRole([
      item({ analysisId: "t", category: "tops", styleTags: ["formal"] }),
      item({ analysisId: "b", category: "bottoms", styleTags: ["formal"] }),
    ]);
    const items = [...(scored.top ?? []), ...(scored.bottom ?? [])];
    const sc = scoreOutfit(items);
    expect(sc.overall).toBeGreaterThanOrEqual(0);
    expect(sc.overall).toBeLessThanOrEqual(100);
    expect(sc.formality).toBeGreaterThanOrEqual(72);
  });

  it("rewards matching formality bands", () => {
    const same = scoreOutfit([
      ...(groupByRole([
        item({ analysisId: "t", category: "tops", styleTags: ["formal"] }),
        item({ analysisId: "b", category: "bottoms", styleTags: ["formal"] }),
      ]).top ?? []),
      ...(groupByRole([
        item({ analysisId: "t", category: "tops", styleTags: ["formal"] }),
        item({ analysisId: "b", category: "bottoms", styleTags: ["formal"] }),
      ]).bottom ?? []),
    ]);
    const mixed = scoreOutfit([
      ...(groupByRole([
        item({ analysisId: "t2", category: "tops", styleTags: ["formal"] }),
        item({ analysisId: "b2", category: "bottoms", styleTags: ["streetwear"] }),
      ]).top ?? []),
      ...(groupByRole([
        item({ analysisId: "t2", category: "tops", styleTags: ["formal"] }),
        item({ analysisId: "b2", category: "bottoms", styleTags: ["streetwear"] }),
      ]).bottom ?? []),
    ]);
    expect(same.formality).toBeGreaterThan(mixed.formality);
  });
});

describe("recommendOutfits", () => {
  it("returns an empty list with fewer than two items", () => {
    expect(recommendOutfits([item({})])).toEqual([]);
  });

  it("builds a complete top+bottom outfit and enriches with footwear", () => {
    const outfits = recommendOutfits([
      item({ analysisId: "t", category: "tops", individualScore: 85 }),
      item({ analysisId: "b", category: "bottoms", individualScore: 80 }),
      item({ analysisId: "s", category: "footwear", individualScore: 75 }),
    ]);

    expect(outfits.length).toBeGreaterThan(0);
    const outfit = outfits[0];
    const roles = outfit.items.map((i) => i.role);
    expect(roles).toContain("top");
    expect(roles).toContain("bottom");
    expect(outfit.items.length).toBeGreaterThanOrEqual(2);
    expect(outfit.overallScore).toBeGreaterThanOrEqual(0);
    expect(outfit.overallScore).toBeLessThanOrEqual(100);
    expect(outfit.stylingTips.length).toBeGreaterThan(0);
  });

  it("produces a dress as a standalone foundation", () => {
    const outfits = recommendOutfits([
      item({ analysisId: "d", category: "dresses", individualScore: 90 }),
      item({ analysisId: "s", category: "footwear", individualScore: 70 }),
    ]);
    expect(outfits.length).toBeGreaterThan(0);
    expect(outfits[0].items.some((i) => i.role === "dress")).toBe(true);
  });

  it("respects the limit and sorts by overall score descending", () => {
    const outfits = recommendOutfits(
      [
        item({ analysisId: "t1", category: "tops" }),
        item({ analysisId: "t2", category: "tops" }),
        item({ analysisId: "b1", category: "bottoms" }),
        item({ analysisId: "b2", category: "bottoms" }),
      ],
      { limit: 2 }
    );
    expect(outfits.length).toBeLessThanOrEqual(2);
    for (let i = 1; i < outfits.length; i++) {
      expect(outfits[i - 1].overallScore).toBeGreaterThanOrEqual(
        outfits[i].overallScore
      );
    }
  });
});
