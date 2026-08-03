import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { extractProductFromUrl } from "@/lib/ai/product-extraction";
import { analyzeWithVision } from "@/lib/ai/vision";
import "@/lib/ai/providers"; // Auto-initialize vision providers
import { syncTryOnLifecycle } from "@/lib/ai/tryon/lifecycle";
import { mapCategoryToTryOn } from "@/lib/ai/tryon";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { productUrl, productImageUpload, userImageUrl, category } = body;

    // Fetch user's self image if not provided
    let finalUserImage = userImageUrl;
    if (!finalUserImage) {
      const [user] = await db
        .select({ selfImageUrl: schema.users.selfImageUrl })
        .from(schema.users)
        .where(eq(schema.users.id, session.user.id));
      finalUserImage = user?.selfImageUrl;
    }

    if (!finalUserImage) {
      return NextResponse.json(
        { error: "User self image is required. Please upload one first." },
        { status: 400 }
      );
    }

    let finalProductImage = productImageUpload;
    let productId: string | null = null;

    // If product URL is provided, extract the image candidate
    if (productUrl) {
      try {
        const extracted = await extractProductFromUrl(productUrl);
        finalProductImage = extracted.imageUrl;

        // Save to products table if doesn't exist
        const prodId = `prod_${nanoid()}`;
        await db.insert(schema.products).values({
          id: prodId,
          sourceUrl: productUrl,
          title: extracted.title,
          brand: extracted.brand,
          priceCents: extracted.priceCents,
          currency: extracted.currency,
          imageUrl: extracted.imageUrl,
          metadata: JSON.stringify(extracted.metadata),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).onConflictDoNothing();

        // Retrieve existing or new product ID
        const [existing] = await db
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(eq(schema.products.sourceUrl, productUrl));
        productId = existing?.id || prodId;
      } catch (err) {
        return NextResponse.json({ error: `URL extraction failed: ${errorMessage(err)}` }, { status: 400 });
      }
    }

    if (!finalProductImage) {
      return NextResponse.json({ error: "Product image or URL is required." }, { status: 400 });
    }

    const analysisId = `analysis_${nanoid()}`;

    // Create a pending analysis record
    await db.insert(schema.analyses).values({
      id: analysisId,
      userId: session.user.id,
      productId: productId,
      userImage: finalUserImage,
      productImage: finalProductImage,
      status: "pending",
      tryOnStatus: "pending",
      tryOnCategory: mapCategoryToTryOn(category),
      overallScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, analysisId });
  } catch (err) {
    console.error("Error in POST /api/analysis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // If ID is not provided, fetch user's full history of analyses
    if (!id) {
      const history = await getAnalysesByUserId(session.user.id, 50);
      const favorites = await getFavoritesByUserId(session.user.id);
      const favoriteAnalysisIds = new Set(favorites.map((f) => f.favorite.analysisId));

      const mappedHistory = history.map((item) => ({
        ...item,
        isFavorite: favoriteAnalysisIds.has(item.id),
      }));

      return NextResponse.json({ analyses: mappedHistory });
    }

    const [analysis] = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.id, id));

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Advance the virtual try-on lifecycle (lazy submit / resolve).
    await syncTryOnLifecycle(analysis);

    // Re-fetch to reflect any try-on state change.
    const [current] = await db
      .select()
      .from(schema.analyses)
      .where(eq(schema.analyses.id, id));

    if (!current) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // If analysis is already completed or failed, return it
    if (current.status === "completed" || current.status === "failed") {
      return NextResponse.json({
        analysis: {
          ...current,
          recommendations: current.recommendations ? JSON.parse(current.recommendations) : [],
          colorAnalysis: current.colorAnalysis ? JSON.parse(current.colorAnalysis) : null,
          compatibilityMetadata: current.compatibilityMetadata ? JSON.parse(current.compatibilityMetadata) : null,
        }
      });
    }

    // Simulate pipeline stages based on time elapsed since creation
    const elapsedMs = Date.now() - new Date(current.createdAt).getTime();

    let stage: "detecting" | "analyzing" | "try-on" | "scoring" | "complete" = "detecting";
    let progress = 10;
    let message = "Detecting person in image...";

    // Prefer the real try-on stage while a job is in flight
    if (current.tryOnStatus === "processing") {
      stage = "try-on";
      progress = 60;
      message = "Generating virtual try-on...";
    }

    if (elapsedMs > 6000) {
      // Pipeline complete — run real analysis
      try {
        const visionResult = await analyzeWithVision({
          userImageUrl: current.userImage,
          clothingImageUrl: current.productImage,
        });

        const recommendations = visionResult.recommendations;

        const colorAnalysis = visionResult.colorAnalysis;

        const compatibilityMetadata = {
          bodyShape: visionResult.traits.bodyShape,
          skinTone: visionResult.traits.skinTone,
          faceShape: visionResult.traits.faceShape,
          height: visionResult.height,
          heightConfidence: visionResult.heightConfidence,
          weight: visionResult.weight,
          weightConfidence: visionResult.weightConfidence,
        };

        // Update DB record with real analysis results
        await db
          .update(schema.analyses)
          .set({
            status: "completed",
            overallScore: visionResult.scores.overall,
            bodyScore: visionResult.scores.body,
            styleScore: visionResult.scores.style,
            colorScore: visionResult.scores.color,
            bodyShape: visionResult.traits.bodyShape,
            skinTone: visionResult.traits.skinTone,
            faceShape: visionResult.traits.faceShape,
            styleType: visionResult.traits.styleType,
            recommendations: JSON.stringify(recommendations),
            colorAnalysis: JSON.stringify(colorAnalysis),
            compatibilityMetadata: JSON.stringify(compatibilityMetadata),
            height: visionResult.height ?? null,
            heightConfidence: visionResult.heightConfidence ?? null,
            weight: visionResult.weight ?? null,
            weightConfidence: visionResult.weightConfidence ?? null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.analyses.id, id));

        // Refetch complete analysis
        const [updatedAnalysis] = await db
          .select()
          .from(schema.analyses)
          .where(eq(schema.analyses.id, id));

        return NextResponse.json({
          analysis: {
            ...updatedAnalysis,
            recommendations,
            colorAnalysis,
            compatibilityMetadata,
          },
          progress: 100,
          stage: "complete",
          message: "Analysis complete!"
        });
      } catch (err) {
        console.error("Vision analysis failed:", err);

        // Mark as failed
        await db
          .update(schema.analyses)
          .set({
            status: "failed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.analyses.id, id));

        return NextResponse.json({
          analysis: { ...current, status: "failed" },
          error: `Analysis pipeline failed: ${errorMessage(err)}`,
        });
      }
    } else if (elapsedMs > 4500) {
      stage = "scoring";
      progress = 85;
      message = "Calculating compatibility scores...";
    } else if (elapsedMs > 3000) {
      stage = "try-on";
      progress = 60;
      message = "Analyzing style compatibility...";
    } else if (elapsedMs > 1500) {
      stage = "analyzing";
      progress = 35;
      message = "Analyzing body shape & features...";
    }

    return NextResponse.json({
      analysis: current,
      progress,
      stage,
      message,
    });
  } catch (err) {
    console.error("Error in GET /api/analysis:", err);
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Analysis ID is required" }, { status: 400 });
    }

    // Load the row (ownership-scoped) so we can clean up generated assets.
    const [analysis] = await db
      .select()
      .from(schema.analyses)
      .where(and(eq(schema.analyses.id, id), eq(schema.analyses.userId, session.user.id)));

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    // Best-effort cleanup of the generated try-on image (owned by us in
    // Cloudinary). Never blocks the delete on storage failures.
    await deleteCloudinaryImageFromUrl(analysis.generatedImage);

    await db.delete(schema.analyses).where(eq(schema.analyses.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/analysis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Re-import these from queries to avoid circular dependency
import { getAnalysesByUserId, getFavoritesByUserId } from "@/lib/db/queries";
import { deleteCloudinaryImageFromUrl } from "@/lib/storage/cloudinary";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
