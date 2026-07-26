import { db, schema } from "@/drizzle";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import type { UpdateProfilePayload } from "@/types";

// ─── User Queries ─────────────────────────────────────────────────

export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return user;
}

// ─── Analysis Queries ────────────────────────────────────────────

export async function getAnalysesByUserId(userId: string, limit = 20) {
  return db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.userId, userId))
    .orderBy(desc(schema.analyses.createdAt))
    .limit(limit);
}

export async function getAnalysisById(id: string) {
  const [analysis] = await db
    .select()
    .from(schema.analyses)
    .where(eq(schema.analyses.id, id));
  return analysis;
}

export async function createAnalysis(data: Omit<typeof schema.analyses.$inferInsert, 'id'>) {
  const [analysis] = await db
    .insert(schema.analyses)
    .values({ id: nanoid(), ...data })
    .returning();
  return analysis;
}

export async function deleteAnalysis(id: string) {
  await db
    .delete(schema.analyses)
    .where(eq(schema.analyses.id, id));
}

// ─── Favorites Queries ────────────────────────────────────────────

export async function getFavoritesByUserId(userId: string) {
  return db
    .select({
      favorite: schema.favorites,
      analysis: schema.analyses,
    })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId))
    .innerJoin(
      schema.analyses,
      eq(schema.favorites.analysisId, schema.analyses.id)
    )
    .orderBy(desc(schema.favorites.createdAt));
}

export async function addFavorite(userId: string, analysisId: string) {
  const [favorite] = await db
    .insert(schema.favorites)
    .values({ id: nanoid(), userId, analysisId })
    .returning();
  return favorite;
}

export async function removeFavorite(id: string) {
  await db
    .delete(schema.favorites)
    .where(eq(schema.favorites.id, id));
}

export async function isFavorite(analysisId: string, userId: string) {
  const [favorite] = await db
    .select()
    .from(schema.favorites)
    .where(
      sql`${schema.favorites.analysisId} = ${analysisId} AND ${schema.favorites.userId} = ${userId}`
    );
  return !!favorite;
}

// ─── Stats Queries ────────────────────────────────────────────────

// ─── Profile Queries ─────────────────────────────────────────────

export async function getProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId));
  return profile ?? null;
}

export async function createProfile(userId: string) {
  const [profile] = await db
    .insert(schema.userProfiles)
    .values({ id: nanoid(), userId })
    .returning();
  return profile;
}

export async function upsertProfile(
  userId: string,
  data: UpdateProfilePayload
) {
  // Ensure profile exists
  const existing = await getProfileByUserId(userId);
  if (!existing) {
    await createProfile(userId);
  }

  // Build update object from the payload, filtering only known profile fields
  const profileFields: Record<string, any> = {};
  const allowedFields = [
    "phone", "dateOfBirth", "gender",
    "height", "weight", "chestCircumference", "waistCircumference",
    "hipCircumference", "shoulderWidth", "inseamLength", "armLength",
    "neckCircumference", "footLength", "footWidth", "shoeSize", "bustCupSize",
    "styleTags", "preferredBrands", "preferredColors", "avoidColors",
    "priceRangeMin", "priceRangeMax", "fitPreference", "sizePreference",
  ];

  for (const field of allowedFields) {
    if (field in data && data[field as keyof UpdateProfilePayload] !== undefined) {
      const value = data[field as keyof UpdateProfilePayload];
      // Serialize arrays to JSON strings
      if (Array.isArray(value)) {
        profileFields[field] = JSON.stringify(value);
      } else {
        profileFields[field] = value;
      }
    }
  }

  if (Object.keys(profileFields).length === 0) return existing ?? null;

  profileFields.updatedAt = new Date().toISOString();

  const [updated] = await db
    .update(schema.userProfiles)
    .set(profileFields)
    .where(eq(schema.userProfiles.userId, userId))
    .returning();

  return updated ?? null;
}

export async function updateProfileSelfImage(
  userId: string,
  selfImageUrl: string
) {
  // Ensure profile exists
  const existing = await getProfileByUserId(userId);
  if (!existing) {
    await createProfile(userId);
  }

  await db
    .update(schema.userProfiles)
    .set({
      selfImageUrl,
      selfImageUploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.userProfiles.userId, userId));
}

// ─── Stats Queries ────────────────────────────────────────────────

export async function getDashboardStats(userId: string) {
  const [stats] = await db
    .select({
      totalAnalyses: sql<number>`COUNT(*)`,
      averageScore: sql<number>`AVG(${schema.analyses.overallScore})`,
      favoriteCount: sql<number>`(SELECT COUNT(*) FROM ${schema.favorites} WHERE ${schema.favorites.userId} = ${userId})`,
      recentActivity: sql<number>`COUNT(CASE WHEN ${schema.analyses.createdAt} >= datetime('now', '-7 days') THEN 1 END)`,
    })
    .from(schema.analyses)
    .where(eq(schema.analyses.userId, userId));

  return {
    totalAnalyses: stats?.totalAnalyses ?? 0,
    averageScore: Math.round(stats?.averageScore ?? 0),
    favoriteCount: stats?.favoriteCount ?? 0,
    recentActivity: stats?.recentActivity ?? 0,
  };
}
