import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { parseBody } from "@/lib/api/request";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import {
  favoriteOutfitDeleteSchema,
  favoriteOutfitSchema,
} from "@/lib/validation";
import {
  addFavoriteOutfit,
  getFavoriteOutfitsByUserId,
  removeFavoriteOutfit,
} from "@/lib/db/queries";
import type { TrendOutfit } from "@/types/trend";

/**
 * GET /api/wardrobe/outfits/favorite — list saved outfits
 * POST /api/wardrobe/outfits/favorite — body: { outfit: TrendOutfit }
 * DELETE /api/wardrobe/outfits/favorite?id=<id>
 */
export const GET = withApiRoute("/api/wardrobe/outfits/favorite", async () => {
  const user = await requireUser();
  if (!user) return apiError("Unauthorized", 401);
  withUserId(user.id);

  const rows = await getFavoriteOutfitsByUserId(user.id);
  const saved = rows
    .map((row) => {
      try {
        const outfit = JSON.parse(row.outfit) as TrendOutfit;
        return {
          favoriteId: row.id,
          ...outfit,
          createdAt: row.createdAt,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return apiOk({ saved });
});

export const POST = withApiRoute("/api/wardrobe/outfits/favorite", async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("Unauthorized", 401);
  withUserId(user.id);

  const rl = await enforceRateLimit(stylistRateLimiter, user.id);
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return apiRateLimitError(
      "Too many requests. Please try again later.",
      retryAfter
    );
  }

  const parsed = await parseBody(favoriteOutfitSchema, req);
  if (parsed.error) return parsed.error;
  const { outfit } = parsed.data;

  const snapshot = {
    id: outfit.id,
    name: outfit.name,
    items: outfit.items,
    overallScore: outfit.overallScore,
    coherenceScore: outfit.coherenceScore ?? 0,
    colorStoryScore: outfit.colorStoryScore ?? 0,
    proportionScore: outfit.proportionScore ?? 0,
    formalityConsistency: outfit.formalityConsistency ?? 0,
    seasonTags: outfit.seasonTags ?? [],
    occasionTags: outfit.occasionTags ?? [],
    stylingTips: outfit.stylingTips ?? [],
    createdAt: outfit.createdAt || new Date().toISOString(),
  };

  const row = await addFavoriteOutfit(user.id, JSON.stringify(snapshot));

  return apiOk({
    favorite: {
      favoriteId: row.id,
      ...snapshot,
      createdAt: row.createdAt,
    },
  });
});

export const DELETE = withApiRoute("/api/wardrobe/outfits/favorite", async (req: Request) => {
  const user = await requireUser();
  if (!user) return apiError("Unauthorized", 401);
  withUserId(user.id);

  const rl = await enforceRateLimit(stylistRateLimiter, user.id);
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return apiRateLimitError(
      "Too many requests. Please try again later.",
      retryAfter
    );
  }

  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");
  if (!id) {
    const parsed = await parseBody(favoriteOutfitDeleteSchema, req);
    if (parsed.error) return parsed.error;
    id = parsed.data.id;
  }
  if (!id) return apiError("id is required", 400);

  const removed = await removeFavoriteOutfit(user.id, id);
  if (!removed) return apiError("Saved outfit not found", 404);

  return apiOk();
});
