/**
 * Scheduled trend synchronization entrypoint.
 * Can be invoked by a cron worker, CLI, or protected admin API.
 *
 * Example:
 *   npx tsx jobs/trend-sync.ts
 */

import { syncTrendItems } from "@/lib/trend/sync";
import { getLogger } from "@/lib/logger";
import { Redis } from "ioredis";

async function main() {
  const log = getLogger();
  log.info("Trend sync starting");
  const result = await syncTrendItems();
  log.info(
    {
      providers: result.providers,
      fetched: result.itemsFetched,
      upserted: result.itemsUpserted,
      errors: result.errors,
    },
    "Trend sync done"
  );
  if (result.errors.length > 0) {
    log.warn({ errors: result.errors }, "Trend sync errors");
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
    log.error({ err: redisErr }, "Failed to publish trend-sync to Redis");
  }
}

main().catch((err) => {
  getLogger().error({ err }, "Trend sync fatal");
  process.exit(1);
});
