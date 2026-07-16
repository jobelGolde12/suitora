import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ selfImageUrl: schema.users.selfImageUrl })
      .from(schema.users)
      .where(eq(schema.users.id, session.user.id));

    return NextResponse.json({ selfImageUrl: user?.selfImageUrl || null });
  } catch (err: any) {
    console.error("Error in GET /api/user/self-image:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { selfImageUrl } = body;

    if (!selfImageUrl) {
      return NextResponse.json({ error: "selfImageUrl is required" }, { status: 400 });
    }

    // 1. Update user's selfImageUrl
    await db
      .update(schema.users)
      .set({ selfImageUrl, updatedAt: new Date().toISOString() })
      .where(eq(schema.users.id, session.user.id));

    // 2. Add uploads record
    await db.insert(schema.uploads).values({
      id: nanoid(),
      userId: session.user.id,
      kind: "user_photo",
      url: selfImageUrl,
      mimeType: "image/jpeg",
      sizeBytes: 1024 * 100, // mock size
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, selfImageUrl });
  } catch (err: any) {
    console.error("Error in POST /api/user/self-image:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
