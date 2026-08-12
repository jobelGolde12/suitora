import { v2 as cloudinary } from "cloudinary";
import { getLogger } from "@/lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image buffer to Cloudinary with optimization.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    transformation?: Record<string, unknown>;
  } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder || "suitora/uploads";

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" },
          ...(options.transformation ? [options.transformation] : []),
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Extract the Cloudinary public id from a delivery URL, or null if the URL
 * is not a Cloudinary image. Handles `/image/upload/v{version}/...` and
 * transformation segments.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("cloudinary.com")) return null;
    const match = parsed.pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    return match[1].replace(/\.[a-zA-Z0-9]+$/, "");
  } catch {
    return null;
  }
}

/**
 * Delete a Cloudinary asset by its delivery URL. No-ops for non-Cloudinary
 * URLs so callers never have to branch on provider.
 */
export async function deleteCloudinaryImageFromUrl(
  url: string | null | undefined
): Promise<boolean> {
  if (!url) return false;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return false;
  try {
    await deleteFromCloudinary(publicId);
    return true;
  } catch (err) {
    getLogger().error({ err, publicId }, "Cloudinary delete failed");
    return false;
  }
}

/**
 * Generate a Cloudinary URL with transformations.
 */
export function getCloudinaryUrl(
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations
      ? [
          {
            width: transformations.width,
            height: transformations.height,
            crop: transformations.crop || "fill",
            quality: transformations.quality || "auto:good",
            fetch_format: "auto",
          },
        ]
      : undefined,
  });
}
