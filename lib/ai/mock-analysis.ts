/**
 * Mock AI analysis service.
 * Returns simulated analysis results so the UI is fully functional
 * before integrating real AI services like OpenAI or Gemini Vision.
 *
 * Returns FitAnalysisResult shape for compatibility with the fit engine.
 */

import type {
  FitAnalysisResult,
  FitScores,
  FitInsights,
  SizeRecommendation,
  CompatibilityMetadata,
  BodyShape,
  SkinTone,
  FaceShape,
  StyleTag,
  ItemProfile,
  UserBodyProfile,
} from "@/types";

const bodyShapes: BodyShape[] = ["rectangle", "pear", "apple", "hourglass", "triangle"];
const skinTones: SkinTone[] = ["warm", "cool", "neutral"];
const faceShapes: FaceShape[] = ["round", "oval", "heart", "square", "diamond"];
const styleTypes: StyleTag[] = [
  "casual",
  "minimalist",
  "streetwear",
  "vintage",
  "formal",
  "korean",
  "business-casual",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomScore(min = 40, max = 98): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface MockAnalysisInput {
  userImageUrl: string;
  clothingImageUrl: string;
}

/**
 * Simulate an AI analysis process with progress callbacks.
 * Returns a full FitAnalysisResult.
 */
export async function analyzeFashion(
  input: MockAnalysisInput,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<FitAnalysisResult> {
  const stages = [
    { stage: "detecting", duration: 800, message: "Detecting person in image..." },
    { stage: "analyzing", duration: 1200, message: "Analyzing body shape & features..." },
    { stage: "scoring", duration: 1000, message: "Calculating compatibility scores..." },
  ];

  let totalProgress = 0;
  const totalDuration = stages.reduce((acc, s) => acc + s.duration, 0);

  for (const { stage, duration, message } of stages) {
    const stageProgress = (duration / totalDuration) * 100;
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await delay(duration / steps);
      totalProgress += stageProgress / steps;
      onProgress?.(stage, Math.min(Math.round(totalProgress), 99), message);
    }
  }

  // Generate mock result
  const bodyShape = randomItem(bodyShapes);
  const skinTone = randomItem(skinTones);
  const faceShape = randomItem(faceShapes);
  const styleType = randomItem(styleTypes);

  const scores: FitScores = {
    overall: randomScore(55, 95),
    body: randomScore(50, 98),
    style: randomScore(45, 95),
    color: randomScore(50, 92),
  };

  const height = 155 + Math.floor(Math.random() * 35);
  const weight = 50 + Math.floor(Math.random() * 50);
  const confidence = 0.75 + Math.random() * 0.2;

  const sizeRecommendation: SizeRecommendation = {
    suggested: randomItem(["XS", "S", "M", "L", "XL"]),
    rationale: "Based on standard sizing for this garment type.",
  };

  const insights: FitInsights = {
    positives: [
      "This piece complements your body shape well",
      "The silhouette works well for both casual and semi-formal occasions",
    ],
    cautions: [
      "May feel slightly fitted across the bust if you prefer more ease",
    ],
    stylingTips: [
      "Add a belt to define your waist",
      "Layer with a blazer for evening events",
    ],
  };

  const bodyProfile: UserBodyProfile = {
    heightCm: height,
    weightKg: weight,
    bodyShape,
    measurements: {
      bust: 85 + Math.floor(Math.random() * 20),
      waist: 65 + Math.floor(Math.random() * 20),
      hips: 90 + Math.floor(Math.random() * 20),
      shoulderWidth: 35 + Math.floor(Math.random() * 10),
    },
    skinTone,
    faceShape,
    stylePreference: [styleType],
    confidence,
  };

  const itemProfile: ItemProfile = {
    category: "tops",
    subtype: "casual_shirt",
    silhouette: "regular",
    keyMeasurements: {
      bust: 90,
      waist: 75,
      hips: 95,
    },
    fabricStretch: "moderate",
    colors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
    styleTags: [styleType],
  };

  const compatibilityMetadata: CompatibilityMetadata = {
    bodyProfile,
    itemProfile,
    scores,
    sizeRecommendation,
    insights,
    confidence,
    flags: insights.cautions,
  };

  onProgress?.("complete", 100, "Analysis complete!");

  return {
    scores,
    bodyShape,
    skinTone,
    faceShape,
    styleType,
    height,
    heightConfidence: confidence,
    weight,
    weightConfidence: confidence,
    recommendations: [...insights.positives, ...insights.stylingTips],
    colorAnalysis: {
      primaryColors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
      recommendedColors: ["#E8D5B7", "#4A90D9", "#2ECC71", "#F39C12"],
      avoidColors: ["#FF6B6B", "#98FB98", "#FFD700"],
    },
    compatibilityMetadata,
  };
}
