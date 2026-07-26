/**
 * Category-aware fit scoring engine.
 * Calculates Body Fit, Color Harmony, Style Match, and Overall scores.
 */

import type {
  UserBodyProfile,
  ItemProfile,
  FitScores,
  FitInsights,
  SizeRecommendation,
  CompatibilityMetadata,
  FitAnalysisResult,
  MeasurementDelta,
  BodyShape,
  SkinTone,
  FaceShape,
  StyleTag,
  ItemCategory,
  Silhouette,
  ItemMeasurements,
  BodyMeasurements,
  CATEGORY_WEIGHTS,
} from "@/types";
import { CATEGORY_WEIGHTS as DEFAULT_WEIGHTS, SILHOUETTE_RULES } from "@/types";

// ─── Measurement Comparison ──────────────────────────────────────

function compareMeasurements(
  user: BodyMeasurements,
  garment: ItemMeasurements,
  category: ItemCategory
): MeasurementDelta[] {
  const deltas: MeasurementDelta[] = [];

  const mappings: { key: keyof BodyMeasurements; garmentKey: keyof ItemMeasurements; label: string }[] =
    category === "bottoms"
      ? [
          { key: "waist", garmentKey: "waist", label: "Waist" },
          { key: "hips", garmentKey: "hips", label: "Hips" },
        ]
      : category === "dresses"
      ? [
          { key: "bust", garmentKey: "bust", label: "Bust" },
          { key: "waist", garmentKey: "waist", label: "Waist" },
          { key: "hips", garmentKey: "hips", label: "Hips" },
        ]
      : category === "tops" || category === "outerwear"
      ? [
          { key: "shoulderWidth", garmentKey: "shoulderWidth", label: "Shoulder" },
          { key: "bust", garmentKey: "bust", label: "Chest/Bust" },
        ]
      : category === "footwear"
      ? [
          { key: "footLength", garmentKey: "footLengthCm", label: "Foot Length" },
          { key: "footWidth", garmentKey: "footWidthCm", label: "Foot Width" },
        ]
      : [];

  for (const m of mappings) {
    const userVal = user[m.key];
    const garmentVal = garment[m.garmentKey];
    if (userVal == null || garmentVal == null) continue;

    const delta = garmentVal - userVal;
    let status: MeasurementDelta["status"];

    if (delta >= -1 && delta <= 2) {
      status = "ideal";
    } else if (delta >= -3 && delta < -1) {
      status = "slightly.tight";
    } else if (delta < -3) {
      status = "tight";
    } else if (delta > 2 && delta <= 4) {
      status = "slightly.roomy";
    } else {
      status = "roomy";
    }

    deltas.push({
      measurement: m.key,
      userValue: userVal,
      garmentValue: garmentVal,
      delta,
      unit: "cm",
      status,
      label: m.label,
    });
  }

  return deltas;
}

// ─── Body Fit Score ──────────────────────────────────────────────

function calculateBodyFitScore(
  profile: UserBodyProfile,
  item: ItemProfile
): { score: number; deltas: MeasurementDelta[] } {
  const deltas = compareMeasurements(
    profile.measurements,
    item.keyMeasurements,
    item.category
  );

  if (deltas.length === 0) {
    // No measurements to compare — use silhouette + body shape rules
    return { score: calculateSilhouetteScore(profile.bodyShape, item.silhouette), deltas };
  }

  // Score based on measurement deltas
  let totalFit = 0;
  for (const d of deltas) {
    switch (d.status) {
      case "ideal":
        totalFit += 100;
        break;
      case "slightly.tight":
        totalFit += 75;
        break;
      case "slightly.roomy":
        totalFit += 80;
        break;
      case "tight":
        totalFit += 45;
        break;
      case "roomy":
        totalFit += 55;
        break;
    }
  }

  const measurementScore = totalFit / deltas.length;

  // Blend with silhouette score
  const silhouetteScore = calculateSilhouetteScore(profile.bodyShape, item.silhouette);

  return {
    score: Math.round(measurementScore * 0.7 + silhouetteScore * 0.3),
    deltas,
  };
}

function calculateSilhouetteScore(bodyShape: BodyShape, silhouette: Silhouette): number {
  const rule = SILHOUETTE_RULES.find((r) => r.bodyShape === bodyShape);
  if (!rule) return 70;

  if (rule.flatteringSilhouettes.includes(silhouette)) return 85;
  if (rule.avoidSilhouettes.includes(silhouette)) return 55;
  return 70;
}

// ─── Color Harmony Score ─────────────────────────────────────────

