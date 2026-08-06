import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api/response";
import {
  getDashboardStats,
  getAnalysesByUserId,
  getFavoriteAnalysisIds,
  toAnalysisResult,
} from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Fetch independent queries in parallel — reduces worst-case latency to
    // the slowest single query instead of the sum of all query times.
    const [stats, recent, favoriteAnalysisIds, trendAnalyses] =
      await Promise.all([
        getDashboardStats(userId),
        getAnalysesByUserId(userId, 5),
        getFavoriteAnalysisIds(userId), // lightweight: only returns favorited analysis IDs
        getAnalysesByUserId(userId, 10),
      ]);

    const recentAnalysesWithFavorite = recent.map((item) => ({
      ...toAnalysisResult(item),
      isFavorite: favoriteAnalysisIds.has(item.id),
    }));

    // Score trend: use overallScore of the recent 10 analyses in ascending
    // chronological order.
    const scoreTrend = trendAnalyses
      .map((a) => a.overallScore)
      .reverse(); // oldest first

    const bestScore =
      trendAnalyses.length > 0
        ? Math.max(...trendAnalyses.map((a) => a.overallScore))
        : null;

    const trendDates = trendAnalyses
      .map((a) => a.createdAt)
      .reverse(); // aligns with scoreTrend

    // Fallback if trend is empty
    const finalScoreTrend = scoreTrend.length > 0 ? scoreTrend : [70, 75, 80];

    const userName =
      session.user.name?.trim() ||
      (session.user.email ? session.user.email.split("@")[0] : null) ||
      null;

    return NextResponse.json({
      stats,
      recentAnalyses: recentAnalysesWithFavorite,
      scoreTrend: finalScoreTrend,
      trendDates,
      bestScore,
      userName,
    });
  } catch (err) {
    console.error("Error in GET /api/dashboard/stats:", err);
    return apiError("Internal server error", 500);
  }
}
