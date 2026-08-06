/**
 * Shopify Storefront API adapter.
 *
 * Fetches real products from public Shopify storefronts using the
 * /products.json endpoint — no API key required for public stores.
 *
 * Each Shopify store exposes: https://{store}.myshopify.com/products.json
 * or via custom domains: https://{domain}/products.json
 */

import type { RawProviderProduct } from "@/types/trend";
import { getLogger } from "@/lib/logger";

// --- Store Registry ---

interface ShopifyStore {
  name: string;
  /** Store domain (must serve /products.json) */
  domain: string;
  /** Override product_type → category mapping */
  categoryOverrides?: Record<string, string>;
}

/**
 * Popular fashion Shopify stores with public product catalogs.
 * These are real, actively maintained stores.
 */
const SHOPIFY_STORES: ShopifyStore[] = [
  {
    name: "Gymshark",
    domain: "www.gymshark.com",
    categoryOverrides: {
      tops: "activewear",
      bottoms: "activewear",
      accessories: "accessories",
    },
  },
  {
    name: "Allbirds",
    domain: "www.allbirds.com",
    categoryOverrides: {
      shoes: "footwear",
      sneakers: "footwear",
      men: "footwear",
      women: "footwear",
    },
  },
  {
    name: "MVMT",
    domain: "www.mvmt.com",
    categoryOverrides: {
      watches: "accessories",
      sunglasses: "accessories",
      accessories: "accessories",
    },
  },
  {
    name: "Kith",
    domain: "kith.com",
  },
  {
    name: "ColourPop",
    domain: "colourpop.com",
    categoryOverrides: {
      lips: "accessories",
      eyes: "accessories",
      face: "accessories",
    },
  },
];

// --- Shopify API Response Types ---

interface ShopifyImage {
  id: number;
  src: string;
  width: number;
  height: number;
  alt: string | null;
}

