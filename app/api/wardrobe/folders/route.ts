import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
import {
  createWardrobeFolder,
  getWardrobeFolderItemCounts,
  getWardrobeFoldersByUserId,
} from "@/lib/db/queries";

const MAX_FOLDER_NAME = 48;
const MAX_FOLDERS = 30;

/**
 * GET /api/wardrobe/folders
 * POST /api/wardrobe/folders — body: { name: string }
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json().catch(() => ({}));
    const name =
      typeof body?.name === "string" ? body.name.trim().slice(0, MAX_FOLDER_NAME) : "";

    if (!name) {
      return apiError("Folder name is required", 400);
    }

    const existing = await getWardrobeFoldersByUserId(session.user.id);
    if (existing.length >= MAX_FOLDERS) {
      return apiError(`You can have at most ${MAX_FOLDERS} folders`, 400);
    }

    const folder = await createWardrobeFolder(session.user.id, name);

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
