import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import {
  getProfileByUserId,
  upsertProfile,
} from "@/lib/db/queries";
import { updateProfileSchema } from "@/lib/utils/validation";
import type { UpdateProfilePayload, UserProfile } from "@/types";

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile with all measurements and preferences.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let profile = await getProfileByUserId(session.user.id);

    // Auto-create profile if none exists
    if (!profile) {
      const { createProfile } = await import("@/lib/db/queries");
      profile = await createProfile(session.user.id);
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
  } catch (err: any) {
    console.error("Error in GET /api/user/profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Updates profile fields. Accepts partial updates.
 */
export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input with Zod
    const validated = updateProfileSchema.safeParse(body);
    if (!validated.success) {
      const message = validated.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return NextResponse.json({ error: `Invalid input: ${message}` }, { status: 400 });
    }

    const profileData: UpdateProfilePayload = validated.data;

    // Also update the user's name if provided
    if (profileData.name) {
      await db
        .update(schema.users)
        .set({ name: profileData.name, updatedAt: new Date().toISOString() })
        .where(eq(schema.users.id, session.user.id));
    }

    const updated = await upsertProfile(session.user.id, profileData);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Parse JSON string fields
    const parsed = {
      ...updated,
      styleTags: safeParseJson(updated.styleTags),
      preferredBrands: safeParseJson(updated.preferredBrands),
      preferredColors: safeParseJson(updated.preferredColors),
      avoidColors: safeParseJson(updated.avoidColors),
    };

    return NextResponse.json({ profile: parsed });
  } catch (err: any) {
    console.error("Error in PUT /api/user/profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function safeParseJson(value: string | null | undefined): any[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
