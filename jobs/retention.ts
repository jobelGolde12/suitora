/**
 * Scheduled retention cleanup entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/retention.ts
 */

import { cleanupExpiredUploads } from "@/lib/retention";

async function main() {
  console.log("[retention] Starting cleanup…");
  const result = await cleanupExpiredUploads();
  console.log(
    `[retention] Done. scanned=${result.scanned} deleted=${result.deleted} retained=${result.retained}`
  );
}

main().catch((err) => {
  console.error("[retention] Fatal:", err);
  process.exit(1);
});
