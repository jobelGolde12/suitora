/**
 * AI Stylist — context-aware fashion chat.
 *
 * Uses OpenAI-compatible chat-completion endpoints (Groq, NVIDIA, OpenAI).
 * All configured providers are raced in parallel and the first real reply
 * wins; the rule-based mock is only a last resort so the feature always works.
 *
 * Provider selection (STYLIST_PROVIDER=auto|groq|openai|nvidia|mock):
 *   - explicit value wins
 *   - otherwise every configured provider is raced: Groq, then OpenAI, then
 *     NVIDIA (Groq is first because it is fast and has a generous free tier)
 *
 * Circuit breaker: a provider that fails (timeout, auth error, exhausted
 * quota) is skipped for a short cooldown, so a dead endpoint never stalls the
 * chat twice in a row.
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

export type StylistProvider = "auto" | "groq" | "openai" | "nvidia" | "mock";

const OPENAI_API_URL = "https://api.openai.com/v1";
const OPENAI_MODEL = "gpt-4o";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_MODEL = "meta/llama-3.3-70b-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// Providers are raced in parallel — the first real reply wins. Groq first
// (fast + free tier), OpenAI second, NVIDIA last.
const PROVIDER_RACE_ORDER: StylistProvider[] = ["groq", "openai", "nvidia"];
// Per-attempt ceiling for a single provider HTTP call. The stylist is prompted
// to reply in 2–5 sentences, so generations are short — 4s comfortably covers
// them while keeping failover from a hung endpoint fast.
const FETCH_TIMEOUT_MS = 4_000;
// Hard failures (timeout, network, auth) mean the provider is effectively dead
// for a while — skip it for 5 minutes so every message doesn't pay the same
// timeout again.
const HARD_FAILURE_COOLDOWN_MS = 5 * 60_000;
// Transient failures (5xx, rate-limit 429) usually recover quickly — skip for
// only 30 seconds so a healthy provider isn't starved for minutes.
const TRANSIENT_FAILURE_COOLDOWN_MS = 30_000;

// ── Circuit breaker ────────────────────────────────────────────────
const providerCooldownUntil = new Map<string, number>();

/** Reset the circuit-breaker state (used in tests). */
export function resetStylistProviderHealth(): void {
  providerCooldownUntil.clear();
}

function isProviderAvailable(provider: StylistProvider): boolean {
  const until = providerCooldownUntil.get(provider);
  return until === undefined || Date.now() >= until;
}

function markProviderUnavailable(provider: StylistProvider, cooldownMs: number): void {
  providerCooldownUntil.set(provider, Date.now() + cooldownMs);
}

/**
 * Resolve which chat provider should answer stylist messages.
 * `auto` (default) races Groq, then OpenAI, then NVIDIA, then the rule-based
 * mock.
 */
export function resolveStylistProvider(): StylistProvider {
  const forced = process.env.STYLIST_PROVIDER?.trim().toLowerCase();
  if (forced === "groq" || forced === "openai" || forced === "nvidia" || forced === "mock") {
    return forced;
  }
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.NVIDIA_API_KEY) return "nvidia";
  return "mock";
}

function isProviderConfigured(provider: StylistProvider): boolean {
  switch (provider) {
    case "groq":
      return !!process.env.GROQ_API_KEY;
    case "openai":
      return !!process.env.OPENAI_API_KEY;
    case "nvidia":
      return !!process.env.NVIDIA_API_KEY;
    default:
      return false;
  }
}

