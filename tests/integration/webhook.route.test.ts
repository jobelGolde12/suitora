import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/ai/tryon/lifecycle", () => ({
  completeTryOnByJobId: vi.fn(),
}));

import { completeTryOnByJobId } from "@/lib/ai/tryon/lifecycle";
import { POST } from "@/app/api/tryon/webhook/route";
import { jsonRequest, callRoute } from "./helpers";

const originalSecret = process.env.RUNPOD_WEBHOOK_SECRET;

describe("POST /api/tryon/webhook (security)", () => {
  beforeEach(() => {
    process.env.RUNPOD_WEBHOOK_SECRET = "super-secret-value";
    vi.mocked(completeTryOnByJobId).mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    process.env.RUNPOD_WEBHOOK_SECRET = originalSecret;
    vi.clearAllMocks();
  });

  it("rejects a forged secret with 401", async () => {
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/tryon/webhook?secret=wrong", "POST", {
        id: "job-1",
        status: "COMPLETED",
      })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("rejects a missing secret with 401", async () => {
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/tryon/webhook", "POST", {
        id: "job-1",
        status: "COMPLETED",
      })
    );
    expect(res.status).toBe(401);
  });

  it("accepts a valid query-string secret and completes the job", async () => {
    const res = await callRoute(
      POST,
      jsonRequest(
        "http://localhost/api/tryon/webhook?secret=super-secret-value",
        "POST",
        { id: "job-1", status: "COMPLETED", output: { image_url: "https://img" } }
      )
    );
    expect(res.status).toBe(200);
    expect(completeTryOnByJobId).toHaveBeenCalledTimes(1);
  });

  it("accepts a valid header secret", async () => {
    const req = jsonRequest("http://localhost/api/tryon/webhook", "POST", {
      id: "job-1",
      status: "COMPLETED",
      output: { image_url: "https://img" },
    });
    req.headers.set("x-tryon-secret", "super-secret-value");

    const res = await callRoute(POST, req);
    expect(res.status).toBe(200);
  });

  it("accepts a valid body secret", async () => {
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/tryon/webhook", "POST", {
        id: "job-1",
        status: "COMPLETED",
        output: { image_url: "https://img" },
        secret: "super-secret-value",
      })
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when a valid request omits the job id", async () => {
    const res = await callRoute(
      POST,
      jsonRequest(
        "http://localhost/api/tryon/webhook?secret=super-secret-value",
        "POST",
        { status: "COMPLETED" }
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 503 when the webhook secret is not configured", async () => {
    delete process.env.RUNPOD_WEBHOOK_SECRET;
    const res = await callRoute(
      POST,
      jsonRequest("http://localhost/api/tryon/webhook?secret=x", "POST", {})
    );
    expect(res.status).toBe(503);
  });
});
