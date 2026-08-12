import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "@/lib/api/route";
import { listTrendItems } from "@/lib/db/queries";
import { getCached, setCached } from "@/lib/trend/cache";
import { rowToTrendItem } from "@/lib/trend/normalize";
import { buildTrendCacheKey } from "@/lib/trend/cache";
import { getCurrentSeason, rankTrendItems } from "@/lib/trend/ranking";
import { ensureTrendItemsSeeded, maybeRefreshTrendItems } from "@/lib/trend/sync";
import type { TrendItem } from "@/types/trend";

/**
 * GET /api/trending
 * Query: limit, category, season, gender, featured, occasion, brand
 *
 * Serves normalized TrendItem objects from the local DB only.
 * Never calls third-party fashion APIs from this route.
 */
export const GET = withApiRoute("/api/trending", async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "12", 10) || 12, 1),
      48
    );
    const category = searchParams.get("category") || undefined;
    const season = searchParams.get("season") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const occasion = searchParams.get("occasion") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const featuredParam = searchParams.get("featured");
    const featured =
      featuredParam === "true" ? true : featuredParam === "false" ? false : undefined;

    const cacheKey = buildTrendCacheKey({
      limit,
      category,
      season,
      gender,
      occasion,
      brand,
      featured,
    });

    const cached = await getCached<TrendItem[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ items: cached, cached: true });
    }

    // Seed curated items on first empty DB
    await ensureTrendItemsSeeded();

    // Refresh from live providers in the background when data is stale
    await maybeRefreshTrendItems();

    const rows = await listTrendItems({
      limit: Math.min(limit * 2, 48), // over-fetch slightly for ranking
      category,
      season,
      gender,
      featured: featured === true ? true : undefined,
      occasion,
      brand,
    });

    const items = rankTrendItems(
      rows.map(rowToTrendItem),
      { currentSeason: season || getCurrentSeason() }
    ).slice(0, limit);

    await setCached(cacheKey, items);

    return NextResponse.json({ items, cached: false });
});