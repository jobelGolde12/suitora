import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { validateQuery } from "@/lib/api/request";
import { similarItemsQuerySchema } from "@/lib/validation";
import { parseJsonObject } from "@/lib/db/queries";
import { getAnalysisById, getProfileByUserId, listSimilarTrendItems } from "@/lib/db/queries";
import { rowToTrendItem } from "@/lib/trend/normalize";
import { buildUserBodyProfileFromProfile, scoreTrendItemsForUser } from "@/lib/ai/similar-items";

/**
 * GET /api/trending/similar?analysisId=<id>&limit=<n>
 *
 * Returns trending items matching the analysis's product category/style tags,
 * scored against the user's stored profile via the fit-scoring engine.
 */
export const GET = withApiRoute("/api/trending/similar", async (request: NextRequest) => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const q = validateQuery(similarItemsQuerySchema, request.nextUrl.searchParams);
  if (q.error) return q.error;
  const { analysisId } = q.data;
  const limit = q.data.limit ?? 6;

  const analysis = await getAnalysisById(analysisId);
  if (!analysis || analysis.userId !== user.id) {
    return apiError("Analysis not found", 404);
  }

  // Pull category/style tags from the stored compatibility metadata.
  const metadata = parseJsonObject(analysis.compatibilityMetadata);
  const itemProfile = metadata?.itemProfile as
    | { category?: string; styleTags?: string[] }
    | undefined;

  const category = itemProfile?.category;
  if (!category) {
    return apiOk({ items: [] });
  }

  const styleTags = Array.isArray(itemProfile?.styleTags)
    ? itemProfile.styleTags
    : [];

  const rows = await listSimilarTrendItems({ category, styleTags, limit });
  const profile = await getProfileByUserId(user.id);
  const items = profile
    ? scoreTrendItemsForUser(buildUserBodyProfileFromProfile(profile), rows.map(rowToTrendItem))
    : rows.map(rowToTrendItem).map((item) => ({
        id: item.id,
        title: item.title,
        brand: item.brand,
        imageUrl: item.imageUrl,
        productUrl: item.productUrl,
        price: item.price,
        currency: item.currency,
        category: item.category,
        styleTags: item.styleTags,
        colors: item.colors,
        popularityScore: item.popularityScore,
        score: 0,
        bodyScore: 0,
        colorScore: 0,
        styleScore: 0,
        scoreLabel: "Popular pick",
      }));

  return apiOk({ items });
});
