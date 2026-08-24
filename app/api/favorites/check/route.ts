import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { dbRead, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { notDeleted } from "@/lib/db/filters";
import { apiError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";

/**
 * GET /api/favorites/check?analysisId=xxx
 *
 * Lightweight endpoint to check if a specific analysis is favorited and/or
 * in the user's wardrobe. Returns only the boolean flags — no joined analysis
 * data, no full favorite objects. O(1) database lookup via the unique index
 * on (user_id, analysis_id).
 */
export const GET = withApiRoute("/api/favorites/check", async (req: Request) => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const { searchParams } = new URL(req.url);
  const analysisId = searchParams.get("analysisId");

  if (!analysisId) {
    return apiError("analysisId is required", 400);
  }

  const [favorite] = await dbRead
    .select({
      id: schema.favorites.id,
      inWardrobe: schema.favorites.inWardrobe,
      wardrobeFolder: schema.favorites.wardrobeFolder,
    })
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, user.id),
        eq(schema.favorites.analysisId, analysisId),
        notDeleted(schema.favorites)
      )
    )
    .limit(1);

  return NextResponse.json({
    isFavorited: !!favorite,
    inWardrobe: favorite?.inWardrobe ?? false,
    wardrobeFolder: favorite?.wardrobeFolder ?? null,
  });
});
