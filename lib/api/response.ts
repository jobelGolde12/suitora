import { NextResponse } from "next/server";

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
