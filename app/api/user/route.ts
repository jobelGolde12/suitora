import { requireUser } from "@/lib/auth/session";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import {
  deleteUserRecord,
  getAnalysesByUserId,
  getProfileByUserId,
  getUploadsByUserId,
} from "@/lib/db/queries";
import { deleteCloudinaryImageFromUrl } from "@/lib/storage/cloudinary";

/**
 * DELETE /api/user
 * Permanently deletes the authenticated user's account and all associated
 * data: Cloudinary assets, analyses, favorites, uploads, profile, settings,
 * sessions, and accounts. Backs the deletion rights in the Privacy Policy.
 */
export async function DELETE() {
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

    const userId = user.id;

    const [analyses, uploads, profile, users] = await Promise.all([
      getAnalysesByUserId(userId, 5000),
      getUploadsByUserId(userId),
      getProfileByUserId(userId),
      db
        .select({ image: schema.users.image, selfImageUrl: schema.users.selfImageUrl })
        .from(schema.users)
        .where(eq(schema.users.id, userId)),
    ]);

    const [dbUser] = users;

    // Collect every Cloudinary asset the user owns before rows are removed.
    const assetUrls = new Set<string>();
    for (const analysis of analyses) {
      assetUrls.add(analysis.userImage);
      assetUrls.add(analysis.productImage);
      if (analysis.generatedImage) assetUrls.add(analysis.generatedImage);
    }
    for (const upload of uploads) {
      assetUrls.add(upload.url);
    }
    if (profile?.selfImageUrl) assetUrls.add(profile.selfImageUrl);
    if (profile?.selfImageThumbnailUrl) assetUrls.add(profile.selfImageThumbnailUrl);
    if (dbUser?.image) assetUrls.add(dbUser.image);
    if (dbUser?.selfImageUrl) assetUrls.add(dbUser.selfImageUrl);

    // Purge Cloudinary assets (best-effort; no-op for non-Cloudinary URLs),
    // then remove the rows.
    await Promise.allSettled(
      [...assetUrls].map((url) => deleteCloudinaryImageFromUrl(url))
    );

    await deleteUserRecord(userId);

    await db.insert(schema.auditLogs).values({
      id: nanoid(),
      userId,
      action: "account_deleted",
      details: JSON.stringify({
        email: user.email,
        timestamp: new Date().toISOString(),
      }),
      createdAt: new Date().toISOString(),
    });

    return apiOk({ deleted: true, purgedAssets: assetUrls.size });
  } catch (err) {
    console.error("Error in DELETE /api/user:", err);
    return apiError("Failed to delete account", 500);
  }
}
