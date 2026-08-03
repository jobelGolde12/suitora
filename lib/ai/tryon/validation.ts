import type { TryOnRequest } from "./types";

export interface TryOnValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_CATEGORIES = ["upper_body", "lower_body", "dresses"] as const;

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value);
}

/**
 * Cheap client-side validation run before any GPU spend.
 * Deep checks (face visibility, minimum resolution) run on the worker.
 */
export function validateTryOnRequest(
  req: TryOnRequest
): TryOnValidationResult {
  const errors: string[] = [];

  if (!req.personImageUrl || !isHttpUrl(req.personImageUrl)) {
    errors.push("personImageUrl must be a valid http(s) URL");
  }
  if (!req.garmentImageUrl || !isHttpUrl(req.garmentImageUrl)) {
    errors.push("garmentImageUrl must be a valid http(s) URL");
  }
  if (!VALID_CATEGORIES.includes(req.category)) {
    errors.push(
      `category must be one of: ${VALID_CATEGORIES.join(", ")}`
    );
  }

  return { valid: errors.length === 0, errors };
}
