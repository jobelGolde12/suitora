/**
 * Season helpers — pure, hemisphere-neutral, no network.
 */

import type { SkinTone } from "@/types";

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export interface SeasonInfo {
  key: SeasonKey;
  label: string;
  emoji: string;
}

export const SEASONAL_TIPS: Record<
  SeasonKey,
  { clothing: string; colors: string; skinToneNudge?: Partial<Record<SkinTone, string>> }
> = {
  spring:
    {
      clothing:
        "Light layers and soft textures — think linen blends, breathable knits, and pieces you can peel as the day warms.",
      colors:
        "Fresh pastels and clear mid-tones wake up winter-worn palettes without jumping straight to summer brights.",
      skinToneNudge: {
        warm: "Coral, peach, and soft gold flatter warm undertones this season.",
        cool: "Soft lilac, mint, and icy pink keep cool undertones luminous.",
        olive: "Sage and dusty rose play especially well with olive skin in spring.",
      },
    },
  summer: {
    clothing:
      "Prioritize breathable fabrics and clean silhouettes — shorts, airy dresses, and open-weave shirts that move with heat.",
    colors:
      "Crisp whites, ocean blues, and saturated accents read intentional rather than loud in strong light.",
    skinToneNudge: {
      warm: "Terracotta and sunflower accents glow against warm skin in summer sun.",
      cool: "Jewel-toned blues and berry keep cool undertones vivid in bright light.",
      deep: "High-contrast white and bold color blocks photograph beautifully on deep tones.",
    },
  },
  autumn: {
    clothing:
      "Lean into structure and texture — tailored jackets, mid-weight knits, and boots that ground the look.",
    colors:
      "Earthy neutrals and muted warmth (camel, rust, olive) carry autumn without feeling costume-y.",
    skinToneNudge: {
      warm: "Burnt orange and cognac deepen warm undertones beautifully.",
      cool: "Plum and forest green keep cool undertones rich as light softens.",
      olive: "Olive, mustard, and brick are natural allies this season.",
    },
  },
  winter: {
    clothing:
      "Build around a strong outer layer, then add insulating mid-layers so proportion stays sharp under coats.",
    colors:
      "Deep neutrals with one polished accent (cream, burgundy, or ice) keep winter looks intentional.",
    skinToneNudge: {
      cool: "True red, emerald, and icy white are classic cool-winter winners.",
      warm: "Camel coats and soft ivory soften winter without washing warm skin out.",
      neutral: "Charcoal + cream is a reliable winter base for neutral undertones.",
    },
  },
};

/** Meteorological season using northern-hemisphere month boundaries (hemisphere-neutral default). */
export function getCurrentSeason(date: Date = new Date()): SeasonInfo {
  const month = date.getMonth(); // 0–11
  if (month >= 2 && month <= 4) {
    return { key: "spring", label: "Spring", emoji: "🌿" };
  }
  if (month >= 5 && month <= 7) {
    return { key: "summer", label: "Summer", emoji: "☀️" };
  }
  if (month >= 8 && month <= 10) {
    return { key: "autumn", label: "Autumn", emoji: "🍂" };
  }
  return { key: "winter", label: "Winter", emoji: "❄️" };
}

export function getSeasonalTip(
  season: SeasonKey | SeasonInfo = getCurrentSeason(),
  skinTone?: SkinTone | null
): string {
  const key = typeof season === "string" ? season : season.key;
  const entry = SEASONAL_TIPS[key];
  const nudge =
    skinTone && entry.skinToneNudge?.[skinTone]
      ? ` ${entry.skinToneNudge[skinTone]}`
      : "";
  return `${entry.clothing} ${entry.colors}${nudge}`.trim();
}

/** Categories that tend to be season-sensitive for a one-line results tip. */
const SEASONAL_CATEGORIES = new Set([
  "outerwear",
  "footwear",
  "dresses",
  "activewear",
]);

export function isSeasonalCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  return SEASONAL_CATEGORIES.has(category.toLowerCase());
}

export function getResultsSeasonalLine(
  category: string | null | undefined,
  date: Date = new Date()
): string | null {
  if (!isSeasonalCategory(category)) return null;
  const season = getCurrentSeason(date);
  const tip = SEASONAL_TIPS[season.key];
  return `${season.label} tip: ${tip.clothing.split("—")[0].trim()}.`;
}
