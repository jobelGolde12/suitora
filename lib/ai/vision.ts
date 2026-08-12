/**
 * Vision AI provider abstraction.
 * Provides a unified interface for analyzing fashion compatibility
 * across different vision model providers.
 */

import type { BodyShape, SkinTone, FaceShape, StyleTag } from "@/types";
import type { CompatibilityMetadata } from "@/types/body-fit";

export interface VisionAnalysisInput {
  userImageUrl: string;
  clothingImageUrl: string;
}

export interface VisionAnalysisResult {
  scores: {
    overall: number;
    body: number;
    style: number;
    color: number;
  };
  traits: {
    bodyShape: BodyShape;
    skinTone: SkinTone;
    faceShape: FaceShape;
    styleType: StyleTag;
  };
  height?: number;
  heightConfidence?: number;
  weight?: number;
  weightConfidence?: number;
  recommendations: string[];
  colorAnalysis: {
    primaryColors: string[];
    recommendedColors: string[];
    avoidColors: string[];
  };
  /** Optional rich fit metadata produced by the analysis engine. */
  compatibilityMetadata?: CompatibilityMetadata;
}

export interface VisionProvider {
  name: string;
  analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult>;
}

let activeProvider: VisionProvider | null = null;

export function setVisionProvider(provider: VisionProvider) {
  activeProvider = provider;
}

export function getVisionProvider(): VisionProvider | null {
  return activeProvider;
}

/**
 * Analyze fashion compatibility using the configured vision provider.
 * Falls back to mock if no provider is configured.
 */
export async function analyzeWithVision(
  input: VisionAnalysisInput
): Promise<VisionAnalysisResult> {
  if (activeProvider) {
    return activeProvider.analyze(input);
  }

  // Fallback: use mock analysis
  const { analyzeFashion } = await import("./mock-analysis");
  const mockResult = await analyzeFashion(input);

  return {
    scores: {
      overall: mockResult.scores.overall,
      body: mockResult.scores.body,
      style: mockResult.scores.style,
      color: mockResult.scores.color,
    },
    traits: {
      bodyShape: mockResult.bodyShape,
      skinTone: mockResult.skinTone,
      faceShape: mockResult.faceShape,
      styleType: mockResult.styleType,
    },
    height: mockResult.height,
    heightConfidence: mockResult.heightConfidence,
    weight: mockResult.weight,
    weightConfidence: mockResult.weightConfidence,
    recommendations: mockResult.recommendations,
    colorAnalysis: mockResult.colorAnalysis,
    compatibilityMetadata: mockResult.compatibilityMetadata,
  };
}
