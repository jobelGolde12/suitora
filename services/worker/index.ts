// Background worker: subscribes to the `trend-sync` Redis channel that
// jobs/trend-sync.ts publishes to, and reacts to completed syncs by
// invalidating the dashboard cache so the next fetch returns fresh data.
//
// Run via: npx tsx services/worker/index.ts

import { Redis } from "ioredis";
import { invalidateTrendCache } from "@/lib/trend/cache";
import { getLogger } from "@/lib/logger";
import { runWithRequestContext } from "@/lib/request-context";

const CHANNEL = "trend-sync";

async function main() {
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  const subscriber = redis.duplicate();

  await subscriber.subscribe(CHANNEL);
  getLogger().info({ channel: CHANNEL }, "Worker subscribed");

  subscriber.on("message", async (channel, message) => {
    if (channel !== CHANNEL) return;

    const log = getLogger();
    try {
      const payload = JSON.parse(message);
      await runWithRequestContext(
        {
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
          route: "worker:trend-sync",
          method: "MESSAGE",
        },
        async () => {
          const ctxLog = getLogger();
          ctxLog.info(
            { providers: payload.providers, fetched: payload.fetched, upserted: payload.upserted },
            "Sync event received"
          );

          // A fresh sync just finished — drop cached dashboard responses so the
          // next request re-queries the DB with up-to-date trend items.
          await invalidateTrendCache();
        }
      );
    } catch (err) {
      log.error({ err }, "Failed to handle sync event");
    }
  });

  // Keep the process alive; ioredis handles reconnects internally.
  process.on("SIGINT", async () => {
    await subscriber.unsubscribe(CHANNEL);
    await subscriber.quit();
    await redis.quit();
    process.exit(0);
  });

  redis.on("error", (err) => getLogger().error({ err }, "Worker redis error"));
  subscriber.on("error", (err) => getLogger().error({ err }, "Worker subscriber error"));
}

main().catch((err) => {
  getLogger().error({ err }, "Worker fatal");
  process.exit(1);
});
