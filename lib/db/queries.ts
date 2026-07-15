import { db, schema } from "@/drizzle";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";

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
