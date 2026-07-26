/**
 * Trend fetch service — downloads products from enabled providers.
 * Not accessible from the frontend; used by sync jobs and seed paths.
 */

import { getEnabledProviders } from "@/config/trend-providers";
import { fetchCuratedProducts } from "./providers/curated";
import type { RawProviderProduct } from "@/types/trend";

export interface ProviderFetchResult {
  provider: string;
  products: RawProviderProduct[];
  error?: string;
}

export async function fetchFromProvider(providerId: string): Promise<ProviderFetchResult> {
  switch (providerId) {
    case "curated":
      return {
        provider: providerId,
        products: fetchCuratedProducts(),
      };
    case "affiliate": {
      // Placeholder for a future live affiliate API.
      // Keys stay server-side via TREND_AFFILIATE_API_KEY.
      const apiKey = process.env.TREND_AFFILIATE_API_KEY;
      const baseUrl = process.env.TREND_AFFILIATE_API_URL;
      if (!apiKey || !baseUrl) {
        return {
          provider: providerId,
          products: [],
          error: "Affiliate provider not configured",
        };
      }
      try {
        const res = await fetch(`${baseUrl}/products?limit=50`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          next: { revalidate: 0 },
        });
        if (!res.ok) {
          return {
            provider: providerId,
            products: [],
            error: `Affiliate API error: ${res.status}`,
          };
        }
        const data = (await res.json()) as { products?: RawProviderProduct[] };
        return {
          provider: providerId,
          products: data.products ?? [],
        };
      } catch (err) {
        return {
          provider: providerId,
          products: [],
          error: err instanceof Error ? err.message : "Affiliate fetch failed",
        };
      }
    }
    default:
      return {
        provider: providerId,
        products: [],
        error: `Unknown provider: ${providerId}`,
      };
  }
}

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

  return results;
}