interface ShopifyVariant {
  id: number;
  price: string;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  tags: string[];
  created_at: string;
  updated_at: string;
  handle: string;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// --- Category Mapping ---

/**
 * Map Shopify product_type values to Suitora's ItemCategory taxonomy.
 * Falls back to normalizeCategoryKey in the pipeline for unknown types.
 */
function mapShopifyProductType(
  productType: string,
  tags: string[],
  overrides?: Record<string, string>
): { category: string; subcategory: string } {
  const raw = productType.toLowerCase().trim();

  // Check overrides first
  if (overrides?.[raw]) {
    return { category: overrides[raw], subcategory: raw };
  }

  // Map common Shopify product types
  const typeMap: Record<string, { category: string; subcategory: string }> = {
    // Tops
    shirt: { category: "tops", subcategory: "shirt" },
    "t-shirt": { category: "tops", subcategory: "tee" },
    tee: { category: "tops", subcategory: "tee" },
    blouse: { category: "tops", subcategory: "blouse" },
    sweater: { category: "tops", subcategory: "sweater" },
    hoodie: { category: "tops", subcategory: "hoodie" },
    sweatshirt: { category: "tops", subcategory: "sweatshirt" },
    tank: { category: "tops", subcategory: "tank" },
    polo: { category: "tops", subcategory: "polo" },
    // Bottoms
    pants: { category: "bottoms", subcategory: "pants" },
    jeans: { category: "bottoms", subcategory: "jeans" },
    shorts: { category: "bottoms", subcategory: "shorts" },
    skirt: { category: "bottoms", subcategory: "skirt" },
    trousers: { category: "bottoms", subcategory: "trousers" },
    leggings: { category: "bottoms", subcategory: "leggings" },
    joggers: { category: "bottoms", subcategory: "joggers" },
    // Dresses
    dress: { category: "dresses", subcategory: "dress" },
    gown: { category: "dresses", subcategory: "gown" },
    jumpsuit: { category: "dresses", subcategory: "jumpsuit" },
    romper: { category: "dresses", subcategory: "romper" },
    // Outerwear
    jacket: { category: "outerwear", subcategory: "jacket" },
    coat: { category: "outerwear", subcategory: "coat" },
    blazer: { category: "outerwear", subcategory: "blazer" },
    vest: { category: "outerwear", subcategory: "vest" },
    parka: { category: "outerwear", subcategory: "parka" },
    // Footwear
    shoes: { category: "footwear", subcategory: "shoes" },
    sneakers: { category: "footwear", subcategory: "sneakers" },
    boots: { category: "footwear", subcategory: "boots" },
    sandals: { category: "footwear", subcategory: "sandals" },
    heels: { category: "footwear", subcategory: "heels" },
    loafers: { category: "footwear", subcategory: "loafers" },
    // Accessories
    hat: { category: "accessories", subcategory: "hat" },
    cap: { category: "accessories", subcategory: "cap" },
    bag: { category: "accessories", subcategory: "bag" },
    backpack: { category: "accessories", subcategory: "backpack" },
    scarf: { category: "accessories", subcategory: "scarf" },
    belt: { category: "accessories", subcategory: "belt" },
    watch: { category: "accessories", subcategory: "watch" },
    jewelry: { category: "accessories", subcategory: "jewelry" },
    sunglasses: { category: "accessories", subcategory: "sunglasses" },
    // Activewear
    sports_bra: { category: "activewear", subcategory: "sports_bra" },
    sportsbra: { category: "activewear", subcategory: "sports_bra" },
    "sports bra": { category: "activewear", subcategory: "sports_bra" },
    // Swimwear
    bikini: { category: "activewear", subcategory: "bikini" },
    swimsuit: { category: "activewear", subcategory: "swimsuit" },
    swim: { category: "activewear", subcategory: "swim" },
    // Formal
    suit: { category: "formal", subcategory: "suit" },
    tuxedo: { category: "formal", subcategory: "tuxedo" },
    tie: { category: "formal", subcategory: "tie" },
  };

  if (typeMap[raw]) {
    return typeMap[raw];
  }

  // Fallback: check tags for hints
  const tagStr = tags.map((t) => t.toLowerCase()).join(" ");
  for (const [key, value] of Object.entries(typeMap)) {
    if (tagStr.includes(key)) {
      return value;
    }
  }

  return { category: "tops", subcategory: raw || "unknown" };
}

// --- Gender Detection ---

function inferGender(title: string, tags: string[], vendor: string): string {
  const combined = `${title} ${tags.join(" ")} ${vendor}`.toLowerCase();

  if (/\b(women|woman|ladies|lady|femme|her)\b/.test(combined)) return "women";
  if (/\b(men|man|gentlemen|guy|his)\b/.test(combined)) return "men";
  if (/\b(unisex|genderless)\b/.test(combined)) return "unisex";
  if (/\b(kids|children|junior|toddler)\b/.test(combined)) return "unisex";

  return "unisex";
}

// --- Season Detection ---

function inferSeason(tags: string[]): string {
  const tagStr = tags.map((t) => t.toLowerCase()).join(" ");
  const month = new Date().getMonth();

  if (/\b(spring|spring\/summer|ss24|ss25|ss26)\b/.test(tagStr)) return "spring";
  if (/\b(summer|summer\/fall|sf24|sf25)\b/.test(tagStr)) return "summer";
  if (/\b(fall|autumn|fw24|fw25|fw26)\b/.test(tagStr)) return "fall";
  if (/\b(winter|holiday|resort|pre-fall)\b/.test(tagStr)) return "winter";

  // Default based on current month
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

// --- Color Extraction ---

function extractColors(tags: string[]): string[] {
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
    tan: "#D2B48C",
    cream: "#FFFDD0",
    burgundy: "#800020",
    maroon: "#800000",
    teal: "#008080",
    coral: "#FF7F50",
    lavender: "#E6E6FA",
    olive: "#808000",
    khaki: "#C3B091",
    charcoal: "#36454F",
    denim: "#1560BD",
    stone: "#928E85",
    camel: "#C19A6B",
    rust: "#B7410E",
    sage: "#BCB88A",
    mauve: "#E0B0FF",
  };

  const found: string[] = [];
  const tagLower = tags.map((t) => t.toLowerCase());

  for (const [name, hex] of Object.entries(colorMap)) {
    if (tagLower.some((t) => t.includes(name))) {
      found.push(hex);
    }
  }

  return found.length > 0 ? found : ["#808080"];
}

// --- Fetch Products from a Single Store ---

const PRODUCTS_PER_PAGE = 50;
const MAX_PAGES = 2;
const REQUEST_TIMEOUT_MS = 10_000;

async function fetchStoreProducts(
  store: ShopifyStore
): Promise<RawProviderProduct[]> {
  const products: RawProviderProduct[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://${store.domain}/products.json?limit=${PRODUCTS_PER_PAGE}&page=${page}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Suitora-TrendSync/1.0",
        },
        signal: controller.signal,
        next: { revalidate: 0 },
      });

      clearTimeout(timeout);

      if (!res.ok) {
        getLogger().warn(
          { store: store.name, status: res.status },
          "Shopify HTTP error — stopping pagination"
        );
        break;
      }

      const data = (await res.json()) as ShopifyProductsResponse;
      const items = data.products ?? [];

      if (items.length === 0) break;

      for (const product of items) {
        const mapped = mapShopifyProductType(
          product.product_type,
          product.tags,
          store.categoryOverrides
        );

        const imageUrl = product.images?.[0]?.src ?? null;
        if (!imageUrl) continue;

        const price = product.variants?.[0]
          ? parseFloat(product.variants[0].price)
          : undefined;

        products.push({
          providerId: `shopify-${store.name.toLowerCase().replace(/\s+/g, "-")}-${product.id}`,
          title: product.title,
          brand: product.vendor,
          category: mapped.category,
          subcategory: mapped.subcategory,
          gender: inferGender(product.title, product.tags, product.vendor),
          imageUrl,
          productUrl: `https://${store.domain}/products/${product.handle}`,
          colors: extractColors(product.tags),
          styleTags: product.tags
            .filter((t) => !t.startsWith("_"))
            .slice(0, 8),
          price: Number.isFinite(price) ? price : undefined,
          currency: "USD",
          popularityScore: computePopularity(product),
          season: inferSeason(product.tags),
          occasion: inferOccasion(product.tags, product.product_type),
          description: product.body_html
            ? stripHtml(product.body_html).slice(0, 300)
            : undefined,
          isFeatured: product.tags.some((t) =>
            /featured|bestseller|popular|new/i.test(t)
          ),
        });
      }

      // If fewer items than requested, no more pages
      if (items.length < PRODUCTS_PER_PAGE) break;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        getLogger().warn({ store: store.name }, "Shopify request timed out");
      } else {
        getLogger().warn({ store: store.name, err }, "Shopify fetch error");
      }
      break;
    }
  }

  return products;
}

