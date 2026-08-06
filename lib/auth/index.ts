import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/drizzle";
import * as schema from "@/drizzle/schema";
import { sendPasswordResetEmail } from "@/lib/email";

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET is required. Set it in your environment variables."
    );
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
    requireEmailVerification: false,
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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  accountLinking: {
    trustedProviders: ["google"],
    allowDifferentEmails: false,
  },
});

export type Session = typeof auth.$Infer.Session;
