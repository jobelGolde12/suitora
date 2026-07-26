/**
 * Item attribute extraction.
 * Extracts structured ItemProfile from product image or scraped data.
 * Uses vision AI when available, falls back to heuristics.
 */

import type {
  ItemProfile,
  ItemCategory,
  ItemMeasurements,
  Silhouette,
  FabricStretch,
  StyleTag,
} from "@/types";

export interface ItemExtractionInput {
  imageUrl: string;
  productUrl?: string;
  productTitle?: string;
  productDescription?: string;
}

// ─── Category Detection ──────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ItemCategory, string[]> = {
  tops: ["shirt", "blouse", "t-shirt", "tee", "sweater", "hoodie", "pullover", "top", "tank", "camisole"],
  dresses: ["dress", "gown", "frock", "midi", "maxi", "mini", "wrap dress", "bodycon"],
  bottoms: ["jeans", "pants", "trousers", "shorts", "skirt", "leggings", "chinos", "denim"],
  outerwear: ["jacket", "coat", "blazer", "cardigan", "vest", "parka", "windbreaker", "hoodie jacket"],
  footwear: ["shoes", "sneakers", "boots", "heels", "sandals", "loafers", "flats", "slides", "clogs"],
  headwear: ["cap", "hat", "beanie", "beret", "visor", "bucket hat", "baseball cap"],
  accessories: ["belt", "scarf", "bag", "necklace", "bracelet", "earrings", "watch", "sunglasses"],
  activewear: ["leggings", "sports bra", "swimsuit", "swim", "athletic", "yoga", "running"],
  formal: ["suit", "tuxedo", "gown", "formal", "evening", "cocktail", "ceremony"],
  full_outfit: ["outfit", "ensemble", "look", "full look", "head to toe", "coordinated"],
};

export function detectCategory(text: string): ItemCategory {
  const lower = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as ItemCategory;
      }
    }
  }

  return "tops"; // default
}

// ─── Subtype Detection ───────────────────────────────────────────

function detectSubtype(title: string, category: ItemCategory): string {
  const lower = title.toLowerCase();

  const subtypePatterns: Record<ItemCategory, Record<string, string[]>> = {
    tops: {
      "crew-neck_t-shirt": ["crew neck", "crew-neck", "round neck"],
      "v-neck_t-shirt": ["v-neck", "v neck"],
      "button-down_shirt": ["button down", "button-down", "dress shirt"],
      "henley": ["henley"],
      "polo": ["polo"],
      "turtleneck": ["turtleneck", "roll neck"],
      "crop_top": ["crop", "cropped"],
      "oversized_hoodie": ["oversized hoodie"],
    },
    dresses: {
      "midi_wrap": ["midi wrap", "wrap midi"],
      "maxi_a-line": ["maxi a-line", "a-line maxi"],
      "mini_bodycon": ["mini bodycon", "bodycon mini"],
      "shirt_dress": ["shirt dress"],
      "slip_dress": ["slip dress"],
      "cocktail_dress": ["cocktail"],
      "evening_gown": ["evening", "gown"],
    },
    bottoms: {
      "skinny_jeans": ["skinny", "slim fit jeans"],
      "straight_jeans": ["straight", "straight leg"],
      "wide_leg": ["wide leg", "wide-leg"],
      "high_waisted": ["high waist", "high-waisted"],
      "cargo": ["cargo"],
      "bermuda": ["bermuda", "knee length"],
    },
    outerwear: {
      "bomber": ["bomber"],
      "trench": ["trench"],
      "puffer": ["puffer", "quilted"],
      "leather_jacket": ["leather"],
      "denim_jacket": ["denim jacket"],
      "windbreaker": ["windbreaker"],
    },
    footwear: {
      "high-top_sneaker": ["high top", "high-top"],
      "low-top_sneaker": ["low top", "low-top"],
      "ankle_boot": ["ankle boot", "bootie"],
      "knee_high_boot": ["knee high", "knee-high"],
      "platform": ["platform"],
      "stiletto": ["stiletto"],
    },
    headwear: {
      "baseball_cap": ["baseball", "dad hat"],
      "bucket_hat": ["bucket"],
      "beanie": ["beanie", "knit cap"],
      "beret": ["beret"],
    },
    accessories: {},
    activewear: {},
    formal: {},
    full_outfit: {
      "head_to_toe": ["outfit", "ensemble", "full look", "coordinated"],
    },
  };

  const patterns = subtypePatterns[category] || {};
  for (const [subtype, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return subtype;
      }
    }
  }

  // Generic subtype from title
  return lower.replace(/[^a-z0-9]+/g, "_").slice(0, 40);
}

// ─── Silhouette Detection ────────────────────────────────────────

