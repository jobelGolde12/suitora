/**
 * Outfit recommendation engine.
 *
 * Takes a user's wardrobe items (favorited analyses marked `in_wardrobe`) and
 * generates complete, scored outfit suggestions. It reuses the same philosophy
 * as `similar-items`: the per-item fit scores stored on each analysis (which
 * are already user-specific) are blended with outfit-level quality signals —
 * style coherence, color story, proportion balance, and formality consistency.
 *
 * This module is pure and free of DB/network access so the core logic is unit
 * testable; the API route feeds it extracted wardrobe rows.
 */

import type {
  ItemCategory,
  Silhouette,
  StyleTag,
} from "@/types";
import type {
  OutfitItemRole,
  TrendOutfit,
  TrendOutfitItem,
} from "@/types/trend";

/** A single wardrobe item as consumed by the engine. */
export interface WardrobeItemInput {
  analysisId: string;
  name: string;
  imageUrl: string;
  category: ItemCategory;
  colors: string[];
  styleTags: StyleTag[];
  silhouette?: Silhouette;
  /** The user-specific fit score already computed for this item. */
  individualScore: number;
}

interface ScoredItem extends WardrobeItemInput {
  role: OutfitItemRole;
}

export interface OutfitScore {
  avgFit: number;
  coherence: number;
  colorStory: number;
  proportion: number;
  formality: number;
  overall: number;
}

export interface RecommendOutfitsOptions {
  /** Max outfits to return (capped at 12). */
  limit?: number;
}

// ─── Role mapping ────────────────────────────────────────────────

const CATEGORY_ROLE: Record<ItemCategory, OutfitItemRole> = {
  tops: "top",
  dresses: "dress",
  bottoms: "bottom",
  outerwear: "outer",
  footwear: "footwear",
  headwear: "headwear",
  accessories: "accessory",
  activewear: "top",
  formal: "top",
  full_outfit: "top",
};

/** Map an item category to its outfit role, with a couple of name-based heuristics. */
export function roleFromCategory(
  category: ItemCategory,
  name = ""
): OutfitItemRole {
  const lower = name.toLowerCase();
  if (category === "activewear" && /legging|short|bott/.test(lower)) {
    return "bottom";
  }
  if (category === "formal" && /gown|dress/.test(lower)) {
    return "dress";
  }
  return CATEGORY_ROLE[category];
}

// ─── Color helpers ───────────────────────────────────────────────

interface Hsl {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

function hexToHsl(hex: string): Hsl | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s, l };
}

function isNeutral(c: Hsl): boolean {
  return c.s < 0.12 || c.l > 0.92 || c.l < 0.06;
}

/** 0-100 compatibility of two hex colors (neutrals pair with anything). */
export function colorCompatibility(a: string, b: string): number {
  const ha = hexToHsl(a);
  const hb = hexToHsl(b);
  if (!ha || !hb) return 70;
  if (isNeutral(ha) || isNeutral(hb)) return 100;

  let dh = Math.abs(ha.h - hb.h);
  dh = dh > 180 ? 360 - dh : dh;

  let base = 100 - (dh * 45) / 180;
  // Penalize clashing high-saturation pairings.
  if (ha.s > 0.6 && hb.s > 0.6 && dh > 30 && dh < 150) base -= 15;
  return Math.min(100, Math.max(40, Math.round(base)));
}

// ─── Formality ───────────────────────────────────────────────────

type FormalityBand = "casual" | "smart" | "formal";

const FORMAL_BAND: Record<StyleTag, FormalityBand> = {
  formal: "formal",
  "business-casual": "formal",
  classic: "formal",
  minimalist: "smart",
  korean: "smart",
  preppy: "smart",
  romantic: "smart",
  vintage: "smart",
  "avant-garde": "smart",
  casual: "casual",
  streetwear: "casual",
  athleisure: "casual",
  edgy: "casual",
  bohemian: "casual",
};

