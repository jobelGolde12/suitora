// Background worker: subscribes to the `trend-sync` Redis channel that
// jobs/trend-sync.ts publishes to, and reacts to completed syncs by
// invalidating the dashboard cache so the next fetch returns fresh data.
//
// Run via: npx tsx services/worker/index.ts

import { Redis } from "ioredis";
import { invalidateTrendCache } from "@/lib/trend/cache";

const CHANNEL = "trend-sync";

async function main() {
  const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  const subscriber = redis.duplicate();

  await subscriber.subscribe(CHANNEL);
  console.log(`[worker] subscribed to "${CHANNEL}"`);

  subscriber.on("message", async (channel, message) => {
    if (channel !== CHANNEL) return;

    try {
      const payload = JSON.parse(message);
      console.log(
        `[worker] sync completed: providers=${payload.providers} fetched=${payload.fetched} upserted=${payload.upserted}`
      );

      // A fresh sync just finished — drop cached dashboard responses so the
      // next request re-queries the DB with up-to-date trend items.
      await invalidateTrendCache();
    } catch (err) {
      console.error("[worker] failed to handle sync event:", err);
    }
  });

  // Keep the process alive; ioredis handles reconnects internally.
  process.on("SIGINT", async () => {
    await subscriber.unsubscribe(CHANNEL);
    await subscriber.quit();
    await redis.quit();
    process.exit(0);
  });

  redis.on("error", (err) => console.error("[worker] redis error:", err));
  subscriber.on("error", (err) => console.error("[worker] subscriber error:", err));
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
