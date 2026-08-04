/**
 * Upload retention cleanup.
 * Deletes user-photo uploads older than the retention window from both
 * Cloudinary and the `uploads` table. Uploads still referenced by an active
 * analysis (user/product/generated image) or user profile are never removed.
 */

import { db, schema } from "@/drizzle";
import { eq, lt, or } from "drizzle-orm";
import { deleteCloudinaryImageFromUrl } from "@/lib/storage/cloudinary";

const DEFAULT_RETENTION_DAYS = 90;

async function isUploadReferenced(url: string): Promise<boolean> {
  const [analysisRef] = await db
    .select({ id: schema.analyses.id })
    .from(schema.analyses)
    .where(
      or(
        eq(schema.analyses.userImage, url),
        eq(schema.analyses.productImage, url),
        eq(schema.analyses.generatedImage, url)
      )
    )
    .limit(1);
  if (analysisRef) return true;

  const [profileRef] = await db
    .select({ id: schema.userProfiles.id })
    .from(schema.userProfiles)
    .where(
      or(
        eq(schema.userProfiles.selfImageUrl, url),
        eq(schema.userProfiles.selfImageThumbnailUrl, url)
      )
    )
    .limit(1);

  return !!profileRef;
}

export async function cleanupExpiredUploads(opts: {
  maxAgeDays?: number;
} = {}): Promise<{ scanned: number; deleted: number; retained: number }> {
  const maxAgeDays = opts.maxAgeDays ?? DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const candidates = await db
    .select()
    .from(schema.uploads)
    .where(lt(schema.uploads.createdAt, cutoff));

  let deleted = 0;
  let retained = 0;

  for (const upload of candidates) {
    if (await isUploadReferenced(upload.url)) {
      retained++;
      continue;
    }

    // Cloudinary delete is a no-op for non-Cloudinary (dev) URLs.
    await deleteCloudinaryImageFromUrl(upload.url);
    await db.delete(schema.uploads).where(eq(schema.uploads.id, upload.id));
    deleted++;
  }

  return { scanned: candidates.length, deleted, retained };
}
