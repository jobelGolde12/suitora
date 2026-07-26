import { v2 as cloudinary } from "cloudinary";

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
    transformation?: Record<string, any>;
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
