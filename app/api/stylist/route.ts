import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { stylistRateLimiter } from "@/lib/rate-limit";
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
const MAX_MESSAGE_LENGTH = 2000;

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
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return apiError("Unauthorized", 401);

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
      getStylistMessages(session.user.id, limit, offset),
      countStylistMessagesThisMonth(session.user.id),
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
  } catch (err) {
    console.error("Error in GET /api/stylist:", err);
    return apiError("Failed to load stylist history", 500);
  }
}

/**
 * POST /api/stylist
 * Body: { message: string }
 * Persists the user message, generates (and persists) a stylist reply.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return apiError("Unauthorized", 401);
    const userId = session.user.id;

    const rate = await stylistRateLimiter.limit(userId);
    if (!rate.success) {
      return apiError("Too many stylist requests. Please try again later.", 429);
    }

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return apiError("Message is required", 400);
    if (message.length > MAX_MESSAGE_LENGTH) {
      return apiError(`Message must be under ${MAX_MESSAGE_LENGTH} characters`, 400);
    }

    const [used, history, context] = await Promise.all([
      countStylistMessagesThisMonth(userId),
      getStylistMessages(userId, 40),
      buildContext(userId),
    ]);
    context.name = session.user.name;

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
  } catch (err) {
    console.error("Error in POST /api/stylist:", err);
    return apiError("Failed to generate stylist reply", 500);
  }
}
