import { get, set, getRedisClient } from "@/lib/cache";

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
  try {
    const client = getRedisClient();
    if (!client) return;
    // SCAN instead of KEYS so invalidation never blocks the Redis event loop.
    const batches = client.scanStream({ match: `${prefix}*` });
    for await (const keys of batches) {
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  } catch {
    // Cache invalidation failure is non-fatal.
  }
}

export function buildTrendCacheKey(params: Record<string, string | number | boolean | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`);
  return `trending:${parts.join("&") || "default"}`;
}
