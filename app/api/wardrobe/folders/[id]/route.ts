import { requireUser } from "@/lib/auth/session";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId, type RouteParams } from "@/lib/api/route";
import { parseBody } from "@/lib/api/request";
import { enforceRateLimit, stylistRateLimiter } from "@/lib/rate-limit";
import { updateFolderSchema } from "@/lib/validation";
import {
  deleteWardrobeFolder,
  updateWardrobeFolder,
} from "@/lib/db/queries";

/**
 * PATCH /api/wardrobe/folders/[id] — body: { name: string }
 * DELETE /api/wardrobe/folders/[id] — unassigns items (sets wardrobe_folder null)
 */
export const PATCH = withApiRoute(
  "/api/wardrobe/folders/[id]",
  async (req: Request, context: { params: RouteParams<{ id: string }> }) => {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }
    withUserId(user.id);

    const rl = await enforceRateLimit(stylistRateLimiter, user.id);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(
        "Too many requests. Please try again later.",
        retryAfter
      );
    }

    const { id } = await context.params;
    if (!id) return apiError("Folder id is required", 400);

    const parsed = await parseBody(updateFolderSchema, req);
    if (parsed.error) return parsed.error;
    const { name } = parsed.data;

    const updated = await updateWardrobeFolder(user.id, id, name);
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
  }
);

export const DELETE = withApiRoute(
  "/api/wardrobe/folders/[id]",
  async (_req: Request, context: { params: RouteParams<{ id: string }> }) => {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }
    withUserId(user.id);

    const rl = await enforceRateLimit(stylistRateLimiter, user.id);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(
        "Too many requests. Please try again later.",
        retryAfter
      );
    }

    const { id } = await context.params;
    if (!id) return apiError("Folder id is required", 400);

    const deleted = await deleteWardrobeFolder(user.id, id);
    if (!deleted) {
      return apiError("Folder not found", 404);
    }

    return apiOk();
  }
);
