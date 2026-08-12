import { dbWrite, dbRead, schema } from "@/drizzle";
import { eq, desc, and, sql, type SQL } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { getTryOnStats } from "@/lib/ai/tryon/monitoring";
import { notDeleted } from "@/lib/db/filters";
import type { UpdateProfilePayload, AnalysisResult } from "@/types";

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Convert a raw `analyses` row into the parsed, API-facing shape. */
export function toAnalysisResult(
  row: typeof schema.analyses.$inferSelect
): AnalysisResult {
  // The DB stores `status`/`tryOnStatus` as free text; the app only writes the
  // union values below, so cast to the API-facing union for type safety.
  const base = row as Omit<AnalysisResult, "recommendations" | "colorAnalysis" | "compatibilityMetadata">;
  return {
    ...base,
    recommendations: parseJsonArray<string>(row.recommendations),
    colorAnalysis: parseJsonObject(row.colorAnalysis) as AnalysisResult["colorAnalysis"],
    compatibilityMetadata: parseJsonObject(row.compatibilityMetadata),
  };
}

// ─── User Queries ─────────────────────────────────────────────────
// User/auth reads stay on the primary (`dbWrite`) so signup/session writes are
// immediately visible (read-your-writes).

export async function getUserById(id: string) {
  const [user] = await dbWrite
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await dbWrite
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return user;
}

export async function getUploadsByUserId(userId: string) {
  return dbRead
    .select()
    .from(schema.uploads)
    .where(eq(schema.uploads.userId, userId));
}

/**
 * Permanently delete a user and every row that references them (GDPR hard
 * delete — deliberately bypasses soft-delete `deleted_at`). Child tables
 * cascade on delete, but rows are removed explicitly (in dependency order)
 * inside one transaction so the deletion is deterministic and auditable.
 */
export async function deleteUserRecord(userId: string) {
  await dbWrite.transaction(async (tx) => {
    await tx.delete(schema.favoriteOutfits).where(eq(schema.favoriteOutfits.userId, userId));
    await tx.delete(schema.wardrobeFolders).where(eq(schema.wardrobeFolders.userId, userId));
    await tx.delete(schema.favorites).where(eq(schema.favorites.userId, userId));
    await tx.delete(schema.analyses).where(eq(schema.analyses.userId, userId));
    await tx.delete(schema.uploads).where(eq(schema.uploads.userId, userId));
    await tx.delete(schema.settings).where(eq(schema.settings.userId, userId));
    await tx.delete(schema.userProfiles).where(eq(schema.userProfiles.userId, userId));
    await tx.delete(schema.stylistMessages).where(eq(schema.stylistMessages.userId, userId));
    await tx.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
    await tx.delete(schema.accounts).where(eq(schema.accounts.userId, userId));
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });
}

/** Assemble a GDPR-style JSON payload of everything the user has stored. */
export async function getUserDataExport(userId: string) {
  const [user] = await dbWrite
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  const [profile, analyses, favorites, uploads] = await Promise.all([
    getProfileByUserId(userId),
    getAnalysesByUserId(userId, 5000),
    getFavoritesByUserId(userId),
    getUploadsByUserId(userId),
  ]);

  return {
    user: user ?? null,
    profile,
    analyses: analyses.map((row) => toAnalysisResult(row)),
    favorites: favorites.map(({ favorite, analysis }) => ({
      ...favorite,
      wardrobeTags: parseJsonArray<string>(favorite.wardrobeTags),
      analysis: toAnalysisResult(analysis),
    })),
    uploads,
  };
}

// ─── Analysis Queries ────────────────────────────────────────────

