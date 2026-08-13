import { describe, it, expect } from "vitest";
import { createAnalysisSchema, selfImageBodySchema } from "./validation";

// Dev mode (no storage provider) stores images as base64 data URLs; a real
// photo easily exceeds the old 4096-char cap and must still validate.
const bigDataUrl = `data:image/jpeg;base64,${"a".repeat(1024 * 1024)}`;

describe("createAnalysisSchema", () => {
  it("accepts data-URL image references (dev fallback)", () => {
    expect(
      createAnalysisSchema.safeParse({
        userImageUrl: bigDataUrl,
        productImageUpload: bigDataUrl,
      }).success
    ).toBe(true);
  });

  it("accepts a product URL without image references", () => {
    expect(
      createAnalysisSchema.safeParse({ productUrl: "https://example.com/p" }).success
    ).toBe(true);
  });

  it("rejects a non-URL productUrl", () => {
    expect(
      createAnalysisSchema.safeParse({ productUrl: "not-a-url" }).success
    ).toBe(false);
  });
});

describe("selfImageBodySchema", () => {
  it("accepts a data-URL self image (dev fallback)", () => {
    expect(selfImageBodySchema.safeParse({ selfImageUrl: bigDataUrl }).success).toBe(true);
  });

  it("rejects a missing selfImageUrl", () => {
    expect(selfImageBodySchema.safeParse({}).success).toBe(false);
  });
});
