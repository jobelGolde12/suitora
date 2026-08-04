import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { auth } from "@/lib/auth";
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
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = request.nextUrl;
    const analysisId = searchParams.get("analysisId");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "6", 10) || 6, 1),
      12
    );

    if (!analysisId) {
      return apiError("Missing analysisId", 400);
    }

    const analysis = await getAnalysisById(analysisId);
    if (!analysis || analysis.userId !== session.user.id) {
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
    const profile = await getProfileByUserId(session.user.id);
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
  } catch (err) {
    console.error("Error in GET /api/trending/similar:", err);
    return apiError("Failed to load similar items", 500);
  }
}
