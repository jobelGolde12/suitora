import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
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
      const session = await auth.api.getSession({ headers: headerStore });
      if (!session?.user) {
        return apiError("Unauthorized", 401);
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
