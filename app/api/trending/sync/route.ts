import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { syncTrendItems } from "@/lib/trend/sync";

/**
 * POST /api/trending/sync
 * Protected: authenticated user (admin-style manual refresh).
 * Runs the server-side synchronization pipeline.
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: require CRON_SECRET for automated jobs
    // For now, any authenticated user can trigger a refresh in dev.

    const result = await syncTrendItems();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Error in POST /api/trending/sync:", err);
    return NextResponse.json(
      { error: "Synchronization failed" },
      { status: 500 }
    );
  }
}