export async function getAnalysesByUserId(
  userId: string,
  limit = 20,
  offset = 0,
  includeDeleted = false
) {
  return dbRead
    .select()
    .from(schema.analyses)
    .where(
      includeDeleted
        ? eq(schema.analyses.userId, userId)
        : and(eq(schema.analyses.userId, userId), notDeleted(schema.analyses))
    )
    .orderBy(desc(schema.analyses.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAnalysisById(id: string) {
  const [analysis] = await dbRead
    .select()
    .from(schema.analyses)
    .where(and(eq(schema.analyses.id, id), notDeleted(schema.analyses)));
  return analysis;
}

export async function createAnalysis(data: Omit<typeof schema.analyses.$inferInsert, 'id'>) {
  const [analysis] = await dbWrite
    .insert(schema.analyses)
    .values({ id: nanoid(), ...data })
    .returning();
  return analysis;
}

/** Soft delete — the row stays in the DB with a `deleted_at` timestamp. */
export async function deleteAnalysis(id: string) {
  await dbWrite
    .update(schema.analyses)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.analyses.id, id));
}

// ─── Favorites Queries ────────────────────────────────────────────

export async function getFavoritesByUserId(userId: string) {
  return dbRead
    .select({
      favorite: schema.favorites,
      analysis: schema.analyses,
    })
    .from(schema.favorites)
    .where(and(eq(schema.favorites.userId, userId), notDeleted(schema.favorites)))
    .innerJoin(
      schema.analyses,
      and(
        eq(schema.favorites.analysisId, schema.analyses.id),
        notDeleted(schema.analyses)
      )
    )
    .orderBy(desc(schema.favorites.createdAt));
}

/** Favorites flagged as being part of the user's wardrobe, newest first. */
export async function getWardrobeFavoritesByUserId(userId: string) {
  return dbRead
    .select({
      favorite: schema.favorites,
      analysis: schema.analyses,
    })
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, userId),
        eq(schema.favorites.inWardrobe, true),
        notDeleted(schema.favorites)
      )
    )
    .innerJoin(
      schema.analyses,
      and(
        eq(schema.favorites.analysisId, schema.analyses.id),
        notDeleted(schema.analyses)
      )
    )
    .orderBy(desc(schema.favorites.addedToWardrobeAt));
}

export async function addFavorite(userId: string, analysisId: string) {
  const [favorite] = await dbWrite
    .insert(schema.favorites)
    .values({ id: nanoid(), userId, analysisId })
    .returning();
  return favorite;
}

/** Soft delete — preserves history and any wardrobe associations. */
export async function removeFavorite(id: string) {
  await dbWrite
    .update(schema.favorites)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(schema.favorites.id, id));
}

export async function updateFavoriteWardrobe(
  userId: string,
  analysisId: string,
  data: {
    inWardrobe?: boolean;
    wardrobeTags?: string[];
    wardrobeFolder?: string | null;
  }
) {
  const setFields: Record<string, unknown> = {};

  if (data.inWardrobe !== undefined) {
    setFields.inWardrobe = data.inWardrobe;
    setFields.addedToWardrobeAt = data.inWardrobe
      ? new Date().toISOString()
      : null;
  }
  if (data.wardrobeTags !== undefined) {
    setFields.wardrobeTags = JSON.stringify(data.wardrobeTags);
  }
  if (data.wardrobeFolder !== undefined) {
    setFields.wardrobeFolder = data.wardrobeFolder || null;
  }

  if (Object.keys(setFields).length === 0) return null;

  const [updated] = await dbWrite
    .update(schema.favorites)
    .set(setFields)
    .where(
      and(
        eq(schema.favorites.userId, userId),
        eq(schema.favorites.analysisId, analysisId),
        notDeleted(schema.favorites)
      )
    )
    .returning();

  return updated ?? null;
}

export async function isFavorite(analysisId: string, userId: string) {
  const [favorite] = await dbRead
    .select()
    .from(schema.favorites)
    .where(
      and(
        sql`${schema.favorites.analysisId} = ${analysisId} AND ${schema.favorites.userId} = ${userId}`,
        notDeleted(schema.favorites)
      )
    );
  return !!favorite;
}

export async function getFavoriteAnalysisIds(userId: string): Promise<Set<string>> {
  const rows = await dbRead
    .select({ analysisId: schema.favorites.analysisId })
    .from(schema.favorites)
    .where(and(eq(schema.favorites.userId, userId), notDeleted(schema.favorites)));
  return new Set(rows.map((r) => r.analysisId));
}

