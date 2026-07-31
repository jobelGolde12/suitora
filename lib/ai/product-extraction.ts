/**
 * Product extraction service.
 * Extracts clothing item images and metadata from e-commerce product links
 * using Open Graph tags, JSON-LD structured data, and meta tags.
 */

export interface ExtractedProduct {
  title: string;
  brand: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  metadata: Record<string, any>;
}

const FETCH_TIMEOUT = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractMetaContent(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() || null;
}

function extractJsonLd(html: string): Record<string, any> | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data["@type"] === "Product" || data["@type"] === "IndividualProduct") {
        return data;
      }
      if (Array.isArray(data)) {
        const product = data.find(
          (item: any) => item["@type"] === "Product" || item["@type"] === "IndividualProduct"
        );
        if (product) return product;
      }
    } catch {
      // Skip invalid JSON-LD
    }
  }
  return null;
}

function extractOgTags(html: string): Record<string, string | null> {
  return {
    title: extractMetaContent(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i),
    image: extractMetaContent(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i),
    siteName: extractMetaContent(html, /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:site_name["']/i),
    price: extractMetaContent(html, /<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']product:price:amount["']/i),
    currency: extractMetaContent(html, /<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']product:price:currency["']/i),
    brand: extractMetaContent(html, /<meta[^>]*property=["']product:brand["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']product:brand["']/i),
  };
}

function extractMetaTags(html: string): Record<string, string | null> {
  return {
    title: extractMetaContent(html, /<meta[^>]*name=["']title["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']title["']/i),
    description: extractMetaContent(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i),
    image: extractMetaContent(html, /<meta[^>]*name=["']image["'][^>]*content=["']([^"']*)["']/i)
      || extractMetaContent(html, /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']image["']/i),
  };
}

function extractTitle(html: string): string | null {
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleTag?.[1]?.trim() || null;
}

function parsePrice(priceStr: string | null): { priceCents: number; currency: string } {
  if (!priceStr) return { priceCents: 0, currency: "USD" };
  const cleaned = priceStr.replace(/[^0-9.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return { priceCents: 0, currency: "USD" };
  return {
    priceCents: Math.round(num * 100),
    currency: "USD",
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

/**
 * Extract product image and details from a pasted URL.
 * Fetches the page HTML and parses Open Graph, JSON-LD, and meta tags.
 */
export async function extractProductFromUrl(productUrl: string): Promise<ExtractedProduct> {
  if (!productUrl.startsWith("http://") && !productUrl.startsWith("https://")) {
    throw new Error("Invalid URL. Please provide a valid HTTP/HTTPS link.");
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(productUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    html = await response.text();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. The website may be slow or unavailable.");
    }
    throw new Error(`Failed to fetch product page: ${err.message}`);
  }

  // Extract from multiple sources, prefer higher quality data
  const jsonLd = extractJsonLd(html);
  const ogTags = extractOgTags(html);
  const metaTags = extractMetaTags(html);
  const pageTitle = extractTitle(html);

  // Parse brand
  let brand = "Unknown Brand";
  if (jsonLd?.brand?.name) {
    brand = jsonLd.brand.name;
  } else if (ogTags.brand) {
    brand = ogTags.brand;
  } else {
    try {
      const urlObj = new URL(productUrl);
      const parts = urlObj.hostname.replace("www.", "").split(".");
      if (parts.length >= 2) {
        brand = parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
    } catch {
      // Fallback
    }
  }

  // Parse title
  let title = "Product";
  if (jsonLd?.name) {
    title = jsonLd.name;
  } else if (ogTags.title) {
    title = ogTags.title;
  } else if (metaTags.title) {
    title = metaTags.title;
  } else if (pageTitle) {
    title = pageTitle.split("|")[0].split("-")[0].trim();
  }

  // Parse price
  let priceCents = 0;
  let currency = "USD";
  if (jsonLd?.offers) {
    const offers = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
    if (offers?.price) {
      priceCents = Math.round(parseFloat(offers.price) * 100);
      currency = offers.priceCurrency || "USD";
    }
  } else if (ogTags.price) {
    const parsed = parsePrice(ogTags.price);
    priceCents = parsed.priceCents;
    currency = ogTags.currency || parsed.currency;
  }

  // Parse image — prefer OG image, then JSON-LD, then first large img tag
  let imageUrl = ogTags.image || "";
  if (!imageUrl && jsonLd?.image) {
    const img = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
    imageUrl = typeof img === "string" ? img : img?.url || "";
  }
  if (!imageUrl) {
    imageUrl = metaTags.image || "";
  }
  if (!imageUrl) {
    // Try to find a large product image in img tags
    const imgMatch = html.match(/<img[^>]*src=["']([^"']*)["'][^>]*class=["'][^"']*(?:product|hero|main|featured)[^"']*["']/i);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }
  if (imageUrl) {
    imageUrl = resolveUrl(productUrl, imageUrl);
  } else {
    imageUrl = "/placeholder.svg";
  }

  // Parse colors from JSON-LD
  const colors: string[] = [];
  if (jsonLd?.color) {
    const c = Array.isArray(jsonLd.color) ? jsonLd.color : [jsonLd.color];
    colors.push(...c.filter(Boolean));
  }

  // Parse sizes from JSON-LD
  const sizes: string[] = [];
  if (jsonLd?.size) {
    const s = Array.isArray(jsonLd.size) ? jsonLd.size : [jsonLd.size];
    sizes.push(...s.filter(Boolean));
  }

  return {
    title,
    brand,
    priceCents,
    currency,
    imageUrl,
    metadata: {
      originalUrl: productUrl,
      extractedAt: new Date().toISOString(),
      source: jsonLd ? "json-ld" : ogTags.title ? "og-tags" : "meta-tags",
      colors,
      sizes,
      description: jsonLd?.description || ogTags.siteName || metaTags.description || null,
      siteName: ogTags.siteName || null,
    },
  };
}
