import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
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
export async function POST() {
  const startTime = Date.now();

  try {
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

    console.log(
      `[trend-sync] Completed in ${duration}ms: ${result.itemsUpserted} items upserted, ${result.errors.length} errors`
    );

    return apiOk({ ...result, duration });
  } catch (err) {
    console.error("Error in POST /api/trending/sync:", err);
    return apiError("Synchronization failed", 500);
  }
}
