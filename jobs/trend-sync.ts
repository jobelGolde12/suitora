/**
 * Scheduled trend synchronization entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/trend-sync.ts
 */

import { syncTrendItems } from "@/lib/trend/sync";

async function main() {
  console.log("[trend-sync] Starting synchronization…");
  const result = await syncTrendItems();
  console.log(
    `[trend-sync] Done. providers=${result.providers} fetched=${result.itemsFetched} upserted=${result.itemsUpserted}`
  );
  if (result.errors.length > 0) {
    console.warn("[trend-sync] Errors:", result.errors);
  }
}

main().catch((err) => {
  console.error("[trend-sync] Fatal:", err);
  process.exit(1);
});
