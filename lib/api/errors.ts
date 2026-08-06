/**
 * Standardized error taxonomy (Pillar 04, Action Item 1).
 *
 * Every error a route can produce is classified into an `ErrorCode` mapped to
 * a standard HTTP status. `AppError` carries `code`, `status`, optional
 * `details`, and the original `cause` (server-side only — never sent to the
 * client). Clients always receive `{ error, code, requestId }`.
 */

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "PAYLOAD_TOO_LARGE"
  | "UPSTREAM_UNAVAILABLE"
  | "BAD_REQUEST"
  | "INTERNAL";

export const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMIT: 429,
  PAYLOAD_TOO_LARGE: 413,
  UPSTREAM_UNAVAILABLE: 503,
  BAD_REQUEST: 400,
  INTERNAL: 500,
};

export type AppErrorOptions = {
  code: ErrorCode;
  message: string;
  details?: unknown;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(opts: AppErrorOptions) {
    super(opts.message, { cause: opts.cause });
    this.name = "AppError";
    this.code = opts.code;
    this.status = STATUS_BY_CODE[opts.code];
    this.details = opts.details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function appError(
  code: ErrorCode,
  message: string,
  opts?: { details?: unknown; cause?: unknown }
): AppError {
  return new AppError({ code, message, ...opts });
}

export const notFound = (message = "Not found") => appError("NOT_FOUND", message);
export const unauthorized = (message = "Unauthorized") =>
  appError("UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden") => appError("FORBIDDEN", message);
export const badRequest = (message = "Bad request") =>
  appError("BAD_REQUEST", message);
export const conflict = (message = "Conflict") => appError("CONFLICT", message);
export const validationError = (message = "Invalid request") =>
  appError("VALIDATION", message);
export const rateLimitError = (message = "Too many requests") =>
  appError("RATE_LIMIT", message);
export const payloadTooLarge = (message = "Payload too large") =>
  appError("PAYLOAD_TOO_LARGE", message);
export const upstreamUnavailable = (message = "Upstream service unavailable") =>
  appError("UPSTREAM_UNAVAILABLE", message);
export const internalError = (message = "Internal server error") =>
  appError("INTERNAL", message);
