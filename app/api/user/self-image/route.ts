import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { dbWrite, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { parseBody } from "@/lib/api/request";
import { enforceRateLimit, uploadRateLimiter } from "@/lib/rate-limit";
import { selfImageBodySchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const [row] = await dbWrite
      .select({ selfImageUrl: schema.users.selfImageUrl })
      .from(schema.users)
      .where(eq(schema.users.id, user.id));

    return NextResponse.json({ selfImageUrl: row?.selfImageUrl || null });
  } catch (err) {
    console.error("Error in GET /api/user/self-image:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await enforceRateLimit(uploadRateLimiter, user.id);
    if (!rl.success) {
      const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
      return apiRateLimitError(
        "Too many requests. Please try again later.",
        retryAfter
      );
    }

    const parsed = await parseBody(selfImageBodySchema, req);
    if (parsed.error) return parsed.error;
    const { selfImageUrl } = parsed.data;

    // 1. Update user's selfImageUrl
    await dbWrite
      .update(schema.users)
      .set({ selfImageUrl, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, user.id));

    // 2. Add uploads record (skip if already tracked by upload service)
    const existingUpload = await dbWrite
      .select({ id: schema.uploads.id })
      .from(schema.uploads)
      .where(eq(schema.uploads.url, selfImageUrl))
      .limit(1);

    if (existingUpload.length === 0) {
      await dbWrite.insert(schema.uploads).values({
        id: nanoid(),
        userId: user.id,
        kind: "user_photo",
        url: selfImageUrl,
        createdAt: new Date().toISOString(),
      });
    }

    return apiOk({ selfImageUrl });
  } catch (err) {
    console.error("Error in POST /api/user/self-image:", err);
    return apiError("Internal server error", 500);
  }
}
