import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import {
  getWardrobeFavoritesByUserId,
  parseJsonObject,
} from "@/lib/db/queries";
import {
  recommendOutfits,
  type WardrobeItemInput,
} from "@/lib/ai/outfit-recommender";
import type { ItemCategory, Silhouette, StyleTag } from "@/types";

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

/**
 * GET /api/wardrobe/outfits?limit=<n>
 *
 * Generates complete, scored outfit suggestions from the user's wardrobe
 * (favorites flagged `in_wardrobe`). Each analysis supplies its item profile
 * (category, colors, style tags, silhouette) and its user-specific fit score,
 * which the outfit engine blends with outfit-level quality signals.
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

    const rows = await getWardrobeFavoritesByUserId(session.user.id);
    if (rows.length === 0) {
      return apiOk({ outfits: [], wardrobeCount: 0 });
    }

    const items: WardrobeItemInput[] = rows
      .map(({ analysis }) => {
        const meta = parseJsonObject(analysis.compatibilityMetadata);
        const itemProfile = (meta?.itemProfile ??
          {}) as ItemProfileFragment;
        const category = (itemProfile.category ??
          "tops") as ItemCategory;
        const name = formatItemName(
          itemProfile.subtype ?? itemProfile.category ?? category
        );
        return {
          analysisId: analysis.id,
          name,
          imageUrl: analysis.productImage,
          category,
          colors: Array.isArray(itemProfile.colors) && itemProfile.colors.length
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

    const outfits = recommendOutfits(items, { limit });

    return apiOk({ outfits, wardrobeCount: items.length });
  } catch (err) {
    console.error("Error in GET /api/wardrobe/outfits:", err);
    return apiError("Failed to generate outfit suggestions", 500);
  }
}