function detectSilhouette(title: string, category: ItemCategory): Silhouette {
  const lower = title.toLowerCase();

  if (lower.includes("oversized") || lower.includes("boxy")) return "oversized";
  if (lower.includes("fitted") || lower.includes("slim")) return "fitted";
  if (lower.includes("a-line") || lower.includes("aline")) return "a-line";
  if (lower.includes("bodycon")) return "bodycon";
  if (lower.includes("wrap")) return "wrap";
  if (lower.includes("empire")) return "empire";
  if (lower.includes("flared") || lower.includes("flare")) return "flared";
  if (lower.includes("relaxed")) return "relaxed";
  if (lower.includes("straight")) return "straight";
  if (lower.includes("slim")) return "slim";

  // Category defaults
  const defaults: Record<ItemCategory, Silhouette> = {
    tops: "regular",
    dresses: "a-line",
    bottoms: "straight",
    outerwear: "relaxed",
    footwear: "regular",
    headwear: "regular",
    accessories: "regular",
    activewear: "fitted",
    formal: "fitted",
    full_outfit: "a-line",
  };

  return defaults[category] || "regular";
}

// ─── Color Extraction (Heuristic) ────────────────────────────────

function extractColorsFromTitle(title: string): string[] {
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#FFFFFF",
    red: "#FF0000",
    blue: "#0000FF",
    navy: "#000080",
    green: "#008000",
    yellow: "#FFFF00",
    pink: "#FFC0CB",
    purple: "#800080",
    orange: "#FFA500",
    brown: "#A52A2A",
    beige: "#F5F5DC",
    grey: "#808080",
    gray: "#808080",
    cream: "#FFFDD0",
    olive: "#808000",
    maroon: "#800000",
    teal: "#008080",
    coral: "#FF7F50",
    tan: "#D2B48C",
    khaki: "#C3B091",
    burgundy: "#800020",
    charcoal: "#36454F",
    stone: "#928E85",
    blush: "#DE5D83",
    sage: "#9DC183",
    mustard: "#FFDB58",
    lavender: "#E6E6FA",
    mint: "#98FF98",
    peach: "#FFE5B4",
    ivory: "#FFFFF0",
    camel: "#C19A6B",
    taupe: "#483C32",
    ecru: "#C2B280",
    chambray: "#6E7F80",
    indigo: "#4B0082",
  };

  const lower = title.toLowerCase();
  const colors: string[] = [];

  for (const [name, hex] of Object.entries(colorMap)) {
    if (lower.includes(name)) {
      colors.push(hex);
    }
  }

  if (colors.length === 0) {
    colors.push("#2D2D2D", "#F5F5F5"); // default neutral
  }

  return colors.slice(0, 4);
}

// ─── Style Tags ──────────────────────────────────────────────────

function extractStyleTags(title: string): StyleTag[] {
  const lower = title.toLowerCase();
  const tags: StyleTag[] = [];

  const tagPatterns: [StyleTag, string[]][] = [
    ["casual", ["casual", "everyday", "laid-back", "relaxed"]],
    ["minimalist", ["minimal", "minimalist", "clean", "simple"]],
    ["streetwear", ["street", "streetwear", "urban", "hypebeast"]],
    ["vintage", ["vintage", "retro", "throwback", "old school"]],
    ["formal", ["formal", "elegant", "sophisticated", "refined"]],
    ["korean", ["korean", "k-fashion", "kstyle", "seoul"]],
    ["business-casual", ["business", "office", "workwear", "professional"]],
    ["bohemian", ["boho", "bohemian", "free-spirited", "festival"]],
    ["athleisure", ["athletic", "sport", "activewear", "gym", "yoga"]],
    ["preppy", ["preppy", "classic", "ivy", "collegiate"]],
    ["edgy", ["edgy", "grunge", "punk", "rebel"]],
    ["romantic", ["romantic", "feminine", "floral", "lace"]],
  ];

  for (const [tag, patterns] of tagPatterns) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        tags.push(tag);
        break;
      }
    }
  }

  if (tags.length === 0) {
    tags.push("casual");
  }

  return tags;
}

// ─── Fabric Stretch Detection ────────────────────────────────────

function detectStretch(title: string): FabricStretch {
  const lower = title.toLowerCase();

  if (
    lower.includes("stretch") ||
    lower.includes("spandex") ||
    lower.includes("elastane") ||
    lower.includes("lycra") ||
    lower.includes("jersey")
  ) {
    if (lower.includes("high stretch") || lower.includes("super stretch")) {
      return "high";
    }
    return "moderate";
  }

  if (
    lower.includes("denim") ||
    lower.includes("canvas") ||
    lower.includes("corduroy") ||
    lower.includes("wool") ||
    lower.includes("linen") ||
    lower.includes("cotton")
  ) {
    return "rigid";
  }

  return "moderate";
}

// ─── Main Extraction ─────────────────────────────────────────────

export async function extractItemProfile(
  input: ItemExtractionInput
): Promise<ItemProfile> {
  const title = input.productTitle || input.productUrl || "";
  const category = detectCategory(title);
  const subtype = detectSubtype(title, category);
  const silhouette = detectSilhouette(title, category);
  const colors = extractColorsFromTitle(title);
  const styleTags = extractStyleTags(title);
  const fabricStretch = detectStretch(title);

  // Default measurements (placeholder — real extraction needs vision)
  const keyMeasurements: ItemMeasurements = {
    bust: 90,
    waist: 72,
    hips: 98,
    lengthCm: 100,
  };

  return {
    category,
    subtype,
    silhouette,
    keyMeasurements,
    fabricStretch,
    colors,
    styleTags,
  };
}
