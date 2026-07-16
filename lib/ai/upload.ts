/**
 * Mock image upload service.
 * Simulates uploading to Cloudinary with a delay.
 * In production, this would use Cloudinary's upload API.
 */

import type { UploadResponse } from "@/types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload an image file and return a mock URL.
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  // Simulate upload progress
  for (let i = 0; i <= 100; i += 10) {
    await delay(100);
    onProgress?.(i);
  }

  // Return a mock URL (in production, this would be the Cloudinary URL)
  const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Convert the file to a base64 Data URL to make it persistent in the database
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  return {
    url: base64,
    publicId: mockId,
  };
}

/**
 * Delete an uploaded image by public ID.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await delay(200);
  console.log(`[Mock] Deleted image: ${publicId}`);
}
