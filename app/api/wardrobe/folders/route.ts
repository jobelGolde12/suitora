import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { parseBody } from "@/lib/api/request";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { createFolderSchema } from "@/lib/validation";
import {
  createWardrobeFolder,
  getWardrobeFolderItemCounts,
  getWardrobeFoldersByUserId,
} from "@/lib/db/queries";

const MAX_FOLDERS = 30;

/**
 * GET /api/wardrobe/folders
 * POST /api/wardrobe/folders — body: { name: string }
 */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const userId = user.id;
    const [folders, counts] = await Promise.all([
      getWardrobeFoldersByUserId(userId),
      getWardrobeFolderItemCounts(userId),
    ]);

    const countByFolder = new Map(
      counts
        .filter((c) => c.folderId)
        .map((c) => [c.folderId as string, Number(c.itemCount)])
    );

    return apiOk({
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        itemCount: countByFolder.get(f.id) ?? 0,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error in GET /api/wardrobe/folders:", err);
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

    const parsed = await parseBody(createFolderSchema, req);
    if (parsed.error) return parsed.error;
    const { name } = parsed.data;

    const existing = await getWardrobeFoldersByUserId(user.id);
    if (existing.length >= MAX_FOLDERS) {
      return apiError(`You can have at most ${MAX_FOLDERS} folders`, 400);
    }

    const folder = await createWardrobeFolder(user.id, name);

    return apiOk({
      folder: {
        id: folder.id,
        name: folder.name,
        itemCount: 0,
        createdAt: folder.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/wardrobe/folders:", err);
    return apiError("Internal server error", 500);
  }
}
