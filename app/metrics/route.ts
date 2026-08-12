import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { registry } from "@/lib/metrics";

/**
 * GET /metrics — Prometheus scrape endpoint (Pillar 04, Action Item 5).
 *
 * Protected with a bearer token when METRICS_TOKEN is set (monitoring network
 * only). Returns Prometheus text format v0.0.4.
 */
export async function GET(request: NextRequest) {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${token}`) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const body = await registry.metrics();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": registry.contentType,
    },
  });
}
