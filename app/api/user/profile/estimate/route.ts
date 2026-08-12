import { requireUser } from "@/lib/auth/session";
import { dbWrite, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { estimateBodyTraits } from "@/lib/ai/body-estimation";
import { getProfileByUserId, createProfile } from "@/lib/db/queries";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { analysisRateLimiter, enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/user/profile/estimate
 * Triggers AI body estimation using the user's saved self-image.
 * Saves the estimated values to the user's profile.
 */
export const POST = withApiRoute("/api/user/profile/estimate", async () => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const rl = await enforceRateLimit(analysisRateLimiter, user.id);
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return apiRateLimitError(
      "Too many estimation requests. Please try again later.",
      retryAfter
    );
  }

  // Get the user's self-image URL
  const [row] = await dbWrite
    .select({ selfImageUrl: schema.users.selfImageUrl })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));

  if (!row?.selfImageUrl) {
    return apiError("No self-image uploaded. Please upload a photo first.", 400);
  }

  // Run AI body estimation
  const estimation = await estimateBodyTraits(row.selfImageUrl);

  // Ensure profile exists
  const profile = await getProfileByUserId(user.id);
  if (!profile) {
    await createProfile(user.id);
  }

  // Save estimation results to profile
  const now = new Date().toISOString();
  await dbWrite
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
    .where(eq(schema.userProfiles.userId, user.id));

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
});
