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
  {
    id: "curated",
    name: "Suitora Curated",
    enabled: true,
  },
  // Future live providers (disabled until keys are configured)
  {
    id: "affiliate",
    name: "Affiliate Feed",
    enabled: false,
    baseUrl: process.env.TREND_AFFILIATE_API_URL,
    apiKeyEnv: "TREND_AFFILIATE_API_KEY",
  },
];

export function getEnabledProviders(): TrendProviderConfig[] {
  return trendProviders.filter((p) => p.enabled);
}
