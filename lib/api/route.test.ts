import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withApiRoute } from "./route";
import { appError } from "./errors";

// handleError is synchronous (returns NextResponse directly) — route.ts does
// not await it, so the mock must return the response synchronously.
const handleErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/response", () => ({
  handleError: handleErrorMock,
}));

describe("withApiRoute", () => {
  beforeEach(() => {
    handleErrorMock.mockReset();
    handleErrorMock.mockReturnValue(
      NextResponse.json({ error: "mapped", code: "NOT_FOUND" }, { status: 404 })
    );
  });

  function makeRequest(method = "GET", headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost/api/test", {
      method,
      headers: { ...headers },
    });
  }

  it("echoes the upstream X-Request-Id on the response", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiRoute("/api/test", handler);

    const res = await wrapped(
      makeRequest("GET", { "x-request-id": "abc-12345678" }),
      { params: Promise.resolve({}) }
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.headers.get("X-Request-Id")).toBe("abc-12345678");
  });

  it("generates a correlation id when no header is present", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiRoute("/api/test", handler);

    const res = await wrapped(makeRequest("GET"), { params: Promise.resolve({}) });

    const id = res.headers.get("X-Request-Id");
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("routes thrown errors through handleError and tags the response", async () => {
    const handler = vi.fn().mockRejectedValue(appError("NOT_FOUND", "gone"));
    const wrapped = withApiRoute("/api/test", handler);

    const res = await wrapped(makeRequest("POST"), { params: Promise.resolve({}) });

    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    expect(handleErrorMock.mock.calls[0][0]).toMatchObject({ code: "NOT_FOUND" });
    expect(res.status).toBe(404);
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("passes params through to the handler", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiRoute("/api/items/[id]", handler);

    const params = Promise.resolve({ id: "42" });
    await wrapped(makeRequest("GET"), { params });

    expect(handler.mock.calls[0][1].params).toBe(params);
  });

  it("records a 200 for successful handler responses", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiRoute("/api/test", handler);
    const res = await wrapped(makeRequest("GET"), { params: Promise.resolve({}) });
    expect(res.status).toBe(200);
  });
});
