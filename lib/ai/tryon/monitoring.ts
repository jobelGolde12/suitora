/**
 * Virtual try-on monitoring.
 *
 * Logs status transitions to `audit_logs` (same pattern as auth audit events)
 * and aggregates failure/latency metrics from `analyses` for the dashboard.
 */

import { dbWrite, dbRead, schema } from "@/drizzle";
import { eq, sql, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { notDeleted } from "@/lib/db/filters";
import { getLogger } from "@/lib/logger";
import { observeTryOn } from "@/lib/metrics";

/** Structured try-on lifecycle events written to audit_logs.action. */
export type TryOnEventAction =
  | "tryon.cache_hit"
  | "tryon.rate_limited"
  | "tryon.submitted"
  | "tryon.submit_failed"
  | "tryon.completed"
  | "tryon.failed";

export interface TryOnEvent {
  action: TryOnEventAction;
  analysisId: string;
  userId?: string | null;
  jobId?: string | null;
  provider?: string | null;
  latencyMs?: number | null;
  status?: string;
  error?: string | null;
  details?: Record<string, unknown>;
}

export interface TryOnStats {
  /** Analyses that ever entered the try-on pipeline (any tryOnStatus except never-started). */
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  pending: number;
  processing: number;
  /**
   * Failed / (completed + failed) as a 0–100 percentage.
   * Null when there are no completed or failed outcomes yet.
   */
  failureRate: number | null;
  /** Mean tryOnLatencyMs among completed jobs (excludes cache hits at 0 when none have latency). */
  avgLatencyMs: number | null;
}

export interface TryOnCountRow {
  completed: number;
  failed: number;
  skipped: number;
  pending: number;
  processing: number;
  avgLatencyMs: number | null;
}

/**
 * Pure aggregator — kept free of DB so unit tests can cover the math.
 * Counts may arrive as strings from SQLite drivers; coerce defensively.
 */
export function computeTryOnStats(row: TryOnCountRow): TryOnStats {
  const completed = Number(row.completed) || 0;
  const failed = Number(row.failed) || 0;
  const skipped = Number(row.skipped) || 0;
  const pending = Number(row.pending) || 0;
  const processing = Number(row.processing) || 0;
  const total = completed + failed + skipped + pending + processing;

  const decided = completed + failed;
  const failureRate =
    decided > 0 ? Math.round((failed / decided) * 1000) / 10 : null;

  const rawAvg = row.avgLatencyMs;
  const avgLatencyMs =
    rawAvg == null || Number.isNaN(Number(rawAvg))
      ? null
      : Math.round(Number(rawAvg));

  return {
    total,
    completed,
    failed,
    skipped,
    pending,
    processing,
    failureRate,
    avgLatencyMs,
  };
}

/**
 * Persist a try-on lifecycle event to audit_logs, emit a structured log line,
 * and record Prometheus counters/histograms.
 *
 * Never throws — monitoring must not break the try-on pipeline.
 */
export async function logTryOnEvent(event: TryOnEvent): Promise<void> {
  const payload = {
    analysisId: event.analysisId,
    jobId: event.jobId ?? null,
    provider: event.provider ?? null,
    latencyMs: event.latencyMs ?? null,
    status: event.status ?? event.action.replace(/^tryon\./, ""),
    error: event.error ?? null,
    ...event.details,
    timestamp: new Date().toISOString(),
  };

  observeTryOn(event.action, event.latencyMs ?? 0, event.provider ?? undefined);

  const log = getLogger().child({ action: event.action });
  if (event.action.endsWith("failed") || event.action === "tryon.submit_failed") {
    log.warn(payload, "Try-on lifecycle event");
  } else {
    log.info(payload, "Try-on lifecycle event");
  }

  try {
    await dbWrite.insert(schema.auditLogs).values({
      id: nanoid(),
      userId: event.userId ?? null,
      action: event.action,
      details: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    getLogger().error({ err }, "Failed to write try-on audit log");
  }
}

/**
 * Aggregate try-on outcomes for a user (or globally if userId omitted).
 * Uses analyses.try_on_* columns — the source of truth for final status.
 */
export async function getTryOnStats(userId?: string): Promise<TryOnStats> {
  const base = dbRead
    .select({
      completed: sql<number>`SUM(CASE WHEN ${schema.analyses.tryOnStatus} = 'completed' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN ${schema.analyses.tryOnStatus} = 'failed' THEN 1 ELSE 0 END)`,
      skipped: sql<number>`SUM(CASE WHEN ${schema.analyses.tryOnStatus} = 'skipped' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${schema.analyses.tryOnStatus} = 'pending' THEN 1 ELSE 0 END)`,
      processing: sql<number>`SUM(CASE WHEN ${schema.analyses.tryOnStatus} = 'processing' THEN 1 ELSE 0 END)`,
      avgLatencyMs: sql<number | null>`AVG(CASE WHEN ${schema.analyses.tryOnStatus} = 'completed' AND ${schema.analyses.tryOnLatencyMs} IS NOT NULL AND ${schema.analyses.tryOnLatencyMs} > 0 THEN ${schema.analyses.tryOnLatencyMs} END)`,
    })
    .from(schema.analyses);

  const [row] = userId
    ? await base.where(
        and(notDeleted(schema.analyses), eq(schema.analyses.userId, userId))
      )
    : await base.where(notDeleted(schema.analyses));

  return computeTryOnStats({
    completed: row?.completed ?? 0,
    failed: row?.failed ?? 0,
    skipped: row?.skipped ?? 0,
    pending: row?.pending ?? 0,
    processing: row?.processing ?? 0,
    avgLatencyMs: row?.avgLatencyMs ?? null,
  });
}
