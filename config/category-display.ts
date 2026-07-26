/**
 * Single source of truth for category display configuration.
 * Used by results, history, favorites, upload, and trend UI.
 */

import type { ComponentType } from "react";
import {
  Shirt,
  Footprints,
  Watch,
  Sparkles,
  Briefcase,
  Dumbbell,
  ShoppingBag,
  Crown,
  Layers,
  type LucideProps,
} from "lucide-react";
import type { ItemCategory } from "@/types/body-fit";

export type CategoryIcon = ComponentType<LucideProps>;

export interface CategoryDisplayConfig {
  icon: CategoryIcon;
  label: string;
  pluralLabel: string;
  cropClass: string;
  primaryMeasurementLabels: string[];
  emptyStateMessage: string;
  emptyStateAction: string;
}

export const categoryConfig: Record<ItemCategory | "full_outfit", CategoryDisplayConfig> = {
  tops: {
    icon: Shirt,
    label: "Top",
    pluralLabel: "Tops",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Shoulder", "Chest", "Sleeve"],
    emptyStateMessage: "No top analyses yet. Upload a top to see how it fits!",
    emptyStateAction: "Upload a Top",
  },
  dresses: {
    icon: Shirt,
    label: "Dress",
    pluralLabel: "Dresses",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Bust", "Waist", "Hips", "Length"],
    emptyStateMessage: "No dress analyses yet. Upload a dress to see how it fits!",
    emptyStateAction: "Upload a Dress",
  },
  bottoms: {
    icon: ShoppingBag,
    label: "Bottom",
    pluralLabel: "Bottoms",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Waist", "Hips", "Inseam"],
    emptyStateMessage: "No bottom analyses yet. Try uploading jeans or trousers!",
    emptyStateAction: "Upload Bottoms",
  },
  outerwear: {
    icon: Layers,
    label: "Outerwear",
    pluralLabel: "Outerwear",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Shoulder", "Chest", "Length"],
    emptyStateMessage: "No outerwear analyses yet. Upload a jacket or coat!",
    emptyStateAction: "Upload Outerwear",
  },
  footwear: {
    icon: Footprints,
    label: "Shoe",
    pluralLabel: "Shoes",
    cropClass: "aspect-square",
    primaryMeasurementLabels: ["Length", "Width", "Heel Height"],
    emptyStateMessage: "No shoe analyses yet. Let's find your perfect fit!",
    emptyStateAction: "Upload Shoes",
  },
  headwear: {
    icon: Crown,
    label: "Headwear",
    pluralLabel: "Headwear",
    cropClass: "aspect-square",
    primaryMeasurementLabels: ["Circumference", "Face Shape"],
    emptyStateMessage: "No headwear analyses yet. Upload a cap or hat!",
    emptyStateAction: "Upload Headwear",
  },
  accessories: {
    icon: Watch,
    label: "Accessory",
    pluralLabel: "Accessories",
    cropClass: "aspect-square",
    primaryMeasurementLabels: ["Scale", "Style"],
    emptyStateMessage: "No accessory analyses yet. Upload a bag or accessory!",
    emptyStateAction: "Upload Accessory",
  },
  activewear: {
    icon: Dumbbell,
    label: "Activewear",
    pluralLabel: "Activewear",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Compression", "Coverage", "Stretch"],
    emptyStateMessage: "No activewear analyses yet. Upload workout gear!",
    emptyStateAction: "Upload Activewear",
  },
  formal: {
    icon: Briefcase,
    label: "Formal",
    pluralLabel: "Formal",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Shoulder", "Chest", "Waist", "Length"],
    emptyStateMessage: "No formal analyses yet. Upload a suit or occasion piece!",
    emptyStateAction: "Upload Formal",
  },
  full_outfit: {
    icon: Sparkles,
    label: "Outfit",
    pluralLabel: "Outfits",
    cropClass: "aspect-[4/5]",
    primaryMeasurementLabels: ["Coherence", "Color Story", "Proportion"],
    emptyStateMessage: "No outfits created yet. Combine your items into a look!",
    emptyStateAction: "Create Outfit",
  },
};

export const CATEGORY_FILTER_PRIMARY: Array<ItemCategory | "full_outfit" | "all"> = [
  "all",
  "dresses",
  "tops",
  "bottoms",
  "footwear",
];

export const CATEGORY_FILTER_MORE: Array<ItemCategory | "full_outfit"> = [
  "headwear",
  "accessories",
  "outerwear",
  "activewear",
  "formal",
  "full_outfit",
];

export function getCategoryConfig(
  category: string | null | undefined
): CategoryDisplayConfig {
  if (category && category in categoryConfig) {
    return categoryConfig[category as keyof typeof categoryConfig];
  }
  return categoryConfig.tops;
}

export function getCategoryCropClass(category: string | null | undefined): string {
  return getCategoryConfig(category).cropClass;
}

export function formatCategoryLabel(category: string | null | undefined): string {
  return getCategoryConfig(category).label;
}

/** Map free-text / provider category strings to internal ItemCategory */
export function normalizeCategoryKey(raw: string | null | undefined): string {
  if (!raw) return "tops";
  const key = raw.toLowerCase().trim().replace(/\s+/g, "_");
  const aliases: Record<string, string> = {
    top: "tops",
    shirt: "tops",
    blouse: "tops",
    sweater: "tops",
    dress: "dresses",
    gown: "dresses",
    jumpsuit: "dresses",
    bottom: "bottoms",
    pants: "bottoms",
    trousers: "bottoms",
    jeans: "bottoms",
    shorts: "bottoms",
    skirt: "bottoms",
    shoes: "footwear",
    shoe: "footwear",
    sneakers: "footwear",
    boots: "footwear",
    heels: "footwear",
    hat: "headwear",
    cap: "headwear",
    beanie: "headwear",
    accessory: "accessories",
    bag: "accessories",
    jewelry: "accessories",
    jacket: "outerwear",
    coat: "outerwear",
    blazer: "outerwear",
    active: "activewear",
    sportswear: "activewear",
    swim: "activewear",
    suit: "formal",
    tuxedo: "formal",
    outfit: "full_outfit",
    full_outfit: "full_outfit",
  };
  if (key in categoryConfig) return key;
  return aliases[key] ?? "tops";
}
