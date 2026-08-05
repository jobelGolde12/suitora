import { z } from "zod";

const serverEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL").optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL is required").optional(),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required").optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
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
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _validatedEnv: ServerEnv | null = null;

/**
 * Validate server environment variables.
 * Only validates BETTER_AUTH_SECRET as truly required.
 * Other vars are validated at their point of use.
 */
export function validateEnv(): ServerEnv {
  if (_validatedEnv) return _validatedEnv;

  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  _validatedEnv = result.data;
  return _validatedEnv;
}
