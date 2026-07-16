/**
 * Body estimation service.
 * Simulates detecting body landmarks and predicting height/weight from a user photo.
 */

export interface BodyEstimationResult {
  height: number; // in cm
  heightConfidence: number; // 0.0 to 1.0
  weight: number; // in kg
  weightConfidence: number; // 0.0 to 1.0
  bodyShape: "rectangle" | "pear" | "apple" | "hourglass" | "triangle";
  skinTone: "warm" | "cool" | "neutral";
  faceShape: "round" | "oval" | "heart" | "square" | "diamond";
}

/**
 * Predict weight, height, and shape from the user's self image URL.
 */
export async function estimateBodyTraits(userImageUrl: string): Promise<BodyEstimationResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Determine deterministic values based on image URL string if possible, or randomize
  const hash = userImageUrl.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const shapes: BodyEstimationResult["bodyShape"][] = ["rectangle", "pear", "apple", "hourglass", "triangle"];
  const tones: BodyEstimationResult["skinTone"][] = ["warm", "cool", "neutral"];
  const faces: BodyEstimationResult["faceShape"][] = ["round", "oval", "heart", "square", "diamond"];

  const height = 155 + (hash % 35); // 155 to 190 cm
  const weight = 50 + (hash % 50); // 50 to 100 kg
  const heightConfidence = parseFloat((0.85 + (hash % 15) / 100).toFixed(2)); // 0.85 to 0.99
  const weightConfidence = parseFloat((0.75 + (hash % 20) / 100).toFixed(2)); // 0.75 to 0.95

  return {
    height,
    heightConfidence,
    weight,
    weightConfidence,
    bodyShape: shapes[hash % shapes.length],
    skinTone: tones[hash % tones.length],
    faceShape: faces[hash % faces.length],
  };
}
