/**
 * AI Stylist — context-aware fashion chat.
 *
 * Uses NVIDIA chat completions (OpenAI-compatible endpoint) when
 * NVIDIA_API_KEY is configured, falling back to OpenAI when OPENAI_API_KEY is
 * set, and to a helpful rule-based reply otherwise (mirroring the vision
 * pipeline's mock fallback so the feature always works).
 *
 * Provider selection (STYLIST_PROVIDER=auto|nvidia|openai|mock):
 *   - explicit value wins
 *   - otherwise NVIDIA is preferred when a key exists, then OpenAI, then mock
 */

import type { SkinTone, StyleTag, FitPreference } from "@/types";
import { getLogger } from "@/lib/logger";

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
  sizePreference?: string | null;
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
  // ── Analytics ─────────────────────────────────────────────────
  /** Per-category average compatibility, strongest first. */
  categoryBreakdown?: Array<{
    category: string;
    averageScore: number;
    count: number;
  }>;
  /** Whether recent analyses score higher/lower than earlier ones. */
  scoreTrend?: {
    direction: "improving" | "declining" | "stable";
    recentAverage: number;
    earlierAverage: number;
  } | null;
  /** Most recently analyzed garments, newest first. */
  recentItems?: Array<{
    category: string;
    subtype?: string;
    score: number;
  }>;
  /** Aggregated tags across everything in the wardrobe. */
  wardrobeTags?: string[];
  preferredColors?: string[];
  avoidColors?: string[];
  /** Most frequently detected style types across analyses. */
  topStyleTypes?: string[];
}

export type StylistProvider = "auto" | "openai" | "nvidia" | "mock";

const OPENAI_API_URL = "https://api.openai.com/v1";
const OPENAI_MODEL = "gpt-4o";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "meta/llama-3.3-70b-instruct";
const FETCH_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Resolve which chat provider should answer stylist messages.
 * `auto` (default) prefers NVIDIA, then OpenAI, then the rule-based mock.
 */
export function resolveStylistProvider(): StylistProvider {
  const forced = process.env.STYLIST_PROVIDER?.trim().toLowerCase();
  if (forced === "openai" || forced === "nvidia" || forced === "mock") {
    return forced;
  }
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok || !RETRYABLE_STATUS.has(response.status)) return response;
      lastError = new Error(`Chat API status ${response.status}`);
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

  throw lastError instanceof Error ? lastError : new Error("Chat API request failed");
}

interface ChatProviderConfig {
  name: "openai" | "nvidia";
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getProviderConfig(provider: StylistProvider): ChatProviderConfig | null {
  switch (provider) {
    case "nvidia": {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured");
      return {
        name: "nvidia",
        apiKey,
        baseUrl: (process.env.NVIDIA_BASE_URL || NVIDIA_API_URL).replace(/\/+$/, ""),
        model: process.env.NVIDIA_MODEL || NVIDIA_MODEL,
      };
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
      return {
        name: "openai",
        apiKey,
        baseUrl: OPENAI_API_URL,
        model: process.env.OPENAI_MODEL || OPENAI_MODEL,
      };
    }
    default:
      return null;
  }
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
  if (context.sizePreference) profile.push(`Size system: ${context.sizePreference}`);
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

  const analytics: string[] = [];
  if (context.scoreTrend && context.totalAnalyses >= 4) {
    analytics.push(
      `Score trend: ${context.scoreTrend.direction} — recent average ${Math.round(
        context.scoreTrend.recentAverage
      )} vs earlier ${Math.round(context.scoreTrend.earlierAverage)}`
    );
  }
  if (context.categoryBreakdown?.length) {
    const top = context.categoryBreakdown
      .slice(0, 3)
      .map(
        (c) =>
          `${c.category} (avg ${Math.round(c.averageScore)}, ${c.count} ${
            c.count === 1 ? "item" : "items"
          })`
      )
      .join(", ");
    analytics.push(`Category strength: ${top}`);
  }
  if (context.recentItems?.length) {
    analytics.push(
      `Recently analyzed: ${context.recentItems
        .slice(0, 5)
        .map((i) => `${i.category}${i.subtype ? ` (${i.subtype})` : ""} (${Math.round(i.score)})`)
        .join(", ")}`
    );
  }
  if (context.wardrobeTags?.length) {
    analytics.push(`Wardrobe staples: ${context.wardrobeTags.slice(0, 6).join(", ")}`);
  }
  if (context.topStyleTypes?.length) {
    analytics.push(`Dominant style: ${context.topStyleTypes.slice(0, 3).join(", ")}`);
  }
  const colorLeanings: string[] = [];
  if (context.preferredColors?.length)
    colorLeanings.push(`prefers ${context.preferredColors.join(", ")}`);
  if (context.avoidColors?.length) colorLeanings.push(`avoids ${context.avoidColors.join(", ")}`);
  if (colorLeanings.length) analytics.push(`Color leanings: ${colorLeanings.join("; ")}`);
  if (analytics.length > 0) {
    lines.push(`Analytics:\n- ${analytics.join("\n- ")}`);
  }

  return lines.join("\n\n");
}

async function callChatCompletion(
  provider: ChatProviderConfig,
  messages: StylistMessageInput[],
  context: StylistContext
): Promise<string> {
  const response = await fetchWithRetry(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
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
    throw new Error(`${provider.name} API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty response from ${provider.name}`);
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
      const staples =
        context.wardrobeTags && context.wardrobeTags.length
          ? ` Your staples lean ${context.wardrobeTags.slice(0, 3).join(", ")}.`
          : "";
      return `You have ${context.wardrobeCount} pieces in your wardrobe${folders}.${staples} Start with your strongest category${
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
  const trend =
    context.scoreTrend && context.scoreTrend.direction !== "stable"
      ? ` and your fit is trending ${context.scoreTrend.direction}`
      : "";
  return `${greeting}here's a thought based on${recent || " your profile"}: keep the hero piece simple and let one statement detail (color, texture, or silhouette) carry the look${trend}. Tell me what you're styling for and I'll get more specific.`;
}

/**
 * Generate a stylist reply for the conversation. Routes to the configured chat
 * provider (NVIDIA → OpenAI → mock) and falls back to rule-based advice when
 * the provider is unavailable or fails.
 */
export async function generateStylistReply(params: {
  messages: StylistMessageInput[];
  context: StylistContext;
}): Promise<string> {
  const provider = resolveStylistProvider();

  try {
    const config = getProviderConfig(provider);
    if (!config) return mockStylistReply(params.messages, params.context);
    return await callChatCompletion(config, params.messages, params.context);
  } catch (err) {
    getLogger().warn({ err, provider }, "Stylist reply failed — falling back to mock");
    return mockStylistReply(params.messages, params.context);
  }
}
