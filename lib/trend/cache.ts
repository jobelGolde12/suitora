import { get, set } from "@/lib/cache";

/**
 * Redis-backed cache for trending API responses.
 * Dashboard requests should never hit third-party APIs in real time.
 */

const DEFAULT_TTL_SECONDS = 5 * 60; // 5 minutes

export async function getCached<T>(key: string): Promise<T | null> {
  return get<T>(key);
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
  await set(key, data, ttlSeconds);
}

export async function invalidateTrendCache(prefix = "trending:"): Promise<void> {
  // Redis does not support prefix-based deletion natively without scanning
  // keys. If the KEYS command is acceptable in your environment, otherwise use SCAN.
  const client = (await import("@/lib/cache")).getRedisClient();
  const keys = await client.keys(`${prefix}*`);
  if (keys.length > 0) {
    await client.del(keys);
  }
}

export function buildTrendCacheKey(params: Record<string, string | number | boolean | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return `trending:${parts.join("&") || "default"}`;
}