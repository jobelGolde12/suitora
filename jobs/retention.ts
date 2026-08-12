/**
 * Scheduled retention cleanup entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/retention.ts
 */

import { cleanupExpiredUploads, purgeSoftDeletedRows } from "@/lib/retention";
import { getLogger } from "@/lib/logger";

async function main() {
  const log = getLogger();
  log.info("Retention cleanup starting");
  const [uploadResult, purgeResult] = await Promise.all([
    cleanupExpiredUploads(),
    purgeSoftDeletedRows(),
  ]);
  log.info(
    {
      uploadsScanned: uploadResult.scanned,
      uploadsDeleted: uploadResult.deleted,
      uploadsRetained: uploadResult.retained,
      purge: purgeResult.map(({ table, purged }) => ({ table, purged })),
    },
    "Retention cleanup done"
  );
}

main().catch((err) => {
  getLogger().error({ err }, "Retention cleanup fatal");
  process.exit(1);
});
