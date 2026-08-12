import { describe, it, expect, vi } from "vitest";

vi.mock("@/drizzle", () => ({
  dbWrite: {},
  dbRead: {},
  schema: {},
}));

vi.mock("@/lib/ai/tryon/monitoring", () => ({
  getTryOnStats: vi.fn().mockResolvedValue({}),
}));

import { parseJsonObject, toAnalysisResult } from "./queries";
import type { AnalysisResult } from "@/types";

describe("parseJsonObject", () => {
  it("parses a valid JSON object", () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null for null/empty input", () => {
    expect(parseJsonObject(null)).toBeNull();
    expect(parseJsonObject("")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseJsonObject("{bad")).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(parseJsonObject("[1,2]")).toBeNull();
    expect(parseJsonObject("42")).toBeNull();
    expect(parseJsonObject('"str"')).toBeNull();
  });
});

describe("toAnalysisResult", () => {
  function row(overrides: Record<string, unknown> = {}) {
    return {
      id: "a-1",
      userId: "u-1",
      productId: null,
      userImage: "https://x/self.jpg",
      productImage: "https://x/img.jpg",
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
      colorAnalysis: '{"tone":"warm"}',
      compatibilityMetadata: '{"ok":true}',
      recommendations: '["avoid","pair"]',
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      deletedAt: null,
      ...overrides,
    } as never;
  }

  it("parses JSON columns into arrays/objects on the result", () => {
    const result = toAnalysisResult(row()) as AnalysisResult;
    expect(result.recommendations).toEqual(["avoid", "pair"]);
    expect(result.colorAnalysis).toEqual({ tone: "warm" });
    expect(result.compatibilityMetadata).toEqual({ ok: true });
  });

  it("handles malformed JSON columns gracefully", () => {
    const result = toAnalysisResult(
      row({ recommendations: "{bad", colorAnalysis: "nope", compatibilityMetadata: "42" })
    ) as AnalysisResult;
    expect(result.recommendations).toEqual([]);
    expect(result.colorAnalysis).toBeNull();
    expect(result.compatibilityMetadata).toBeNull();
  });

  it("keeps scalar fields verbatim", () => {
    const result = toAnalysisResult(row()) as AnalysisResult;
    expect(result.id).toBe("a-1");
    expect(result.userId).toBe("u-1");
    expect(result.overallScore).toBe(82);
    expect(result.status).toBe("completed");
    expect(result.bodyScore).toBe(80);
    expect(result.userImage).toBe("https://x/self.jpg");
  });
});
