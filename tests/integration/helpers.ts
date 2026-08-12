/**
 * Shared helpers for integration tests (Pillar 05, Action Item 3).
 *
 * Integration tests exercise real route handlers end-to-end through the
 * `withApiRoute` wrapper (correlation ID, metrics, error funnel) while mocking
 * only the hard boundaries: sessions (`@/lib/auth/session`), the database
 * (`@/drizzle`), rate limiting (`@/lib/rate-limit`), and external AI/storage
 * providers. This keeps suites deterministic, offline, and fast.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Universal thenable drizzle query builder stub. Any chain of
 * `.select().from().where()/.insert().values()/.update().set()` resolves to
 * `resolveValue`. Keeps route handlers that build queries syntactically intact
 * without a real database.
 */
export function makeDrizzleChain(
  resolveValue: unknown = []
): Record<string, unknown> {
  const chain: Record<string, unknown> & {
    then?: (onF: (v: unknown) => unknown) => Promise<unknown>;
    select: () => Record<string, unknown>;
    from: () => Record<string, unknown>;
    where: () => Record<string, unknown>;
    and: () => Record<string, unknown>;
    insert: () => Record<string, unknown>;
    values: () => Record<string, unknown>;
    onConflictDoNothing: () => Record<string, unknown>;
    update: () => Record<string, unknown>;
    set: () => Record<string, unknown>;
  } = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    and: () => chain,
    insert: () => chain,
    values: () => chain,
    onConflictDoNothing: () => chain,
    update: () => chain,
    set: () => chain,
    then: (onF) => Promise.resolve(resolveValue).then(onF),
  };
  return chain;
}

/** Build a schema object stub whose tables accept arbitrary column access. */
export function makeSchemaStub(): Record<string, unknown> {
  return new Proxy(
    {},
    {
      get: () => ({}),
    }
  );
}

/** JSON body request against a route handler. */
export function jsonRequest(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "POST",
  body?: unknown
): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-request-id": "it-00000000-0000-0000-0000-000000000001",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Invoke a route's exported handler with a NextRequest + params. */
export async function callRoute<P extends Record<string, string>>(
  handler: (
    req: NextRequest,
    ctx: { params: Promise<P> }
  ) => Promise<Response | NextResponse>,
  req: NextRequest,
  params: P = {} as P
): Promise<Response> {
  return handler(req, { params: Promise.resolve(params) });
}