const BAND_ORDER: Record<FormalityBand, number> = {
  casual: 0,
  smart: 1,
  formal: 2,
};

function formalityOf(tags: StyleTag[]): FormalityBand {
  if (tags.length === 0) return "smart";
  const bands = tags.map((t) => FORMAL_BAND[t] ?? "smart") as FormalityBand[];
  return bands.sort(
    (x, y) =>
      bands.filter((b) => b === y).length - bands.filter((b) => b === x).length
  )[0];
}

function formalityConsistency(items: ScoredItem[]): number {
  if (items.length < 2) return 100;
  let total = 0;
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const bi = formalityOf(items[i].styleTags);
      const bj = formalityOf(items[j].styleTags);
      if (bi === bj) total += 100;
      else if (Math.abs(BAND_ORDER[bi] - BAND_ORDER[bj]) === 1) total += 72;
      else total += 45;
      count++;
    }
  }
  return Math.round(total / count);
}


// ─── Style coherence ─────────────────────────────────────────────

function styleCoherence(items: ScoredItem[]): number {
  if (items.length < 2) return 80;
  let total = 0;
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].styleTags;
      const b = items[j].styleTags;
      if (!a.length || !b.length) {
        total += 70;
      } else {
        const inter = a.filter((t) => b.includes(t)).length;
        const union = new Set([...a, ...b]).size;
        total += (inter / union) * 100;
      }
      count++;
    }
  }
  return Math.round(total / count);
}

// ─── Color story ─────────────────────────────────────────────────

function colorStory(items: ScoredItem[]): number {
  if (items.length < 2) return 80;
  let total = 0;
  let count = 0;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].colors[0] ?? "#2D2D2D";
      const b = items[j].colors[0] ?? "#2D2D2D";
      total += colorCompatibility(a, b);
      count++;
    }
  }
  return Math.round(total / count);
}

// ─── Proportion / silhouette balance ─────────────────────────────

const SILHOUETTE_VOLUME: Record<string, number> = {
  fitted: 1,
  slim: 1,
  bodycon: 1,
  "a-line": 2,
  wrap: 2,
  empire: 2,
  straight: 2,
  regular: 3,
  relaxed: 3,
  flared: 3,
  boxy: 4,
  oversized: 4,
  "wide-leg": 4,
  wide_leg: 4,
};

function silhouetteVolume(silhouette?: Silhouette): number {
  if (!silhouette) return 2;
  return SILHOUETTE_VOLUME[silhouette] ?? 2;
}

/** 0-100: reward one-fitted-one-loose pairings (complementary volume). */
function pairBalance(fitVolume: number, baseVolume: number): number {
  const d = Math.abs(fitVolume - baseVolume);
  if (d === 2) return 100;
  if (d === 1) return 85;
  if (d === 3) return 70;
  if (d === 0) return 78;
  return 62;
}

function proportionScore(items: ScoredItem[]): number {
  if (items.length < 2) return 70;
  const pairs: Array<[ScoredItem, ScoredItem]> = [];
  const tops = items.filter((i) => i.role === "top" || i.role === "dress");
  const bottoms = items.filter((i) => i.role === "bottom");
  const outers = items.filter((i) => i.role === "outer");

  for (const t of tops) {
    for (const b of bottoms) pairs.push([t, b]);
    for (const o of outers) pairs.push([t, o]);
  }
  for (const b of bottoms) {
    for (const o of outers) pairs.push([o, b]);
  }

  if (pairs.length === 0) return 75;
  const total = pairs.reduce(
    (sum, [fit, base]) =>
      sum +
      pairBalance(
        silhouetteVolume(fit.silhouette),
        silhouetteVolume(base.silhouette)
      ),
    0
  );
  return Math.round(total / pairs.length);
}

