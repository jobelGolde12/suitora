import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./validation";

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "password123" }).success
    ).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(
      loginSchema.safeParse({ email: "nope", password: "password123" }).success
    ).toBe(false);
  });

  it("rejects a short password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "short" }).success
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@example.com",
    password: "password123",
    confirmPassword: "password123",
    agreeToTerms: true,
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords with a message on confirmPassword", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "other" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues.filter((i) => i.path[0] === "confirmPassword");
      expect(issues.some((i) => i.message.includes("don't match"))).toBe(true);
    }
  });

  it("requires agreement to terms", () => {
    expect(
      registerSchema.safeParse({ ...valid, agreeToTerms: false }).success
    ).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const valid = {
    password: "password123",
    confirmPassword: "password123",
    token: "token-abc",
  };

  it("accepts a valid reset payload", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(resetPasswordSchema.safeParse({ ...valid, token: "" }).success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    expect(
      resetPasswordSchema.safeParse({ ...valid, confirmPassword: "other" }).success
    ).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts a partial profile update", () => {
    expect(
      updateProfileSchema.safeParse({ name: "Jane", height: 172, fitPreference: "regular" }).success
    ).toBe(true);
  });

  it("rejects an out-of-range measurement", () => {
    expect(updateProfileSchema.safeParse({ height: 9999 }).success).toBe(false);
  });

  it("rejects an unknown style tag", () => {
    expect(updateProfileSchema.safeParse({ styleTags: ["goth-punk"] }).success).toBe(false);
  });
});
