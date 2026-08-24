import { Redis } from "ioredis";
import { getLogger } from "@/lib/logger";

let redis: Redis | null = null;
let redisAvailable = true;

/**
 * Lazy Redis client with graceful degradation.
 * If Redis is unreachable, cache operations silently no-op so the
 * application continues working without caching rather than crashing.
 */
export function getRedisClient(): Redis | null {
  if (!redisAvailable) return null;
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 3) {
          redisAvailable = false;
          getLogger().warn("Redis unavailable — cache disabled");
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });
    redis.on("error", () => {
      // Silence repeated error logs; the retryStrategy handles disabling.
    });
    redis.connect().catch(() => {
      redisAvailable = false;
    });
  }
  return redis;
}

export async function get<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    if (!client) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function set<T>(key: string, value: T, expireSeconds: number = 3600): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.set(key, JSON.stringify(value), "EX", expireSeconds);
  } catch {
    // Cache write failure is non-fatal — continue without caching.
  }
}

export async function del(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.del(key);
  } catch {
    // Non-fatal.
  }
}

export async function flushAll(): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.flushall();
  } catch {
    // Non-fatal.
  }
}
