import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDashboardStats, getAnalysesByUserId, getFavoritesByUserId } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get stats
    const stats = await getDashboardStats(userId);

    // 2. Get recent analyses
    const recent = await getAnalysesByUserId(userId, 5);

    // 3. Get favorites to set isFavorite on recent items
    const favorites = await getFavoritesByUserId(userId);
    const favoriteAnalysisIds = new Set(favorites.map((f) => f.favorite.analysisId));

    const recentAnalysesWithFavorite = recent.map((item) => ({
      ...item,
      isFavorite: favoriteAnalysisIds.has(item.id),
    }));

    // 4. Score trend: use overallScore of recent 10 analyses in ascending chronological order
    const trendAnalyses = await getAnalysesByUserId(userId, 10);
    const scoreTrend = trendAnalyses
      .map((a) => a.overallScore)
      .reverse(); // oldest first

    // Fallback if trend is empty
    const finalScoreTrend = scoreTrend.length > 0 ? scoreTrend : [70, 75, 80];

    return NextResponse.json({
      stats,
      recentAnalyses: recentAnalysesWithFavorite,
      scoreTrend: finalScoreTrend,
    });
  } catch (err: any) {
    console.error("Error in GET /api/dashboard/stats:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
