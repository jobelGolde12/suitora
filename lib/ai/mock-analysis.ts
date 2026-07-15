/**
 * Mock AI analysis service.
 * Returns simulated analysis results so the UI is fully functional
 * before integrating real AI services like OpenAI or Gemini Vision.
 */

import type {
  Analysis,
  BodyShape,
  SkinTone,
  FaceShape,
  StyleType,
  ColorAnalysis,
} from "@/types";

const bodyShapes: BodyShape[] = ["rectangle", "pear", "apple", "hourglass", "triangle"];
const skinTones: SkinTone[] = ["warm", "cool", "neutral"];
const faceShapes: FaceShape[] = ["round", "oval", "heart", "square", "diamond"];
const styleTypes: StyleType[] = [
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

function randomRecommendations(): string[] {
  const all: string[] = [
    "This piece complements your body shape well",
    "Consider pairing with neutral accessories",
    "Works great for both casual and semi-formal occasions",
    "The silhouette flatters your frame",
    "Try tucking it in for a more polished look",
    "Roll up the sleeves for a relaxed vibe",
    "Add a belt to define your waist",
    "Layer with a blazer for evening events",
    "Pair with high-waisted bottoms for balance",
    "Opt for lighter fabrics in warmer months",
  ];
  const count = randomScore(2, 5);
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateColorAnalysis(): ColorAnalysis {
  return {
    primaryColors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
    recommendedColors: ["#E8D5B7", "#4A90D9", "#2ECC71", "#F39C12"],
    avoidColors: ["#FF6B6B", "#98FB98", "#FFD700"],
  };
}

interface MockAnalysisInput {
  userImageUrl: string;
  clothingImageUrl: string;
}

interface AnalysisResult {
  overallScore: number;
  bodyScore: number;
  styleScore: number;
  colorScore: number;
  bodyShape: BodyShape;
  skinTone: SkinTone;
  faceShape: FaceShape;
  styleType: StyleType;
  recommendations: string[];
  colorAnalysis: ColorAnalysis;
  generatedImageUrl: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate an AI analysis process with progress callbacks.
 */
export async function analyzeFashion(
  input: MockAnalysisInput,
  onProgress?: (stage: string, progress: number, message: string) => void
): Promise<AnalysisResult> {
  const stages = [
    { stage: "detecting", duration: 800, message: "Detecting person in image..." },
    { stage: "analyzing", duration: 1200, message: "Analyzing body shape & features..." },
    { stage: "analyzing", duration: 1000, message: "Analyzing skin tone & face shape..." },
    { stage: "try-on", duration: 1500, message: "Generating virtual try-on..." },
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
  const overallScore = randomScore(55, 95);
  const bodyScore = randomScore(50, 98);
  const styleScore = randomScore(45, 95);
  const colorScore = randomScore(50, 92);

  onProgress?.("complete", 100, "Analysis complete!");

  return {
    overallScore,
    bodyScore,
    styleScore,
    colorScore,
    bodyShape: randomItem(bodyShapes),
    skinTone: randomItem(skinTones),
    faceShape: randomItem(faceShapes),
    styleType: randomItem(styleTypes),
    recommendations: randomRecommendations(),
    colorAnalysis: generateColorAnalysis(),
    generatedImageUrl: input.clothingImageUrl, // In production, this would be the AI-generated try-on
  };
}
