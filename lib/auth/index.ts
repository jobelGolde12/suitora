import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/drizzle";
import * as schema from "@/drizzle/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "suitora-default-secret-change-in-production",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: ["http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