// ─── Wardrobe Folder Queries ──────────────────────────────────────

export async function getWardrobeFoldersByUserId(userId: string) {
  return dbRead
    .select()
    .from(schema.wardrobeFolders)
    .where(and(eq(schema.wardrobeFolders.userId, userId), notDeleted(schema.wardrobeFolders)))
    .orderBy(desc(schema.wardrobeFolders.createdAt));
}

export async function getWardrobeFolderById(userId: string, folderId: string) {
  const [folder] = await dbRead
    .select()
    .from(schema.wardrobeFolders)
    .where(
      and(
        eq(schema.wardrobeFolders.id, folderId),
        eq(schema.wardrobeFolders.userId, userId),
        notDeleted(schema.wardrobeFolders)
      )
    );
  return folder ?? null;
}

export async function createWardrobeFolder(userId: string, name: string) {
  const [folder] = await dbWrite
    .insert(schema.wardrobeFolders)
    .values({
      id: nanoid(),
      userId,
      name,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return folder;
}

export async function updateWardrobeFolder(
  userId: string,
  folderId: string,
  name: string
) {
  const [updated] = await dbWrite
    .update(schema.wardrobeFolders)
    .set({ name })
    .where(
      and(
        eq(schema.wardrobeFolders.id, folderId),
        eq(schema.wardrobeFolders.userId, userId),
        notDeleted(schema.wardrobeFolders)
      )
    )
    .returning();
  return updated ?? null;
}

/** Soft-delete a folder and clear wardrobe_folder on any assigned favorites. */
export async function deleteWardrobeFolder(userId: string, folderId: string) {
  const existing = await getWardrobeFolderById(userId, folderId);
  if (!existing) return false;

  await dbWrite.transaction(async (tx) => {
    await tx
      .update(schema.favorites)
      .set({ wardrobeFolder: null })
      .where(
        and(
          eq(schema.favorites.userId, userId),
          eq(schema.favorites.wardrobeFolder, folderId),
          notDeleted(schema.favorites)
        )
      );

    await tx
      .update(schema.wardrobeFolders)
      .set({ deletedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.wardrobeFolders.id, folderId),
          eq(schema.wardrobeFolders.userId, userId)
        )
      );
  });

  return true;
}

export async function getWardrobeFolderItemCounts(userId: string) {
  return dbRead
    .select({
      folderId: schema.favorites.wardrobeFolder,
      itemCount: sql<number>`COUNT(*)`,
    })
    .from(schema.favorites)
    .where(
      and(
        eq(schema.favorites.userId, userId),
        eq(schema.favorites.inWardrobe, true),
        notDeleted(schema.favorites),
        sql`${schema.favorites.wardrobeFolder} IS NOT NULL`
      )
    )
    .groupBy(schema.favorites.wardrobeFolder);
}

// ─── Favorite Outfit Queries ──────────────────────────────────────

export async function getFavoriteOutfitsByUserId(userId: string) {
  return dbRead
    .select()
    .from(schema.favoriteOutfits)
    .where(and(eq(schema.favoriteOutfits.userId, userId), notDeleted(schema.favoriteOutfits)))
    .orderBy(desc(schema.favoriteOutfits.createdAt));
}

export async function addFavoriteOutfit(userId: string, outfitJson: string) {
  const [row] = await dbWrite
    .insert(schema.favoriteOutfits)
    .values({
      id: nanoid(),
      userId,
      outfit: outfitJson,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return row;
}

/** Soft delete — preserves the outfit snapshot for analytics/restore. */
export async function removeFavoriteOutfit(userId: string, id: string) {
  const result = await dbWrite
    .update(schema.favoriteOutfits)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(
        eq(schema.favoriteOutfits.id, id),
        eq(schema.favoriteOutfits.userId, userId),
        notDeleted(schema.favoriteOutfits)
      )
    )
    .returning();
  return result.length > 0;
}

// ─── Profile Queries ─────────────────────────────────────────────

export async function getProfileByUserId(userId: string) {
  const [profile] = await dbRead
    .select()
    .from(schema.userProfiles)
    .where(and(eq(schema.userProfiles.userId, userId), notDeleted(schema.userProfiles)));
  return profile ?? null;
}

export async function createProfile(userId: string) {
  const [profile] = await dbWrite
    .insert(schema.userProfiles)
    .values({ id: nanoid(), userId })
    .returning();
  return profile;
}

export async function upsertProfile(
  userId: string,
  data: UpdateProfilePayload
) {
  // Build update object from the payload, filtering only known profile fields
  const profileFields: Record<string, string | number | boolean | null> = {};
  const allowedFields = [
    "phone", "dateOfBirth", "gender",
    "height", "weight", "chestCircumference", "waistCircumference",
    "hipCircumference", "shoulderWidth", "inseamLength", "armLength",
    "neckCircumference", "footLength", "footWidth", "shoeSize", "bustCupSize",
    "styleTags", "preferredBrands", "preferredColors", "avoidColors",
    "priceRangeMin", "priceRangeMax", "fitPreference", "sizePreference",
  ];

  for (const field of allowedFields) {
    const value = data[field as keyof UpdateProfilePayload];
    if (value === undefined) continue;
    // Serialize arrays to JSON strings
    if (Array.isArray(value)) {
      profileFields[field] = JSON.stringify(value);
    } else {
      profileFields[field] = value;
    }
  }

  if (Object.keys(profileFields).length === 0) {
    const existing = await getProfileByUserId(userId);
    return existing;
  }

  profileFields.updatedAt = new Date().toISOString();

  // Ensure-profile-then-update runs in a single transaction so two concurrent
  // requests can't both see "no profile" and race the unique(user_id) insert.
  return dbWrite.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1);

    if (!existing[0]) {
      await tx.insert(schema.userProfiles).values({
        id: nanoid(),
        userId,
        ...(profileFields as Partial<typeof schema.userProfiles.$inferInsert>),
      });
      const [created] = await tx
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, userId));
      return created;
    }

    const [updated] = await tx
      .update(schema.userProfiles)
      .set(profileFields)
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    return updated;
  });
}

