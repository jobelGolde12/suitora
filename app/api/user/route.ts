import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk } from "@/lib/api/response";
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;

    const [analyses, uploads, profile, users] = await Promise.all([
      getAnalysesByUserId(userId, 5000),
      getUploadsByUserId(userId),
      getProfileByUserId(userId),
      db
        .select({ image: schema.users.image, selfImageUrl: schema.users.selfImageUrl })
        .from(schema.users)
        .where(eq(schema.users.id, userId)),
    ]);

    const [user] = users;

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
    if (user?.image) assetUrls.add(user.image);
    if (user?.selfImageUrl) assetUrls.add(user.selfImageUrl);

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
        email: session.user.email,
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