// ─── Scoring ─────────────────────────────────────────────────────

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Score a candidate outfit across all quality dimensions. */
export function scoreOutfit(items: ScoredItem[]): OutfitScore {
  const avgFit =
    items.length > 0
      ? Math.round(
          items.reduce((s, i) => s + i.individualScore, 0) / items.length
        )
      : 0;

  if (items.length === 1) {
    const overall = Math.round(
      avgFit * 0.45 + 75 * 0.25 + 80 * 0.15 + 70 * 0.15
    );
    return {
      avgFit,
      coherence: 75,
      colorStory: 80,
      proportion: 70,
      formality: 100,
      overall: clampScore(overall),
    };
  }

  const coherence = Math.round(
    styleCoherence(items) * 0.55 + formalityConsistency(items) * 0.45
  );
  const color = colorStory(items);
  const proportion = proportionScore(items);
  const overall = Math.round(
    avgFit * 0.45 + coherence * 0.25 + color * 0.15 + proportion * 0.15
  );

  return {
    avgFit,
    coherence,
    colorStory: color,
    proportion,
    formality: formalityConsistency(items),
    overall: clampScore(overall),
  };
}

// ─── Candidate generation ────────────────────────────────────────

type Grouped = Partial<Record<OutfitItemRole, ScoredItem[]>>;

export function groupByRole(items: WardrobeItemInput[]): Grouped {
  const grouped: Grouped = {};
  for (const item of items) {
    const role = roleFromCategory(item.category, item.name);
    (grouped[role] ??= []).push({ ...item, role });
  }
  return grouped;
}

function byFitDesc(a: ScoredItem, b: ScoredItem): number {
  return b.individualScore - a.individualScore;
}

/**
 * Greedily add one best-scoring item from each remaining optional role
 * (outer, footwear, headwear, accessory) as long as it keeps the outfit whole.
 */
function augment(foundation: ScoredItem[], pool: Grouped): ScoredItem[] {
  const current = [...foundation];
  const usedRoles = new Set(current.map((i) => i.role));
  const baseScore = scoreOutfit(current).overall;

  const order: OutfitItemRole[] = ["outer", "footwear", "headwear", "accessory"];
  for (const role of order) {
    if (usedRoles.has(role)) continue;
    const candidates = pool[role] ?? [];
    if (candidates.length === 0) continue;

    let best: { item: ScoredItem; score: number } | null = null;
    for (const cand of candidates) {
      const next = [...current, cand];
      const sc = scoreOutfit(next);
      if (!best || sc.overall > best.score) {
        best = { item: cand, score: sc.overall };
      }
    }
    if (best && (current.length < 2 || best.score >= baseScore - 1)) {
      current.push(best.item);
      usedRoles.add(role);
    }
  }
  return current;
}

// ─── Naming & tips ───────────────────────────────────────────────

const TAG_LABEL: Partial<Record<StyleTag, string>> = {
  formal: "Elegant",
  "business-casual": "Office",
  minimalist: "Minimal",
  casual: "Casual",
  streetwear: "Street",
  korean: "Korean",
  vintage: "Vintage",
  bohemian: "Bohemian",
  athleisure: "Athleisure",
  preppy: "Preppy",
  edgy: "Edgy",
  romantic: "Romantic",
  classic: "Classic",
  "avant-garde": "Avant-Garde",
};

