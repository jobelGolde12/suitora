/**
 * Upload retention cleanup.
 * Deletes user-photo uploads older than the retention window from both
 * Cloudinary and the `uploads` table. Uploads still referenced by an active
 * analysis (user/product/generated image) or user profile are never removed.
 *
 * Reference checks are batched (two queries total) so cleanup stays O(1)
 * queries regardless of candidate count — no per-upload N+1.
 */

import { dbWrite, dbRead, schema } from "@/drizzle";
import { lt, lte, inArray } from "drizzle-orm";
import { deleteCloudinaryImageFromUrl } from "@/lib/storage/cloudinary";

const DEFAULT_RETENTION_DAYS = 90;

async function collectReferencedUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const referenced = new Set<string>();

  const push = (rows: { url: string | null }[]) => {
    for (const row of rows) if (row.url) referenced.add(row.url);
  };

  push(
    await dbRead
      .select({ url: schema.analyses.userImage })
      .from(schema.analyses)
      .where(inArray(schema.analyses.userImage, urls))
  );
  push(
    await dbRead
      .select({ url: schema.analyses.productImage })
      .from(schema.analyses)
      .where(inArray(schema.analyses.productImage, urls))
  );
  push(
    await dbRead
      .select({ url: schema.analyses.generatedImage })
      .from(schema.analyses)
      .where(
        inArray(
          schema.analyses.generatedImage,
          urls.filter((u): u is string => !!u)
        )
      )
  );
  push(
    await dbRead
      .select({ url: schema.userProfiles.selfImageUrl })
      .from(schema.userProfiles)
      .where(inArray(schema.userProfiles.selfImageUrl, urls))
  );
  push(
    await dbRead
      .select({ url: schema.userProfiles.selfImageThumbnailUrl })
      .from(schema.userProfiles)
      .where(inArray(schema.userProfiles.selfImageThumbnailUrl, urls))
  );

  return referenced;
}

export async function cleanupExpiredUploads(opts: {
  maxAgeDays?: number;
} = {}): Promise<{ scanned: number; deleted: number; retained: number }> {
  const maxAgeDays = opts.maxAgeDays ?? DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const candidates = await dbRead
    .select()
    .from(schema.uploads)
    .where(lt(schema.uploads.createdAt, cutoff));

  const referenced = await collectReferencedUrls(candidates.map((u) => u.url));

  const idsToDelete: string[] = [];
  for (const upload of candidates) {
    if (referenced.has(upload.url)) continue;
    // Cloudinary delete is a no-op for non-Cloudinary (dev) URLs.
    await deleteCloudinaryImageFromUrl(upload.url);
    idsToDelete.push(upload.id);
  }

  if (idsToDelete.length > 0) {
    await dbWrite
      .delete(schema.uploads)
      .where(inArray(schema.uploads.id, idsToDelete));
  }

  return {
    scanned: candidates.length,
    deleted: idsToDelete.length,
    retained: candidates.length - idsToDelete.length,
  };
}

const SOFT_DELETE_PURGE_TABLES = [
  { name: "analyses", table: schema.analyses },
  { name: "favorites", table: schema.favorites },
  { name: "user_profiles", table: schema.userProfiles },
  { name: "stylist_messages", table: schema.stylistMessages },
  { name: "wardrobe_folders", table: schema.wardrobeFolders },
  { name: "favorite_outfits", table: schema.favoriteOutfits },
] as const;

/**
 * Physically purge soft-deleted rows past the retention window (Pillar 03,
 * Action Item 5). Hard-deletes rows where `deleted_at` is set and older than
 * the cutoff, freeing storage while keeping GDPR hard-delete semantics intact.
 */
export async function purgeSoftDeletedRows(opts: {
  maxAgeDays?: number;
} = {}): Promise<{ table: string; purged: number }[]> {
  const maxAgeDays = opts.maxAgeDays ?? DEFAULT_RETENTION_DAYS;
  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const results = await Promise.all(
    SOFT_DELETE_PURGE_TABLES.map(async ({ name, table }) => {
      const deleted = await dbWrite
        .delete(table)
        .where(lte(table.deletedAt, cutoff));
      return { table: name, purged: deleted.rowsAffected ?? 0 };
    })
  );
  return results;
}