// --- Popularity Heuristic ---

function computePopularity(product: ShopifyProduct): number {
  let score = 50;

  // Boost for having many variants (likely popular product line)
  if (product.variants.length > 5) score += 10;
  if (product.variants.length > 10) score += 5;

  // Boost for tags indicating popularity
  const tagStr = product.tags.join(" ").toLowerCase();
  if (/bestseller|best-selling|popular/.test(tagStr)) score += 20;
  if (/new|new-arrival|just-in/.test(tagStr)) score += 10;
  if (/sale|clearance/.test(tagStr)) score -= 5;
  if (/sold-out|unavailable/.test(tagStr)) score -= 15;

  // Boost for having multiple images
  if (product.images.length > 3) score += 5;

  // Boost for recently updated
  const ageMs = Date.now() - new Date(product.updated_at).getTime();
  const days = ageMs / (1000 * 60 * 60 * 24);
  if (days < 7) score += 10;
  else if (days < 30) score += 5;

  return Math.max(0, Math.min(100, score));
}

// --- Occasion Detection ---

function inferOccasion(tags: string[], productType: string): string {
  const combined = `${tags.join(" ")} ${productType}`.toLowerCase();

  if (/formal|office|work|business|professional/.test(combined)) return "work";
  if (/casual|everyday|lounge|relax/.test(combined)) return "everyday";
  if (/athletic|gym|workout|sport|running|training/.test(combined))
    return "workout";
  if (/evening|party|club|night/.test(combined)) return "evening";
  if (/wedding|bridal|gala/.test(combined)) return "formal";

  return "everyday";
}

// --- HTML Stripper ---

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Public API ---

/**
 * Fetch products from all configured Shopify stores.
 * Returns a flat array of normalized products.
 */
export async function fetchShopifyProducts(): Promise<RawProviderProduct[]> {
  const allProducts: RawProviderProduct[] = [];

  const results = await Promise.allSettled(
    SHOPIFY_STORES.map((store) => fetchStoreProducts(store))
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const store = SHOPIFY_STORES[i];

    if (result.status === "fulfilled") {
      getLogger().info(
        { store: store.name, count: result.value.length },
        "Shopify store fetched"
      );
      allProducts.push(...result.value);
    } else {
      getLogger().warn(
        { store: store.name, err: result.reason },
        "Shopify store failed"
      );
    }
  }

  getLogger().info({ count: allProducts.length, stores: SHOPIFY_STORES.length }, "Shopify total products");
  return allProducts;
}
