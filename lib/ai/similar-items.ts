/**
 * Similar items — scores trending items against a user's stored profile so the
 * results page can suggest complementary pieces with the same fit engine.
 */

import type {
  BodyMeasurements,
  BodyShape,
  ItemCategory,
  ItemProfile,
  SkinTone,
  StyleTag,
  UserBodyProfile,
} from "@/types";
import type { TrendItem } from "@/types/trend";
import type { SimilarItemResult } from "@/types";
import { calculateFitScores } from "./fit-scoring";
import { detectSilhouette, detectStretch } from "./item-attributes";
import {
  estimateBust,
  estimateHips,
  estimateShoulderWidth,
  estimateWaist,
} from "./fit-pipeline";

// ─── Profile Builders ────────────────────────────────────────────

/** Normalized shape accepted by the profile builder (raw DB row or parsed). */
interface ProfileLike {
  height?: number | null;
  estimatedHeight?: number | null;
  weight?: number | null;
  estimatedWeight?: number | null;
  bodyShape?: string | null;
  bodyShapeConfidence?: number | null;
  skinTone?: string | null;
  faceShape?: string | null;
  chestCircumference?: number | null;
  waistCircumference?: number | null;
  hipCircumference?: number | null;
  shoulderWidth?: number | null;
  styleTags?: string | string[] | null;
}

function parseStyleTags(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildUserBodyProfileFromProfile(
  profile: ProfileLike
): UserBodyProfile {
  const heightCm = profile.height ?? profile.estimatedHeight ?? undefined;
  const weightKg = profile.weight ?? profile.estimatedWeight ?? undefined;
  const bodyShape: BodyShape = (profile.bodyShape ?? "rectangle") as BodyShape;

  const measurements: BodyMeasurements = {
    bust: profile.chestCircumference ?? estimateBust(bodyShape, heightCm),
    waist: profile.waistCircumference ?? estimateWaist(bodyShape, heightCm),
    hips: profile.hipCircumference ?? estimateHips(bodyShape, heightCm),
    shoulderWidth: profile.shoulderWidth ?? estimateShoulderWidth(heightCm),
  };

  const stylePreference = parseStyleTags(profile.styleTags);

  return {
    heightCm,
    weightKg,
    bodyShape,
    measurements,
    skinTone: (profile.skinTone ?? "neutral") as SkinTone,
    faceShape: (profile.faceShape ?? "oval") as UserBodyProfile["faceShape"],
    stylePreference: (stylePreference.length
      ? stylePreference
      : ["casual"]) as StyleTag[],
    confidence: profile.bodyShapeConfidence ?? 0.6,
  };
}

export function buildItemProfileFromTrendItem(item: TrendItem): ItemProfile {
  const category = (item.category || "tops") as ItemCategory;
  return {
    category,
    subtype: item.subcategory ?? category,
    silhouette: detectSilhouette(item.title, category),
    keyMeasurements: {},
    fabricStretch: detectStretch(item.title),
    colors: item.colors?.length ? item.colors : ["#2D2D2D", "#F5F5F5"],
    styleTags: (item.styleTags?.length
      ? item.styleTags
      : ["casual"]) as StyleTag[],
  };
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 60) return "Reasonable match";
  return "Check sizing";
}

// ─── Scoring ─────────────────────────────────────────────────────

export function scoreTrendItemsForUser(
  profile: UserBodyProfile,
  items: TrendItem[]
): SimilarItemResult[] {
  return items
    .map((item) => {
      const result = calculateFitScores(profile, buildItemProfileFromTrendItem(item));
      return {
        id: item.id,
        title: item.title,
        brand: item.brand,
        imageUrl: item.imageUrl,
        productUrl: item.productUrl,
        price: item.price,
        currency: item.currency,
        category: item.category,
        styleTags: item.styleTags,
        colors: item.colors,
        popularityScore: item.popularityScore,
        score: result.scores.overall,
        bodyScore: result.scores.body,
        colorScore: result.scores.color,
        styleScore: result.scores.style,
        scoreLabel: scoreLabel(result.scores.overall),
      };
    })
    .sort((a, b) => b.score - a.score);
}
