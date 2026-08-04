import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const [user] = await db
      .select({ selfImageUrl: schema.users.selfImageUrl })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id));

    return NextResponse.json({ selfImageUrl: user?.selfImageUrl || null });
  } catch (err) {
    console.error("Error in GET /api/user/self-image:", err);
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
    const { selfImageUrl } = body;

    if (!selfImageUrl) {
      return apiError("selfImageUrl is required", 400);
    }

    // 1. Update user's selfImageUrl
    await db
      .update(schema.users)
      .set({ selfImageUrl, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, session.user.id));

    // 2. Add uploads record (skip if already tracked by upload service)
    const existingUpload = await db
      .select({ id: schema.uploads.id })
      .from(schema.uploads)
      .where(eq(schema.uploads.url, selfImageUrl))
      .limit(1);

    if (existingUpload.length === 0) {
      await db.insert(schema.uploads).values({
        id: nanoid(),
        userId: session.user.id,
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
