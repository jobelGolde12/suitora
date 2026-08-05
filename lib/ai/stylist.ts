/**
 * AI Stylist — context-aware fashion chat.
 *
 * Uses OpenAI chat completions when OPENAI_API_KEY is configured and falls
 * back to a helpful rule-based reply otherwise (mirroring the vision
 * pipeline's mock fallback so the feature always works).
 */

import type { SkinTone, StyleTag, FitPreference } from "@/types";

export interface StylistMessageInput {
  role: "user" | "assistant";
  content: string;
}

/** Compact user context injected into the system prompt. */
export interface StylistContext {
  name?: string | null;
  bodyShape?: string | null;
  skinTone?: SkinTone | null;
  styleTags?: StyleTag[];
  fitPreference?: FitPreference | null;
  totalAnalyses: number;
  averageScore: number;
  bestScore?: number | null;
  favoriteCount: number;
  recentScores: number[];
  wardrobeCount?: number;
  folderNames?: string[];
  favoriteCategories?: string[];
  currentSeason?: string;
  bestCategory?: string | null;
  worstCategory?: string | null;
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const FETCH_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok || !RETRYABLE_STATUS.has(response.status)) return response;
      lastError = new Error(`OpenAI API status ${response.status}`);
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < 2) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1_000 * 2 ** attempt + Math.random() * 500)
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenAI request failed");
}

export function buildSystemPrompt(context: StylistContext): string {
  const lines: string[] = [
    "You are Suitora's AI fashion stylist. You give warm, specific, practical styling advice tailored to the user's body, skin tone, and preferences.",
    "Be conversational and concise — 2 to 5 sentences. Ask a clarifying question when something is ambiguous. Never invent measurements.",
  ];

  const profile: string[] = [];
  if (context.name) profile.push(`Name: ${context.name}`);
  if (context.bodyShape) profile.push(`Body shape: ${context.bodyShape}`);
  if (context.skinTone) profile.push(`Skin tone: ${context.skinTone}`);
  if (context.styleTags?.length)
    profile.push(`Style preferences: ${context.styleTags.join(", ")}`);
  if (context.fitPreference) profile.push(`Fit preference: ${context.fitPreference}`);
  if (profile.length > 0) {
    lines.push(`User profile:\n- ${profile.join("\n- ")}`);
  }

  const history: string[] = [];
  if (context.totalAnalyses > 0) {
    history.push(`${context.totalAnalyses} analyses so far`);
    history.push(`Average score: ${Math.round(context.averageScore)}`);
    if (context.bestScore != null)
      history.push(`Best score: ${Math.round(context.bestScore)}`);
  }
  if (context.favoriteCount > 0) history.push(`${context.favoriteCount} saved items`);
  if (context.wardrobeCount != null && context.wardrobeCount > 0) {
    history.push(`${context.wardrobeCount} wardrobe items`);
  }
  if (context.folderNames?.length) {
    history.push(`Wardrobe folders: ${context.folderNames.join(", ")}`);
  }
  if (context.favoriteCategories?.length) {
    history.push(`Favorite categories: ${context.favoriteCategories.join(", ")}`);
  }
  if (context.bestCategory) history.push(`Strongest category: ${context.bestCategory}`);
  if (context.worstCategory) history.push(`Weakest category: ${context.worstCategory}`);
  if (context.currentSeason) history.push(`Current season: ${context.currentSeason}`);
  if (history.length > 0) {
    lines.push(`Usage context:\n- ${history.join("\n- ")}`);
  }

  return lines.join("\n\n");
}

async function callOpenAI(
  messages: StylistMessageInput[],
  context: StylistContext
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetchWithRetry(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI");
  return content.trim();
}

function mockStylistReply(
  messages: StylistMessageInput[],
  context: StylistContext
): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const text = last?.content.toLowerCase() ?? "";
  const firstName = context.name?.split(" ")[0] || "";

  if (text.includes("wardrobe") || text.includes("build from")) {
    if ((context.wardrobeCount ?? 0) > 0) {
      const folders =
        context.folderNames && context.folderNames.length
          ? ` across folders like ${context.folderNames.slice(0, 3).join(", ")}`
          : "";
      return `You have ${context.wardrobeCount} pieces in your wardrobe${folders}. Start with your strongest category${
        context.bestCategory ? ` (${context.bestCategory})` : ""
      }, pair it with a contrasting silhouette, and keep one accent color. Want a full outfit for a specific occasion?`;
    }
    return "Your wardrobe is empty so far — add a few favorites from analyses, then I can mix real pieces into outfits for you.";
  }

  if (text.includes("season") || text.includes("weather")) {
    const season = context.currentSeason ?? "this season";
    return `${season} calls for pieces that balance comfort and polish. Lean on breathable or insulating layers as needed, and keep one accent color so the look still feels intentional. What are you dressing for?`;
  }

  if (
    text.includes("size") ||
    text.includes("fit") ||
    text.includes("measurement")
  ) {
    return context.totalAnalyses > 0
      ? `Based on your analyses, your average compatibility score is ${Math.round(context.averageScore)}. Fit matters most for tops and dresses across the shoulder and chest — if a piece runs snug, sizing up usually drapes better. Would you like to check a specific garment?`
      : "Great question — fit is about how a cut works with your frame. Add a photo analysis first and I'll be able to give precise guidance for your body shape.";
  }

  if (
    text.includes("color") ||
    text.includes("colour") ||
    text.includes("palette")
  ) {
    if (context.skinTone) {
      return `For your ${context.skinTone} undertone, lean on your recommended palette and keep one or two neutrals as anchors. A quick test: hold a warm tone next to a cool tone and see which brightens your face. Want me to break down specific shades?`;
    }
    return "Color harmony is personal, but a simple rule: warm undertones glow in earthy and golden shades, while cool undertones suit jewel tones and crisp whites. Run an analysis and I'll build your palette.";
  }

  if (
    (text.includes("what") && text.includes("wear")) ||
    text.includes("occasion") ||
    text.includes("event")
  ) {
    return "For any occasion, start from the dress code, then anchor with a well-fitted neutral base and add one accent piece (color or texture). Tell me the occasion and I'll suggest a full outfit direction.";
  }

  if (context.totalAnalyses === 0) {
    return "I'm your personal AI stylist. Once you run a few analyses, I can give advice tuned to your body shape, skin tone, and style preferences. Meanwhile — are you more after fit advice, color guidance, or outfit ideas?";
  }

  const greeting = firstName ? `${firstName}, ` : "";
  const recent = context.recentScores.length
    ? ` your last ${context.recentScores.length} scores averaged ${Math.round(context.averageScore)}`
    : "";
  return `${greeting}here's a thought based on${recent || " your profile"}: keep the hero piece simple and let one statement detail (color, texture, or silhouette) carry the look. Tell me what you're styling for and I'll get more specific.`;
}

/**
 * Generate a stylist reply for the conversation. Falls back to rule-based
 * advice when no OpenAI key is configured or the API call fails.
 */
export async function generateStylistReply(params: {
  messages: StylistMessageInput[];
  context: StylistContext;
}): Promise<string> {
  try {
    return await callOpenAI(params.messages, params.context);
  } catch (err) {
    console.warn("[Stylist] Falling back to mock reply:", err);
    return mockStylistReply(params.messages, params.context);
  }
}
