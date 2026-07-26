/**
 * Size prediction engine.
 * Maps body measurements to standard clothing size charts.
 */

export interface SizePrediction {
  topSize: { size: string; confidence: number };
  bottomSize: { size: string; confidence: number };
  dressSize: { size: string; confidence: number };
  shoeSize: { us: string; eu: string; uk: string; confidence: number };
  measurementsUsed: string[];
  missingMeasurements: string[];
}

interface Measurements {
  height?: number;
  weight?: number;
  chestCircumference?: number;
  waistCircumference?: number;
  hipCircumference?: number;
  shoulderWidth?: number;
  inseamLength?: number;
  armLength?: number;
  neckCircumference?: number;
  footLength?: number;
  shoeSize?: string;
}

// ─── Size Chart Tables ───────────────────────────────────────────

// General tops sizing (chest circumference in cm)
const TOP_SIZE_CHART: { size: string; minChest: number; maxChest: number }[] = [
  { size: "XS", minChest: 81, maxChest: 86 },
  { size: "S", minChest: 86, maxChest: 91 },
  { size: "M", minChest: 91, maxChest: 97 },
  { size: "L", minChest: 97, maxChest: 102 },
  { size: "XL", minChest: 102, maxChest: 107 },
  { size: "XXL", minChest: 107, maxChest: 112 },
  { size: "3XL", minChest: 112, maxChest: 117 },
];

// General bottoms sizing (waist circumference in cm)
const BOTTOM_SIZE_CHART: { size: string; minWaist: number; maxWaist: number }[] = [
  { size: "XS", minWaist: 66, maxWaist: 71 },
  { size: "S", minWaist: 71, maxWaist: 76 },
  { size: "M", minWaist: 76, maxWaist: 81 },
  { size: "L", minWaist: 81, maxWaist: 86 },
  { size: "XL", minWaist: 86, maxWaist: 91 },
  { size: "XXL", minWaist: 91, maxWaist: 97 },
  { size: "3XL", minWaist: 97, maxWaist: 102 },
];

// Dress sizing (chest + waist + hip combined)
const DRESS_SIZE_CHART: { size: string; minChest: number; maxChest: number; minWaist: number; maxWaist: number; minHip: number; maxHip: number }[] = [
  { size: "XS", minChest: 81, maxChest: 86, minWaist: 66, maxWaist: 71, minHip: 86, maxHip: 91 },
  { size: "S", minChest: 86, maxChest: 91, minWaist: 71, maxWaist: 76, minHip: 91, maxHip: 97 },
  { size: "M", minChest: 91, maxChest: 97, minWaist: 76, maxWaist: 81, minHip: 97, maxHip: 102 },
  { size: "L", minChest: 97, maxChest: 102, minWaist: 81, maxWaist: 86, minHip: 102, maxHip: 107 },
  { size: "XL", minChest: 102, maxChest: 107, minWaist: 86, maxWaist: 91, minHip: 107, maxHip: 112 },
  { size: "XXL", minChest: 107, maxChest: 112, minWaist: 91, maxWaist: 97, minHip: 112, maxHip: 117 },
  { size: "3XL", minChest: 112, maxChest: 117, minWaist: 97, maxWaist: 102, minHip: 117, maxHip: 122 },
];

