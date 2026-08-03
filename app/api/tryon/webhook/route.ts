import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { completeTryOnByJobId } from "@/lib/ai/tryon/lifecycle";

interface RunPodWebhookPayload {
  id?: string;
  status?: string;
  error?: string;
  secret?: string;
  output?: { image_url?: string; result?: string } | string;
}

/**
 * RunPod webhook callback for try-on completions.
 *
 * RunPod POSTs the job result here (see docs/virtual_tryon_engine_plan.md
 * §6.2). The shared secret is verified constant-time from the query string
 * (signed at submit time), a header, or the JSON body, then the analysis is
 * completed/failed exactly like the poll-tick path — avoiding wasted polls.
 */
export async function POST(req: Request) {
  const secret = process.env.RUNPOD_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get("secret");
  const headerSecret = req.headers.get("x-tryon-secret");

  let bodySecret: string | null = null;
  let payload: RunPodWebhookPayload | null = null;
  try {
    payload = (await req.json()) as RunPodWebhookPayload;
    if (payload && typeof payload.secret === "string") {
      bodySecret = payload.secret;
    }
  } catch {
    // Non-JSON bodies are rejected below by the secret check.
  }

  const supplied = querySecret || headerSecret || bodySecret;
  if (!supplied || !safeEqual(supplied, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = payload?.id as string | undefined;
  if (!jobId) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  const status = String(payload?.status || "").toUpperCase();

  if (status === "COMPLETED") {
    const output = payload?.output;
    const resultUrl =
      typeof output === "string"
        ? output
        : output?.image_url || output?.result;

    if (!resultUrl) {
      return NextResponse.json(
        { error: "Completed job missing output" },
        { status: 400 }
      );
    }

    await completeTryOnByJobId(jobId, { status: "completed", resultUrl });
    return NextResponse.json({ success: true });
  }

  if (status === "FAILED" || status === "TIMED_OUT" || status === "CANCELLED") {
    await completeTryOnByJobId(jobId, {
      status: "failed",
      error: payload?.error || `RunPod job ${status.toLowerCase()}`,
    });
    return NextResponse.json({ success: true });
  }

  // IN_QUEUE / IN_PROGRESS — nothing to do yet.
  return NextResponse.json({ success: true });
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
