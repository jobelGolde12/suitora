/**
 * SerpAPI Google Shopping adapter.
 *
 * Queries Google Shopping for trending fashion products via the SerpAPI REST API.
 * Free tier: 100 searches/month — keywords are rotated strategically.
 *
 * API docs: https://serpapi.com/google-shopping-api
 */

import { getKeywords } from "../keywords";
import type { RawProviderProduct } from "@/types/trend";

const SERPAPI_BASE = "https://serpapi.com/search.json";
const ENGINE = "google_shopping";
const RESULTS_PER_QUERY = 20;
const MAX_QUERIES = 5;

// --- SerpAPI Response Types ---

interface SerpApiShoppingResult {
  position: number;
  title: string;
  link: string;
  product_link?: string;
  thumbnail?: string;
  extracted_price?: number;
  price?: string;
  rating?: number;
  reviews?: number;
  source?: string;
  extensions?: string[];
}

interface SerpApiShoppingResponse {
  search_metadata?: {
    status: string;
    id: string;
  };
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

// --- Category Inference ---

function inferCategory(title: string): string {
  const lower = title.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\b(dress|gown|jumpsuit|romper|maxi|midi)\b/, "dresses"],
    [/\b(shirt|blouse|tee|t-shirt|sweater|hoodie|tank|polo|top)\b/, "tops"],
    [/\b(pants|jeans|shorts|skirt|trousers|leggings|joggers)\b/, "bottoms"],
    [/\b(jacket|coat|blazer|vest|parka|trench|windbreaker)\b/, "outerwear"],
    [/\b(shoes?|sneakers?|boots?|sandals?|heels?|loafers?|slippers?)\b/, "footwear"],
    [/\b(bag|hat|cap|scarf|belt|watch|jewelry|sunglasses?|backpack)\b/, "accessories"],
    [/\b(sports?\s*bra|leggings?|activewear|workout|gym|yoga)\b/, "activewear"],
    [/\b(suit|tuxedo|formal|office|blazer)\b/, "formal"],
  ];

  for (const [regex, category] of patterns) {
    if (regex.test(lower)) return category;
  }
  return "tops";
}

function inferGender(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(women|woman|ladies|lady|femme|her|girls?)\b/.test(lower)) return "women";
  if (/\b(men|man|gentlemen|guy|his|boys?)\b/.test(lower)) return "men";
  return "unisex";
}

function inferSeason(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(spring|summer|sundress|swim|beach|shorts)\b/.test(lower)) return "summer";
  if (/\b(fall|autumn|layer|knit|plaid)\b/.test(lower)) return "fall";
  if (/\b(winter|thermal|puffer|cashmere|wool)\b/.test(lower)) return "winter";
  return getCurrentSeason();
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function inferOccasion(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(formal|office|work|business|professional)\b/.test(lower)) return "work";
  if (/\b(casual|everyday|lounge)\b/.test(lower)) return "everyday";
  if (/\b(athletic|gym|workout|sport|running|training|yoga)\b/.test(lower)) return "workout";
  if (/\b(evening|party|club|night|cocktail)\b/.test(lower)) return "evening";
  return "everyday";
}

function extractColors(title: string): string[] {
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    blue: "#0000FF",
    navy: "#000080",
    green: "#008000",
    yellow: "#FFD700",
    orange: "#FF8C00",
    pink: "#FFC0CB",
    purple: "#800080",
    brown: "#8B4513",
    grey: "#808080",
    gray: "#808080",
    beige: "#F5F5DC",
    cream: "#FFFDD0",
    burgundy: "#800020",
    coral: "#FF7F50",
    lavender: "#E6E6FA",
    olive: "#808000",
    camel: "#C19A6B",
    rust: "#B7410E",
    sage: "#BCB88A",
  };

  const lower = title.toLowerCase();
  const found: string[] = [];

  for (const [name, hex] of Object.entries(colorMap)) {
    if (lower.includes(name)) {
      found.push(hex);
    }
  }

  return found.length > 0 ? found : ["#808080"];
}

function parsePrice(priceStr?: string): number | undefined {
  if (!priceStr) return undefined;
  const cleaned = priceStr.replace(/[^0-9.,]/g, "").replace(",", "");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

// --- Fetch from SerpAPI ---

async function queryGoogleShopping(
  keyword: string,
  apiKey: string
): Promise<RawProviderProduct[]> {
  const params = new URLSearchParams({
    engine: ENGINE,
    q: keyword,
    api_key: apiKey,
    num: String(RESULTS_PER_QUERY),
    hl: "en",
    gl: "us",
  });

  const url = `${SERPAPI_BASE}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[serpapi] HTTP ${res.status} for keyword: ${keyword}`);
      return [];
    }

    const data = (await res.json()) as SerpApiShoppingResponse;

    if (data.error) {
      console.warn(`[serpapi] API error: ${data.error}`);
      return [];
    }

    const results = data.shopping_results ?? [];

    return results
      .filter((r) => r.title && (r.thumbnail || r.product_link))
      .map((r, idx) => ({
        providerId: `serpapi-${slugify(keyword)}-${r.position ?? idx}`,
        title: r.title,
        brand: r.source || undefined,
        category: inferCategory(r.title),
        gender: inferGender(r.title),
        imageUrl: r.thumbnail || "",
        productUrl: r.product_link || r.link || undefined,
        colors: extractColors(r.title),
        styleTags: buildStyleTags(r.extensions),
        price: parsePrice(r.price),
        currency: "USD",
        popularityScore: computePopularity(r.rating, r.reviews, idx),
        season: inferSeason(r.title),
        occasion: inferOccasion(r.title),
        description: r.extensions?.join(" · ") || undefined,
        isFeatured: idx < 3,
      }));
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[serpapi] Timeout for keyword: ${keyword}`);
    } else {
      console.warn(
        `[serpapi] Fetch error: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
    return [];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildStyleTags(extensions?: string[]): string[] {
  if (!extensions || extensions.length === 0) return ["google-shopping"];
  return extensions.slice(0, 5).map((e) => e.toLowerCase().trim());
}

function computePopularity(
  rating?: number,
  reviews?: number,
  position?: number
): number {
  let score = 50;

  if (rating && rating >= 4) score += 15;
  if (rating && rating >= 4.5) score += 10;
  if (reviews && reviews > 100) score += 10;
  if (reviews && reviews > 500) score += 10;

  // Position bias: top results are more relevant
  if (position !== undefined) {
    if (position < 3) score += 15;
    else if (position < 7) score += 10;
    else if (position < 12) score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// --- Public API ---

/**
 * Fetch trending fashion products from Google Shopping via SerpAPI.
 * Rotates through keyword batches to maximize coverage within rate limits.
 *
 * @param apiKey - SerpAPI key
 * @param maxQueries - Max number of API calls (default: 5, leaving headroom under 100/mo)
 */
export async function fetchSerpApiProducts(
  apiKey: string,
  maxQueries = MAX_QUERIES
): Promise<RawProviderProduct[]> {
  const keywords = getKeywords(maxQueries);
  const allProducts: RawProviderProduct[] = [];

  console.log(`[serpapi] Querying ${keywords.length} keywords: ${keywords.join(", ")}`);

  // Execute queries sequentially to respect rate limits
  for (const keyword of keywords) {
    const products = await queryGoogleShopping(keyword, apiKey);
    allProducts.push(...products);

    // Small delay between requests to be respectful
    if (keywords.indexOf(keyword) < keywords.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    const key = p.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[serpapi] total: ${unique.length} unique products from ${keywords.length} queries`);
  return unique;
}
