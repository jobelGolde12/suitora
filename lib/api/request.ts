import type { NextResponse } from "next/server";
import type { z } from "zod";
import { apiValidationError } from "./response";

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns `{ data }` on success or `{ error }` (a 400 NextResponse) on
 * malformed/non-conforming input. Never throws for bad client input.
 */
export async function parseBody<Output>(
  schema: z.ZodType<Output>,
  req: Request
): Promise<{ data: Output; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
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
