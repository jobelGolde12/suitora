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
} from "@/lib/db/queries";
import {
  generateStylistReply,
  type StylistContext,
  type StylistMessageInput,
} from "@/lib/ai/stylist";
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

async function buildContext(userId: string): Promise<StylistContext> {
  const [profile, analyses, favorites, stats] = await Promise.all([
    getProfileByUserId(userId),
    getAnalysesByUserId(userId, 10),
    getFavoritesByUserId(userId),
    getDashboardStats(userId),
  ]);

  const scores = analyses.map((a) => a.overallScore);
  const skinTone = SKIN_TONES.includes(profile?.skinTone as SkinTone)
    ? (profile?.skinTone as SkinTone)
    : null;
  const fitPreference = FIT_PREFERENCES.includes(profile?.fitPreference as FitPreference)
    ? (profile?.fitPreference as FitPreference)
    : null;

  return {
    bodyShape: profile?.bodyShape ?? null,
    skinTone,
    styleTags: parseJsonArray(profile?.styleTags) as StyleTag[],
    fitPreference,
    totalAnalyses: stats.totalAnalyses,
    averageScore: stats.averageScore,
    bestScore: scores.length > 0 ? Math.max(...scores) : null,
    favoriteCount: favorites.length,
    recentScores: scores,
  };
}

/**
 * GET /api/stylist
 * Returns the user's persisted conversation history plus monthly usage.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return apiError("Unauthorized", 401);

    const [messages, used] = await Promise.all([
      getStylistMessages(session.user.id, 50),
      countStylistMessagesThisMonth(session.user.id),
    ]);

    return apiOk({
      messages,
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
    return apiError("Failed to get a stylist reply", 500);
  }
}
