/**
 * Product extraction service.
 * Simulates extracting clothing item images and metadata from e-commerce product links.
 */

export interface ExtractedProduct {
  title: string;
  brand: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  metadata: Record<string, any>;
}

/**
 * Extract product image and details from a pasted URL.
 */
export async function extractProductFromUrl(productUrl: string): Promise<ExtractedProduct> {
  // Simulate network scrape delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Basic validation
  if (!productUrl.startsWith("http://") && !productUrl.startsWith("https://")) {
    throw new Error("Invalid URL. Please provide a valid HTTP/HTTPS link.");
  }

  // Parse hostname for brand naming
  let brand = "E-Commerce Store";
  try {
    const urlObj = new URL(productUrl);
    const parts = urlObj.hostname.split(".");
    if (parts.length >= 2) {
      brand = parts[parts.length - 2].toUpperCase();
    }
  } catch {
    // Fallback
  }

  // Pick a realistic mock clothing item based on URL string hash
  const hash = productUrl.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const titles = [
    "Minimalist Linen Shirt",
    "Tailored Wool Blazer",
    "Slim Fit Cotton Chinos",
    "Casual Denim Jacket",
    "Classic Trench Coat",
    "Oversized Knit Sweater",
  ];
  
  // Use a placeholder public image or predefined asset
  const imageUrl = "/placeholder.svg";

  return {
    title: titles[hash % titles.length],
    brand,
    priceCents: 4900 + (hash % 15000), // $49.00 to $199.00
    currency: "USD",
    imageUrl,
    metadata: {
      sizes: ["S", "M", "L", "XL"],
      colors: ["Neutral", "Beige", "Charcoal", "Olive"],
      originalUrl: productUrl,
      extractedAt: new Date().toISOString(),
    },
  };
}
