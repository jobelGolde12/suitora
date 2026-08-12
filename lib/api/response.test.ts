import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

const loggerError = vi.fn();
const loggerWarn = vi.fn();

vi.mock("@/lib/logger", () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: loggerWarn,
    error: loggerError,
    debug: vi.fn(),
  }),
}));

import {
  apiError,
  apiOk,
  apiValidationError,
  apiRateLimitError,
  handleError,
} from "./response";
import {
  AppError,
  appError,
  unauthorized,
  notFound,
} from "./errors";

describe("apiError", () => {
  it("returns a JSON payload with error, code, and status", async () => {
    const res = apiError("nope", 400, "VALIDATION");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("nope");
    expect(body.code).toBe("VALIDATION");
  });

  it("defaults the code to BAD_REQUEST", async () => {
    const res = apiError("bad", 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("BAD_REQUEST");
  });
});

describe("apiOk", () => {
  it("returns success:true plus data and optional message", async () => {
    const res = apiOk({ items: [1, 2] }, "done");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, items: [1, 2], message: "done" });
  });

  it("omits message when not provided", async () => {
    const res = apiOk();
    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(body.message).toBeUndefined();
  });
});

describe("apiValidationError", () => {
  it("maps Zod issues to path/message pairs", async () => {
    const zod = new ZodError([
      { code: "too_small", minimum: 1, type: "string", path: ["title"], message: "too short" },
    ] as never);
    const res = apiValidationError(zod);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
    expect(body.issues).toEqual([{ path: "title", message: "too short" }]);
    expect(body.error).toBe("Invalid request");
  });

  it("accepts a plain issues/message object", async () => {
    const res = apiValidationError({
      issues: [{ path: "a.b", message: "boom" }],
      message: "custom",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.issues).toEqual([{ path: "a.b", message: "boom" }]);
    expect(body.error).toBe("custom");
  });

  it("falls back to a default message when none is given", async () => {
    const res = apiValidationError({ issues: [] });
    const body = await res.json();
    expect(body.error).toBe("Invalid request");
  });
});

describe("apiRateLimitError", () => {
  it("returns 429 with a Retry-After header", async () => {
    const res = apiRateLimitError("slow down", 60);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    const body = await res.json();
    expect(body.code).toBe("RATE_LIMIT");
  });

  it("floors Retry-After at 1 and handles fractional/negative input", () => {
    expect(apiRateLimitError("x", 0).headers.get("Retry-After")).toBe("1");
    expect(apiRateLimitError("x", -5).headers.get("Retry-After")).toBe("1");
    expect(apiRateLimitError("x", 1.4).headers.get("Retry-After")).toBe("2");
  });
});

describe("handleError", () => {
  beforeEach(() => {
    loggerError.mockClear();
    loggerWarn.mockClear();
  });

  it("logs and returns AppError 5xx errors with the mapped status", async () => {
    const err = appError("UPSTREAM_UNAVAILABLE", "provider down", {
      details: { provider: "openai" },
    });
    const res = handleError(err, { route: "/api/analysis", method: "POST" });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("UPSTREAM_UNAVAILABLE");
    expect(body.error).toBe("provider down");
    expect(body.issues).toEqual({ provider: "openai" });
    expect(loggerError).toHaveBeenCalledTimes(1);
  });

  it("logs 4xx AppErrors at warn level and never as server errors", async () => {
    const res = handleError(notFound("missing"), { route: "/api/x" });
    expect(res.status).toBe(404);
    await res.json();
    expect(loggerWarn).toHaveBeenCalledTimes(1);
    expect(loggerError).not.toHaveBeenCalled();
  });

  it("maps Zod errors to a structured VALIDATION 400", async () => {
    const zod = new ZodError([
      { code: "invalid_type", expected: "string", received: "number", path: ["id"], message: "expected string" },
    ] as never);
    const res = handleError(zod);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION");
    expect(body.issues).toEqual([{ path: "id", message: "expected string" }]);
    expect(loggerWarn).toHaveBeenCalled();
  });

  it("masks unexpected errors as a generic INTERNAL 500", async () => {
    const boom = new Error("sensitive internal detail");
    const res = handleError(boom, { route: "/api/foo" });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL");
    expect(body.error).toBe("Internal server error");
    expect(body.error).not.toContain("sensitive");
    expect(loggerError).toHaveBeenCalled();
  });

  it("handles non-Error throws (strings) without crashing", async () => {
    const res = handleError("oops");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("INTERNAL");
  });

  it("preserves the AppError status code on the response", () => {
    const res = handleError(unauthorized());
    expect(res.status).toBe(401);
    expect(res).toBeInstanceOf(Response);
  });

  it("AppError with INTERNAL code maps to 500 and is logged as error", async () => {
    const res = handleError(new AppError({ code: "INTERNAL", message: "boom" }));
    expect(res.status).toBe(500);
    expect(loggerError).toHaveBeenCalled();
  });
});
