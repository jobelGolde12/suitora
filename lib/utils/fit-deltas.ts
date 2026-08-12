import type {
  CompatibilityMetadata,
  MeasurementDelta,
} from "@/types";

interface DeltaSpec {
  measurement: string;
  label: string;
  userKey: keyof CompatibilityMetadata["bodyProfile"]["measurements"];
  garmentKey: keyof CompatibilityMetadata["itemProfile"]["keyMeasurements"];
}

const DELTA_SPECS: DeltaSpec[] = [
  { measurement: "bust", label: "Bust / Chest", userKey: "bust", garmentKey: "bust" },
  { measurement: "waist", label: "Waist", userKey: "waist", garmentKey: "waist" },
  { measurement: "hips", label: "Hips", userKey: "hips", garmentKey: "hips" },
  { measurement: "shoulder", label: "Shoulders", userKey: "shoulderWidth", garmentKey: "shoulderWidth" },
  { measurement: "sleeve", label: "Sleeve length", userKey: "armLength", garmentKey: "sleeveLengthCm" },
  { measurement: "inseam", label: "Inseam / leg length", userKey: "legLength", garmentKey: "inseamCm" },
  { measurement: "foot-length", label: "Foot length", userKey: "footLength", garmentKey: "footLengthCm" },
  { measurement: "foot-width", label: "Foot width", userKey: "footWidth", garmentKey: "footWidthCm" },
];

function fitStatus(delta: number): MeasurementDelta["status"] {
  if (delta <= -2) return "tight";
  if (delta < -0.5) return "slightly.tight";
  if (delta <= 0.5) return "ideal";
  if (delta <= 2) return "slightly.roomy";
  return "roomy";
}

/**
 * Build a list of body-vs-garment measurement comparisons from the stored
 * compatibility metadata. Returns an empty array when either side lacks the
 * required measurements (the results UI renders no section in that case).
 */
export function buildMeasurementDeltas(
  metadata: CompatibilityMetadata
): MeasurementDelta[] {
  const body = metadata.bodyProfile?.measurements;
  const garment = metadata.itemProfile?.keyMeasurements;
  if (!body || !garment) return [];

  const deltas: MeasurementDelta[] = [];

  for (const spec of DELTA_SPECS) {
    const userValue = body[spec.userKey];
    const garmentValue = garment[spec.garmentKey];
    if (userValue == null || garmentValue == null) continue;

    const delta = Math.round((garmentValue - userValue) * 10) / 10;

    deltas.push({
      measurement: spec.measurement,
      label: spec.label,
      userValue,
      garmentValue,
      delta,
      unit: "cm",
      status: fitStatus(delta),
    });
  }

  return deltas;
}