export async function updateProfileSelfImage(
  userId: string,
  selfImageUrl: string
) {
  await dbWrite.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1);

    if (!existing[0]) {
      await tx.insert(schema.userProfiles).values({ id: nanoid(), userId });
    }

    await tx
      .update(schema.userProfiles)
      .set({
        selfImageUrl,
        selfImageUploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.userProfiles.userId, userId));
  });
}

/**
 * Persist AI-estimated traits from an analysis into `user_profiles.estimated_*`.
 * Height/weight are only stored when confidence is high. Manual values live in
 * separate columns, so they are never overwritten.
 */
export async function persistAnalysisEstimates(
  userId: string,
  estimates: {
    height?: number | null;
    heightConfidence?: number | null;
    weight?: number | null;
    weightConfidence?: number | null;
    bodyShape?: string | null;
    skinTone?: string | null;
    faceShape?: string | null;
  }
) {
  const setFields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (estimates.height && (estimates.heightConfidence ?? 0) >= 0.7) {
    setFields.estimatedHeight = estimates.height;
    setFields.estimatedHeightConfidence = estimates.heightConfidence;
  }
  if (estimates.weight && (estimates.weightConfidence ?? 0) >= 0.7) {
    setFields.estimatedWeight = estimates.weight;
    setFields.estimatedWeightConfidence = estimates.weightConfidence;
  }
  if (estimates.bodyShape) {
    setFields.bodyShape = estimates.bodyShape;
    setFields.bodyShapeConfidence = estimates.heightConfidence ?? 0.7;
  }
  if (estimates.skinTone) setFields.skinTone = estimates.skinTone;
  if (estimates.faceShape) setFields.faceShape = estimates.faceShape;

  await dbWrite.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId))
      .limit(1);

    if (!existing[0]) {
      await tx.insert(schema.userProfiles).values({ id: nanoid(), userId });
    }

    await tx
      .update(schema.userProfiles)
      .set(setFields)
      .where(eq(schema.userProfiles.userId, userId));
  });
}

