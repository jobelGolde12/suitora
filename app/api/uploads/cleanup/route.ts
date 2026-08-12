import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { getLogger } from "@/lib/logger";
import { cleanupExpiredUploads, purgeSoftDeletedRows } from "@/lib/retention";

/**
 * POST /api/uploads/cleanup
 *
 * Authentication (pick ONE per invocation):
 *  - Bearer session  — any authenticated user (manual run).
 *  - x-vercel-cron header + CRON_SECRET — Vercel Cron Jobs.
 *
 * Deletes expired user-photo uploads older than the retention window and
 * physically purges soft-deleted rows past the soft-delete retention window
 * (Pillar 03, Action Item 5 step 5).
 */
export const POST = withApiRoute("/api/uploads/cleanup", async () => {
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
  }

  const [uploads, purge] = await Promise.all([
    cleanupExpiredUploads(),
    purgeSoftDeletedRows(),
  ]);
  const duration = Date.now() - startTime;

  getLogger().info(
    {
      uploadsDeleted: uploads.deleted,
      uploadsRetained: uploads.retained,
      uploadsScanned: uploads.scanned,
      purged: purge.map((p) => `${p.table}=${p.purged}`).join(", ") || "none",
      durationMs: duration,
    },
    "Retention cleanup completed"
  );

  return apiOk({ uploads, purge, duration });
});
