import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk } from "@/lib/api/response";
import {
  getFavoritesByUserId,
  toAnalysisResult,
  updateFavoriteWardrobe,
} from "@/lib/db/queries";

function parseWardrobeTags(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const favorites = await getFavoritesByUserId(session.user.id);

    const result = favorites.map(({ favorite, analysis }) => ({
      id: favorite.id,
      analysisId: favorite.analysisId,
      createdAt: favorite.createdAt,
      inWardrobe: favorite.inWardrobe,
      wardrobeTags: parseWardrobeTags(favorite.wardrobeTags),
      wardrobeFolder: favorite.wardrobeFolder,
      addedToWardrobeAt: favorite.addedToWardrobeAt,
      analysis: toAnalysisResult(analysis),
    }));

    return NextResponse.json({ favorites: result });
  } catch (err) {
    console.error("Error in GET /api/favorites:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { analysisId } = body;

    if (!analysisId) {
      return apiError("analysisId is required", 400);
    }

    // Check if already favorited
    const [existing] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, session.user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    if (existing) {
      return apiOk({ favorite: existing });
    }

    const favId = nanoid();
    const [newFav] = await db
      .insert(schema.favorites)
      .values({
        id: favId,
        userId: session.user.id,
        analysisId: analysisId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return apiOk({ favorite: newFav });
  } catch (err) {
    console.error("Error in POST /api/favorites:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const { analysisId, inWardrobe, wardrobeTags, wardrobeFolder } = body;

    if (!analysisId) {
      return apiError("analysisId is required", 400);
    }

    // Only allow updating wardrobe fields for an existing favorite.
    const [existing] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, session.user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    if (!existing) {
      return apiError("Favorite not found", 404);
    }

    const tags = Array.isArray(wardrobeTags)
      ? wardrobeTags
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12)
      : undefined;

    const updated = await updateFavoriteWardrobe(session.user.id, analysisId, {
      inWardrobe: typeof inWardrobe === "boolean" ? inWardrobe : undefined,
      wardrobeTags: tags,
      wardrobeFolder:
        typeof wardrobeFolder === "string" ? wardrobeFolder : undefined,
    });

    const favorite = updated ?? existing;

    return apiOk({
      favorite: {
        id: favorite.id,
        analysisId: favorite.analysisId,
        inWardrobe: favorite.inWardrobe,
        wardrobeTags: parseWardrobeTags(favorite.wardrobeTags),
        wardrobeFolder: favorite.wardrobeFolder,
        addedToWardrobeAt: favorite.addedToWardrobeAt,
      },
    });
  } catch (err) {
    console.error("Error in PATCH /api/favorites:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    let analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      const body = await req.json().catch(() => ({}));
      analysisId = body.analysisId;
    }

    if (!analysisId) {
      return apiError("analysisId is required", 400);
    }

    await db
      .delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, session.user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    return apiOk();
  } catch (err) {
    console.error("Error in DELETE /api/favorites:", err);
    return apiError("Internal server error", 500);
  }
}
