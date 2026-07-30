/**
 * ASOS public product API adapter.
 *
 * Fetches real fashion products from ASOS using their public product search API
 * that powers the website. No API key required for basic product searches.
 *
 * Endpoint: https://www.asos.com/api/product/search/v2/
 * Rate limit: ~60 req/min (be respectful — sequential requests with delays).
 */

import type { RawProviderProduct } from "@/types/trend";

const ASOS_API_BASE = "https://www.asos.com/api/product/search/v2";
const RESULTS_PER_QUERY = 20;
const MAX_QUERIES = 4;
const REQUEST_TIMEOUT_MS = 12_000;

// --- ASOS API Response Types ---

interface AsosProduct {
  id: number;
  name: string;
  brandName: string;
  imageUrl: string;
  price: {
    current: {
      value: number;
      currency: string;
      text: string;
    };
    previous?: {
      value: number;
      currency: string;
      text: string;
    };
  };
  url: string;
  colour?: string;
  AdditionalData?: Record<string, string>;
}

interface AsosSearchResponse {
  products: AsosProduct[];
  totalCount: number;
  offset: number;
  nextOffset?: number;
}

// --- Search Queries ---

const SEARCH_QUERIES = [
  "trending fashion",
  "new arrivals women",
  "new arrivals men",
  "summer collection",
  "casual outfit",
  "formal wear",
  "athleisure",
  "streetwear",
];

// --- Category Mapping ---

function mapAsosCategory(product: AsosProduct): {
  category: string;
  subcategory: string;
} {
  const name = product.name.toLowerCase();

  const patterns: [RegExp, string, string][] = [
    [/\b(dress|gown|jumpsuit|romper)\b/, "dresses", "dress"],
    [/\b(shirt|blouse|tee|t-shirt|sweater|hoodie|tank|polo|top)\b/, "tops", "top"],
    [/\b(trousers?|jeans?|shorts?|joggers?|leggings?|chinos?)\b/, "bottoms", "bottom"],
    [/\b(jacket|coat|blazer|vest|parka|trench|windbreaker|gilet)\b/, "outerwear", "jacket"],
    [/\b(shoes?|sneakers?|boots?|sandals?|heels?|loafers?|sliders?)\b/, "footwear", "shoes"],
    [/\b(bag|hat|cap|scarf|belt|watch|jewelry|sunglasses?|backpack|wallet)\b/, "accessories", "accessory"],
    [/\b(sports?\s*bra|activewear|gym|yoga|training)\b/, "activewear", "activewear"],
    [/\b(suit|tuxedo|waistcoat)\b/, "formal", "formal"],
  ];

  for (const [regex, category, subcategory] of patterns) {
    if (regex.test(name)) return { category, subcategory };
  }

  return { category: "tops", subcategory: "unknown" };
}

function inferGender(product: AsosProduct): string {
  const combined = `${product.name} ${product.brandName}`.toLowerCase();
  if (/\b(women|woman|ladies|lady|femme)\b/.test(combined)) return "women";
  if (/\b(men|man|gentlemen|guy)\b/.test(combined)) return "men";
  return "unisex";
}

function inferSeason(title: string): string {
  const lower = title.toLowerCase();
  if (/\b(spring|summer|sundress|swim|beach|lightweight)\b/.test(lower)) return "summer";
  if (/\b(fall|autumn|layer|knit|plaid)\b/.test(lower)) return "fall";
  if (/\b(winter|thermal|puffer|cashmere|wool|knit)\b/.test(lower)) return "winter";
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

function extractColors(product: AsosProduct): string[] {
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
    stone: "#928E85",
    charcoal: "#36454F",
  };

  const sources = [product.name, product.colour ?? ""].join(" ").toLowerCase();
  const found: string[] = [];

  for (const [name, hex] of Object.entries(colorMap)) {
    if (sources.includes(name)) {
      found.push(hex);
    }
  }

  return found.length > 0 ? found : ["#808080"];
}

// --- Fetch from ASOS ---

async function fetchAsosSearch(
  query: string,
  offset = 0
): Promise<AsosSearchResponse | null> {
  const params = new URLSearchParams({
    q: query,
    offset: String(offset),
    limit: String(RESULTS_PER_QUERY),
    country: "US",
    currency: "USD",
    lang: "en-US",
    storefront: "US",
    channel: "desktop-web",
  });

  const url = `${ASOS_API_BASE}?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Asos-C-Id": "1",
        "Asos-S-Id": "1",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[asos] HTTP ${res.status} for query: ${query}`);
      return null;
    }

    return (await res.json()) as AsosSearchResponse;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn(`[asos] Timeout for query: ${query}`);
    } else {
      console.warn(
        `[asos] Fetch error: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
    return null;
  }
}

function computePopularity(product: AsosProduct): number {
  let score = 60;

  // ASOS products are already curated/trending by the platform
  score += 10;

  // Boost for having a sale price (indicates demand)
  if (product.price.previous && product.price.previous.value > product.price.current.value) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// --- Public API ---

/**
 * Fetch trending fashion products from ASOS.
 *
 * @param maxQueries - Max number of API calls (default: 4)
 */
export async function fetchAsosProducts(
  maxQueries = MAX_QUERIES
): Promise<RawProviderProduct[]> {
  const allProducts: RawProviderProduct[] = [];
  const queries = SEARCH_QUERIES.slice(0, maxQueries);

  console.log(`[asos] Querying ${queries.length} searches: ${queries.join(", ")}`);

  for (const query of queries) {
    const response = await fetchAsosSearch(query);

    if (response?.products) {
      const products = response.products.map((p) => {
        const { category, subcategory } = mapAsosCategory(p);
        return {
          providerId: `asos-${p.id}`,
          title: p.name,
          brand: p.brandName,
          category,
          subcategory,
          gender: inferGender(p),
          imageUrl: p.imageUrl.startsWith("//") ? `https:${p.imageUrl}` : p.imageUrl,
          productUrl: `https://www.asos.com${p.url}`,
          colors: extractColors(p),
          styleTags: ["asos", "fashion"],
          price: p.price.current.value,
          currency: p.price.current.currency,
          popularityScore: computePopularity(p),
          season: inferSeason(p.name),
          occasion: inferOccasion(p.name),
          description: p.price.current.text,
          isFeatured: false,
        };
      });

      allProducts.push(...products);
      console.log(`[asos] "${query}": ${products.length} products`);
    }

    // Delay between requests
    if (queries.indexOf(query) < queries.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Deduplicate by product ID
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    if (seen.has(p.providerId)) return false;
    seen.add(p.providerId);
    return true;
  });

  console.log(`[asos] total: ${unique.length} unique products`);
  return unique;
}
