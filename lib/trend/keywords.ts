/**
 * Rotating fashion keyword lists for trend discovery.
 * Used by providers like SerpAPI to query Google Shopping for trending items.
 *
 * Keywords are grouped by category and season to maximize relevance
 * while staying within API rate limits (100 searches/month on free tier).
 */

import { getCurrentSeason } from "./ranking";

// --- Keyword Registry ---

interface KeywordGroup {
  category: string;
  keywords: string[];
}

/**
 * Season-agnostic base keywords per category.
 * These rotate every sync cycle to avoid hitting the same queries.
 */
const BASE_KEYWORDS: KeywordGroup[] = [
  {
    category: "dresses",
    keywords: [
      "trending dresses 2026",
      "summer dress women",
      "midi dress fashion",
      "maxi dress new arrivals",
      "cocktail dress popular",
      "wrap dress trending",
      "slip dress women",
      "sundress casual",
    ],
  },
  {
    category: "tops",
    keywords: [
      "women's tops trending",
      "silk blouse fashion",
      "linen shirt men",
      "cropped top popular",
      "graphic tee trending",
      "knit sweater new",
      "oxford shirt men",
      "camisole top women",
    ],
  },
  {
    category: "bottoms",
    keywords: [
      "wide leg trousers trending",
      "high waist jeans popular",
      "linen pants men",
      "cargo pants fashion",
      "pleated skirt women",
      "tailored trousers new",
      "denim shorts summer",
      "chinos men casual",
    ],
  },
  {
    category: "outerwear",
    keywords: [
      "trench coat trending",
      "denim jacket popular",
      "blazer women fashion",
      "leather jacket men",
      "puffer jacket winter",
      "windbreaker casual",
      "wool coat women",
      "bomber jacket trending",
    ],
  },
  {
    category: "footwear",
    keywords: [
      "sneakers trending 2026",
      "white leather sneakers",
      "ankle boots women",
      "loafers men popular",
      "sandals summer fashion",
      "platform shoes women",
      "running shoes new",
      "canvas shoes casual",
    ],
  },
  {
    category: "accessories",
    keywords: [
      "crossbody bag trending",
      "gold jewelry popular",
      "sunglasses fashion 2026",
      "watch men minimalist",
      "scarf women silk",
      "belt leather popular",
      "hat bucket trending",
      "tote bag canvas",
    ],
  },
  {
    category: "activewear",
    keywords: [
      "athleisure set women",
      "yoga pants trending",
      "sports bra popular",
      "gym shorts men",
      "running leggings",
      "activewear set matching",
      "training shoes popular",
      "sports jacket lightweight",
    ],
  },
  {
    category: "formal",
    keywords: [
      "blazer women formal",
      "tailored suit men",
      "cocktail outfit women",
      "dress shirt formal",
      "pencil skirt office",
      "trousers formal men",
      "sheath dress professional",
      "waistcoat vest men",
    ],
  },
];

// --- Seasonal Boosts ---

const SEASONAL_KEYWORDS: Record<string, string[]> = {
  spring: [
    "spring fashion trends",
    "spring collection new",
    "lightweight jacket spring",
    "floral dress spring",
  ],
  summer: [
    "summer fashion trends",
    "beach cover up",
    "swimwear popular",
    "linen summer outfit",
    "shorts casual summer",
  ],
  fall: [
    "fall fashion trends",
    "autumn layers outfit",
    "leather boots fall",
    "knit sweater cozy",
    "plaid shirt fall",
  ],
  winter: [
    "winter fashion trends",
    "cashmere sweater luxury",
    "wool coat warm",
    "thermal leggings winter",
    "puffer jacket insulated",
  ],
};

// --- Keyword Rotation State ---

/**
 * Track which keywords have been used recently to rotate through them.
 * Resets periodically so every keyword gets a turn.
 */
let rotationIndex = 0;

/**
 * Get the next batch of keywords to query.
 * Returns a flat list of keyword strings, rotating through the registry
 * to spread API calls across categories over time.
 *
 * @param count - Number of keywords to return (default: 5, SerpAPI free tier cap)
 * @param season - Override season (defaults to current)
 */
export function getKeywords(
  count = 5,
  season?: string
): string[] {
  const currentSeason = season || getCurrentSeason();
  const seasonalPool = SEASONAL_KEYWORDS[currentSeason] ?? [];

  // Flatten all base keywords
  const allBase = BASE_KEYWORDS.flatMap((group) => group.keywords);

  // Interleave: take one from each category, then add seasonal boosters
  const selected: string[] = [];

  // Round-robin through categories
  const categoryCount = BASE_KEYWORDS.length;
  for (let i = 0; i < count && i < allBase.length; i++) {
    const catIndex = (rotationIndex + i) % categoryCount;
    const group = BASE_KEYWORDS[catIndex];
    const kwIndex = Math.floor((rotationIndex + i) / categoryCount) % group.keywords.length;
    selected.push(group.keywords[kwIndex]);
  }

  // Fill remaining slots with seasonal keywords
  if (selected.length < count && seasonalPool.length > 0) {
    const remaining = count - selected.length;
    for (let i = 0; i < remaining; i++) {
      const idx = (rotationIndex + i) % seasonalPool.length;
      selected.push(seasonalPool[idx]);
    }
  }

  // Advance rotation
  rotationIndex = (rotationIndex + 1) % Math.max(allBase.length, 1);

  return selected.slice(0, count);
}

/**
 * Get all keywords for a specific category.
 * Useful for targeted category syncs.
 */
export function getKeywordsForCategory(category: string): string[] {
  const group = BASE_KEYWORDS.find(
    (g) => g.category === category.toLowerCase()
  );
  return group?.keywords ?? [];
}

/**
 * Get a random keyword from the pool.
 * Used for single-query explorations.
 */
export function getRandomKeyword(season?: string): string {
  const keywords = getKeywords(1, season);
  return keywords[0] ?? "trending fashion";
}
