import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError, STATUS_BY_CODE, type ErrorCode } from "@/lib/api/errors";
import { getRequestContext, getRequestId } from "@/lib/request-context";
import { getLogger } from "@/lib/logger";

/**
 * Shared API response helpers (Pillar 04, Action Items 1).
 *
 * Error payloads are always `{ error, code, requestId }` with an appropriate
 * HTTP status. `handleError` is the single funnel for thrown errors: it logs
 * the full server-side detail (stack, cause) via the structured logger and
 * returns a safe client payload that never leaks internals.
 */

type ErrorBody = {
  error: string;
  code: ErrorCode;
  requestId?: string;
  issues?: { path: string; message: string }[];
};

function errorBody(message: string, code: ErrorCode, extra: Partial<ErrorBody> = {}): ErrorBody {
  return {
    error: message,
    code,
    requestId: getRequestId(),
    ...extra,
  };
}

// Reverse of STATUS_BY_CODE so `apiError("Unauthorized", 401)` carries the
// semantically correct code (UNAUTHORIZED, NOT_FOUND, …) instead of always
// defaulting to BAD_REQUEST. Later entries win for duplicate statuses, which
// keeps BAD_REQUEST for 400 and RATE_LIMIT for 429.
const CODE_BY_STATUS: Record<number, ErrorCode> = Object.fromEntries(
  Object.entries(STATUS_BY_CODE).map(([code, status]) => [status, code])
) as Record<number, ErrorCode>;

export function apiError(
  message: string,
  status: number,
  code: ErrorCode = CODE_BY_STATUS[status] ?? "BAD_REQUEST"
): NextResponse {
  return NextResponse.json(errorBody(message, code), { status });
}

export function apiOk(
  data: Record<string, unknown> = {},
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    ...data,
    ...(message ? { message } : {}),
  });
}

/**
 * 400 response with structured, field-level validation errors.
 */
export function apiValidationError(
  error: ZodError | { issues?: ErrorBody["issues"]; message?: string }
): NextResponse {
  const issues =
    error instanceof ZodError
      ? error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }))
      : error.issues;
  const message =
    error instanceof ZodError ? "Invalid request" : error.message || "Invalid request";
  return NextResponse.json(
    errorBody(message, "VALIDATION", { issues }),
    { status: 400 }
  );
}

/**
 * 429 response with a Retry-After header so clients know when to retry.
 */
export function apiRateLimitError(
  message: string,
  retryAfterSeconds = 60
): NextResponse {
  const response = NextResponse.json(
    errorBody(message, "RATE_LIMIT"),
    { status: 429 }
  );
  response.headers.set(
    "Retry-After",
    String(Math.max(1, Math.ceil(retryAfterSeconds)))
  );
  return response;
}

/**
 * Single funnel for errors thrown by route handlers. Logs full detail
 * server-side (including stack and cause) and returns a safe client payload.
 */
export function handleError(
  err: unknown,
  opts: { route?: string; method?: string } = {}
): NextResponse {
  const log = getLogger();
  const context = { ...opts };

  if (isAppError(err)) {
    if (err.status >= 500) {
      log.error({ errorCode: err.code, err, ...context }, err.message);
    } else {
      log.warn({ errorCode: err.code, err, ...context }, err.message);
    }
    return NextResponse.json(
      errorBody(err.message, err.code, { issues: err.details as ErrorBody["issues"] }),
      { status: err.status }
    );
  }

  if (err instanceof ZodError) {
    log.warn({ errorCode: "VALIDATION", err, ...context }, "Validation failed");
    return apiValidationError(err);
  }

  log.error({ errorCode: "INTERNAL", err, ...context }, "Unhandled error");
  return NextResponse.json(
    errorBody("Internal server error", "INTERNAL"),
    { status: 500 }
  );
}

/** Convenience: extract the request's correlation id for custom responses. */
export function currentRequestId(): string | undefined {
  return getRequestContext()?.requestId;
}
