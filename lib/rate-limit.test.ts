import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { getClientIp, enforceRateLimit, withRateLimit } from "./rate-limit";

describe("getClientIp", () => {
  function req(headers: Record<string, string>) {
    return new Request("http://localhost/api/x", { headers });
  }

  it("returns the first hop of X-Forwarded-For", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))
    ).toBe("1.2.3.4");
  });

  it("handles a single-value forwarded header", () => {
    expect(getClientIp(req({ "x-forwarded-for": " 8.8.8.8 " }))).toBe("8.8.8.8");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to unknown when no headers are present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

describe("enforceRateLimit", () => {
  it("delegates to the limiter with the given key", async () => {
    const limiter = { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 }) };
    const result = await enforceRateLimit(limiter, "user_1");
    expect(limiter.limit).toHaveBeenCalledWith("user_1");
    expect(result.success).toBe(true);
  });
});

describe("withRateLimit", () => {
  const okResponse = NextResponse.json({ ok: true });

  it("runs the handler when the limit allows", async () => {
    const handler = vi.fn().mockResolvedValue(okResponse);
    const limiter = { limit: vi.fn().mockResolvedValue({ success: true, limit: 10, remaining: 5, reset: 0 }) };
    const wrapped = withRateLimit(handler, limiter, () => "ip");

    const res = await wrapped();
    expect(res).toBe(okResponse);
    expect(limiter.limit).toHaveBeenCalledWith("ip");
  });

  it("returns a 429 with Retry-After when the limit is exceeded", async () => {
    const handler = vi.fn();
    const limiter = {
      limit: vi.fn().mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: Date.now() + 30_000 }),
    };
    const wrapped = withRateLimit(handler, limiter, () => "ip");

    const res = await wrapped();
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
  });

  it("supports async key functions", async () => {
    const handler = vi.fn().mockResolvedValue(okResponse);
    const limiter = { limit: vi.fn().mockResolvedValue({ success: true, limit: 0, remaining: 0, reset: 0 }) };
    const wrapped = withRateLimit(handler, limiter, async () => "async-key");

    await wrapped();
    expect(limiter.limit).toHaveBeenCalledWith("async-key");
  });

  it("uses a custom message on the 429 response", async () => {
    const limiter = {
      limit: vi.fn().mockResolvedValue({ success: false, limit: 0, remaining: 0, reset: Date.now() + 60_000 }),
    };
    const wrapped = withRateLimit(() => Promise.resolve(okResponse), limiter, () => "ip", "custom msg");

    const res = await wrapped();
    const body = await res.json();
    expect(body.error).toBe("custom msg");
  });
});
