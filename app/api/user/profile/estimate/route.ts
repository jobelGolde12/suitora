import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { estimateBodyTraits } from "@/lib/ai/body-estimation";
import { getProfileByUserId, createProfile } from "@/lib/db/queries";
import { apiError, apiOk } from "@/lib/api/response";

/**
 * POST /api/user/profile/estimate
 * Triggers AI body estimation using the user's saved self-image.
 * Saves the estimated values to the user's profile.
 */
export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    // Get the user's self-image URL
    const [user] = await db
      .select({ selfImageUrl: schema.users.selfImageUrl })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id));

    if (!user?.selfImageUrl) {
      return apiError("No self-image uploaded. Please upload a photo first.", 400);
    }

    // Run AI body estimation
    const estimation = await estimateBodyTraits(user.selfImageUrl);

    // Ensure profile exists
    const profile = await getProfileByUserId(session.user.id);
    if (!profile) {
      await createProfile(session.user.id);
    }

    // Save estimation results to profile
    const now = new Date().toISOString();
    await db
      .update(schema.userProfiles)
      .set({
        estimatedHeight: estimation.height,
        estimatedHeightConfidence: estimation.heightConfidence,
        estimatedWeight: estimation.weight,
        estimatedWeightConfidence: estimation.weightConfidence,
        bodyShape: estimation.bodyShape,
        bodyShapeConfidence: 0.85,
        skinTone: estimation.skinTone,
        faceShape: estimation.faceShape,
        updatedAt: now,
      })
      .where(eq(schema.userProfiles.userId, session.user.id));

    return apiOk({
      estimation: {
        height: estimation.height,
        heightConfidence: estimation.heightConfidence,
        weight: estimation.weight,
        weightConfidence: estimation.weightConfidence,
        bodyShape: estimation.bodyShape,
        skinTone: estimation.skinTone,
        faceShape: estimation.faceShape,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/user/profile/estimate:", err);
    return apiError("Internal server error", 500);
  }
}
