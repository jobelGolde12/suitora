import { describe, it, expect } from "vitest";
import {
  AppError,
  STATUS_BY_CODE,
  isAppError,
  appError,
  notFound,
  unauthorized,
  forbidden,
  badRequest,
  conflict,
  validationError,
  rateLimitError,
  payloadTooLarge,
  upstreamUnavailable,
  internalError,
} from "./errors";

describe("AppError taxonomy", () => {
  it("maps every error code to its standard HTTP status", () => {
    expect(STATUS_BY_CODE.VALIDATION).toBe(400);
    expect(STATUS_BY_CODE.UNAUTHORIZED).toBe(401);
    expect(STATUS_BY_CODE.FORBIDDEN).toBe(403);
    expect(STATUS_BY_CODE.NOT_FOUND).toBe(404);
    expect(STATUS_BY_CODE.CONFLICT).toBe(409);
    expect(STATUS_BY_CODE.RATE_LIMIT).toBe(429);
    expect(STATUS_BY_CODE.PAYLOAD_TOO_LARGE).toBe(413);
    expect(STATUS_BY_CODE.UPSTREAM_UNAVAILABLE).toBe(503);
    expect(STATUS_BY_CODE.BAD_REQUEST).toBe(400);
    expect(STATUS_BY_CODE.INTERNAL).toBe(500);
  });

  it("constructs an AppError with code, status, and message", () => {
    const err = new AppError({ code: "NOT_FOUND", message: "missing" });
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
    expect(err.message).toBe("missing");
    expect(err.name).toBe("AppError");
  });

  it("carries details and a cause without leaking them in the message", () => {
    const cause = new Error("db down");
    const err = new AppError({
      code: "UPSTREAM_UNAVAILABLE",
      message: "provider unreachable",
      details: { provider: "runpod" },
      cause,
    });
    expect(err.details).toEqual({ provider: "runpod" });
    expect(err.cause).toBe(cause);
    expect(err.message).not.toContain("db down");
  });

  it("isAppError narrows AppError instances only", () => {
    expect(isAppError(new AppError({ code: "INTERNAL", message: "x" }))).toBe(true);
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError("string")).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it("appError factory sets defaults for code/status", () => {
    const err = appError("FORBIDDEN", "nope", { details: { a: 1 } });
    expect(err.code).toBe("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.details).toEqual({ a: 1 });
  });

  it("provides typed helper constructors with sane defaults", () => {
    expect(notFound().code).toBe("NOT_FOUND");
    expect(notFound("gone").message).toBe("gone");
    expect(unauthorized().status).toBe(401);
    expect(forbidden().code).toBe("FORBIDDEN");
    expect(badRequest().code).toBe("BAD_REQUEST");
    expect(conflict().status).toBe(409);
    expect(validationError().code).toBe("VALIDATION");
    expect(rateLimitError().status).toBe(429);
    expect(payloadTooLarge().status).toBe(413);
    expect(upstreamUnavailable().status).toBe(503);
    expect(internalError().status).toBe(500);
  });
});
