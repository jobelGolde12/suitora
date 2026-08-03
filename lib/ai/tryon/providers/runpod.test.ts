import { describe, it, expect, vi, afterEach } from "vitest";
import { createRunPodProvider } from "./runpod";

const req = {
  personImageUrl: "https://cdn.test/person.jpg",
  garmentImageUrl: "https://cdn.test/garment.jpg",
  category: "upper_body" as const,
};

function mockFetchJson(payload: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
}

describe("runpod try-on provider", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("throws when RUNPOD_API_KEY is missing", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");
    const provider = createRunPodProvider();
    await expect(provider.submit(req)).rejects.toThrow(
      "RUNPOD_API_KEY is not configured"
    );
  });

  it("throws when RUNPOD_ENDPOINT_ID is missing", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "");
    const provider = createRunPodProvider();
    await expect(provider.submit(req)).rejects.toThrow(
      "RUNPOD_ENDPOINT_ID is not configured"
    );
  });

  it("submits a run with bearer auth and returns the job id", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");
    const fetchMock = mockFetchJson({ id: "run-123", status: "IN_QUEUE" });
    globalThis.fetch = fetchMock;

    const provider = createRunPodProvider();
    const { jobId } = await provider.submit(req);

    expect(jobId).toBe("run-123");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.runpod.ai/v2/ep_test/runs");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer rpa_key",
    });
    expect(JSON.parse((init as RequestInit).body as string).input).toEqual(
      req
    );
  });

  it("passes the webhook URL through when provided", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");
    const fetchMock = mockFetchJson({ id: "run-456", status: "IN_QUEUE" });
    globalThis.fetch = fetchMock;

    const provider = createRunPodProvider();
    await provider.submit(req, "https://app.test/api/tryon/webhook");

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.webhook).toBe("https://app.test/api/tryon/webhook");
  });

  it("maps RunPod statuses into TryOnStatus", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");

    const cases: Array<[string, string, Record<string, unknown>?]> = [
      ["IN_QUEUE", "processing"],
      ["IN_PROGRESS", "processing"],
      ["COMPLETED", "completed"],
      ["FAILED", "failed"],
      ["CANCELLED", "failed"],
      ["TIMED_OUT", "failed"],
      ["WEIRD_STATE", "pending"],
    ];

    for (const [runpodStatus, expected] of cases) {
      const fetchMock = mockFetchJson({
        id: "run-x",
        status: runpodStatus,
        output: { image_url: "https://out.test/x.png" },
      });
      globalThis.fetch = fetchMock;

      const provider = createRunPodProvider();
      const result = await provider.getStatus("run-x");

      expect(result.status).toBe(expected);
      if (runpodStatus === "COMPLETED") {
        expect(result.resultUrl).toBe("https://out.test/x.png");
      }
    }
  });

  it("surfaces the provider error on failed runs", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");
    globalThis.fetch = mockFetchJson({
      id: "run-fail",
      status: "FAILED",
      error: "OOM on worker",
    });

    const provider = createRunPodProvider();
    const result = await provider.getStatus("run-fail");
    expect(result).toEqual({
      status: "failed",
      resultUrl: undefined,
      error: "OOM on worker",
    });
  });

  it("throws on non-OK responses", async () => {
    vi.stubEnv("RUNPOD_API_KEY", "rpa_key");
    vi.stubEnv("RUNPOD_ENDPOINT_ID", "ep_test");
    globalThis.fetch = mockFetchJson({ error: "nope" }, false, 401);

    const provider = createRunPodProvider();
    await expect(provider.submit(req)).rejects.toThrow("401");
  });
});
