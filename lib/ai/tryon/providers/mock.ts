import type { TryOnProvider, TryOnRequest } from "../types";

/**
 * Mock provider. Preserves the legacy mock behavior (1.5 s simulated
 * generation delay, returns the garment image unchanged) so development,
 * CI, and fallback paths are identical to the previous `lib/ai/tryon.ts`.
 */
export function createMockProvider(): TryOnProvider {
  const jobs = new Map<string, TryOnRequest>();

  return {
    name: "mock",

    async submit(req) {
      const jobId = `mock_${Date.now()}`;
      jobs.set(jobId, req);
      return { jobId };
    },

    async getStatus(jobId) {
      // Simulate heavy GPU try-on generation delay (matches legacy behavior)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const req = jobs.get(jobId);
      if (!req) {
        return { status: "failed", error: "Unknown try-on job" };
      }

      // Legacy mock returned the clothing image as the generated output
      return { status: "completed", resultUrl: req.garmentImageUrl };
    },
  };
}
