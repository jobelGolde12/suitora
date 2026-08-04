import { describe, it, expect } from "vitest";
import { calculateFitScores } from "./fit-scoring";
import type { UserBodyProfile, ItemProfile } from "@/types";

const profile: UserBodyProfile = {
  heightCm: 172,
  weightKg: 62,
  bodyShape: "hourglass",
  measurements: {
    bust: 90,
    waist: 70,
    hips: 95,
    shoulderWidth: 39,
  },
  skinTone: "neutral",
  faceShape: "oval",
  stylePreference: ["minimalist"],
  confidence: 1,
};

const item: ItemProfile = {
  category: "tops",
  subtype: "fitted_top",
  silhouette: "fitted",
  keyMeasurements: { bust: 91, waist: 71, shoulderWidth: 40 },
  fabricStretch: "moderate",
  colors: ["#2D2D2D", "#F5F5F5"],
  styleTags: ["minimalist"],
};

describe("calculateFitScores", () => {
  it("returns scores within bounds and consistent metadata", () => {
    const result = calculateFitScores(profile, item);

    for (const s of Object.values(result.scores)) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }

    expect(result.scores.overall).toBeGreaterThan(0);
    expect(result.scores.body).toBeGreaterThan(0);
    expect(result.bodyShape).toBe("hourglass");
    expect(result.skinTone).toBe("neutral");
    expect(result.colorAnalysis.primaryColors).toEqual(item.colors);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.compatibilityMetadata.scores.overall).toBe(result.scores.overall);
    expect(result.compatibilityMetadata.itemProfile.category).toBe("tops");
  });

  it("favors flattering silhouettes for the body shape", () => {
    const flattering = calculateFitScores(profile, {
      ...item,
      silhouette: "wrap",
    }).scores.body;

    const avoid = calculateFitScores(profile, {
      ...item,
      silhouette: "oversized",
    }).scores.body;

    expect(flattering).toBeGreaterThan(avoid);
  });

  it("penalizes styles that mismatch the user preference", () => {
    const matched = calculateFitScores(profile, item).scores.style;
    const mismatched = calculateFitScores(profile, {
      ...item,
      styleTags: ["streetwear"],
    }).scores.style;

    expect(matched).toBeGreaterThan(mismatched);
  });

  it("dampens scores toward neutral when confidence is low", () => {
    const lowConfidence = calculateFitScores(
      { ...profile, confidence: 0.4 },
      item
    );
    const highConfidence = calculateFitScores(profile, item);

    for (const s of Object.values(lowConfidence.scores)) {
      expect(s).toBeGreaterThanOrEqual(65);
      expect(s).toBeLessThanOrEqual(95);
    }
    expect(lowConfidence.scores.overall).toBeLessThan(
      highConfidence.scores.overall
    );
    expect(Math.abs(lowConfidence.scores.overall - 73)).toBeLessThan(
      Math.abs(highConfidence.scores.overall - 73)
    );
  });
});
