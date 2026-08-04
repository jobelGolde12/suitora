import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

function createLimiter(prefix: string, window: [number, Duration]) {
  if (!redis) {
    return {
      limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(...window),
    analytics: true,
    prefix,
  });
}

// Login limiters
export const loginRateLimiter = createLimiter("ratelimit:login", [5, "15 m"]);
export const bruteForceLimiter = createLimiter("ratelimit:brute", [15, "24 h"]);
export const failedAttemptsLimiter = createLimiter("ratelimit:failed", [10, "30 m"]);

// Registration limiters
export const registerRateLimiter = createLimiter("ratelimit:register", [3, "1 h"]);
export const registerEmailLimiter = createLimiter("ratelimit:register-email", [3, "1 h"]);

// Try-on generation limiters
export const tryOnRateLimiter = createLimiter("ratelimit:tryon", [10, "24 h"]);

// AI analysis + upload limiters
export const analysisRateLimiter = createLimiter("ratelimit:analysis", [20, "1 d"]);
export const uploadRateLimiter = createLimiter("ratelimit:upload", [10, "1 h"]);

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};
