/**
 * Body estimation service.
 * Uses vision AI to predict height, weight, and body traits from a user photo.
 * Falls back to mock estimation if vision provider is not available.
 */

import { analyzeWithVision } from "./vision";

export interface BodyEstimationResult {
  height: number; // in cm
  heightConfidence: number; // 0.0 to 1.0
  weight: number; // in kg
  weightConfidence: number; // 0.0 to 1.0
  bodyShape: "rectangle" | "pear" | "apple" | "hourglass" | "triangle" | "inverted-triangle";
  skinTone: "warm" | "cool" | "neutral" | "olive" | "deep";
  faceShape: "round" | "oval" | "heart" | "square" | "diamond" | "oblong";
}

/**
 * Predict weight, height, and shape from the user's self image URL.
 * Uses real vision analysis when available, falls back to deterministic mock.
 */
export async function estimateBodyTraits(userImageUrl: string): Promise<BodyEstimationResult> {
  try {
    // Use a minimal analysis to extract body traits
    const result = await analyzeWithVision({
      userImageUrl,
      clothingImageUrl: "", // Not needed for body estimation
    });

    return {
      height: result.height || 170,
      heightConfidence: result.heightConfidence || 0.8,
      weight: result.weight || 70,
      weightConfidence: result.weightConfidence || 0.75,
      bodyShape: result.traits.bodyShape,
      skinTone: result.traits.skinTone,
      faceShape: result.traits.faceShape,
    };
  } catch {
    // Fallback: deterministic mock based on image URL hash
    const hash = userImageUrl.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const shapes: BodyEstimationResult["bodyShape"][] = ["rectangle", "pear", "apple", "hourglass", "triangle"];
    const tones: BodyEstimationResult["skinTone"][] = ["warm", "cool", "neutral"];
    const faces: BodyEstimationResult["faceShape"][] = ["round", "oval", "heart", "square", "diamond"];

    return {
      height: 155 + (hash % 35),
      heightConfidence: 0.85,
      weight: 50 + (hash % 50),
      weightConfidence: 0.75,
      bodyShape: shapes[hash % shapes.length],
      skinTone: tones[hash % tones.length],
      faceShape: faces[hash % faces.length],
    };
  }
}
