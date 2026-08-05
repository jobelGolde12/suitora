import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import {
  getFavoriteOutfitsByUserId,
  getWardrobeFavoritesByUserId,
  parseJsonObject,
} from "@/lib/db/queries";
import {
  recommendOutfits,
  type WardrobeItemInput,
} from "@/lib/ai/outfit-recommender";
import type { ItemCategory, Silhouette, StyleTag } from "@/types";
import type { TrendOutfit } from "@/types/trend";

/** Turn a machine category/subtype (e.g. "midi_wrap") into a display name. */
function formatItemName(value: string): string {
  return value
    .replace(/[_\-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

interface ItemProfileFragment {
  category?: string;
  colors?: string[];
  styleTags?: string[];
  silhouette?: string;
  subtype?: string;
}

async function buildWardrobeItems(userId: string): Promise<WardrobeItemInput[]> {
  const rows = await getWardrobeFavoritesByUserId(userId);
  return rows
    .map(({ analysis }) => {
      const meta = parseJsonObject(analysis.compatibilityMetadata);
      const itemProfile = (meta?.itemProfile ?? {}) as ItemProfileFragment;
      const category = (itemProfile.category ?? "tops") as ItemCategory;
      const name = formatItemName(
        itemProfile.subtype ?? itemProfile.category ?? category
      );
      return {
        analysisId: analysis.id,
        name,
        imageUrl: analysis.productImage,
        category,
        colors:
          Array.isArray(itemProfile.colors) && itemProfile.colors.length
            ? itemProfile.colors
            : ["#2D2D2D", "#F5F5F5"],
        styleTags: (Array.isArray(itemProfile.styleTags) &&
        itemProfile.styleTags.length
          ? itemProfile.styleTags
          : ["casual"]) as StyleTag[],
        silhouette: (itemProfile.silhouette as Silhouette) || undefined,
        individualScore: Math.round(analysis.overallScore ?? 0),
      };
    })
    .filter((item) => item.imageUrl);
}

function parseSavedOutfit(row: {
  id: string;
  outfit: string;
  createdAt: string;
}): (TrendOutfit & { favoriteId: string }) | null {
  try {
    const parsed = JSON.parse(row.outfit) as TrendOutfit;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
      return null;
    }
    return {
      ...parsed,
      favoriteId: row.id,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/wardrobe/outfits?limit=<n>&regenerate=1
 * POST /api/wardrobe/outfits — body: { regenerate?: boolean, limit?: number }
 *
 * Generates outfit suggestions from the user's wardrobe. Pass regenerate to
 * shuffle foundations for a fresh set.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const limit = Math.min(
      Math.max(
        parseInt(request.nextUrl.searchParams.get("limit") || "6", 10) || 6,
        1
      ),
      12
    );
    const regenerate =
      request.nextUrl.searchParams.get("regenerate") === "1" ||
      request.nextUrl.searchParams.get("regenerate") === "true";

    const items = await buildWardrobeItems(session.user.id);
    if (items.length === 0) {
      return apiOk({ outfits: [], wardrobeCount: 0, saved: [] });
    }

    const seed = regenerate ? Date.now() : undefined;
    const outfits = recommendOutfits(items, { limit, seed });
    const savedRows = await getFavoriteOutfitsByUserId(session.user.id);
    const saved = savedRows
      .map(parseSavedOutfit)
      .filter((o): o is NonNullable<typeof o> => o != null);

    return apiOk({ outfits, wardrobeCount: items.length, saved });
  } catch (err) {
    console.error("Error in GET /api/wardrobe/outfits:", err);
    return apiError("Failed to generate outfit suggestions", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(
      Math.max(typeof body?.limit === "number" ? body.limit : 6, 1),
      12
    );

    const items = await buildWardrobeItems(session.user.id);
    if (items.length === 0) {
      return apiOk({ outfits: [], wardrobeCount: 0 });
    }

    const outfits = recommendOutfits(items, {
      limit,
      seed: Date.now(),
    });

    return apiOk({ outfits, wardrobeCount: items.length });
  } catch (err) {
    console.error("Error in POST /api/wardrobe/outfits:", err);
    return apiError("Failed to regenerate outfit suggestions", 500);
  }
}
