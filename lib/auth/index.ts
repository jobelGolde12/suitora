import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/drizzle";
import * as schema from "@/drizzle/schema";
import { sendPasswordResetEmail } from "@/lib/email";

/** True while Next.js is compiling (collecting page data), not at runtime. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    // Better Auth enforces the secret at runtime, so never block the build
    // when the env var is only missing in the CI/build environment.
    if (!isBuildPhase()) {
      throw new Error(
        "BETTER_AUTH_SECRET is required. Set it in your environment variables."
      );
    }
    // Never used at runtime — production requests throw before signing cookies.
    return "build-phase-placeholder-secret-not-for-runtime-0000";
  }
  return secret;
}

function getTrustedOrigins(): string[] {
  const raw = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (!raw) {
    return ["http://localhost:3000"];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// Google OAuth is only enabled when both credentials are configured. Registering
// the provider with empty clientId/clientSecret makes Better Auth log a
// "missing clientId or clientSecret" warning on every request in dev.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const hasGoogle = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: getSecret(),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Require email verification for production traffic to prevent account
    // takeover via unverified registrations. Kept off in dev for convenience.
    requireEmailVerification: process.env.NODE_ENV === "production",
    // Called whenever a password reset is requested. The reset URL already
    // includes a one-time token and points at /reset-password.
    sendResetPassword: ({ user, url }) =>
      sendPasswordResetEmail(user.email, url),
    // Invalidate every session when a password is reset via email link.
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    cookiePrefix: "suitora",
    cookie: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  trustedOrigins: getTrustedOrigins(),
  plugins: [nextCookies()],
  socialProviders: hasGoogle
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : undefined,
  accountLinking: {
    trustedProviders: hasGoogle ? ["google"] : [],
    allowDifferentEmails: false,
  },
});

export type Session = typeof auth.$Infer.Session;
