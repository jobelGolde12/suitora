/**
 * OpenAI Vision provider for fashion analysis.
 * Uses GPT-4o to analyze clothing compatibility with user body features.
 */

import type {
  VisionProvider,
  VisionAnalysisInput,
  VisionAnalysisResult,
} from "../vision";
import type { BodyShape, SkinTone, FaceShape, StyleType } from "@/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Fetch with a hard timeout and exponential backoff retries.
 * Only transient failures (network errors, timeouts, 429/5xx) are retried.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = MAX_ATTEMPTS
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (response.ok || !RETRYABLE_STATUS.has(response.status)) {
        return response;
      }

      lastError = new Error(`OpenAI API status ${response.status}`);
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1_000 * 2 ** attempt + Math.random() * 500)
      );
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error("OpenAI request timed out");
  }
  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed");
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

function buildAnalysisPrompt(): string {
  return `You are a fashion compatibility analyst. Analyze the two images provided:
1. First image: A person's full-body photo
2. Second image: A clothing item

Provide a detailed fashion compatibility analysis in the following JSON format:
{
  "scores": {
    "overall": <0-100>,
    "body": <0-100>,
    "style": <0-100>,
    "color": <0-100>
  },
  "traits": {
    "bodyShape": "<rectangle|pear|apple|hourglass|triangle|inverted-triangle>",
    "skinTone": "<warm|cool|neutral|olive|deep>",
    "faceShape": "<round|oval|heart|square|diamond|oblong>",
    "styleType": "<casual|minimalist|streetwear|vintage|formal|korean|business-casual>"
  },
  "height": <estimated height in cm or null>,
  "heightConfidence": <0.0-1.0 or null>,
  "weight": <estimated weight in kg or null>,
  "weightConfidence": <0.0-1.0 or null>,
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ],
  "colorAnalysis": {
    "primaryColors": ["<hex1>", "<hex2>", "<hex3>"],
    "recommendedColors": ["<hex1>", "<hex2>", "<hex3>", "<hex4>"],
    "avoidColors": ["<hex1>", "<hex2>"]
  }
}

Scoring guidelines:
- Overall: How well does this clothing item suit this person (body fit + style + color harmony)
- Body: How well does the cut/fit complement their body shape
- Style: How well does the style match their apparent aesthetic
- Color: How well do the colors complement their skin tone

Be specific and thoughtful in your analysis. Return ONLY valid JSON, no other text.`;
}

function parseResponse(content: string): VisionAnalysisResult {
  try {
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize scores
    const clampScore = (val: unknown, fallback: number): number => {
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) return fallback;
      return Math.round(num);
    };

    // Validate body shape
    const validBodyShapes: BodyShape[] = [
      "rectangle", "pear", "apple", "hourglass", "triangle", "inverted-triangle",
    ];
    const bodyShape: BodyShape = validBodyShapes.includes(parsed.traits?.bodyShape)
      ? parsed.traits.bodyShape
      : "rectangle";

    // Validate skin tone
    const validSkinTones: SkinTone[] = ["warm", "cool", "neutral", "olive", "deep"];
    const skinTone: SkinTone = validSkinTones.includes(parsed.traits?.skinTone)
      ? parsed.traits.skinTone
      : "neutral";

    // Validate face shape
    const validFaceShapes: FaceShape[] = [
      "round", "oval", "heart", "square", "diamond", "oblong",
    ];
    const faceShape: FaceShape = validFaceShapes.includes(parsed.traits?.faceShape)
      ? parsed.traits.faceShape
      : "oval";

    // Validate style type
    const validStyleTypes: StyleType[] = [
      "casual", "minimalist", "streetwear", "vintage", "formal", "korean", "business-casual",
    ];
    const styleType: StyleType = validStyleTypes.includes(parsed.traits?.styleType)
      ? parsed.traits.styleType
      : "casual";

    // Ensure recommendations is an array of strings
    const recommendations: string[] = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.filter((r: unknown) => typeof r === "string").slice(0, 5)
      : ["This piece complements your style well"];

    // Validate color analysis
    const colorAnalysis = {
      primaryColors: Array.isArray(parsed.colorAnalysis?.primaryColors)
        ? parsed.colorAnalysis.primaryColors.slice(0, 3)
        : ["#2D2D2D", "#F5F5F5", "#8B7355"],
      recommendedColors: Array.isArray(parsed.colorAnalysis?.recommendedColors)
        ? parsed.colorAnalysis.recommendedColors.slice(0, 4)
        : ["#E8D5B7", "#4A90D9", "#2ECC71", "#F39C12"],
      avoidColors: Array.isArray(parsed.colorAnalysis?.avoidColors)
        ? parsed.colorAnalysis.avoidColors.slice(0, 3)
        : ["#FF6B6B", "#98FB98"],
    };

    // Parse height/weight with confidence
    const height = parsed.height ? Number(parsed.height) : undefined;
    const heightConfidence = parsed.heightConfidence
      ? Math.min(1, Math.max(0, Number(parsed.heightConfidence)))
      : undefined;
    const weight = parsed.weight ? Number(parsed.weight) : undefined;
    const weightConfidence = parsed.weightConfidence
      ? Math.min(1, Math.max(0, Number(parsed.weightConfidence)))
      : undefined;

    return {
      scores: {
        overall: clampScore(parsed.scores?.overall, 70),
        body: clampScore(parsed.scores?.body, 65),
        style: clampScore(parsed.scores?.style, 70),
        color: clampScore(parsed.scores?.color, 68),
      },
      traits: {
        bodyShape,
        skinTone,
        faceShape,
        styleType,
      },
      height: height && !isNaN(height) ? height : undefined,
      heightConfidence,
      weight: weight && !isNaN(weight) ? weight : undefined,
      weightConfidence,
      recommendations,
      colorAnalysis,
    };
  } catch (err) {
    console.error("Failed to parse OpenAI response:", err);
    // Return sensible defaults
    return {
      scores: { overall: 70, body: 65, style: 70, color: 68 },
      traits: {
        bodyShape: "rectangle",
        skinTone: "neutral",
        faceShape: "oval",
        styleType: "casual",
      },
      recommendations: [
        "This piece has potential — consider your personal style preferences",
        "The colors may work well with your skin tone",
        "Try pairing with neutral accessories for balance",
      ],
      colorAnalysis: {
        primaryColors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
        recommendedColors: ["#E8D5B7", "#4A90D9", "#2ECC71", "#F39C12"],
        avoidColors: ["#FF6B6B", "#98FB98"],
      },
    };
  }
}

export function createOpenAIProvider(): VisionProvider {
  return {
    name: "openai",

    async analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const response = await fetchWithRetry(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: buildAnalysisPrompt() },
                {
                  type: "image_url",
                  image_url: { url: input.userImageUrl, detail: "high" },
                },
                {
                  type: "image_url",
                  image_url: { url: input.clothingImageUrl, detail: "high" },
                },
              ],
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return parseResponse(content);
    },
  };
}
