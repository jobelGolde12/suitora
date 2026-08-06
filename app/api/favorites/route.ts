import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { dbWrite, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { notDeleted } from "@/lib/db/filters";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { parseBody } from "@/lib/api/request";
import {
  favoriteCreateSchema,
  favoriteUpdateSchema,
  favoriteDeleteSchema,
} from "@/lib/validation";
import {
  getFavoritesByUserId,
  getWardrobeFolderById,
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
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const favorites = await getFavoritesByUserId(user.id);

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

    const parsed = await parseBody(favoriteCreateSchema, req);
    if (parsed.error) return parsed.error;
    const { analysisId } = parsed.data;

    // Check if already favorited — restores a previously soft-deleted favorite
    // so the unique (user_id, analysis_id) constraint isn't violated.
    const [existing] = await dbWrite
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    if (existing) {
      if (existing.deletedAt) {
        const [restored] = await dbWrite
          .update(schema.favorites)
          .set({ deletedAt: null })
          .where(eq(schema.favorites.id, existing.id))
          .returning();
        return apiOk({ favorite: restored });
      }
      return apiOk({ favorite: existing });
    }

    const favId = nanoid();
    const [newFav] = await dbWrite
      .insert(schema.favorites)
      .values({
        id: favId,
        userId: user.id,
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

    const parsed = await parseBody(favoriteUpdateSchema, req);
    if (parsed.error) return parsed.error;
    const { analysisId, inWardrobe, wardrobeTags, wardrobeFolder } = parsed.data;

    // Only allow updating wardrobe fields for an existing, non-deleted favorite.
    const [existing] = await dbWrite
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, user.id),
          eq(schema.favorites.analysisId, analysisId),
          notDeleted(schema.favorites)
        )
      );

    if (!existing) {
      return apiError("Favorite not found", 404);
    }

    const tags = Array.isArray(wardrobeTags)
      ? wardrobeTags
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 5)
      : undefined;

    let nextFolder: string | null | undefined;
    if (wardrobeFolder === null) {
      nextFolder = null;
    } else if (typeof wardrobeFolder === "string") {
      const folderId = wardrobeFolder.trim();
      if (!folderId) {
        nextFolder = null;
      } else {
        const folder = await getWardrobeFolderById(user.id, folderId);
        if (!folder) {
          return apiError("Folder not found", 404);
        }
        nextFolder = folder.id;
      }
    }

    const updated = await updateFavoriteWardrobe(user.id, analysisId, {
      inWardrobe: typeof inWardrobe === "boolean" ? inWardrobe : undefined,
      wardrobeTags: tags,
      wardrobeFolder: nextFolder,
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

    const { searchParams } = new URL(req.url);
    let analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      const parsed = await parseBody(favoriteDeleteSchema, req);
      if (parsed.error) return parsed.error;
      analysisId = parsed.data.analysisId ?? null;
    }

    if (!analysisId) {
      return apiError("analysisId is required", 400);
    }

    await dbWrite
      .update(schema.favorites)
      .set({ deletedAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.favorites.userId, user.id),
          eq(schema.favorites.analysisId, analysisId),
          notDeleted(schema.favorites)
        )
      );

    return apiOk();
  } catch (err) {
    console.error("Error in DELETE /api/favorites:", err);
    return apiError("Internal server error", 500);
  }
}
