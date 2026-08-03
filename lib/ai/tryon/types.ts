/**
 * Virtual Try-On service — shared contracts.
 * Provider-agnostic types used by the mock provider, the RunPod adapter,
 * and the pipeline orchestration layer.
 */

/** VTON garment zones the worker accepts. */
export type TryOnCategory = "upper_body" | "lower_body" | "dresses";

/** Lifecycle of a try-on generation job. */
export type TryOnStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

/** Payload sent to a VTON provider. */
export interface TryOnRequest {
  personImageUrl: string;
  garmentImageUrl: string;
  category: TryOnCategory;
  textPrompt?: string;
}

/** Resolved output of a successful try-on run. */
export interface TryOnResult {
  generatedImageUrl: string;
  provider: string;
  latencyMs?: number;
}

/**
 * A provider can submit an async job and later report its status.
 * The mock provider completes immediately; the RunPod adapter maps
 * RunPod serverless states into {@link TryOnStatus}.
 */
export interface TryOnProvider {
  name: string;
  submit(
    req: TryOnRequest,
    webhookUrl?: string
  ): Promise<{ jobId: string }>;
  getStatus(
    jobId: string
  ): Promise<{ status: TryOnStatus; resultUrl?: string; error?: string }>;
}