// Footwear size conversion (foot length in cm → US/EU/UK)
const SHOE_SIZE_CHART: { minCm: number; maxCm: number; usMen: string; usWomen: string; eu: string; uk: string }[] = [
  { minCm: 22.0, maxCm: 22.5, usMen: "—", usWomen: "5", eu: "35", uk: "2.5" },
  { minCm: 22.5, maxCm: 23.0, usMen: "—", usWomen: "5.5", eu: "35.5", uk: "3" },
  { minCm: 23.0, maxCm: 23.5, usMen: "—", usWomen: "6", eu: "36", uk: "3.5" },
  { minCm: 23.5, maxCm: 24.0, usMen: "6", usWomen: "6.5", eu: "37", uk: "4" },
  { minCm: 24.0, maxCm: 24.5, usMen: "6.5", usWomen: "7", eu: "37.5", uk: "4.5" },
  { minCm: 24.5, maxCm: 25.0, usMen: "7", usWomen: "7.5", eu: "38", uk: "5" },
  { minCm: 25.0, maxCm: 25.5, usMen: "7.5", usWomen: "8", eu: "38.5", uk: "5.5" },
  { minCm: 25.5, maxCm: 26.0, usMen: "8", usWomen: "8.5", eu: "39", uk: "6" },
  { minCm: 26.0, maxCm: 26.5, usMen: "8.5", usWomen: "9", eu: "40", uk: "6.5" },
  { minCm: 26.5, maxCm: 27.0, usMen: "9", usWomen: "9.5", eu: "41", uk: "7" },
  { minCm: 27.0, maxCm: 27.5, usMen: "9.5", usWomen: "10", eu: "42", uk: "7.5" },
  { minCm: 27.5, maxCm: 28.0, usMen: "10", usWomen: "10.5", eu: "43", uk: "8" },
  { minCm: 28.0, maxCm: 28.5, usMen: "10.5", usWomen: "11", eu: "44", uk: "8.5" },
  { minCm: 28.5, maxCm: 29.0, usMen: "11", usWomen: "11.5", eu: "45", uk: "9" },
  { minCm: 29.0, maxCm: 29.5, usMen: "11.5", usWomen: "12", eu: "46", uk: "9.5" },
  { minCm: 29.5, maxCm: 30.0, usMen: "12", usWomen: "—", eu: "47", uk: "10" },
];

// ─── Prediction Functions ────────────────────────────────────────

function findSizeByValue(
  value: number,
  chart: { size: string; min: number; max: number }[]
): { size: string; confidence: number } {
  for (const entry of chart) {
    if (value >= entry.min && value <= entry.max) {
      // Confidence decreases as we get closer to the edges
      const range = entry.max - entry.min;
      const midpoint = (entry.max + entry.min) / 2;
      const distance = Math.abs(value - midpoint);
      const confidence = Math.max(0.5, 1 - distance / (range * 2));
      return { size: entry.size, confidence };
    }
  }
  // If value exceeds chart, return closest size
  if (value < chart[0].min) {
    return { size: chart[0].size, confidence: 0.5 };
  }
  return { size: chart[chart.length - 1].size, confidence: 0.5 };
}

function findShoeSize(
  footLengthCm: number
): { us: string; eu: string; uk: string; confidence: number } {
  for (const entry of SHOE_SIZE_CHART) {
    if (footLengthCm >= entry.minCm && footLengthCm <= entry.maxCm) {
      const range = entry.maxCm - entry.minCm;
      const mid = (entry.maxCm + entry.minCm) / 2;
      const dist = Math.abs(footLengthCm - mid);
      const confidence = Math.max(0.5, 1 - dist / (range * 2));
      return { us: entry.usWomen, eu: entry.eu, uk: entry.uk, confidence };
    }
  }
  return { us: "—", eu: "—", uk: "—", confidence: 0.3 };
}

