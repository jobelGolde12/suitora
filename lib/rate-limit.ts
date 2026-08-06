import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

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

// Password reset limiters
export const passwordResetIpLimiter = createLimiter("ratelimit:password-reset-ip", [5, "1 h"]);
export const passwordResetEmailLimiter = createLimiter("ratelimit:password-reset-email", [3, "1 h"]);

// Try-on generation limiters
export const tryOnRateLimiter = createLimiter("ratelimit:tryon", [10, "24 h"]);

// AI analysis + upload limiters
export const analysisRateLimiter = createLimiter("ratelimit:analysis", [20, "1 d"]);
export const uploadRateLimiter = createLimiter("ratelimit:upload", [10, "1 h"]);
export const stylistRateLimiter = createLimiter("ratelimit:stylist", [30, "1 h"]);

// Coarse per-IP global limiter for public endpoints (100 req/min/IP).
export const globalIpLimiter = createLimiter("ratelimit:global-ip", [100, "1 m"]);

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Best-effort client IP derived from proxy headers.
 */
export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Run a limiter for a given key and return the result. Callers branch on
 * `success` and return a 429 (see `apiRateLimitError`) when it is false.
 */
export async function enforceRateLimit(
  limiter: { limit: (key: string) => Promise<RateLimitResult> },
  key: string
): Promise<RateLimitResult> {
  return limiter.limit(key);
}

/**
 * Higher-order wrapper that rate-limits a route handler before running it.
 * `keyFn` derives the rate-limit key (e.g. user id or client IP). When the
 * limit is exceeded a standardized 429 with Retry-After is returned.
 */
export function withRateLimit<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
  limiter: { limit: (key: string) => Promise<RateLimitResult> },
  keyFn: (...args: Args) => string | Promise<string>,
  message = "Too many requests. Please try again later."
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args): Promise<NextResponse> => {
    const key = await keyFn(...args);
    const rl = await limiter.limit(key);
    if (!rl.success) {
      const { apiRateLimitError } = await import("@/lib/api/response");
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(message, retryAfter);
    }
    return handler(...args);
  };
}
