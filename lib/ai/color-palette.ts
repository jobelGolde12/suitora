/**
 * Seasonal color palette recommendations derived from skin undertone.
 * Maps each skin tone to a classic seasonal color type (Spring/Summer/
 * Autumn/Winter) and returns best, neutral, and avoid shades by name.
 */

import type { SkinTone } from "@/types";

export type SeasonalType = "spring" | "summer" | "autumn" | "winter";

export interface PaletteColor {
  name: string;
  hex: string;
}

export interface SeasonalPalette {
  season: SeasonalType;
  label: string;
  description: string;
  best: PaletteColor[];
  neutrals: PaletteColor[];
  avoid: PaletteColor[];
}

const SEASONAL_PALETTES: Record<SeasonalType, SeasonalPalette> = {
  spring: {
    season: "spring",
    label: "Spring",
    description:
      "Warm and bright — golden, coral, and fresh tones bring out your natural warmth.",
    best: [
      { name: "Coral", hex: "#E8985E" },
      { name: "Peach", hex: "#F4A460" },
      { name: "Marigold", hex: "#F4C430" },
      { name: "Tomato Red", hex: "#D9534F" },
    ],
    neutrals: [
      { name: "Ivory", hex: "#F5F0E6" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Warm Grey", hex: "#A8A29A" },
    ],
    avoid: [
      { name: "Stark Black", hex: "#1A1816" },
      { name: "Icy Pastel", hex: "#E8F0F6" },
      { name: "Cool Navy", hex: "#1F3A5F" },
    ],
  },
  summer: {
    season: "summer",
    label: "Summer",
    description:
      "Cool and muted — soft blues, roses, and gentle greys flatter your undertone.",
    best: [
      { name: "Powder Blue", hex: "#A8C4D0" },
      { name: "Rose", hex: "#C88CA0" },
      { name: "Lavender", hex: "#B8A6D9" },
      { name: "Sage", hex: "#9CAF88" },
    ],
    neutrals: [
      { name: "Soft White", hex: "#F7F5F0" },
      { name: "Cool Grey", hex: "#9CA3AF" },
      { name: "Navy", hex: "#2E4053" },
    ],
    avoid: [
      { name: "Bright Orange", hex: "#FF7F2A" },
      { name: "Golden Yellow", hex: "#F4C430" },
      { name: "Stark Black", hex: "#1A1816" },
    ],
  },
  autumn: {
    season: "autumn",
    label: "Autumn",
    description:
      "Warm and deep — earthy terracotta, mustard, and forest tones feel most at home.",
    best: [
      { name: "Terracotta", hex: "#C05B2E" },
      { name: "Mustard", hex: "#D9A441" },
      { name: "Forest Green", hex: "#2F4F2F" },
      { name: "Rust", hex: "#A0522D" },
    ],
    neutrals: [
      { name: "Cream", hex: "#F5EDE3" },
      { name: "Taupe", hex: "#8B7355" },
      { name: "Rich Brown", hex: "#5C4033" },
    ],
    avoid: [
      { name: "Icy Pink", hex: "#F4C2C2" },
      { name: "Stark White", hex: "#FFFFFF" },
      { name: "Cool Blue", hex: "#4A90D9" },
    ],
  },
  winter: {
    season: "winter",
    label: "Winter",
    description:
      "Cool and deep — jewel tones and crisp contrasts make a bold, clean statement.",
    best: [
      { name: "Royal Blue", hex: "#1F4E9C" },
      { name: "Emerald", hex: "#046A38" },
      { name: "Ruby", hex: "#9B111E" },
      { name: "Fuchsia", hex: "#C71585" },
    ],
    neutrals: [
      { name: "Crisp White", hex: "#FFFFFF" },
      { name: "Charcoal", hex: "#333333" },
      { name: "Black", hex: "#1A1816" },
    ],
    avoid: [
      { name: "Camel", hex: "#C19A6B" },
      { name: "Mustard", hex: "#D9A441" },
      { name: "Orange", hex: "#FF7F2A" },
    ],
  },
};

const SKIN_TONE_TO_SEASON: Record<SkinTone, SeasonalType> = {
  warm: "spring",
  cool: "summer",
  olive: "autumn",
  deep: "winter",
  neutral: "spring",
};

/** Derive a seasonal palette from a detected skin undertone. */
export function deriveSeasonalPalette(skinTone: SkinTone | null | undefined): SeasonalPalette {
  const mapped =
    skinTone && skinTone in SKIN_TONE_TO_SEASON
      ? SKIN_TONE_TO_SEASON[skinTone as SkinTone]
      : "spring";
  return SEASONAL_PALETTES[mapped] ?? SEASONAL_PALETTES.spring;
}
