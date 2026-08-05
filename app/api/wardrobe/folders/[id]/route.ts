import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/api/response";
import {
  deleteWardrobeFolder,
  updateWardrobeFolder,
} from "@/lib/db/queries";

const MAX_FOLDER_NAME = 48;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/wardrobe/folders/[id] — body: { name: string }
 * DELETE /api/wardrobe/folders/[id] — unassigns items (sets wardrobe_folder null)
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await context.params;
    if (!id) return apiError("Folder id is required", 400);

    const body = await req.json().catch(() => ({}));
    const name =
      typeof body?.name === "string" ? body.name.trim().slice(0, MAX_FOLDER_NAME) : "";

    if (!name) {
      return apiError("Folder name is required", 400);
    }

    const updated = await updateWardrobeFolder(session.user.id, id, name);
    if (!updated) {
      return apiError("Folder not found", 404);
    }

    return apiOk({
      folder: {
        id: updated.id,
        name: updated.name,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in PATCH /api/wardrobe/folders/[id]:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { id } = await context.params;
    if (!id) return apiError("Folder id is required", 400);

    const deleted = await deleteWardrobeFolder(session.user.id, id);
    if (!deleted) {
      return apiError("Folder not found", 404);
    }

    return apiOk();
  } catch (err) {
    console.error("Error in DELETE /api/wardrobe/folders/[id]:", err);
    return apiError("Internal server error", 500);
  }
}
