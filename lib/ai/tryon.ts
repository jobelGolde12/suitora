/**
 * Virtual Try-On generation service.
 * Simulates generating a merged try-on preview of a user wearing a product item.
 */

export interface TryOnResult {
  generatedImageUrl: string;
}

/**
 * Generate a try-on image from user photo and clothing item photo.
 */
export async function generateVirtualTryOn(
  userImageUrl: string,
  clothingImageUrl: string
): Promise<TryOnResult> {
  // Simulate heavy GPU try-on generation delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // In mock environment, return the clothing image or a combined placeholder
  return {
    generatedImageUrl: clothingImageUrl,
  };
}
