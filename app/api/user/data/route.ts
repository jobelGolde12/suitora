import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api/response";
import { getUserDataExport } from "@/lib/db/queries";

/**
 * GET /api/user/data
 * Downloads the authenticated user's data as a JSON file (data portability
 * right in the Privacy Policy).
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const data = await getUserDataExport(session.user.id);

    return Response.json(data, {
      headers: {
        "Content-Disposition": 'attachment; filename="suitora-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error in GET /api/user/data:", err);
    return apiError("Internal server error", 500);
  }
}
