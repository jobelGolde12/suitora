import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { getFavoritesByUserId } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await getFavoritesByUserId(session.user.id);

    const result = favorites.map(({ favorite, analysis }) => ({
      id: favorite.id,
      analysisId: favorite.analysisId,
      createdAt: favorite.createdAt,
      analysis: {
        ...analysis,
        recommendations: analysis.recommendations ? JSON.parse(analysis.recommendations) : [],
        colorAnalysis: analysis.colorAnalysis ? JSON.parse(analysis.colorAnalysis) : null,
        compatibilityMetadata: analysis.compatibilityMetadata ? JSON.parse(analysis.compatibilityMetadata) : null,
      },
    }));

    return NextResponse.json({ favorites: result });
  } catch (err: any) {
    console.error("Error in GET /api/favorites:", err);
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
    const { analysisId } = body;

    if (!analysisId) {
      return NextResponse.json({ error: "analysisId is required" }, { status: 400 });
    }

    // Check if already favorited
    const [existing] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, session.user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    if (existing) {
      return NextResponse.json({ success: true, favorite: existing });
    }

    const favId = nanoid();
    const [newFav] = await db
      .insert(schema.favorites)
      .values({
        id: favId,
        userId: session.user.id,
        analysisId: analysisId,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ success: true, favorite: newFav });
  } catch (err: any) {
    console.error("Error in POST /api/favorites:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      const body = await req.json().catch(() => ({}));
      analysisId = body.analysisId;
    }

    if (!analysisId) {
      return NextResponse.json({ error: "analysisId is required" }, { status: 400 });
    }

    await db
      .delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, session.user.id),
          eq(schema.favorites.analysisId, analysisId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/favorites:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
