import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db, schema } from "@/drizzle";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils/id";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/storage/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, {
      folder: "suitora/uploads",
    });

    // Track in uploads table
    await db.insert(schema.uploads).values({
      id: nanoid(),
      userId: session.user.id,
      kind: "product_image",
      url: result.url,
      width: result.width,
      height: result.height,
      mimeType: `image/${result.format}`,
      sizeBytes: result.bytes,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    });
  } catch (err: any) {
    console.error("Error in POST /api/uploads:", err);
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
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    await deleteFromCloudinary(publicId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/uploads:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
