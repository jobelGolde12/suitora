import { describe, it, expect } from "vitest";
import { normalizeProduct, rowToTrendItem } from "./normalize";
import type { RawProviderProduct } from "@/types/trend";

function raw(overrides: Partial<RawProviderProduct> = {}): RawProviderProduct {
  return {
    providerId: "p-1",
    title: "  Floral Midi Dress  ",
    imageUrl: "https://cdn.example.com/dress.jpg",
    ...overrides,
  };
}

describe("normalizeProduct", () => {
  it("normalizes the common case", () => {
    const out = normalizeProduct("shopify", raw({ title: "  Floral Midi Dress  " }));
    expect(out.provider).toBe("shopify");
    expect(out.providerId).toBe("p-1");
    expect(out.title).toBe("Floral Midi Dress");
    expect(out.imageUrl).toBe("https://cdn.example.com/dress.jpg");
    expect(out.currency).toBe("USD");
    expect(out.popularityScore).toBe(50);
    expect(out.isFeatured).toBe(false);
    expect(out.isAvailable).toBe(true);
    expect(out.styleTags).toBe("[]");
    expect(out.colors).toBe("[]");
  });

  it("lowercases and trims gender, season, and occasion", () => {
    const out = normalizeProduct("asos", raw({ gender: "  Women  ", season: " SUMMER ", occasion: "Party " }));
    expect(out.gender).toBe("women");
    expect(out.season).toBe("summer");
    expect(out.occasion).toBe("party");
  });

  it("serializes array fields and trims optional strings", () => {
    const out = normalizeProduct("serpapi", raw({ styleTags: ["casual", "boho"], colors: ["blue"] }));
    expect(JSON.parse(out.styleTags)).toEqual(["casual", "boho"]);
    expect(JSON.parse(out.colors)).toEqual(["blue"]);
  });

  it("keeps a numeric price and defaults currency", () => {
    const out = normalizeProduct("x", raw({ price: 49.99, currency: "EUR" }));
    expect(out.price).toBe(49.99);
    expect(out.currency).toBe("EUR");
  });

  it("maps non-numeric price to null", () => {
    const out = normalizeProduct("x", raw({ price: "49.99" as unknown as number }));
    expect(out.price).toBeNull();
  });

  it("clamps popularityScore to 0..100 and handles NaN", () => {
    expect(normalizeProduct("x", raw({ popularityScore: 999 })).popularityScore).toBe(100);
    expect(normalizeProduct("x", raw({ popularityScore: -5 })).popularityScore).toBe(0);
    expect(
      normalizeProduct("x", raw({ popularityScore: Number.NaN })).popularityScore
    ).toBe(0);
  });

  it("generates a unique id per product", () => {
    const a = normalizeProduct("x", raw({ providerId: "a" }));
    const b = normalizeProduct("x", raw({ providerId: "b" }));
    expect(a.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });
});

describe("rowToTrendItem", () => {
  const row = {
    id: "1",
    provider: "shopify",
    providerId: "p-1",
    title: "Dress",
    brand: "Brand",
    description: "desc",
    category: "dresses",
    subcategory: "maxi",
    gender: "women",
    imageUrl: "https://x/img.jpg",
    productUrl: "https://x/p",
    price: 99,
    currency: "USD",
    season: "summer",
    occasion: "party",
    styleTags: '["a","b"]',
    colors: '["red"]',
    popularityScore: 80,
    isFeatured: true,
    isAvailable: true,
    lastSynced: "2026-01-01T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("parses JSON array columns into arrays", () => {
    const item = rowToTrendItem(row);
    expect(item.styleTags).toEqual(["a", "b"]);
    expect(item.colors).toEqual(["red"]);
  });

  it("returns [] for malformed JSON arrays", () => {
    const item = rowToTrendItem({ ...row, styleTags: "{bad", colors: "null" });
    expect(item.styleTags).toEqual([]);
    expect(item.colors).toEqual([]);
  });

  it("maps every row field onto the TrendItem shape", () => {
    const item = rowToTrendItem(row);
    expect(item.title).toBe("Dress");
    expect(item.provider).toBe("shopify");
    expect(item.providerId).toBe("p-1");
    expect(item.isFeatured).toBe(true);
    expect(item.popularityScore).toBe(80);
  });
});
