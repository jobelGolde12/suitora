/**
 * Scheduled trend synchronization entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/trend-sync.ts
 */

import { syncTrendItems } from "@/lib/trend/sync";
import { Redis } from "ioredis";

async function main() {
  console.log("[trend-sync] Starting synchronization…");
  const result = await syncTrendItems();
  console.log(
    `[trend-sync] Done. providers=${result.providers} fetched=${result.itemsFetched} upserted=${result.itemsUpserted}`
  );
  if (result.errors.length > 0) {
    console.warn("[trend-sync] Errors:", result.errors);
  }

  // Publish sync result to Redis for other services to consume
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    await redis.publish("trend-sync", JSON.stringify({
      timestamp: new Date().toISOString(),
      providers: result.providers,
      fetched: result.itemsFetched,
      upserted: result.itemsUpserted,
      errors: result.errors,
    }));
    await redis.quit();
  } catch (redisErr) {
    console.error("[trend-sync] Failed to publish to Redis:", redisErr);
  }
}

main().catch((err) => {
  console.error("[trend-sync] Fatal:", err);
  process.exit(1);
});