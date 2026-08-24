import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import {
  getDashboardStats,
  getAnalysesByUserId,
  getFavoriteAnalysisIds,
  toAnalysisResult,
} from "@/lib/db/queries";

export const GET = withApiRoute("/api/dashboard/stats", async () => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const userId = user.id;

  // Fetch independent queries in parallel — use a single analyses query
  // (limit 10) for both recent (first 5) and score trend (all 10) data.
  const [stats, analyses, favoriteAnalysisIds] = await Promise.all([
    getDashboardStats(userId),
    getAnalysesByUserId(userId, 10),
    getFavoriteAnalysisIds(userId),
  ]);

  const recentAnalysesWithFavorite = analyses.slice(0, 5).map((item) => ({
    ...toAnalysisResult(item),
    isFavorite: favoriteAnalysisIds.has(item.id),
  }));

  // Score trend: use overallScore of the recent 10 analyses in ascending
  // chronological order.
  const scoreTrend = analyses
    .map((a) => a.overallScore)
    .reverse(); // oldest first

  const bestScore =
    analyses.length > 0
      ? Math.max(...analyses.map((a) => a.overallScore))
      : null;

  const trendDates = analyses
    .map((a) => a.createdAt)
    .reverse(); // aligns with scoreTrend

  // Fallback if trend is empty
  const finalScoreTrend = scoreTrend.length > 0 ? scoreTrend : [70, 75, 80];

  const userName =
    user.name?.trim() ||
    (user.email ? user.email.split("@")[0] : null) ||
    null;

  return NextResponse.json({
    stats,
    recentAnalyses: recentAnalysesWithFavorite,
    scoreTrend: finalScoreTrend,
    trendDates,
    bestScore,
    userName,
  });
});