function calculateColorScore(
  skinTone: SkinTone,
  itemColors: string[]
): { score: number; recommended: string[]; avoid: string[] } {
  // Color harmony rules based on skin undertone
  const palettes: Record<SkinTone, { recommended: string[]; avoid: string[] }> = {
    warm: {
      recommended: ["#E8D5B7", "#C5A07A", "#8B7355", "#D4A574", "#F4C430", "#E8985E"],
      avoid: ["#FF6B6B", "#98FB98", "#FFD700", "#C0C0C0"],
    },
    cool: {
      recommended: ["#4A90D9", "#2ECC71", "#9B59B6", "#3498DB", "#1ABC9C", "#E74C3C"],
      avoid: ["#F4C430", "#E8985E", "#8B7355", "#C5A07A"],
    },
    neutral: {
      recommended: ["#2D2D2D", "#F5F5F5", "#8B7355", "#E8D5B7", "#4A90D9", "#2ECC71"],
      avoid: ["#FF6B6B", "#98FB98"],
    },
    olive: {
      recommended: ["#2D2D2D", "#F5F5F5", "#E8D5B7", "#C5A07A", "#8B4513", "#DAA520"],
      avoid: ["#FFD700", "#FF69B4", "#00FFFF"],
    },
    deep: {
      recommended: ["#FFFFFF", "#F5F5F5", "#E8D5B7", "#C5A07A", "#DAA520", "#B8860B"],
      avoid: ["#2D2D2D", "#000000", "#808080"],
    },
  };

  const palette = palettes[skinTone] || palettes.neutral;

  // Simple color distance scoring
  let matchCount = 0;
  for (const color of itemColors) {
    const normalized = color.toUpperCase();
    const isRecommended = palette.recommended.some(
      (c) => colorDistance(c, normalized) < 60
    );
    const isAvoid = palette.avoid.some(
      (c) => colorDistance(c, normalized) < 60
    );

    if (isRecommended) matchCount += 2;
    else if (!isAvoid) matchCount += 1;
  }

  const maxScore = itemColors.length * 2;
  const score = maxScore > 0 ? Math.round((matchCount / maxScore) * 100) : 70;

  return {
    score: Math.min(100, Math.max(40, score)),
    recommended: palette.recommended.slice(0, 4),
    avoid: palette.avoid.slice(0, 2),
  };
}

