import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { dbWrite, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { parseBody } from "@/lib/api/request";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { updateProfileBodySchema } from "@/lib/validation";
import {
  getProfileByUserId,
  upsertProfile,
} from "@/lib/db/queries";
import type { UpdateProfilePayload } from "@/types";

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile with all measurements and preferences.
 */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    let profile = await getProfileByUserId(user.id);

    // Auto-create profile if none exists
    if (!profile) {
      const { createProfile } = await import("@/lib/db/queries");
      profile = await createProfile(user.id);
    }

    // Parse JSON string fields into arrays
    const parsed = {
      ...profile,
      styleTags: safeParseJson(profile.styleTags),
      preferredBrands: safeParseJson(profile.preferredBrands),
      preferredColors: safeParseJson(profile.preferredColors),
      avoidColors: safeParseJson(profile.avoidColors),
    };

    return NextResponse.json({ profile: parsed });
  } catch (err) {
    console.error("Error in GET /api/user/profile:", err);
    return apiError("Internal server error", 500);
  }
}

/**
 * PUT /api/user/profile
 * Updates profile fields. Accepts partial updates.
 */
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await enforceRateLimit(stylistRateLimiter, user.id);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(
        "Too many requests. Please try again later.",
        retryAfter
      );
    }

    const parsed = await parseBody(updateProfileBodySchema, req);
    if (parsed.error) return parsed.error;
    const profileData: UpdateProfilePayload = parsed.data;

    // Also update the user's name if provided
    if (profileData.name) {
      await dbWrite
        .update(schema.users)
        .set({ name: profileData.name, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, user.id));
    }

    const updated = await upsertProfile(user.id, profileData);

    if (!updated) {
      return apiError("Failed to update profile", 500);
    }

    // Parse JSON string fields
    const result = {
      ...updated,
      styleTags: safeParseJson(updated.styleTags),
      preferredBrands: safeParseJson(updated.preferredBrands),
      preferredColors: safeParseJson(updated.preferredColors),
      avoidColors: safeParseJson(updated.avoidColors),
    };

    return apiOk({ profile: result });
  } catch (err) {
    console.error("Error in PUT /api/user/profile:", err);
    return apiError("Internal server error", 500);
  }
}

function safeParseJson(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
