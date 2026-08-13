import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/api/request";
import { stylistMessageSchema } from "@/lib/validation";
import {
  addStylistMessage,
  countStylistMessagesThisMonth,
  getStylistMessages,
} from "@/lib/db/queries";
import {
  generateStylistReply,
  type StylistContext,
  type StylistMessageInput,
} from "@/lib/ai/stylist";
import { getCurrentSeason } from "@/lib/season";

const STYLIST_MONTHLY_LIMIT = Number(process.env.STYLIST_MONTHLY_LIMIT || 10);

async function buildContext(): Promise<StylistContext> {
  // Simplified context builder for the error-handling reference. The full
  // context builder (profile, analyses, wardrobe, analytics) lives in
  // `app/api/stylist/route.ts` and in `api-route-fix.ts`.
  return {
    bodyShape: null,
    skinTone: null,
    styleTags: [],
    fitPreference: null,
    sizePreference: null,
    totalAnalyses: 0,
    averageScore: 0,
    bestScore: null,
    favoriteCount: 0,
    recentScores: [],
    wardrobeCount: 0,
    folderNames: [],
    favoriteCategories: [],
    currentSeason: getCurrentSeason().label,
    bestCategory: null,
    worstCategory: null,
    categoryBreakdown: [],
    scoreTrend: {
      direction: "stable",
      recentAverage: 0,
      earlierAverage: 0,
    },
    recentItems: [],
    wardrobeTags: [],
    preferredColors: [],
    avoidColors: [],
    topStyleTypes: [],
  };
}

/**
 * GET /api/stylist?limit=&offset=
 * Returns the user's persisted conversation history plus monthly usage.
 */
export const GET = withApiRoute("/api/stylist", async (req: Request) => {
  try {
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
  } catch (error) {
    console.error("GET /api/stylist error:", error);
    return apiError("Internal server error", 500);
  }
});

/**
 * POST /api/stylist
 * Body: { message: string }
 * Persists the user message, generates (and persists) a stylist reply.
 */
export const POST = withApiRoute("/api/stylist", async (req: Request) => {
  try {
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
      buildContext(),
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
  } catch (error) {
    console.error("POST /api/stylist error:", error);
    return apiError("Internal server error", 500);
  }
});

/**
 * Error handling utilities for the AI Stylist API.
 *
 * Note: the route handlers above are already wrapped in `withApiRoute`, which
 * funnels thrown errors through `handleError` (lib/api/response.ts). The
 * try/catch blocks in the handlers are intentionally redundant-safe: they
 * return the same 500 shape the wrapper would produce, keeping the handler
 * self-contained for tests. Prefer throwing from handlers and letting the
 * wrapper centralize error responses for new routes.
 */
export const handleApiError = (error: Error) => {
  console.error("API Error:", error);
  return apiError("Internal server error", 500);
};

export const rateLimitError = (message: string, retryAfter: number) => {
  return apiRateLimitError(message, retryAfter);
};
