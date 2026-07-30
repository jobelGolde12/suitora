/**
 * Trend provider configuration.
 * Providers are server-side only — never expose keys to the client.
 */

export interface TrendProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  /** Optional API base URL for live providers */
  baseUrl?: string;
  /** Env var name holding the API key (read server-side only) */
  apiKeyEnv?: string;
}

export const trendProviders: TrendProviderConfig[] = [
  // Live providers (real data)
  {
    id: "shopify",
    name: "Shopify Storefronts",
    enabled: true,
  },
  {
    id: "serpapi",
    name: "Google Shopping (SerpAPI)",
    enabled: !!process.env.SERPAPI_API_KEY,
    apiKeyEnv: "SERPAPI_API_KEY",
  },
  {
    id: "asos",
    name: "ASOS Catalog",
    enabled: true,
  },
  // Post-processors (enrich existing products)
  {
    id: "affiliate",
    name: "Affiliate Link Enrichment",
    enabled: !!process.env.TREND_AFFILIATE_API_KEY,
    apiKeyEnv: "TREND_AFFILIATE_API_KEY",
  },
  // Fallback: keep curated data available but disabled by default
  {
    id: "curated",
    name: "Suitora Curated (Fallback)",
    enabled: false,
  },
];

export function getEnabledProviders(): TrendProviderConfig[] {
  return trendProviders.filter((p) => p.enabled);
}
