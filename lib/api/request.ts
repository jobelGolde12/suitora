import type { NextResponse } from "next/server";
import type { z } from "zod";
import { apiError, apiValidationError } from "./response";

export const DEFAULT_BODY_LIMIT = 1024 * 1024;

type BodyRead =
  | { ok: true; text: string }
  | { ok: false };

/**
 * Read the request body, capping it at `limit` bytes. Uses the
 * `content-length` header as a fast path and enforces the cap on the
 * underlying stream for chunked bodies. Returns `{ ok: false }` when the
 * body exceeds the limit so callers can reply with a 413.
 */
async function readBody(req: Request, limit: number): Promise<BodyRead> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    return { ok: false };
  }

  const reader = req.body?.getReader();
  if (!reader) {
    const text = await req.text();
    return text.length > limit ? { ok: false } : { ok: true, text };
  }

  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return { ok: false };
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return { ok: true, text };
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns `{ data }` on success or `{ error }` (a 400 NextResponse) on
 * malformed/non-conforming input, or a 413 when the body exceeds `limit`
 * bytes. Never throws for bad client input.
 */
export async function parseBody<Output>(
  schema: z.ZodType<Output>,
  req: Request,
  options: { limit?: number } = {}
): Promise<{ data: Output; error?: never } | { data?: never; error: NextResponse }> {
  const read = await readBody(req, options.limit ?? DEFAULT_BODY_LIMIT);
  if (!read.ok) {
    return { error: apiError("Payload too large", 413, "PAYLOAD_TOO_LARGE") };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(read.text);
  } catch {
    return { error: apiValidationError({ issues: [], message: "Invalid JSON body" }) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: apiValidationError(result.error) };
  }
  return { data: result.data };
}

/**
 * Validate a URL query string against a Zod schema.
 * Returns `{ data }` on success or `{ error }` (a 400 NextResponse).
 */
export function validateQuery<Output>(
  schema: z.ZodType<Output>,
  searchParams: URLSearchParams
): { data: Output; error?: never } | { data?: never; error: NextResponse } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of searchParams.entries()) {
    raw[key] = value;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { error: apiValidationError(result.error) };
  }
  return { data: result.data };
}
