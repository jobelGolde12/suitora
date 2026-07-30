import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { syncTrendItems } from "@/lib/trend/sync";

/**
 * POST /api/trending/sync
 *
 * Authentication (pick ONE per invocation):
 *  - Bearer session  — any authenticated user (manual refresh).
 *  - x-vercel-cron header + CRON_SECRET — Vercel Cron Jobs.
 *
 * Runs the server-side synchronization pipeline.
 */
export async function POST() {
  const startTime = Date.now();

  try {
    const headerStore = await headers();
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron =
      cronSecret && headerStore.get("x-vercel-cron") === "1";

    if (isVercelCron) {
      const authHeader = headerStore.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const session = await auth.api.getSession({ headers: headerStore });
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await syncTrendItems();
    const duration = Date.now() - startTime;

    console.log(
      `[trend-sync] Completed in ${duration}ms: ${result.itemsUpserted} items upserted, ${result.errors.length} errors`
    );

    return NextResponse.json({
      ok: true,
      ...result,
      duration,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error("Error in POST /api/trending/sync:", err);
    return NextResponse.json(
      { error: "Synchronization failed", duration },
      { status: 500 }
    );
  }
}
