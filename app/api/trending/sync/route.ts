import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { getLogger } from "@/lib/logger";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { syncTrendItems } from "@/lib/trend/sync";

/**
 * POST /api/trending/sync
 *
 * Authentication (pick ONE per invocation):
 *  - Bearer session  — any authenticated user (manual refresh).
 *  - x-vercel-cron header + CRON_SECRET — Vercel Cron Jobs.
 *
 * Runs the server-side synchronization pipeline.
 */
export const POST = withApiRoute("/api/trending/sync", async () => {
  const startTime = Date.now();

  const headerStore = await headers();
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron =
    cronSecret && headerStore.get("x-vercel-cron") === "1";

  if (isVercelCron) {
    const authHeader = headerStore.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return apiError("Forbidden", 403);
    }
  } else {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }
    withUserId(user.id);
    const rl = await enforceRateLimit(stylistRateLimiter, user.id);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(
        "Too many sync requests. Please try again later.",
        retryAfter
      );
    }
  }

  const result = await syncTrendItems();
  const duration = Date.now() - startTime;

  getLogger().info(
    { itemsUpserted: result.itemsUpserted, errors: result.errors.length, durationMs: duration },
    "Trend sync completed"
  );

  return apiOk({ ...result, duration });
});
