import { requireUser } from "@/lib/auth/session";
import { apiError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { getUserDataExport } from "@/lib/db/queries";

/**
 * GET /api/user/data
 * Downloads the authenticated user's data as a JSON file (data portability
 * right in the Privacy Policy).
 */
export const GET = withApiRoute("/api/user/data", async () => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const data = await getUserDataExport(user.id);

  return Response.json(data, {
    headers: {
      "Content-Disposition": 'attachment; filename="suitora-data.json"',
      "Cache-Control": "no-store",
    },
  });
});