function colorDistance(c1: string, c2: string): number {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  if (!rgb1 || !rgb2) return 100;

  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// ─── Style Match Score ───────────────────────────────────────────

function calculateStyleScore(
  userStyle: StyleTag[],
  itemStyle: StyleTag[]
): number {
  if (userStyle.length === 0 || itemStyle.length === 0) return 70;

  let matchCount = 0;
  for (const itemTag of itemStyle) {
    if (userStyle.includes(itemTag)) {
      matchCount += 2;
    }
  }

  // Partial credit for complementary styles
  const complementaryPairs: [StyleTag, StyleTag][] = [
    ["casual", "streetwear"],
    ["minimalist", "classic"],
    ["formal", "business-casual"],
    ["vintage", "romantic"],
    ["korean", "minimalist"],
  ];

  for (const itemTag of itemStyle) {
    for (const [a, b] of complementaryPairs) {
      if (
        (itemTag === a && userStyle.includes(b)) ||
        (itemTag === b && userStyle.includes(a))
      ) {
        matchCount += 0.5;
      }
    }
  }

  const maxScore = itemStyle.length * 2;
  return Math.min(100, Math.round((matchCount / maxScore) * 100));
}

// ─── Size Recommendation ─────────────────────────────────────────

function generateSizeRecommendation(
  deltas: MeasurementDelta[],
  item: ItemProfile,
  stretch: string
): SizeRecommendation {
  if (deltas.length === 0) {
    return {
      suggested: "M",
      rationale: "Unable to determine exact size from available measurements.",
    };
  }

  const tightCount = deltas.filter(
    (d) => d.status === "tight" || d.status === "slightly.tight"
  ).length;
  const roomyCount = deltas.filter(
    (d) => d.status === "roomy" || d.status === "slightly.roomy"
  ).length;

  let suggested = "M";
  let rationale = "";

  if (tightCount === 0 && roomyCount === 0) {
    suggested = "M";
    rationale = "Measurements align well with standard sizing.";
  } else if (tightCount > roomyCount) {
    if (stretch === "high") {
      suggested = "M";
      rationale = "Slightly snug, but stretch fabric allows comfortable fit.";
    } else {
      suggested = "L";
      rationale = "Consider sizing up for a more comfortable fit.";
    }
  } else if (roomyCount > tightCount) {
    if (stretch === "rigid") {
      suggested = "S";
      rationale = "Garment runs roomy; sizing down may give a better fit.";
    } else {
      suggested = "M";
      rationale = "Slightly loose, but should drape well with stretch.";
    }
  } else {
    suggested = "M";
    rationale = "Mixed fit signals — standard size should work.";
  }

  return { suggested, rationale };
}

// ─── Generate Insights ───────────────────────────────────────────

function generateInsights(
  profile: UserBodyProfile,
  item: ItemProfile,
  deltas: MeasurementDelta[],
  bodyScore: number,
  colorScore: number
): FitInsights {
  const positives: string[] = [];
  const cautions: string[] = [];
  const stylingTips: string[] = [];

  // Body shape + silhouette insight
  const rule = SILHOUETTE_RULES.find((r) => r.bodyShape === profile.bodyShape);
  if (rule) {
    if (rule.flatteringSilhouettes.includes(item.silhouette)) {
      positives.push(rule.notes);
    } else if (rule.avoidSilhouettes.includes(item.silhouette)) {
      cautions.push(
        `This ${item.silhouette} silhouette may not be the most flattering for your ${profile.bodyShape} body shape.`
      );
    }
  }

  // Measurement insights
  const tight = deltas.filter((d) => d.status === "tight");
  const roomy = deltas.filter((d) => d.status === "roomy");

  if (tight.length > 0) {
    cautions.push(
      `May feel fitted across ${tight.map((d) => d.label).join(" and ")}`
    );
  }
  if (roomy.length > 0) {
    cautions.push(
      `May feel loose around ${roomy.map((d) => d.label).join(" and ")}`
    );
  }

  // Positive measurements
  const ideal = deltas.filter((d) => d.status === "ideal");
  if (ideal.length > 0) {
    positives.push(
      `${ideal.map((d) => d.label).join(" and ")} measurements are a great match`
    );
  }

  // Color insight
  if (colorScore >= 80) {
    positives.push("Colors complement your skin tone beautifully");
  } else if (colorScore < 60) {
    cautions.push("These colors may not be the most flattering for your undertone");
  }

  // Styling tips based on category
  if (item.category === "tops" || item.category === "dresses") {
    if (item.neckline === "v-neck") {
      stylingTips.push("A V-neckline elongates the torso and draws attention upward");
    }
    if (item.silhouette === "oversized") {
      stylingTips.push("Pair with fitted bottoms to balance the volume");
    }
  }
  if (item.category === "bottoms") {
    if (item.silhouette === "wide-leg") {
      stylingTips.push("A tucked-in top will highlight your waist with this silhouette");
    }
  }
  if (item.category === "dresses") {
    stylingTips.push("Add a belt to further define your waist");
  }

  return { positives, cautions, stylingTips };
}

// ─── Confidence Dampening ────────────────────────────────────────

function dampenScore(score: number, confidence: number): number {
  if (confidence >= 0.85) return score;

  // Pull scores toward neutral band (68-78) when confidence is low
  const neutralMid = 73;
  const dampening = 1 - confidence;

  return Math.round(score + (neutralMid - score) * dampening * 0.5);
}

// ─── Main Scoring Function ───────────────────────────────────────

export function calculateFitScores(
  profile: UserBodyProfile,
  item: ItemProfile
): FitAnalysisResult {
  const weights = DEFAULT_WEIGHTS[item.category] || DEFAULT_WEIGHTS.tops;

  // Body fit
  const { score: rawBodyScore, deltas } = calculateBodyFitScore(profile, item);

  // Color harmony
  const { score: rawColorScore, recommended, avoid } = calculateColorScore(
    profile.skinTone,
    item.colors
  );

  // Style match
  const rawStyleScore = calculateStyleScore(profile.stylePreference, item.styleTags);

  // Apply confidence dampening
  const bodyScore = dampenScore(rawBodyScore, profile.confidence);
  const colorScore = dampenScore(rawColorScore, profile.confidence);
  const styleScore = dampenScore(rawStyleScore, profile.confidence);

  // Overall weighted score
  const overall = Math.round(
    bodyScore * weights.body +
    colorScore * weights.color +
    styleScore * weights.style
  );

  // Size recommendation
  const sizeRecommendation = generateSizeRecommendation(
    deltas,
    item,
    item.fabricStretch
  );

  // Insights
  const insights = generateInsights(profile, item, deltas, bodyScore, colorScore);

  // Recommendations (string array for backward compatibility)
  const recommendations = [
    ...insights.positives.slice(0, 2),
    ...insights.stylingTips.slice(0, 2),
  ];

  // Compatibility metadata
  const compatibilityMetadata: CompatibilityMetadata = {
    bodyProfile: profile,
    itemProfile: item,
    scores: { overall, body: bodyScore, color: colorScore, style: styleScore },
    sizeRecommendation,
    insights,
    confidence: profile.confidence,
    flags: insights.cautions,
  };

  // Determine style type from user preferences
  const styleType: StyleTag = profile.stylePreference[0] || "casual";

  return {
    scores: { overall, body: bodyScore, color: colorScore, style: styleScore },
    bodyShape: profile.bodyShape,
    skinTone: profile.skinTone,
    faceShape: profile.faceShape,
    styleType,
    height: profile.heightCm,
    heightConfidence: profile.confidence,
    weight: profile.weightKg,
    weightConfidence: profile.confidence,
    recommendations,
    colorAnalysis: {
      primaryColors: item.colors,
      recommendedColors: recommended,
      avoidColors: avoid,
    },
    compatibilityMetadata,
  };
}
