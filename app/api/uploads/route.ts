import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk } from "@/lib/api/response";
import { uploadRateLimiter } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const rl = await uploadRateLimiter.limit(session.user.id);
    if (!rl.success) {
      return apiError("Upload limit reached. Please try again in an hour.", 429);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("File is required", 400);
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if Cloudinary is configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    let url: string;
    let publicId: string;
    let width = 0;
    let height = 0;
    let format = "webp";
    let bytes = buffer.length;

    if (hasCloudinary) {
      // Upload to Cloudinary
      const { uploadToCloudinary } = await import("@/lib/storage/cloudinary");
      const result = await uploadToCloudinary(buffer, {
        folder: "suitora/uploads",
      });
      url = result.url;
      publicId = result.publicId;
      width = result.width;
      height = result.height;
      format = result.format;
      bytes = result.bytes;
    } else {
      // Fallback: store as base64 data URL (dev mode only)
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";
      url = `data:${mimeType};base64,${base64}`;
      publicId = `local_${nanoid()}`;
    }

    // Track in uploads table
    await db.insert(schema.uploads).values({
      id: nanoid(),
      userId: session.user.id,
      kind: "product_image",
      url,
      width: width || null,
      height: height || null,
      mimeType: `image/${format}`,
      sizeBytes: bytes,
      createdAt: new Date().toISOString(),
    });

    return apiOk({ url, publicId });
  } catch (err) {
    console.error("Error in POST /api/uploads:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return apiError("publicId is required", 400);
    }

    // Only delete from Cloudinary if configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary && !publicId.startsWith("local_")) {
      const { deleteFromCloudinary } = await import("@/lib/storage/cloudinary");
      await deleteFromCloudinary(publicId);
    }

    return apiOk();
  } catch (err) {
    console.error("Error in DELETE /api/uploads:", err);
    return apiError("Internal server error", 500);
  }
}