// ─── Stats Queries ────────────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const [stats] = await dbRead
    .select({
      totalAnalyses: sql<number>`COUNT(*)`,
      averageScore: sql<number>`AVG(${schema.analyses.overallScore})`,
      favoriteCount: sql<number>`(SELECT COUNT(*) FROM ${schema.favorites} WHERE ${schema.favorites.userId} = ${userId} AND ${schema.favorites.deletedAt} IS NULL)`,
      recentActivity: sql<number>`COUNT(CASE WHEN ${schema.analyses.createdAt} >= datetime('now', '-7 days') THEN 1 END)`,
      wardrobeCount: sql<number>`(SELECT COUNT(*) FROM ${schema.favorites} WHERE ${schema.favorites.userId} = ${userId} AND ${schema.favorites.inWardrobe} = true AND ${schema.favorites.deletedAt} IS NULL)`,
    })
    .from(schema.analyses)
    .where(and(eq(schema.analyses.userId, userId), notDeleted(schema.analyses)));

  const tryOn = await getTryOnStats(userId);

  return {
    totalAnalyses: stats?.totalAnalyses ?? 0,
    averageScore: Math.round(stats?.averageScore ?? 0),
    favoriteCount: stats?.favoriteCount ?? 0,
    recentActivity: stats?.recentActivity ?? 0,
    wardrobeCount: stats?.wardrobeCount ?? 0,
    tryOn,
  };
}

// ─── Trend Item Queries ──────────────────────────────────────────

export type TrendItemRow = typeof schema.trendItems.$inferSelect;

export async function listTrendItems(opts: {
  limit?: number;
  category?: string;
  season?: string;
  gender?: string;
  featured?: boolean;
  occasion?: string;
  brand?: string;
  availableOnly?: boolean;
} = {}): Promise<TrendItemRow[]> {
  const {
    limit = 12,
    category,
    season,
    gender,
    featured,
    occasion,
    brand,
    availableOnly = true,
  } = opts;

  const conditions: SQL[] = [];
  if (availableOnly) {
    conditions.push(eq(schema.trendItems.isAvailable, true));
  }
  if (category) {
    conditions.push(eq(schema.trendItems.category, category));
  }
  if (season) {
    conditions.push(eq(schema.trendItems.season, season));
  }
  if (gender) {
    conditions.push(eq(schema.trendItems.gender, gender));
  }
  if (featured === true) {
    conditions.push(eq(schema.trendItems.isFeatured, true));
  }
  if (occasion) {
    conditions.push(eq(schema.trendItems.occasion, occasion));
  }
  if (brand) {
    conditions.push(eq(schema.trendItems.brand, brand));
  }

  const base = dbRead
    .select()
    .from(schema.trendItems)
    .orderBy(
      desc(schema.trendItems.isFeatured),
      desc(schema.trendItems.popularityScore),
      desc(schema.trendItems.updatedAt)
    )
    .limit(limit);

  if (conditions.length === 0) {
    return base;
  }

  return base.where(and(...conditions));
}

export async function getTrendItemById(id: string): Promise<TrendItemRow | null> {
  const [item] = await dbRead
    .select()
    .from(schema.trendItems)
    .where(eq(schema.trendItems.id, id));
  return item ?? null;
}

export async function listSimilarTrendItems(opts: {
  category: string;
  styleTags?: string[];
  limit?: number;
}): Promise<TrendItemRow[]> {
  const { category, styleTags, limit = 12 } = opts;

  const rows = await listTrendItems({
    category,
    limit: Math.max(limit * 3, 36),
    availableOnly: true,
  });

  if (!styleTags?.length) return rows.slice(0, limit);

  const scored = rows
    .map((row) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(row.styleTags || "[]");
      } catch {
        tags = [];
      }
      return { row, overlap: tags.filter((t) => styleTags.includes(t)).length };
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap);

  if (scored.length === 0) return rows.slice(0, limit);

  return scored.slice(0, limit).map((s) => s.row);
}

export async function countTrendItems(): Promise<number> {
  const [row] = await dbRead
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.trendItems);
  return row?.count ?? 0;
}

