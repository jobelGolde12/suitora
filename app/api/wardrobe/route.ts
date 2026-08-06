import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk } from "@/lib/api/response";
import {
  getWardrobeFavoritesByUserId,
  getWardrobeFoldersByUserId,
  getWardrobeFolderItemCounts,
  toAnalysisResult,
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

/**
 * GET /api/wardrobe
 * Returns folders (with item counts) and in-wardrobe favorites joined with folder info.
 */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const userId = user.id;
    const [folders, counts, rows] = await Promise.all([
      getWardrobeFoldersByUserId(userId),
      getWardrobeFolderItemCounts(userId),
      getWardrobeFavoritesByUserId(userId),
    ]);

    const countByFolder = new Map(
      counts
        .filter((c) => c.folderId)
        .map((c) => [c.folderId as string, Number(c.itemCount)])
    );

    const folderNameById = new Map(folders.map((f) => [f.id, f.name]));

    return apiOk({
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        itemCount: countByFolder.get(f.id) ?? 0,
        createdAt: f.createdAt,
      })),
      items: rows.map(({ favorite, analysis }) => ({
        id: favorite.id,
        analysisId: favorite.analysisId,
        createdAt: favorite.createdAt,
        inWardrobe: favorite.inWardrobe,
        wardrobeTags: parseWardrobeTags(favorite.wardrobeTags),
        wardrobeFolder: favorite.wardrobeFolder,
        wardrobeFolderName: favorite.wardrobeFolder
          ? (folderNameById.get(favorite.wardrobeFolder) ?? null)
          : null,
        addedToWardrobeAt: favorite.addedToWardrobeAt,
        analysis: toAnalysisResult(analysis),
      })),
    });
  } catch (err) {
    console.error("Error in GET /api/wardrobe:", err);
    return apiError("Internal server error", 500);
  }
}
