import { eq, sql, and, desc } from "drizzle-orm";
import { db, schema } from "@/drizzle";
import { submitTryOn, resolveTryOn } from "./index";
import { getTryOnProvider } from "./providers";
import { uploadToCloudinary } from "@/lib/storage/cloudinary";
import { tryOnRateLimiter } from "@/lib/rate-limit";
import { logTryOnEvent } from "./monitoring";

const TRYON_OUTPUT_FOLDER = "suitora/tryon/outputs";
const TRYON_CACHE_TTL_DAYS = 30;

type AnalysisRow = typeof schema.analyses.$inferSelect;

export interface TryOnResolution {
  status: "completed" | "failed";
  resultUrl?: string;
  error?: string;
}

/**
 * Advance the virtual try-on lifecycle for an analysis by one step:
 *  - pending    → reuse a cached result, or submit the job lazily (kick-off)
 *  - processing → resolve the job; persist the output or mark `failed`
 *
 * Safe to call on every GET poll tick — no-ops for terminal states, and
 * transient network errors leave the job `processing` for the next retry.
 */
export async function syncTryOnLifecycle(
  analysis: AnalysisRow
): Promise<void> {
  if (!analysis) return;

  // Never spend GPU on a failed analysis. Completed analyses may still
  // resolve an in-flight try-on (slow GPU jobs finish after scoring).
  if (analysis.status === "failed") return;
  if (
    analysis.tryOnStatus === "completed" ||
    analysis.tryOnStatus === "failed" ||
    analysis.tryOnStatus === "skipped"
  ) {
    return;
  }

  // 1. Lazy kick-off — atomically claim the row first. Two concurrent
  //    polls (double-fetch, two tabs) must not both submit — that would
  //    double-bill GPU time. `rowsAffected` tells us whether we won.
  if (analysis.tryOnStatus === "pending" && !analysis.tryOnJobId) {
    const now = new Date().toISOString();

    // Cache hit — reuse a prior generation for the same user + product
    // instead of spending GPU time again (30-day TTL).
    const cached = await findCachedGeneratedImage(
      analysis.userId,
      analysis.productId
    );
    if (cached) {
      await db
        .update(schema.analyses)
        .set({
          tryOnStatus: "completed",
          generatedImage: cached,
          tryOnLatencyMs: 0,
          tryOnError: null,
          updatedAt: now,
        })
        .where(eq(schema.analyses.id, analysis.id));
      await logTryOnEvent({
        action: "tryon.cache_hit",
        analysisId: analysis.id,
        userId: analysis.userId,
        provider: analysis.tryOnProvider,
        latencyMs: 0,
        status: "completed",
      });
      return;
    }

    const claim = await db.run(sql`
      UPDATE ${schema.analyses}
      SET try_on_status = 'processing', try_on_error = NULL, updated_at = ${now}
      WHERE id = ${analysis.id} AND try_on_status = 'pending'
    `);

    // Another poll claimed this job first (or it left pending) — no-op.
    if (claim.rowsAffected === 0) return;

    // Per-user daily budget — only gates GPU spend, so the mock provider
    // (dev/CI/fallback) is never throttled. Soft-fail (skip) rather than
    // blocking scoring.
    if (getTryOnProvider().name === "runpod") {
      const rl = await tryOnRateLimiter.limit(analysis.userId);
      if (!rl.success) {
        await db
          .update(schema.analyses)
          .set({
            tryOnStatus: "skipped",
            tryOnError: "Daily try-on limit reached. Try again tomorrow.",
            updatedAt: now,
          })
          .where(eq(schema.analyses.id, analysis.id));
        await logTryOnEvent({
          action: "tryon.rate_limited",
          analysisId: analysis.id,
          userId: analysis.userId,
          provider: "runpod",
          status: "skipped",
          error: "Daily try-on limit reached. Try again tomorrow.",
        });
        return;
      }
    }

    try {
      const { jobId, provider } = await submitTryOn(
        analysis.userImage,
        analysis.productImage,
        { category: analysis.tryOnCategory || undefined, webhookUrl: buildWebhookUrl() }
      );

      await db
        .update(schema.analyses)
        .set({
          tryOnJobId: jobId,
          tryOnProvider: provider,
          tryOnStartedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.analyses.id, analysis.id));

      await logTryOnEvent({
        action: "tryon.submitted",
        analysisId: analysis.id,
        userId: analysis.userId,
        jobId,
        provider,
        status: "processing",
      });
    } catch (err) {
      // Roll back to pending so a transient submit failure can retry on
      // the next poll instead of burning a permanently failed status.
      const message = (err as Error).message;
      await db
        .update(schema.analyses)
        .set({
          tryOnStatus: "pending",
          tryOnError: message,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.analyses.id, analysis.id));

      await logTryOnEvent({
        action: "tryon.submit_failed",
        analysisId: analysis.id,
        userId: analysis.userId,
        provider: getTryOnProvider().name,
        status: "pending",
        error: message,
      });
    }
    return;
  }

  // 2. Resolve in-flight job
  if (analysis.tryOnStatus === "processing" && analysis.tryOnJobId) {
    try {
      const { status, resultUrl, error } = await resolveTryOn(
        analysis.tryOnJobId
      );

      if (status === "completed" && resultUrl) {
        await applyTryOnResolution(analysis, {
          status: "completed",
          resultUrl,
        });
      } else if (status === "failed") {
        await applyTryOnResolution(analysis, {
          status: "failed",
          error: error || "Try-on generation failed",
        });
      }
      // "pending"/"processing" → still running; wait for the next tick
    } catch (err) {
      // Transient error (network) — leave as processing; next tick retries
      console.error(`[tryon] resolve failed for ${analysis.id}:`, err);
    }
  }
}

