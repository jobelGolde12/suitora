/**
 * Scheduled retention cleanup entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/retention.ts
 */

import { cleanupExpiredUploads, purgeSoftDeletedRows } from "@/lib/retention";

async function main() {
  console.log("[retention] Starting cleanup…");
  const [uploadResult, purgeResult] = await Promise.all([
    cleanupExpiredUploads(),
    purgeSoftDeletedRows(),
  ]);
  console.log(
    `[retention] Uploads done. scanned=${uploadResult.scanned} deleted=${uploadResult.deleted} retained=${uploadResult.retained}`
  );
  const purgeSummary = purgeResult
    .map(({ table, purged }) => `${table}=${purged}`)
    .join(" ");
  console.log(`[retention] Soft-delete purge done. ${purgeSummary}`);
}

main().catch((err) => {
  console.error("[retention] Fatal:", err);
  process.exit(1);
});