interface ChatProviderConfig {
  name: "groq" | "openai" | "nvidia";
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getProviderConfig(provider: StylistProvider): ChatProviderConfig {
  switch (provider) {
    case "groq": {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
      return {
        name: "groq",
        apiKey,
        baseUrl: (process.env.GROQ_BASE_URL || GROQ_API_URL).replace(/\/+$/, ""),
        model: process.env.GROQ_MODEL || GROQ_MODEL,
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
    default:
      throw new Error(`Unknown stylist provider: ${provider}`);
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

/**
 * Categorize a provider failure so the circuit breaker can pick the right
 * cooldown: hard failures (timeout, network, auth) get a long cooldown,
 * transient ones (5xx, 429) get a short one.
 */
function failureCooldownMs(provider: ChatProviderConfig, err: unknown): number {
  const message = err instanceof Error ? err.message : String(err);
  // Timeout / network abort → the endpoint is unreachable; treat as hard.
  if (message.includes("aborted") || message.includes("fetch failed")) {
    return HARD_FAILURE_COOLDOWN_MS;
  }
  if (message.includes(`${provider.name} API error: 5`)) {
    return TRANSIENT_FAILURE_COOLDOWN_MS;
  }
  // Auth (401/403) and quota (429 credit exhaustion) won't recover on their own.
  if (message.includes(`${provider.name} API error: 4`)) {
    return HARD_FAILURE_COOLDOWN_MS;
  }
  return HARD_FAILURE_COOLDOWN_MS;
}

/**
 * Timeout-aware chat completion call. The external signal lets the race abort
 * losers as soon as a winner answers; the internal timer guarantees the call
 * never outlives the per-attempt budget. Both are always cleaned up.
 */
async function callChatCompletion(
  provider: ChatProviderConfig,
  messages: StylistMessageInput[],
  context: StylistContext,
  externalSignal: AbortSignal
): Promise<string> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
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
      signal: AbortSignal.any([externalSignal, timeoutController.signal]),
    });
  } catch (err) {
    throw new Error(`${provider.name} request failed: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

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

type ProviderAttempt = {
  provider: StylistProvider;
  run: (signal: AbortSignal) => Promise<string>;
};

/**
 * Race provider attempts in parallel. Resolves with the first real reply and
 * aborts the losers; rejects only when every attempt has failed.
 */
async function raceProviders(attempts: ProviderAttempt[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const controllers = new Map<StylistProvider, AbortController>();
    let pending = attempts.length;
    let settled = false;

    if (attempts.length === 0) {
      reject(new Error("No stylist providers to race"));
      return;
    }

    for (const attempt of attempts) {
      const controller = new AbortController();
      controllers.set(attempt.provider, controller);

      attempt
        .run(controller.signal)
        .then((content) => {
          if (settled) return;
          settled = true;
          // Free the losers so a hung endpoint doesn't keep a socket open.
          for (const c of controllers.values()) c.abort();
          resolve(content);
        })
        .catch((err) => {
          if (settled) return; // aborted because another provider already won
          // Hard failures get a long cooldown, transient ones a short one.
          const providerConfig = getProviderConfig(attempt.provider);
          markProviderUnavailable(attempt.provider, failureCooldownMs(providerConfig, err));
          getLogger().warn(
            { err, provider: attempt.provider },
            "Stylist provider failed"
          );
          pending -= 1;
          if (pending === 0) {
            settled = true;
            reject(new Error("All stylist providers failed"));
          }
        });
    }
  });
}

/**
 * Generate a stylist reply for the conversation. Races every configured chat
 * provider in parallel (Groq → OpenAI → NVIDIA) and falls back to rule-based
 * advice when all providers are unavailable or fail.
 */
export async function generateStylistReply(params: {
  messages: StylistMessageInput[];
  context: StylistContext;
}): Promise<string> {
  // An explicit STYLIST_PROVIDER wins; otherwise race every configured provider
  // that is not in a cooldown.
  const forced = process.env.STYLIST_PROVIDER?.trim().toLowerCase();
  const candidates: StylistProvider[] = forced
    ? [forced as StylistProvider]
    : PROVIDER_RACE_ORDER.filter((p) => isProviderConfigured(p) && isProviderAvailable(p));

  const attempts: ProviderAttempt[] = [];
  for (const provider of candidates) {
    let config: ChatProviderConfig;
    try {
      config = getProviderConfig(provider);
    } catch (err) {
      getLogger().warn({ err, provider }, "Stylist provider misconfigured — skipping");
      continue;
    }
    attempts.push({
      provider,
      run: (signal) => callChatCompletion(config, params.messages, params.context, signal),
    });
  }

  if (attempts.length === 0) {
    // No configured & healthy provider — reply instantly with rules.
    getLogger().info({}, "No healthy stylist providers — using rule-based reply");
    return mockStylistReply(params.messages, params.context);
  }

  try {
    return await raceProviders(attempts);
  } catch (err) {
    getLogger().warn({ err }, "All stylist providers failed — falling back to rule-based reply");
    return mockStylistReply(params.messages, params.context);
  }
}
