import type { ItemCategory } from "@/types";
import type { TryOnCategory } from "./types";

/** Suitora category → VTON garment zone. */
const CATEGORY_TO_ZONE: Partial<Record<ItemCategory, TryOnCategory>> = {
  dresses: "dresses",
  formal: "dresses",
  tops: "upper_body",
  outerwear: "upper_body",
  activewear: "upper_body",
  headwear: "upper_body",
  bottoms: "lower_body",
  footwear: "lower_body",
};

const VTON_ZONES: TryOnCategory[] = ["upper_body", "lower_body", "dresses"];

/**
 * Map an existing Suitora item category (or free-form string) to a VTON zone.
 * Raw VTON zones ("upper_body" / "lower_body" / "dresses") pass through
 * unchanged; unknown categories fall back to `upper_body` (the safest
 * default for masks).
 */
export function mapCategoryToTryOn(
  category?: ItemCategory | string
): TryOnCategory {
  if (!category) return "upper_body";

  const asZone = category as TryOnCategory;
  if (VTON_ZONES.includes(asZone)) return asZone;

  return CATEGORY_TO_ZONE[category as ItemCategory] || "upper_body";
}
