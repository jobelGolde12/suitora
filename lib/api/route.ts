/**
 * Route handler wrapper (Pillar 04, Action Items 1, 3 & 5).
 *
 * Wrapping every API route gives us, in one place:
 *  - a correlation/request ID (from the `X-Request-Id` header set by the
 *    proxy, or generated) propagated to every log line,
 *  - Prometheus HTTP metrics (traffic, latency, errors, in-flight),
 *  - centralized error handling through `handleError`,
 *  - the request ID echoed back on the response for client/SRE correlation.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getRequestContext,
  runWithRequestContext,
  type RequestContext,
} from "@/lib/request-context";
import {
  httpInFlightRequests,
  observeHttpRequest,
  observeHttpError,
} from "@/lib/metrics";
import { handleError } from "@/lib/api/response";

export type RouteParams<T = Record<string, string>> = Promise<T>;

type RouteHandler<T = Record<string, unknown>> = (
  req: NextRequest,
  ctx: { params: Promise<T> }
) => Promise<Response | NextResponse> | (Response | NextResponse);

/**
 * Wrap a route handler with correlation context, metrics, and centralized
 * error handling. `route` is the Prometheus route label (e.g. `/api/analysis`).
 */
export function withApiRoute<T extends Record<string, unknown> = Record<string, string>>(
  route: string,
  handler: RouteHandler<T>
) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<T> }
  ): Promise<Response | NextResponse> => {
    const correlationId =
      req.headers.get("x-request-id") || crypto.randomUUID();
    const requestContext: RequestContext = {
      requestId: correlationId,
      correlationId,
      route,
      method: req.method,
    };

    const started = Date.now();
    httpInFlightRequests.inc();

    try {
      const res = await runWithRequestContext(requestContext, () =>
        handler(req, ctx)
      );
      const durationMs = Date.now() - started;
      observeHttpRequest(route, req.method, res.status, durationMs);
      if (res instanceof NextResponse) {
        res.headers.set("X-Request-Id", correlationId);
      }
      return res;
    } catch (err) {
      const durationMs = Date.now() - started;
      const res = handleError(err, { route, method: req.method });
      observeHttpRequest(route, req.method, res.status, durationMs);
      const code =
        err instanceof Error && "code" in err && typeof err.code === "string"
          ? err.code
          : "INTERNAL";
      observeHttpError(route, code);
      res.headers.set("X-Request-Id", correlationId);
      return res;
    } finally {
      httpInFlightRequests.dec();
    }
  };
}

/** Attach the current user id to the active request context (for logs). */
export function withUserId(userId?: string | null): void {
  const ctx = getRequestContext();
  if (ctx && userId) ctx.userId = userId;
}
