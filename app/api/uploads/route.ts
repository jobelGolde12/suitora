import { requireUser } from "@/lib/auth/session";
import { dbWrite, schema } from "@/drizzle";
import { nanoid } from "@/lib/utils/id";
import { apiError, apiOk, apiRateLimitError } from "@/lib/api/response";
import { withApiRoute, withUserId } from "@/lib/api/route";
import { uploadRateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { imageFileSchema, ACCEPTED_IMAGE_TYPES } from "@/lib/utils/validation";

export const POST = withApiRoute("/api/uploads", async (req: Request) => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

  const rl = await enforceRateLimit(uploadRateLimiter, user.id);
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
    return apiRateLimitError(
      "Upload limit reached. Please try again in an hour.",
      retryAfter
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return apiError("File is required", 400);
  }

  // Validate image type + size before reading it into memory.
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return apiError("Only .jpg, .png, and .webp files are accepted", 400);
  }
  const sizeCheck = imageFileSchema.safeParse(file);
  if (!sizeCheck.success) {
    const issue = sizeCheck.error.issues[0];
    return apiError(issue?.message ?? "Invalid file", 400);
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
  await dbWrite.insert(schema.uploads).values({
    id: nanoid(),
    userId: user.id,
    kind: "product_image",
    url,
    width: width || null,
    height: height || null,
    mimeType: `image/${format}`,
    sizeBytes: bytes,
    createdAt: new Date().toISOString(),
  });

  return apiOk({ url, publicId });
});

export const DELETE = withApiRoute("/api/uploads", async (req: Request) => {
  const user = await requireUser();
  if (!user) {
    return apiError("Unauthorized", 401);
  }
  withUserId(user.id);

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
});
