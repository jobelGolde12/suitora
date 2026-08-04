/**
 * Fit analysis pipeline.
 * Orchestrates the full analysis run: body profile → item attributes → fit scoring.
 */

import type {
  UserBodyProfile,
  FitAnalysisResult,
  BodyShape,
} from "@/types";
import { extractItemProfile } from "./item-attributes";
import { calculateFitScores } from "./fit-scoring";

export interface FitPipelineInput {
  userImageUrl: string;
  clothingImageUrl: string;
  productUrl?: string;
  productTitle?: string;
}

export interface FitPipelineProgress {
  stage: "detecting" | "analyzing" | "scoring" | "complete" | "failed";
  progress: number;
  message: string;
}

type ProgressCallback = (progress: FitPipelineProgress) => void;

// ─── Body Profile Extraction ─────────────────────────────────────

async function extractBodyProfile(userImageUrl: string): Promise<UserBodyProfile> {
  // Try to use the real vision provider
  try {
    const { analyzeWithVision } = await import("./vision");
    const result = await analyzeWithVision({
      userImageUrl,
      clothingImageUrl: "", // not needed for body profile
    });

    return {
      heightCm: result.height,
      weightKg: result.weight,
      bodyShape: result.traits.bodyShape,
      measurements: {
        bust: estimateBust(result.traits.bodyShape, result.height),
        waist: estimateWaist(result.traits.bodyShape, result.height),
        hips: estimateHips(result.traits.bodyShape, result.height),
        shoulderWidth: estimateShoulderWidth(result.height),
      },
      skinTone: result.traits.skinTone,
      faceShape: result.traits.faceShape,
      stylePreference: [result.traits.styleType],
      confidence: (result.heightConfidence || 0.8) * 0.9,
    };
  } catch {
    // Fallback to basic profile
    return getDefaultBodyProfile();
  }
}

// ─── Measurement Estimation Helpers ──────────────────────────────

export function estimateBust(bodyShape: BodyShape, height?: number): number {
  const base = (height || 170) * 0.52;
  const adjustments: Record<BodyShape, number> = {
    hourglass: 2,
    pear: -1,
    apple: 3,
    rectangle: 0,
    "inverted-triangle": 2,
    triangle: -1,
  };
  return Math.round(base + (adjustments[bodyShape] || 0));
}

export function estimateWaist(bodyShape: BodyShape, height?: number): number {
  const base = (height || 170) * 0.41;
  const adjustments: Record<BodyShape, number> = {
    hourglass: -2,
    pear: 0,
    apple: 4,
    rectangle: 1,
    "inverted-triangle": -1,
    triangle: 2,
  };
  return Math.round(base + (adjustments[bodyShape] || 0));
}

export function estimateHips(bodyShape: BodyShape, height?: number): number {
  const base = (height || 170) * 0.56;
  const adjustments: Record<BodyShape, number> = {
    hourglass: 2,
    pear: 4,
    apple: -1,
    rectangle: 0,
    "inverted-triangle": -2,
    triangle: 3,
  };
  return Math.round(base + (adjustments[bodyShape] || 0));
}

export function estimateShoulderWidth(height?: number): number {
  return Math.round((height || 170) * 0.23);
}

function getDefaultBodyProfile(): UserBodyProfile {
  return {
    heightCm: 170,
    weightKg: 65,
    bodyShape: "rectangle",
    measurements: {
      bust: 88,
      waist: 70,
      hips: 95,
      shoulderWidth: 39,
    },
    skinTone: "neutral",
    faceShape: "oval",
    stylePreference: ["casual"],
    confidence: 0.65,
  };
}

// ─── Pipeline Execution ──────────────────────────────────────────

export async function runFitPipeline(
  input: FitPipelineInput,
  onProgress?: ProgressCallback
): Promise<FitAnalysisResult> {
  // Stage 1: Body detection
  onProgress?.({
    stage: "detecting",
    progress: 10,
    message: "Reading your proportions...",
  });

  const bodyProfile = await extractBodyProfile(input.userImageUrl);

  // Stage 2: Item analysis
  onProgress?.({
    stage: "analyzing",
    progress: 40,
    message: "Understanding the garment...",
  });

  const itemProfile = await extractItemProfile({
    imageUrl: input.clothingImageUrl,
    productUrl: input.productUrl,
    productTitle: input.productTitle,
  });

  // Stage 3: Fit scoring
  onProgress?.({
    stage: "scoring",
    progress: 70,
    message: "Calculating compatibility...",
  });

  const result = calculateFitScores(bodyProfile, itemProfile);

  // Stage 4: Complete
  onProgress?.({
    stage: "complete",
    progress: 100,
    message: "Analysis complete!",
  });

  return result;
}
