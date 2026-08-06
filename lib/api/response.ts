import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Shared API response helpers.
 *
 * Errors always use the `{ error: string }` shape with an appropriate HTTP
 * status. Success responses include `success: true` alongside their payload.
 */

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
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
export function apiValidationError(error: ZodError): NextResponse {
  const issues = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return NextResponse.json(
    { error: "Invalid request", issues },
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
  const response = NextResponse.json({ error: message }, { status: 429 });
  response.headers.set("Retry-After", String(Math.max(1, Math.ceil(retryAfterSeconds))));
  return response;
}
