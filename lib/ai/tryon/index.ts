/**
 * Virtual Try-On generation service.
 * Provider-agnostic facade over the mock provider and the RunPod adapter.
 *
 * Phase 0: `TRYON_PROVIDER` defaults to "mock", preserving the legacy
 * behavior exactly (see providers/mock.ts).
 */

import type { ItemCategory } from "@/types";
import type {
  TryOnRequest,
  TryOnResult,
  TryOnStatus,
} from "./types";
import { mapCategoryToTryOn } from "./category";
import { validateTryOnRequest } from "./validation";
import { getTryOnProvider } from "./providers";

export type {
  TryOnCategory,
  TryOnStatus,
  TryOnRequest,
  TryOnResult,
  TryOnProvider,
} from "./types";
export { mapCategoryToTryOn } from "./category";
export { validateTryOnRequest } from "./validation";
export { getTryOnProvider, setTryOnProvider } from "./providers";

export interface GenerateTryOnOptions {
  /** Suitora item category — mapped to a VTON zone internally. */
  category?: ItemCategory | string;
  textPrompt?: string;
  /** Completion callback URL passed to the provider (RunPod webhook). */
  webhookUrl?: string;
}

function buildRequest(
  userImageUrl: string,
  clothingImageUrl: string,
  options: GenerateTryOnOptions
): TryOnRequest {
  return {
    personImageUrl: userImageUrl,
    garmentImageUrl: clothingImageUrl,
    category: mapCategoryToTryOn(options.category),
    textPrompt: options.textPrompt,
  };
}

/**
 * Submit a try-on job to the configured provider (does not block on the GPU).
 * Returns a job id suitable for async status resolution.
 */
export async function submitTryOn(
  userImageUrl: string,
  clothingImageUrl: string,
  options: GenerateTryOnOptions = {}
): Promise<{ jobId: string; provider: string }> {
  const provider = getTryOnProvider();
  const request = buildRequest(userImageUrl, clothingImageUrl, options);

  const { valid, errors } = validateTryOnRequest(request);
  if (!valid) {
    throw new Error(`Invalid try-on request: ${errors.join("; ")}`);
  }

  const { jobId } = await provider.submit(request, options.webhookUrl);
  return { jobId, provider: provider.name };
}

/**
 * Resolve a previously submitted try-on job.
 * Poll this on a schedule or use the webhook route for completion.
 */
export async function resolveTryOn(
  jobId: string
): Promise<{ status: TryOnStatus; resultUrl?: string; error?: string }> {
  return getTryOnProvider().getStatus(jobId);
}

/**
 * Generate a try-on image from a user photo and a clothing item photo.
 *
 * For providers that complete quickly (mock) this returns the final result.
 * For GPU-backed providers prefer `submitTryOn` + `resolveTryOn` so the
 * generation happens asynchronously without blocking a Vercel function.
 */
export async function generateVirtualTryOn(
  userImageUrl: string,
  clothingImageUrl: string,
  options: GenerateTryOnOptions = {}
): Promise<TryOnResult> {
  const provider = getTryOnProvider();
  const request = buildRequest(userImageUrl, clothingImageUrl, options);

  const { valid, errors } = validateTryOnRequest(request);
  if (!valid) {
    throw new Error(`Invalid try-on request: ${errors.join("; ")}`);
  }

  const startedAt = Date.now();
  const { jobId } = await provider.submit(request);
  const { status, resultUrl, error } = await provider.getStatus(jobId);

  if (status !== "completed" || !resultUrl) {
    throw new Error(error || "Try-on generation failed");
  }

  return {
    generatedImageUrl: resultUrl,
    provider: provider.name,
    latencyMs: Date.now() - startedAt,
  };
}
