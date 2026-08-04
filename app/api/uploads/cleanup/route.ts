import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { cleanupExpiredUploads } from "@/lib/retention";

/**
 * POST /api/uploads/cleanup
 *
 * Authentication (pick ONE per invocation):
 *  - Bearer session  — any authenticated user (manual run).
 *  - x-vercel-cron header + CRON_SECRET — Vercel Cron Jobs.
 *
 * Deletes expired user-photo uploads older than the retention window.
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

    const result = await cleanupExpiredUploads();
    const duration = Date.now() - startTime;

    console.log(
      `[retention] Completed in ${duration}ms: ${result.deleted} deleted, ${result.retained} retained (${result.scanned} scanned)`
    );

    return apiOk({ ...result, duration });
  } catch (err) {
    console.error("Error in POST /api/uploads/cleanup:", err);
    return apiError("Retention cleanup failed", 500);
  }
}