/**
 * Complete (or fail) a try-on job looked up by its provider job id.
 * Used by the webhook route to avoid wasted poll cycles.
 *
 * @returns true if a matching analysis was found and updated.
 */
export async function completeTryOnByJobId(
  jobId: string,
  resolution: TryOnResolution
): Promise<boolean> {
  const [analysis] = await db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.tryOnJobId, jobId))
    .limit(1);

  if (!analysis) return false;
  await applyTryOnResolution(analysis, resolution);
  return true;
}

/**
 * Persist a provider result to the analysis row.
 * Mock/durable URLs are used directly; worker (RunPod) outputs are
 * downloaded and stored so they cannot expire.
 */
async function applyTryOnResolution(
  analysis: AnalysisRow,
  resolution: TryOnResolution
): Promise<void> {
  const now = new Date().toISOString();

  if (resolution.status === "completed" && resolution.resultUrl) {
    const generatedImage = await persistGeneratedImage(
      resolution.resultUrl,
      analysis.tryOnProvider
    );
    const latencyMs = analysis.tryOnStartedAt
      ? Math.max(0, Date.now() - new Date(analysis.tryOnStartedAt).getTime())
      : null;

    await db
      .update(schema.analyses)
      .set({
        tryOnStatus: "completed",
        generatedImage,
        tryOnLatencyMs: latencyMs,
        tryOnError: null,
        updatedAt: now,
      })
      .where(eq(schema.analyses.id, analysis.id));

    await logTryOnEvent({
      action: "tryon.completed",
      analysisId: analysis.id,
      userId: analysis.userId,
      jobId: analysis.tryOnJobId,
      provider: analysis.tryOnProvider,
      latencyMs,
      status: "completed",
    });
    return;
  }

  const failError = resolution.error || "Try-on generation failed";
  const failLatencyMs = analysis.tryOnStartedAt
    ? Math.max(0, Date.now() - new Date(analysis.tryOnStartedAt).getTime())
    : null;

  await db
    .update(schema.analyses)
    .set({
      tryOnStatus: "failed",
      tryOnError: failError,
      updatedAt: now,
    })
    .where(eq(schema.analyses.id, analysis.id));

  await logTryOnEvent({
    action: "tryon.failed",
    analysisId: analysis.id,
    userId: analysis.userId,
    jobId: analysis.tryOnJobId,
    provider: analysis.tryOnProvider,
    latencyMs: failLatencyMs,
    status: "failed",
    error: failError,
  });
}

/**
 * Persist a provider result to Cloudinary. Mock/durable URLs are used
 * directly; worker (RunPod) outputs are downloaded and stored so they
 * cannot expire.
 */
async function persistGeneratedImage(
  resultUrl: string,
  provider: string | null | undefined
): Promise<string> {
  if (!provider || provider === "mock") return resultUrl;

  try {
    const res = await fetch(resultUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch worker output: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const uploaded = await uploadToCloudinary(buffer, {
      folder: TRYON_OUTPUT_FOLDER,
    });
    return uploaded.url;
  } catch (err) {
    console.error("[tryon] Failed to persist output to Cloudinary:", err);
    return resultUrl;
  }
}

/**
 * Reuse a prior try-on result for the same user + product within the TTL.
 * Only products (which have a stable productId) are cacheable — direct
 * image uploads have no shared key.
 */
async function findCachedGeneratedImage(
  userId: string,
  productId: string | null | undefined
): Promise<string | null> {
  if (!productId) return null;

  const ttlCutoff = new Date(
    Date.now() - TRYON_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [cached] = await db
    .select({ generatedImage: schema.analyses.generatedImage })
    .from(schema.analyses)
    .where(
      and(
        eq(schema.analyses.userId, userId),
        eq(schema.analyses.productId, productId),
        eq(schema.analyses.tryOnStatus, "completed"),
        sql`${schema.analyses.generatedImage} IS NOT NULL`,
        sql`${schema.analyses.createdAt} >= ${ttlCutoff}`
      )
    )
    .orderBy(desc(schema.analyses.createdAt))
    .limit(1);

  return cached?.generatedImage ?? null;
}

/**
 * Build the completion webhook URL for RunPod. RunPod cannot set custom
 * headers, so the shared secret travels as a signed query parameter and is
 * verified (constant-time) by the webhook route.
 */
function buildWebhookUrl(): string | undefined {
  const secret = process.env.RUNPOD_WEBHOOK_SECRET;
  if (!secret) return undefined;

  const vercelUrl = process.env.VERCEL_URL;
  const base =
    process.env.BETTER_AUTH_URL ||
    (vercelUrl ? `https://${vercelUrl}` : undefined);
  if (!base) return undefined;

  return `${base}/api/tryon/webhook?secret=${encodeURIComponent(secret)}`;
}
