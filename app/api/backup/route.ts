import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { getLogger } from "@/lib/logger";
import { runBackup } from "@/jobs/backup";

/**
 * POST /api/backup
 *
 * Authentication (pick ONE per invocation):
 *  - Bearer session  — any authenticated user (manual run).
 *  - x-vercel-cron header + CRON_SECRET — Vercel Cron Jobs.
 *
 * Runs a full database dump → S3 upload → retention prune, and records a
 * `backup_logs` status row (Pillar 03, Action Item 6).
 */
export const POST = withApiRoute("/api/backup", async () => {
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

  const result = await runBackup();
  const duration = Date.now() - startTime;

  getLogger().info(
    { key: result.key, bytes: result.bytes, pruned: result.pruned, durationMs: duration },
    "Backup completed"
  );

  return apiOk({ ...result, duration });
});
