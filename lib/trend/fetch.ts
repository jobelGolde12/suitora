/**
 * Trend fetch service — downloads products from enabled providers.
 * Not accessible from the frontend; used by sync jobs and seed paths.
 */

import { getEnabledProviders } from "@/config/trend-providers";
import { fetchCuratedProducts } from "./providers/curated";
import { fetchShopifyProducts } from "./providers/shopify";
import { fetchSerpApiProducts } from "./providers/serpapi";
import { fetchAsosProducts } from "./providers/asos";
import { getLogger } from "@/lib/logger";
import type { RawProviderProduct } from "@/types/trend";

export interface ProviderFetchResult {
  provider: string;
  products: RawProviderProduct[];
  error?: string;
}

export async function fetchFromProvider(
  providerId: string
): Promise<ProviderFetchResult> {
  switch (providerId) {
    case "shopify": {
      try {
        const products = await fetchShopifyProducts();
        return { provider: providerId, products };
      } catch (err) {
        return {
          provider: providerId,
          products: [],
          error: err instanceof Error ? err.message : "Shopify fetch failed",
        };
      }
    }

    case "curated":
      return {
        provider: providerId,
        products: fetchCuratedProducts(),
      };

    case "serpapi": {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) {
        return {
          provider: providerId,
          products: [],
          error: "SerpAPI key not configured",
        };
      }
      try {
        const products = await fetchSerpApiProducts(apiKey);
        return { provider: providerId, products };
      } catch (err) {
        return {
          provider: providerId,
          products: [],
          error: err instanceof Error ? err.message : "SerpAPI fetch failed",
        };
      }
    }

    case "asos": {
      try {
        const products = await fetchAsosProducts();
        return { provider: providerId, products };
      } catch (err) {
        return {
          provider: providerId,
          products: [],
          error: err instanceof Error ? err.message : "ASOS fetch failed",
        };
      }
    }

    case "affiliate": {
      const apiKey = process.env.TREND_AFFILIATE_API_KEY;
      if (!apiKey) {
        return {
          provider: providerId,
          products: [],
          error: "Affiliate key not configured",
        };
      }
      // Affiliate provider enriches products from other providers
      // Return empty — enrichment happens in sync pipeline
      return { provider: providerId, products: [] };
    }

    default:
      return {
        provider: providerId,
        products: [],
        error: `Unknown provider: ${providerId}`,
      };
  }
}

/**
 * Fetch from all enabled providers.
 * Falls back to curated data if all live providers fail.
 */
export async function fetchAllProviders(): Promise<ProviderFetchResult[]> {
  const providers = getEnabledProviders();
  const results: ProviderFetchResult[] = [];

  for (const provider of providers) {
    try {
      const result = await fetchFromProvider(provider.id);
      results.push(result);
    } catch (err) {
      results.push({
        provider: provider.id,
        products: [],
        error: err instanceof Error ? err.message : "Fetch failed",
      });
    }
  }

  const hasLiveResults = results.some(
    (r) => r.products.length > 0 && r.provider !== "curated"
  );

  if (!hasLiveResults && providers.length > 0) {
    getLogger().warn("All live providers failed — falling back to curated data");
    const curated = await fetchFromProvider("curated");
    return [curated];
  }

  return results;
}
