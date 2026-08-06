import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { stylistRateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { parseBody } from "@/lib/api/request";
import { stylistMessageSchema } from "@/lib/validation";
import {
  addStylistMessage,
  countStylistMessagesThisMonth,
  getAnalysesByUserId,
  getDashboardStats,
  getFavoritesByUserId,
  getProfileByUserId,
  getStylistMessages,
  getWardrobeFavoritesByUserId,
  getWardrobeFoldersByUserId,
  parseJsonObject,
} from "@/lib/db/queries";
import {
  generateStylistReply,
  type StylistContext,
  type StylistMessageInput,
} from "@/lib/ai/stylist";
import { getCurrentSeason } from "@/lib/season";
import type { FitPreference, SkinTone, StyleTag } from "@/types";

const STYLIST_MONTHLY_LIMIT = Number(process.env.STYLIST_MONTHLY_LIMIT || 10);

const SKIN_TONES: SkinTone[] = ["warm", "cool", "neutral", "olive", "deep"];
const FIT_PREFERENCES: FitPreference[] = ["tight", "regular", "relaxed", "oversized"];

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function extractCategory(meta: Record<string, unknown> | null): string | null {
  const itemProfile = meta?.itemProfile as { category?: string } | undefined;
  return itemProfile?.category ?? null;
}

async function buildContext(userId: string): Promise<StylistContext> {
  const [profile, analyses, favorites, stats, wardrobeRows, folders] =
    await Promise.all([
      getProfileByUserId(userId),
      getAnalysesByUserId(userId, 50),
      getFavoritesByUserId(userId),
      getDashboardStats(userId),
      getWardrobeFavoritesByUserId(userId),
      getWardrobeFoldersByUserId(userId),
    ]);

  const scores = analyses.map((a) => a.overallScore);
  const skinTone = SKIN_TONES.includes(profile?.skinTone as SkinTone)
    ? (profile?.skinTone as SkinTone)
    : null;
  const fitPreference = FIT_PREFERENCES.includes(
    profile?.fitPreference as FitPreference
  )
    ? (profile?.fitPreference as FitPreference)
    : null;

  const categoryScores = new Map<string, number[]>();
  for (const a of analyses) {
    const cat = extractCategory(parseJsonObject(a.compatibilityMetadata));
    if (!cat) continue;
    const list = categoryScores.get(cat) ?? [];
    list.push(a.overallScore);
    categoryScores.set(cat, list);
  }

  let bestCategory: string | null = null;
  let worstCategory: string | null = null;
  let bestAvg = -Infinity;
  let worstAvg = Infinity;
  for (const [cat, vals] of categoryScores) {
    if (vals.length < 1) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestCategory = cat;
    }
    if (avg < worstAvg) {
      worstAvg = avg;
      worstCategory = cat;
    }
  }

  const favoriteCategories = Array.from(
    new Set(
      favorites
        .map(({ analysis }) =>
          extractCategory(parseJsonObject(analysis.compatibilityMetadata))
        )
        .filter((c): c is string => !!c)
    )
  ).slice(0, 8);

  const season = getCurrentSeason();

  return {
    bodyShape: profile?.bodyShape ?? null,
    skinTone,
    styleTags: parseJsonArray(profile?.styleTags) as StyleTag[],
    fitPreference,
    totalAnalyses: stats.totalAnalyses,
    averageScore: stats.averageScore,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    favoriteCount: favorites.length,
    recentScores: scores.slice(0, 10),
    wardrobeCount: wardrobeRows.length,
    folderNames: folders.map((f) => f.name),
    favoriteCategories,
    currentSeason: season.label,
    bestCategory,
    worstCategory,
  };
}

/**
 * GET /api/stylist?limit=&offset=
 * Returns the user's persisted conversation history plus monthly usage.
 */
export const GET = withApiRoute("/api/stylist", async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("Unauthorized", 401);
  withUserId(user.id);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1),
    100
  );
  const offset = Math.max(
    parseInt(searchParams.get("offset") || "0", 10) || 0,
    0
  );

  const [messages, used] = await Promise.all([
    getStylistMessages(user.id, limit, offset),
    countStylistMessagesThisMonth(user.id),
  ]);

  return apiOk({
    messages,
    limit,
    offset,
    usage: {
      used,
      limit: STYLIST_MONTHLY_LIMIT,
      remaining: Math.max(0, STYLIST_MONTHLY_LIMIT - used),
    },
  });
});

/**
 * POST /api/stylist
 * Body: { message: string }
 * Persists the user message, generates (and persists) a stylist reply.
 */
export const POST = withApiRoute("/api/stylist", async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("Unauthorized", 401);
  const userId = user.id;
  withUserId(userId);

  const rate = await enforceRateLimit(stylistRateLimiter, userId);
  if (!rate.success) {
    const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
    return apiRateLimitError(
      "Too many stylist requests. Please try again later.",
      retryAfter
    );
  }

  const parsed = await parseBody(stylistMessageSchema, req);
  if (parsed.error) return parsed.error;
  const message = parsed.data.message.trim();

  const [used, history, context] = await Promise.all([
    countStylistMessagesThisMonth(userId),
    getStylistMessages(userId, 40),
    buildContext(userId),
  ]);
  context.name = user.name;

  if (used >= STYLIST_MONTHLY_LIMIT) {
    return apiError(
      `You've reached your monthly Stylist limit of ${STYLIST_MONTHLY_LIMIT} messages.`,
      429
    );
  }

  await addStylistMessage(userId, "user", message);

  const messages: StylistMessageInput[] = [
    ...history.map(({ role, content }) => ({
      role: role as StylistMessageInput["role"],
      content,
    })),
    { role: "user", content: message },
  ];

  const reply = await generateStylistReply({ messages, context });
  await addStylistMessage(userId, "assistant", reply);

  return apiOk({
    message: reply,
    usage: {
      used: used + 1,
      limit: STYLIST_MONTHLY_LIMIT,
      remaining: Math.max(0, STYLIST_MONTHLY_LIMIT - used - 1),
    },
  });
});
