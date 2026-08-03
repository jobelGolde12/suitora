import { describe, it, expect, vi, afterEach } from "vitest";
import { createMockProvider } from "./mock";

describe("mock try-on provider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const req = {
    personImageUrl: "https://cdn.test/person.jpg",
    garmentImageUrl: "https://cdn.test/garment.jpg",
    category: "upper_body" as const,
  };

  it("submits a job and returns a mock job id", async () => {
    const provider = createMockProvider();
    const { jobId } = await provider.submit(req);
    expect(jobId).toMatch(/^mock_/);
  });

  it("preserves the legacy 1.5s simulated delay", async () => {
    vi.useFakeTimers();
    const provider = createMockProvider();
    const { jobId } = await provider.submit(req);

    // Track when the job actually settles.
    let settled = false;
    const statusPromise = provider.getStatus(jobId).then((result) => {
      settled = true;
      return result;
    });

    // Before the 1.5 s delay elapses the job is still running.
    await vi.advanceTimersByTimeAsync(1400);
    expect(settled).toBe(false);

    // After the delay it completes with the garment image.
    await vi.advanceTimersByTimeAsync(200);
    await expect(statusPromise).resolves.toMatchObject({
      status: "completed",
      resultUrl: req.garmentImageUrl,
    });
  });

  it("returns the garment image URL as the generated output", async () => {
    vi.useFakeTimers();
    const provider = createMockProvider();
    const { jobId } = await provider.submit(req);
    const statusPromise = provider.getStatus(jobId);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await statusPromise;
    expect(result).toEqual({
      status: "completed",
      resultUrl: req.garmentImageUrl,
    });
  });

  it("fails for unknown job ids", async () => {
    vi.useFakeTimers();
    const provider = createMockProvider();
    const statusPromise = provider.getStatus("nope");
    await vi.advanceTimersByTimeAsync(2000);
    const result = await statusPromise;
    expect(result.status).toBe("failed");
  });
});
