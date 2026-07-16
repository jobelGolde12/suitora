import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { extractProductFromUrl } from "@/lib/ai/product-extraction";
import { estimateBodyTraits } from "@/lib/ai/body-estimation";
import { generateVirtualTryOn } from "@/lib/ai/tryon";
import { getAnalysesByUserId, getFavoritesByUserId } from "@/lib/db/queries";

function randomScore(min = 55, max = 95): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    const { productUrl, productImageUpload, userImageUrl } = body;

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
      } catch (err: any) {
        return NextResponse.json({ error: `URL extraction failed: ${err.message}` }, { status: 400 });
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
      status: "pending", // Starts as pending
      overallScore: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, analysisId });
  } catch (err: any) {
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

    // If analysis is already completed, return it
    if (analysis.status === "completed" || analysis.status === "failed") {
      return NextResponse.json({
        analysis: {
          ...analysis,
          recommendations: analysis.recommendations ? JSON.parse(analysis.recommendations) : [],
          colorAnalysis: analysis.colorAnalysis ? JSON.parse(analysis.colorAnalysis) : null,
          compatibilityMetadata: analysis.compatibilityMetadata ? JSON.parse(analysis.compatibilityMetadata) : null,
        }
      });
    }

    // Simulate pipeline stages based on time elapsed since creation
    const elapsedMs = Date.now() - new Date(analysis.createdAt).getTime();

    let stage: "detecting" | "analyzing" | "try-on" | "scoring" | "complete" = "detecting";
    let progress = 10;
    let message = "Detecting person in image...";

    if (elapsedMs > 6000) {
      // Transition to completed
      try {
        const traits = await estimateBodyTraits(analysis.userImage);
        const tryon = await generateVirtualTryOn(analysis.userImage, analysis.productImage);

        const overallScore = randomScore(55, 95);
        const bodyScore = randomScore(50, 98);
        const styleScore = randomScore(45, 95);
        const colorScore = randomScore(50, 92);

        const recommendations = [
          "This piece complements your figure beautifully",
          "Consider pairing with neutral-toned accessories for balance",
          "The silhouette works well for both casual and semi-formal occasions",
          "Try rolling up the sleeves for a more relaxed look",
        ];

        const colorAnalysis = {
          primaryColors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
          recommendedColors: ["#E8D5B7", "#4A90D9", "#2ECC71"],
          avoidColors: ["#FF6B6B", "#98FB98"],
        };

        const compatibilityMetadata = {
          bodyShape: traits.bodyShape,
          skinTone: traits.skinTone,
          faceShape: traits.faceShape,
          height: traits.height,
          heightConfidence: traits.heightConfidence,
          weight: traits.weight,
          weightConfidence: traits.weightConfidence,
        };

        // Update DB record
        await db
          .update(schema.analyses)
          .set({
            status: "completed",
            overallScore,
            bodyScore,
            styleScore,
            colorScore,
            bodyShape: traits.bodyShape,
            skinTone: traits.skinTone,
            faceShape: traits.faceShape,
            styleType: "minimalist",
            recommendations: JSON.stringify(recommendations),
            colorAnalysis: JSON.stringify(colorAnalysis),
            compatibilityMetadata: JSON.stringify(compatibilityMetadata),
            generatedImage: tryon.generatedImageUrl,
            height: traits.height,
            heightConfidence: traits.heightConfidence,
            weight: traits.weight,
            weightConfidence: traits.weightConfidence,
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
      } catch (err: any) {
        // Mark as failed
        await db
          .update(schema.analyses)
          .set({
            status: "failed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.analyses.id, id));

        return NextResponse.json({
          analysis: { ...analysis, status: "failed" },
          error: "Pipeline execution failed",
        });
      }
    } else if (elapsedMs > 4500) {
      stage = "scoring";
      progress = 85;
      message = "Calculating compatibility scores...";
    } else if (elapsedMs > 3000) {
      stage = "try-on";
      progress = 60;
      message = "Generating virtual try-on...";
    } else if (elapsedMs > 1500) {
      stage = "analyzing";
      progress = 35;
      message = "Analyzing body shape & features...";
    }

    return NextResponse.json({
      analysis,
      progress,
      stage,
      message,
    });
  } catch (err: any) {
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

    // Verify ownership and delete
    await db
      .delete(schema.analyses)
      .where(and(eq(schema.analyses.id, id), eq(schema.analyses.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/analysis:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