function parseShoeSize(shoeSize: string): number | null {
  // Extract numeric part from strings like "US 8", "EU 39", "8"
  const match = shoeSize.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Predict clothing sizes from body measurements.
 */
export function predictSizes(measurements: Measurements): SizePrediction {
  const used: string[] = [];
  const missing: string[] = [];

  // ─── Top Size ──────────────────────────────────────────────────
  let topSize: { size: string; confidence: number } = { size: "—", confidence: 0 };

  if (measurements.chestCircumference) {
    const chart = TOP_SIZE_CHART.map((e) => ({
      size: e.size,
      min: e.minChest,
      max: e.maxChest,
    }));
    topSize = findSizeByValue(measurements.chestCircumference, chart);
    used.push("chestCircumference");
  } else if (measurements.shoulderWidth) {
    // Estimate chest from shoulder width (rough heuristic)
    const estimatedChest = measurements.shoulderWidth * 2.3;
    const chart = TOP_SIZE_CHART.map((e) => ({
      size: e.size,
      min: e.minChest,
      max: e.maxChest,
    }));
    topSize = findSizeByValue(estimatedChest, chart);
    topSize.confidence *= 0.8; // Lower confidence for estimated value
    used.push("shoulderWidth");
  } else {
    missing.push("chestCircumference");
    missing.push("shoulderWidth");
  }

  // ─── Bottom Size ───────────────────────────────────────────────
  let bottomSize: { size: string; confidence: number } = { size: "—", confidence: 0 };

  if (measurements.waistCircumference) {
    const chart = BOTTOM_SIZE_CHART.map((e) => ({
      size: e.size,
      min: e.minWaist,
      max: e.maxWaist,
    }));
    bottomSize = findSizeByValue(measurements.waistCircumference, chart);
    used.push("waistCircumference");
  } else if (measurements.hipCircumference) {
    // Estimate waist from hip (rough heuristic: waist ≈ hip * 0.8)
    const estimatedWaist = measurements.hipCircumference * 0.8;
    const chart = BOTTOM_SIZE_CHART.map((e) => ({
      size: e.size,
      min: e.minWaist,
      max: e.maxWaist,
    }));
    bottomSize = findSizeByValue(estimatedWaist, chart);
    bottomSize.confidence *= 0.75;
    used.push("hipCircumference");
  } else {
    missing.push("waistCircumference");
    missing.push("hipCircumference");
  }

  // ─── Dress Size ────────────────────────────────────────────────
  let dressSize: { size: string; confidence: number } = { size: "—", confidence: 0 };

  if (measurements.chestCircumference && measurements.waistCircumference) {
    // Find the best matching dress size considering all three dimensions
    let bestMatch = DRESS_SIZE_CHART[0];
    let bestScore = Infinity;

    for (const entry of DRESS_SIZE_CHART) {
      let score = 0;
      if (measurements.chestCircumference) {
        score += Math.abs(measurements.chestCircumference - (entry.minChest + entry.maxChest) / 2);
      }
      if (measurements.waistCircumference) {
        score += Math.abs(measurements.waistCircumference - (entry.minWaist + entry.maxWaist) / 2);
      }
      if (measurements.hipCircumference) {
        score += Math.abs(measurements.hipCircumference - (entry.minHip + entry.maxHip) / 2);
      }
      if (score < bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    dressSize = { size: bestMatch.size, confidence: 0.75 };
    used.push("chestCircumference");
    used.push("waistCircumference");
  } else {
    missing.push("chestCircumference");
    missing.push("waistCircumference");
  }

  // ─── Shoe Size ─────────────────────────────────────────────────
  let shoeResult: { us: string; eu: string; uk: string; confidence: number } = {
    us: "—",
    eu: "—",
    uk: "—",
    confidence: 0,
  };

  if (measurements.footLength) {
    shoeResult = findShoeSize(measurements.footLength);
    used.push("footLength");
  } else if (measurements.shoeSize) {
    const numericSize = parseShoeSize(measurements.shoeSize);
    if (numericSize) {
      // Rough estimate: EU size ≈ 1.5 × footLength cm + 2
      const estimatedFootLength = (numericSize - 2) / 1.5;
      shoeResult = findShoeSize(estimatedFootLength);
      shoeResult.confidence *= 0.7;
      used.push("shoeSize");
    }
  } else {
    missing.push("footLength");
    missing.push("shoeSize");
  }

  return {
    topSize,
    bottomSize,
    dressSize,
    shoeSize: shoeResult,
    measurementsUsed: [...new Set(used)],
    missingMeasurements: [...new Set(missing)],
  };
}
