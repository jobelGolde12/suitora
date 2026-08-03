import type { TryOnProvider, TryOnStatus } from "../types";

const RUNPOD_API_BASE = "https://api.runpod.ai/v2";

export interface RunPodProviderConfig {
  apiKey?: string;
  endpointId?: string;
}

/**
 * RunPod Serverless adapter.
 *
 * HTTP contract (see docs/virtual_tryon_engine_plan.md §6.2):
 *  - submit: POST /v2/{endpointId}/runs  → { id, status: "IN_QUEUE" }
 *  - status: GET  /v2/{endpointId}/status/{runId}
 *  - webhook: optional `webhook` URL passed in the submit payload
 */
export function createRunPodProvider(
  config: RunPodProviderConfig = {}
): TryOnProvider {
  const apiKey = config.apiKey || process.env.RUNPOD_API_KEY || "";
  const endpointId =
    config.endpointId || process.env.RUNPOD_ENDPOINT_ID || "";

  function requireConfig(): void {
    if (!apiKey) {
      throw new Error("RUNPOD_API_KEY is not configured");
    }
    if (!endpointId) {
      throw new Error("RUNPOD_ENDPOINT_ID is not configured");
    }
  }

  return {
    name: "runpod",

    async submit(req, webhookUrl) {
      requireConfig();

      const res = await fetch(
        `${RUNPOD_API_BASE}/${endpointId}/runs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            input: { ...req },
            ...(webhookUrl ? { webhook: webhookUrl } : {}),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`RunPod submit failed: ${res.status}`);
      }

      const data = (await res.json()) as { id?: string };
      if (!data.id) {
        throw new Error("RunPod submit returned no job id");
      }
      return { jobId: data.id };
    },

    async getStatus(jobId) {
      requireConfig();

      const res = await fetch(
        `${RUNPOD_API_BASE}/${endpointId}/status/${jobId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!res.ok) {
        throw new Error(`RunPod status failed: ${res.status}`);
      }

      const data = (await res.json()) as {
        status?: string;
        output?: { image_url?: string; result?: string } | string;
        error?: string;
      };

      const output = data.output;
      const resultUrl =
        typeof output === "string"
          ? output
          : output?.image_url || output?.result;

      return {
        status: mapRunPodStatus(data.status || ""),
        resultUrl: resultUrl || undefined,
        error: data.error || undefined,
      };
    },
  };
}

function mapRunPodStatus(status: string): TryOnStatus {
  switch (status) {
    case "IN_QUEUE":
    case "IN_PROGRESS":
      return "processing";
    case "COMPLETED":
      return "completed";
    case "FAILED":
    case "CANCELLED":
    case "TIMED_OUT":
      return "failed";
    default:
      return "pending";
  }
}