/**
 * Insert a trend item or update it in place using the (provider, providerId)
 * unique constraint — no select-then-write race under concurrent syncs.
 */
export async function upsertTrendItem(
  data: Omit<typeof schema.trendItems.$inferInsert, "id"> & { id?: string }
) {
  const now = new Date().toISOString();
  const [row] = await dbWrite
    .insert(schema.trendItems)
    .values({
      id: data.id ?? nanoid(),
      provider: data.provider,
      providerId: data.providerId,
      title: data.title,
      brand: data.brand,
      description: data.description,
      category: data.category,
      subcategory: data.subcategory,
      gender: data.gender,
      imageUrl: data.imageUrl,
      productUrl: data.productUrl,
      price: data.price,
      currency: data.currency,
      season: data.season,
      occasion: data.occasion,
      styleTags: data.styleTags ?? "[]",
      colors: data.colors ?? "[]",
      popularityScore: data.popularityScore ?? 0,
      isFeatured: data.isFeatured ?? false,
      isAvailable: data.isAvailable ?? true,
      lastSynced: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.trendItems.provider, schema.trendItems.providerId],
      set: {
        title: data.title,
        brand: data.brand,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        gender: data.gender,
        imageUrl: data.imageUrl,
        productUrl: data.productUrl,
        price: data.price,
        currency: data.currency,
        season: data.season,
        occasion: data.occasion,
        styleTags: data.styleTags ?? "[]",
        colors: data.colors ?? "[]",
        popularityScore: data.popularityScore ?? 0,
        isFeatured: data.isFeatured ?? false,
        isAvailable: data.isAvailable ?? true,
        lastSynced: now,
        updatedAt: now,
      },
    })
    .returning();
  return row;
}

export async function createTrendSyncLog(data: {
  provider: string;
  status: string;
  itemsFetched: number;
  itemsUpserted: number;
  message?: string;
}) {
  const [log] = await dbWrite
    .insert(schema.trendSyncLogs)
    .values({
      id: nanoid(),
      provider: data.provider,
      status: data.status,
      itemsFetched: data.itemsFetched,
      itemsUpserted: data.itemsUpserted,
      message: data.message,
    })
    .returning();
  return log;
}

/** Most recent trend sync time, or null when no sync has ever run. */
export async function getLastTrendSyncAt(): Promise<Date | null> {
  const [row] = await dbRead
    .select({
      lastSync: sql<number>`strftime('%s', MAX(${schema.trendSyncLogs.createdAt}))`,
    })
    .from(schema.trendSyncLogs);
  if (row?.lastSync == null) return null;
  return new Date(row.lastSync * 1000);
}

// ─── Stylist Queries ──────────────────────────────────────────────

export type StylistMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

/** Most recent stylist messages, oldest-first (chronological). */
export async function getStylistMessages(
  userId: string,
  limit = 100,
  offset = 0
) {
  const rows = await dbRead
    .select()
    .from(schema.stylistMessages)
    .where(and(eq(schema.stylistMessages.userId, userId), notDeleted(schema.stylistMessages)))
    .orderBy(desc(schema.stylistMessages.createdAt))
    .limit(limit)
    .offset(offset);
  return rows.reverse() as StylistMessage[];
}

export async function addStylistMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<StylistMessage> {
  const [row] = await dbWrite
    .insert(schema.stylistMessages)
    .values({
      id: nanoid(),
      userId,
      role,
      content,
      createdAt: new Date().toISOString(),
    })
    .returning();
  return row as StylistMessage;
}

/** Count of user messages in the current calendar month (UTC). */
export async function countStylistMessagesThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const rows = await dbRead
    .select({ id: schema.stylistMessages.id })
    .from(schema.stylistMessages)
    .where(
      and(
        eq(schema.stylistMessages.userId, userId),
        eq(schema.stylistMessages.role, "user"),
        notDeleted(schema.stylistMessages),
        sql`${schema.stylistMessages.createdAt} >= ${monthStart}`
      )
    );
  return rows.length;
}
