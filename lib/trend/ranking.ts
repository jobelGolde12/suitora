/**
 * Rank trend items for dashboard display.
 * Backend owns ranking; frontend renders the ordered list.
 */

import type { TrendItem } from "@/types/trend";

export interface RankOptions {
  /** Boost seasonal relevance for a given season key */
  currentSeason?: string;
  /** Prefer a gender when ranking ties */
  preferredGender?: string;
}

/**
 * Score used for ordering. Higher is better.
 * Signals: featured, popularity, season match, recency.
 */
export function computeRankScore(item: TrendItem, opts: RankOptions = {}): number {
  let score = item.popularityScore;

  if (item.isFeatured) {
    score += 40;
  }

  if (opts.currentSeason && item.season === opts.currentSeason) {
    score += 15;
  }

  if (opts.preferredGender && item.gender === opts.preferredGender) {
    score += 5;
  }

  // Mild recency boost (items updated within last 7 days)
  if (item.updatedAt) {
    const ageMs = Date.now() - new Date(item.updatedAt).getTime();
    const days = ageMs / (1000 * 60 * 60 * 24);
    if (days < 7) score += 8;
    else if (days < 30) score += 3;
  }

  return score;
}

export function rankTrendItems(
  items: TrendItem[],
  opts: RankOptions = {}
): TrendItem[] {
  return [...items].sort(
    (a, b) => computeRankScore(b, opts) - computeRankScore(a, opts)
  );
}

export function getCurrentSeason(date = new Date()): string {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}
