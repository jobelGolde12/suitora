/**
 * Synthetic health-check probe (Pillar 04, Action Item 7).
 *
 * Hits the app's public `/api/health` endpoint and exits non-zero on any
 * failure (connection error, non-200, non-"ok" body, or slow response), so a
 * cron entry outside the app can page on-call when the service is unreachable.
 *
 * Run via: tsx jobs/health-check.ts
 * Cron (every minute):
 *   * * * * * cd /path/to/suitora && /usr/bin/npx tsx jobs/health-check.ts
 *
 * Target URL from HEALTH_CHECK_URL (default http://localhost:3000/api/health).
 */

import { getLogger } from "@/lib/logger";

const HEALTH_CHECK_URL =
  process.env.HEALTH_CHECK_URL || "http://localhost:3000/api/health";
const TIMEOUT_MS = 5_000;

export async function checkHealth(url = HEALTH_CHECK_URL): Promise<{
  ok: boolean;
  status?: number;
  durationMs: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const durationMs = Date.now() - started;

      let ok = res.ok;
      try {
        const body = await res.json();
        ok = ok && body?.data?.status === "ok";
      } catch {
        ok = false;
      }

      return { ok, status: res.status, durationMs };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

if (
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  main().catch((err) => {
    getLogger().error({ err }, "Health check aborted");
    process.exit(1);
  });
}

async function main() {
  const result = await checkHealth();
  if (!result.ok) {
    getLogger().error(result, "Health check failed");
    process.exit(1);
  }
  getLogger().info(result, "Health check passed");
  process.exit(0);
}

export { main as runHealthCheckCli };
