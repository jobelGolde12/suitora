/**
 * Affiliate link provider.
 *
 * Wraps existing product URLs with affiliate tracking tags using
 * Skimlinks, ShareASale, or similar affiliate networks.
 *
 * This provider does NOT fetch new products — it enriches existing
 * products from other providers (Shopify, ASOS, SerpAPI) with
 * affiliate-tagged URLs for monetization.
 *
 * Skimlinks API: https://api.skimlinks.com/v3/linkify.json
 * Requires: TREND_AFFILIATE_API_KEY (Skimlinks publisher ID)
 */

import type { RawProviderProduct } from "@/types/trend";

const SKIMLINKS_API = "https://api.skimlinks.com/v3/linkify.json";
const REQUEST_TIMEOUT_MS = 8_000;
const BATCH_SIZE = 10;

// --- Skimlinks Response Types ---

interface SkimlinksResponse {
  success: boolean;
  links?: {
    skim_url: string;
    merchant_id: string;
    merchant_name: string;
    commission: string;
  }[];
  error?: string;
}

// --- Link Enrichment ---

async function enrichUrlWithAffiliate(
  url: string,
  apiKey: string
): Promise<string | null> {
  if (!url || url.includes("example.com")) return null;

  const params = new URLSearchParams({
    url,
    key: apiKey,
    format: "json",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${SKIMLINKS_API}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = (await res.json()) as SkimlinksResponse;

    if (data.success && data.links && data.links.length > 0) {
      return data.links[0].skim_url;
    }

    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function enrichBatchWithAffiliate(
  products: RawProviderProduct[],
  apiKey: string
): Promise<RawProviderProduct[]> {
  const enriched: RawProviderProduct[] = [];

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (product) => {
        if (!product.productUrl) return product;

        const affiliateUrl = await enrichUrlWithAffiliate(
          product.productUrl,
          apiKey
        );

        if (affiliateUrl) {
          return {
            ...product,
            productUrl: affiliateUrl,
            styleTags: [...(product.styleTags ?? []), "affiliate"],
          };
        }

        return product;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        enriched.push(result.value);
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < products.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return enriched;
}

// --- Public API ---

/**
 * Enrich existing products with affiliate-tagged URLs.
 *
 * This provider acts as a post-processor — it takes products from
 * other providers and wraps their URLs with affiliate tracking.
 *
 * @param products - Products to enrich
 * @param apiKey - Skimlinks/affiliate network API key
 */
export async function fetchAffiliateProducts(
  products: RawProviderProduct[],
  apiKey: string
): Promise<RawProviderProduct[]> {
  console.log(`[affiliate] Enriching ${products.length} products with affiliate links`);

  const enriched = await enrichBatchWithAffiliate(products, apiKey);
  const withAffiliate = enriched.filter((p) =>
    p.styleTags?.includes("affiliate")
  );

  console.log(
    `[affiliate] ${withAffiliate.length}/${enriched.length} products enriched with affiliate links`
  );

  return enriched;
}

/**
 * Standalone fetch for affiliate-only products.
 * Returns an empty array — affiliate provider requires source products.
 */
export async function fetchAffiliateStandalone(): Promise<RawProviderProduct[]> {
  // Affiliate provider doesn't fetch products independently
  // It enriches products from other providers
  return [];
}
