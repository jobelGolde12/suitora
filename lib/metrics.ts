/**
 * Prometheus metrics (Pillar 04, Action Item 5).
 *
 * A single shared `prom-client` registry exposed at `GET /metrics`. HTTP,
 * try-on, upstream-provider, and DB timings are recorded here. All metric names
 * follow Prometheus conventions; histogram buckets are tuned to the SLOs
 * (p95 < 500ms, p99 < 2s).
 */

import client from "prom-client";

export const registry = client.register;

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests handled by API routes",
  labelNames: ["route", "method", "status"],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds per route",
  labelNames: ["route"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const httpErrorsTotal = new client.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors per route and error code",
  labelNames: ["route", "error_code"],
});

export const httpInFlightRequests = new client.Gauge({
  name: "http_in_flight_requests",
  help: "Number of API requests currently being handled",
});

export const tryOnEventsTotal = new client.Counter({
  name: "tryon_events_total",
  help: "Virtual try-on lifecycle events",
  labelNames: ["action"],
});

export const tryOnLatencySeconds = new client.Histogram({
  name: "tryon_latency_seconds",
  help: "Virtual try-on latency in seconds per provider",
  labelNames: ["provider"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
});

export const upstreamRequestDurationSeconds = new client.Histogram({
  name: "upstream_request_duration_seconds",
  help: "Latency of outbound upstream (provider) calls in seconds",
  labelNames: ["provider"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
});

export const dbQueryDurationSeconds = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Latency of database round-trips in seconds",
  labelNames: ["op"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

if (process.env.NODE_ENV !== "test") {
  client.collectDefaultMetrics({ register: registry });
}

export function observeHttpRequest(
  route: string,
  method: string,
  status: number,
  durationMs: number
): void {
  const statusLabel = String(status);
  httpRequestsTotal.inc({ route, method, status: statusLabel });
  httpRequestDurationSeconds.observe({ route }, durationMs / 1000);
}

export function observeHttpError(route: string, errorCode: string): void {
  httpErrorsTotal.inc({ route, error_code: errorCode });
}

export function observeUpstream(provider: string, durationMs: number): void {
  upstreamRequestDurationSeconds.observe({ provider }, durationMs / 1000);
}

export function observeTryOn(
  action: string,
  durationMs: number,
  provider?: string
): void {
  tryOnEventsTotal.inc({ action });
  if (provider) {
    tryOnLatencySeconds.observe({ provider }, durationMs / 1000);
  }
}

export function observeDbQuery(op: string, durationMs: number): void {
  dbQueryDurationSeconds.observe({ op }, durationMs / 1000);
}

/** Time an async operation and record its latency under `op`. */
export async function timeOperation<T>(
  op: string,
  fn: () => Promise<T>,
  observe: (durationMs: number) => void
): Promise<T> {
  const started = Date.now();
  try {
    return await fn();
  } finally {
    observe(Date.now() - started);
  }
}
