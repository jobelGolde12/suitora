/**
 * Client-side image upload service.
 * Sends the file to a server API route which handles the actual Cloudinary upload.
 */

import type { UploadResponse } from "@/types";

/**
 * Upload an image file via the server upload API.
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  onProgress?.(10);

  const formData = new FormData();
  formData.append("file", file);

  onProgress?.(30);

  const res = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  onProgress?.(80);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }

  const data = await res.json();

  onProgress?.(100);

  return {
    url: data.url,
    publicId: data.publicId,
  };
}

/**
 * Delete an uploaded image by public ID.
 * Best-effort: network/deletion failures are intentionally swallowed — the
 * uploads table is the source of truth and the Cloudinary cleanup is retried
 * by the retention job.
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await fetch(`/api/uploads?publicId=${encodeURIComponent(publicId)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // best-effort — see note above
  }
}
