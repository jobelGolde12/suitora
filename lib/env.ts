import { z } from "zod";

// Next.js sets NEXT_PHASE during `next build`; we skip strict production env
// enforcement during a build (page-data collection) so images/CI can build
// with placeholder secrets, but still fail fast at runtime.
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

const baseSchema = z.object({
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters")
    .optional(),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL").optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL is required").optional(),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required").optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  STYLIST_PROVIDER: z.enum(["auto", "nvidia", "openai", "mock"]).optional(),
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_BASE_URL: z.string().optional(),
  NVIDIA_MODEL: z.string().optional(),
  STYLIST_MONTHLY_LIMIT: z.string().optional(),
  TRYON_PROVIDER: z.string().optional(),
  RUNPOD_API_KEY: z.string().optional(),
  RUNPOD_ENDPOINT_ID: z.string().optional(),
  RUNPOD_WEBHOOK_SECRET: z.string().optional(),
  TRYON_MAX_WAIT_MS: z.string().optional(),
  TRYON_UPSCALE: z.string().optional(),
  TRYON_HEALTH_CHECK: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  // Comma-separated allow-list of cross-origin clients (Action Item 4).
  CORS_ORIGINS: z.string().optional(),
  // DB pooling & timeouts (Pillar 03, Action Item 2).
  DB_POOL_SIZE: z.string().optional(),
  DB_CONNECT_TIMEOUT_MS: z.string().optional(),
  DB_STATEMENT_TIMEOUT_MS: z.string().optional(),
  // Read replica (Pillar 03, Action Item 4). Unset → reads use the primary.
  TURSO_REPLICA_URL: z.string().optional(),
  // S3-compatible backup storage (Pillar 03, Action Item 6).
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  BACKUP_RETAIN_DAILY: z.string().optional(),
  BACKUP_RETAIN_MONTHLY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Vars that must be present when serving production traffic. Enforced at
// runtime (not during build) so the app fails fast on a missing secret.
const REQUIRED_IN_PRODUCTION = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "BETTER_AUTH_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "OPENAI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RUNPOD_API_KEY",
  "RUNPOD_ENDPOINT_ID",
  "RUNPOD_WEBHOOK_SECRET",
  // Backup to S3 is part of the production data-integrity guarantee (Pillar 03).
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const serverEnvSchema = baseSchema.superRefine((env, ctx) => {
  // Skipped during `next build` (page-data collection) so CI/images can build
  // with placeholder env, but still enforced at runtime.
  if (IS_BUILD_PHASE) return;

  // Always required at runtime, in every environment.
  if (!env.BETTER_AUTH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["BETTER_AUTH_SECRET"],
      message: "BETTER_AUTH_SECRET is required",
    });
  }

  if (env.NODE_ENV !== "production") return;
  for (const key of REQUIRED_IN_PRODUCTION) {
    const value = env[key];
    if (value === undefined || value === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required in production`,
      });
    }
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _validatedEnv: ServerEnv | null = null;

/**
 * Validate server environment variables.
 *
 * `BETTER_AUTH_SECRET` is required at runtime in every environment. In
 * production at runtime, critical infrastructure vars (Turso/URL) are
 * additionally required and cause a fail-fast boot error if missing. During
 * `next build` the strict checks are skipped so page-data collection / CI can
 * run with placeholder env.
 *
 * Call this at module load of a heavily-imported module (e.g. `@/drizzle`) so
 * production refuses to boot without its required configuration.
 */
export function validateEnv(): ServerEnv {
  if (_validatedEnv) return _validatedEnv;
  // Treat empty-string values as unset (an empty env var disables an optional
  // feature rather than being an invalid value).
  const cleaned = Object.fromEntries(
    Object.entries(process.env).filter(
      ([, v]) => v !== undefined && v !== ""
    )
  );
  const result = serverEnvSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  _validatedEnv = result.data;
  return _validatedEnv;
}

/** Parse the comma-separated CORS allow-list into an array of origins. */
export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