function dominantTag(items: ScoredItem[]): StyleTag | null {
  const counts = new Map<StyleTag, number>();
  for (const item of items) {
    for (const tag of item.styleTags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  let best: StyleTag | null = null;
  let bestCount = 0;
  for (const [tag, count] of counts) {
    if (count > bestCount) {
      best = tag;
      bestCount = count;
    }
  }
  return best;
}

function outfitName(items: ScoredItem[]): string {
  const tag = dominantTag(items);
  const label = tag ? TAG_LABEL[tag] : undefined;
  return label ? `${label} Look` : "Curated Look";
}

function occasionTags(items: ScoredItem[]): string[] {
  const bands = items.map((i) => formalityOf(i.styleTags));
  if (bands.includes("formal")) return ["Evening", "Formal"];
  if (bands.includes("smart")) return ["Smart Casual", "Work"];
  return ["Everyday"];
}

function stylingTips(items: ScoredItem[], score: OutfitScore): string[] {
  const tips: string[] = [];
  const hasBottom = items.some((i) => i.role === "bottom");
  const hasOuter = items.some((i) => i.role === "outer");
  const hasDress = items.some((i) => i.role === "dress");

  if (hasDress) {
    tips.push("Define the waist with a belt or a cropped layer.");
  } else if (hasBottom && !hasOuter) {
    const top = items.find((i) => i.role === "top");
    const bottom = items.find((i) => i.role === "bottom");
    const topVol = silhouetteVolume(top?.silhouette);
    const bottomVol = silhouetteVolume(bottom?.silhouette);
    if (topVol > bottomVol) {
      tips.push("Balance the relaxed top with streamlined bottoms.");
    } else if (bottomVol > topVol) {
      tips.push("Tuck or layer to define the waist over the fuller bottom.");
    }
  }

  if (score.colorStory >= 85) {
    tips.push("The palette works beautifully together — keep accessories tonal.");
  } else if (score.colorStory >= 60) {
    tips.push("Ground the look with a neutral layer for a more cohesive palette.");
  } else {
    tips.push("Try swapping one piece for a neutral tone to unify the look.");
  }

  if (hasBottom && !hasOuter) {
    tips.push("An outer layer would extend this look across more weather.");
  }

  return tips.slice(0, 3);
}

// ─── Main API ────────────────────────────────────────────────────

/**
 * Generate complete, scored outfit suggestions from a user's wardrobe.
 *
 * Deterministic: for each "foundation" (a dress alone, or a top+bottom pair)
 * it greedily adds the single best item from each remaining role (outer,
 * footwear, headwear, accessory), scores the finished look, then returns the
 * top-ranking outfits.
 */
export function recommendOutfits(
  items: WardrobeItemInput[],
  options: RecommendOutfitsOptions = {}
): TrendOutfit[] {
  const limit = Math.min(Math.max(options.limit ?? 6, 1), 12);
  if (items.length < 2) return [];

  const pool = groupByRole(items);

  const tops = (pool.top ?? []).slice().sort(byFitDesc).slice(0, 5);
  const bottoms = (pool.bottom ?? []).slice().sort(byFitDesc).slice(0, 5);
  const dresses = (pool.dress ?? []).slice().sort(byFitDesc).slice(0, 5);

  const foundations: ScoredItem[][] = [];
  for (const dress of dresses) foundations.push([dress]);
  for (const top of tops) {
    for (const bottom of bottoms) {
      foundations.push([top, bottom]);
    }
  }

  if (foundations.length === 0) return [];

  const finished: TrendOutfit[] = foundations
    .map((foundation) => {
      const outfitItems = augment(foundation, pool);
      const score = scoreOutfit(outfitItems);
      const id = `outfit-${outfitItems
        .map((i) => i.analysisId)
        .sort()
        .join("-")}`;
      const trendItems: TrendOutfitItem[] = outfitItems.map((i) => ({
        analysisId: i.analysisId,
        category: i.category,
        itemName: i.name,
        itemImageUrl: i.imageUrl,
        individualScore: i.individualScore,
        role: i.role,
      }));
      return {
        id,
        name: outfitName(outfitItems),
        items: trendItems,
        overallScore: score.overall,
        coherenceScore: score.coherence,
        colorStoryScore: score.colorStory,
        proportionScore: score.proportion,
        formalityConsistency: score.formality,
        seasonTags: [],
        occasionTags: occasionTags(outfitItems),
        stylingTips: stylingTips(outfitItems, score),
        createdAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit);

  return finished;
}
