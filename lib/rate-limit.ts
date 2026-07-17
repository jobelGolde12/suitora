import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Tier 1: 5 attempts per 15 minutes per IP
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "ratelimit:login",
});

// Tier 2: 15 attempts per 24 hours per IP (brute force protection)
export const bruteForceLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "24 h"),
  analytics: true,
  prefix: "ratelimit:brute",
});

// Failed attempts tracker per email
export const failedAttemptsLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "30 m"),
  analytics: true,
  prefix: "ratelimit:failed",
});

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};
