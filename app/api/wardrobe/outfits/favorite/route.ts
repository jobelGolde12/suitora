import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
import {
  addFavoriteOutfit,
  getFavoriteOutfitsByUserId,
  removeFavoriteOutfit,
} from "@/lib/db/queries";
import type { TrendOutfit } from "@/types/trend";

/**
 * GET /api/wardrobe/outfits/favorite — list saved outfits
 * POST /api/wardrobe/outfits/favorite — body: { outfit: TrendOutfit }
 * DELETE /api/wardrobe/outfits/favorite?id=<id>
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return apiError("Unauthorized", 401);

    const rows = await getFavoriteOutfitsByUserId(session.user.id);
    const saved = rows
      .map((row) => {
        try {
          const outfit = JSON.parse(row.outfit) as TrendOutfit;
          return {
            favoriteId: row.id,
            ...outfit,
            createdAt: row.createdAt,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return apiOk({ saved });
  } catch (err) {
    console.error("Error in GET /api/wardrobe/outfits/favorite:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const outfit = body?.outfit as TrendOutfit | undefined;
    if (
      !outfit ||
      typeof outfit !== "object" ||
      !outfit.id ||
      !Array.isArray(outfit.items)
    ) {
      return apiError("Valid outfit snapshot is required", 400);
    }

    const snapshot = {
      id: outfit.id,
      name: outfit.name,
      items: outfit.items,
      overallScore: outfit.overallScore,
      coherenceScore: outfit.coherenceScore,
      colorStoryScore: outfit.colorStoryScore,
      proportionScore: outfit.proportionScore,
      formalityConsistency: outfit.formalityConsistency,
      seasonTags: outfit.seasonTags ?? [],
      occasionTags: outfit.occasionTags ?? [],
      stylingTips: outfit.stylingTips ?? [],
      createdAt: outfit.createdAt || new Date().toISOString(),
    };

    const row = await addFavoriteOutfit(
      session.user.id,
      JSON.stringify(snapshot)
    );

    return apiOk({
      favorite: {
        favoriteId: row.id,
        ...snapshot,
        createdAt: row.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/wardrobe/outfits/favorite:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = typeof body?.id === "string" ? body.id : null;
    }
    if (!id) return apiError("id is required", 400);

    const removed = await removeFavoriteOutfit(session.user.id, id);
    if (!removed) return apiError("Saved outfit not found", 404);

    return apiOk();
  } catch (err) {
    console.error("Error in DELETE /api/wardrobe/outfits/favorite:", err);
    return apiError("Internal server error", 500);
  }
}
