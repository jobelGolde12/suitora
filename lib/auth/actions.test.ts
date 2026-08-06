import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  loginAction,
} from "./actions";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const mocks = vi.hoisted(() => {
  const allowed: LimitResult = { success: true, limit: 5, remaining: 5, reset: 0 };
  const blocked: LimitResult = { success: false, limit: 5, remaining: 0, reset: 999 };
  const mkLimiter = (result: LimitResult) => ({
    limit: vi.fn(async () => result),
  });

  return {
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    signInEmail: vi.fn(),
    signUpEmail: vi.fn(),
    signOut: vi.fn(),
    allowed,
    blocked,
    loginRateLimiter: mkLimiter(allowed),
    bruteForceLimiter: mkLimiter(allowed),
    failedAttemptsLimiter: mkLimiter(allowed),
    registerRateLimiter: mkLimiter(allowed),
    registerEmailLimiter: mkLimiter(allowed),
    passwordResetIpLimiter: mkLimiter(allowed),
    passwordResetEmailLimiter: mkLimiter(allowed),
  };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: mocks },
}));

vi.mock("@/drizzle", () => ({
  db: { insert: () => ({ values: async () => {} }) },
  schema: { auditLogs: {} },
}));

vi.mock("@/lib/rate-limit", () => ({
  loginRateLimiter: mocks.loginRateLimiter,
  bruteForceLimiter: mocks.bruteForceLimiter,
  failedAttemptsLimiter: mocks.failedAttemptsLimiter,
  registerRateLimiter: mocks.registerRateLimiter,
  registerEmailLimiter: mocks.registerEmailLimiter,
  passwordResetIpLimiter: mocks.passwordResetIpLimiter,
  passwordResetEmailLimiter: mocks.passwordResetEmailLimiter,
  tryOnRateLimiter: { limit: vi.fn() },
  analysisRateLimiter: { limit: vi.fn() },
  uploadRateLimiter: { limit: vi.fn() },
  stylistRateLimiter: { limit: vi.fn() },
}));

describe("requestPasswordResetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestPasswordReset.mockResolvedValue({});
    mocks.passwordResetIpLimiter.limit.mockResolvedValue(mocks.allowed);
    mocks.passwordResetEmailLimiter.limit.mockResolvedValue(mocks.allowed);
  });

  it("requests a reset via the auth API for a valid email", async () => {
    const result = await requestPasswordResetAction(
      { email: "user@example.com" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      body: { email: "user@example.com", redirectTo: "/reset-password" },
    });
  });

  it("returns the same generic success when the email is unknown", async () => {
    mocks.requestPasswordReset.mockRejectedValue(new Error("User not found"));

    const result = await requestPasswordResetAction(
      { email: "ghost@example.com" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true });
  });

  it("rejects an invalid email before calling the auth API", async () => {
    const result = await requestPasswordResetAction(
      { email: "not-an-email" },
      "127.0.0.1"
    );

    expect(result.success).toBe(false);
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("surfaces the IP rate limit", async () => {
    mocks.passwordResetIpLimiter.limit.mockResolvedValue(mocks.blocked);

    const result = await requestPasswordResetAction(
      { email: "user@example.com" },
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: false,
      error: "Too many reset requests. Please try again in an hour.",
      rateLimit: {
        limit: mocks.blocked.limit,
        remaining: mocks.blocked.remaining,
        reset: mocks.blocked.reset,
      },
    });
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("returns generic success when the email is rate limited (no enumeration)", async () => {
    mocks.passwordResetEmailLimiter.limit.mockResolvedValue(mocks.blocked);

    const result = await requestPasswordResetAction(
      { email: "user@example.com" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true });
    expect(mocks.requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetPassword.mockResolvedValue({});
  });

  it("resets the password via the auth API", async () => {
    const result = await resetPasswordAction({
      password: "new-secret-123",
      confirmPassword: "new-secret-123",
      token: "valid-token",
    });

    expect(result).toEqual({ success: true });
    expect(mocks.resetPassword).toHaveBeenCalledWith({
      body: { newPassword: "new-secret-123", token: "valid-token" },
    });
  });

  it("maps invalid/expired token errors to a user-facing message", async () => {
    mocks.resetPassword.mockRejectedValue(
      new Error("Token is invalid or expired")
    );

    const result = await resetPasswordAction({
      password: "new-secret-123",
      confirmPassword: "new-secret-123",
      token: "stale-token",
    });

    expect(result).toEqual({
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    });
  });

  it("maps weak-password errors to a user-facing message", async () => {
    mocks.resetPassword.mockRejectedValue(new Error("Password too weak"));

    const result = await resetPasswordAction({
      password: "aaaaaaaa",
      confirmPassword: "aaaaaaaa",
      token: "valid-token",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("stronger password");
  });

  it("rejects mismatched passwords before calling the auth API", async () => {
    const result = await resetPasswordAction({
      password: "new-secret-123",
      confirmPassword: "different-123",
      token: "valid-token",
    });

    expect(result.success).toBe(false);
    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });
});

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signInEmail.mockResolvedValue({
      user: { id: "1", name: "Jane", email: "jane@example.com" },
    });
  });

  it("returns the signed-in user on success", async () => {
    const result = await loginAction(
      { email: "jane@example.com", password: "correct-horse" },
      "127.0.0.1"
    );

    expect(result.success).toBe(true);
    expect(result.data?.user?.email).toBe("jane@example.com");
  });

  it("returns a generic error when credentials are invalid", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("Invalid email or password"));

    const result = await loginAction(
      { email: "jane@example.com", password: "wrong-password" },
      "127.0.0.1"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email or password. Please try again.");
  });

  it("blocks when the IP tier-1 rate limit is hit", async () => {
    mocks.loginRateLimiter.limit.mockResolvedValue(mocks.blocked);

    const result = await loginAction(
      { email: "jane@example.com", password: "correct-horse" },
      "127.0.0.1"
    );

    expect(result.success).toBe(false);
    expect(result.rateLimit).toEqual({
      limit: mocks.blocked.limit,
      remaining: mocks.blocked.remaining,
      reset: mocks.blocked.reset,
    });
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });
});
