/**
 * Per-request correlation context (Pillar 04, Action Items 2 & 3).
 *
 * Every API request is run inside an AsyncLocalStorage store carrying the
 * correlation/request ID, route, and method so that any log line emitted while
 * handling that request — in the route handler, a query, or a provider call —
 * automatically includes the same identifiers.
 */

import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
  requestId: string;
  correlationId: string;
  route: string;
  method: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => T | Promise<T>
): Promise<T> {
  return Promise.resolve(storage.run(ctx, fn));
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
